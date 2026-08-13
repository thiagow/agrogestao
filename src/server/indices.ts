'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireContext, requireUser } from '@/lib/session';
import { fetchDolarBRL, fetchSerieBcb, SERIE_BCB } from '@/lib/market-data';
import type { IndicesVigentes } from '@/lib/taxa-efetiva';
import {
  carregarIndicesVigentes,
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
 * Busca CDI, IPCA e dólar nas fontes públicas, grava o snapshot e regrava o
 * cronograma dos contratos indexados da propriedade ativa.
 *
 * Fail-soft por fonte: se uma cair, as outras seguem e o último valor salvo é
 * mantido — nunca se zera um índice nem se apaga cronograma por falha de rede.
 * Contratos pré-fixados não são tocados: não dependem de índice nenhum.
 */
export async function atualizarIndices(): Promise<ResultadoAtualizacaoIndices> {
  const ctx = await requireContext();
  const falhas: string[] = [];
  let atualizados = 0;

  const cdi = await fetchSerieBcb(SERIE_BCB.CDI);
  if (cdi) {
    await upsertIndice('CDI', cdi.valor, '% a.a.', `BCB SGS ${SERIE_BCB.CDI}`, cdi.dataReferencia);
    atualizados++;
  } else {
    falhas.push('CDI');
  }

  const ipca = await fetchSerieBcb(SERIE_BCB.IPCA);
  if (ipca) {
    await upsertIndice('IPCA', ipca.valor, '% a.a.', `BCB SGS ${SERIE_BCB.IPCA}`, ipca.dataReferencia);
    atualizados++;
  } else {
    falhas.push('IPCA');
  }

  const dolar = await fetchDolarBRL();
  if (dolar) {
    await upsertIndice('USD', dolar.precoBrl, 'BRL/USD', 'AwesomeAPI USD-BRL', hoje());
    atualizados++;
  } else {
    falhas.push('Dólar');
  }

  const contratosRecalculados = ctx.propriedade ? await recalcularContratosIndexados(ctx.propriedade.id) : 0;

  revalidatePath('/bancos');
  revalidatePath('/resumo');
  revalidatePath('/fluxo_safra');

  return { atualizados, falhas, contratosRecalculados };
}

/** Regrava o cronograma de todo contrato ativo cujo juro depende de um índice. */
async function recalcularContratosIndexados(propriedadeId: string): Promise<number> {
  const indices = await carregarIndicesVigentes();

  const contratos = await db.contratoBancario.findMany({
    where: {
      propriedadeId,
      ativo: true,
      tipoTaxa: { not: 'PRE_FIXADO' }
    },
    select: SELECT_CRONOGRAMA
  });

  for (const contrato of contratos) {
    await regerarCronograma(contrato, indices);
  }

  return contratos.length;
}

async function upsertIndice(
  tipo: 'CDI' | 'IPCA' | 'USD',
  valor: number,
  unidade: string,
  fonte: string,
  dataReferencia: string
) {
  const dados = { valor, unidade, fonte, dataReferencia: new Date(dataReferencia) };
  await db.indiceMercado.upsert({
    where: { tipo },
    update: { ...dados, atualizadoEm: new Date() },
    create: { tipo, ...dados }
  });
}

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}
