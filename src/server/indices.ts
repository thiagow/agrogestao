'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireContext, requireUser } from '@/lib/session';
import { fetchDolarBRL, fetchSerieBcb, fetchExpectativasFocusAnuais, SERIE_BCB } from '@/lib/market-data';
import type { IndicesVigentes } from '@/lib/taxa-efetiva';
import {
  carregarIndicesVigentes,
  carregarSerieIndices,
  regerarCronograma,
  SELECT_CRONOGRAMA
} from './cronograma-engine';

export async function listIndices(): Promise<IndicesVigentes> {
  await requireUser();
  return carregarIndicesVigentes();
}

export interface ResultadoAtualizacaoIndices {
  atualizados: number;
  falhas: string[];
  contratosRecalculados: number;
}

/**
 * Busca CDI, IPCA e dólar (realizado) + projeções BCB Focus (Selic/IPCA/
 * Câmbio, Fase 5), grava a série temporal e regrava o cronograma dos
 * contratos indexados da propriedade ativa.
 *
 * Fail-soft por fonte: se uma cair, as outras seguem e o último valor salvo é
 * mantido — nunca se zera um índice nem se apaga cronograma por falha de rede.
 * Contratos totalmente pré-fixados em BRL não são tocados: não dependem de
 * índice nenhum (Dólar Puro é pré-fixado mas depende de PTAX — ver filtro em
 * `recalcularContratosIndexados`).
 */
export async function atualizarIndices(): Promise<ResultadoAtualizacaoIndices> {
  const ctx = await requireContext();
  const falhas: string[] = [];
  let atualizados = 0;

  // ── Realizado (SGS / AwesomeAPI) ──────────────────────────────────────
  const cdi = await fetchSerieBcb(SERIE_BCB.CDI);
  if (cdi) {
    await inserirPontoRealizado('CDI', cdi.valor, '% a.a.', `BCB SGS ${SERIE_BCB.CDI}`, cdi.dataReferencia);
    atualizados++;
  } else {
    falhas.push('CDI (realizado)');
  }

  const ipca = await fetchSerieBcb(SERIE_BCB.IPCA);
  if (ipca) {
    await inserirPontoRealizado('IPCA', ipca.valor, '% a.a.', `BCB SGS ${SERIE_BCB.IPCA}`, ipca.dataReferencia);
    atualizados++;
  } else {
    falhas.push('IPCA (realizado)');
  }

  const dolar = await fetchDolarBRL();
  if (dolar) {
    await inserirPontoRealizado('USD', dolar.precoBrl, 'BRL/USD', 'AwesomeAPI USD-BRL', hoje());
    atualizados++;
  } else {
    falhas.push('Dólar (realizado)');
  }

  // ── Projeção (BCB Focus) — Selic é o proxy de CDI, não existe indicador CDI na Focus ──
  const projSelic = await fetchExpectativasFocusAnuais('Selic');
  if (projSelic) {
    await upsertPontosProjetados('CDI', projSelic, '% a.a.', 'BCB Focus (Selic, proxy de CDI)');
    atualizados++;
  } else {
    falhas.push('CDI (projeção Focus)');
  }

  const projIpca = await fetchExpectativasFocusAnuais('IPCA');
  if (projIpca) {
    await upsertPontosProjetados('IPCA', projIpca, '% a.a.', 'BCB Focus (IPCA)');
    atualizados++;
  } else {
    falhas.push('IPCA (projeção Focus)');
  }

  const contratosRecalculados = ctx.propriedade ? await recalcularContratosIndexados(ctx.propriedade.id) : 0;

  revalidatePath('/bancos');
  revalidatePath('/resumo');
  revalidatePath('/fluxo_safra');

  return { atualizados, falhas, contratosRecalculados };
}

/**
 * Regrava o cronograma de todo contrato ativo cujo juro depende de uma fonte
 * externa — indexados (CDI/IPCA/VC) OU Dólar Puro (pré-fixado em USD, mas a
 * conversão depende da PTAX vigente no ciclo). Só o pré-fixado em BRL fica de
 * fora: é o único caso que realmente não depende de nada externo.
 */
async function recalcularContratosIndexados(propriedadeId: string): Promise<number> {
  const [indices, series] = await Promise.all([carregarIndicesVigentes(), carregarSerieIndices()]);

  const contratos = await db.contratoBancario.findMany({
    where: {
      propriedadeId,
      ativo: true,
      OR: [{ tipoTaxa: { not: 'PRE_FIXADO' } }, { moeda: 'USD' }]
    },
    select: SELECT_CRONOGRAMA
  });

  for (const contrato of contratos) {
    await regerarCronograma(contrato, indices, series);
  }

  return contratos.length;
}

async function inserirPontoRealizado(tipo: 'CDI' | 'IPCA' | 'USD', valor: number, unidade: string, fonte: string, dataReferencia: string) {
  await db.indiceMercado.upsert({
    where: { tipo_origem_dataReferencia: { tipo, origem: 'REALIZADO', dataReferencia: new Date(dataReferencia) } },
    update: { valor, unidade, fonte, atualizadoEm: new Date() },
    create: { tipo, origem: 'REALIZADO', valor, unidade, fonte, dataReferencia: new Date(dataReferencia) }
  });
}

async function upsertPontosProjetados(
  tipo: 'CDI' | 'IPCA',
  projecoes: { ano: number; valor: number }[],
  unidade: string,
  fonte: string
) {
  for (const p of projecoes) {
    const dataReferencia = new Date(`${p.ano}-01-01`);
    await db.indiceMercado.upsert({
      where: { tipo_origem_dataReferencia: { tipo, origem: 'PROJETADO', dataReferencia } },
      update: { valor: p.valor, unidade, fonte, atualizadoEm: new Date() },
      create: { tipo, origem: 'PROJETADO', valor: p.valor, unidade, fonte, dataReferencia }
    });
  }
}

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}
