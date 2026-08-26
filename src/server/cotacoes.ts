'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/session';
import { fetchDolarBRL, fetchYahooQuote } from '@/lib/market-data';
import { converterCotacaoCommodity } from '@/lib/commodity-unidade';
import { commodityDaCultura } from '@/lib/cultura-commodity';
import type { Cotacao, PrecoDefinidoSafra } from '@/types';

// Catálogo de commodities acompanhadas — mesmos tickers já usados no mock.
// Fator de conversão bushel/lb -> saca/arroba vive em commodity-unidade.ts,
// aplicado em refreshCotacoes() antes de gravar `precoUsd`/`precoBrl`.
const COMMODITIES: { commodity: string; bolsa: 'CBOT' | 'CME' | 'ICE'; ticker: string }[] = [
  { commodity: 'Soja Grão', bolsa: 'CBOT', ticker: 'ZS=F' },
  { commodity: 'Milho Grão', bolsa: 'CBOT', ticker: 'ZC=F' },
  { commodity: 'Algodão Pluma', bolsa: 'ICE', ticker: 'CT=F' },
  { commodity: 'Boi Gordo', bolsa: 'CME', ticker: 'GF=F' },
  { commodity: 'Trigo', bolsa: 'CBOT', ticker: 'ZW=F' },
  { commodity: 'Café Arábica', bolsa: 'ICE', ticker: 'KC=F' }
];

export async function listCotacoes(): Promise<{ dolar: Cotacao | null; commodities: Cotacao[] }> {
  await requireUser();
  const rows = await db.cotacao.findMany({ orderBy: { commodity: 'asc' } });
  const dolar = rows.find((r) => r.bolsa === 'PTAX') ?? null;
  const commodities = rows.filter((r) => r.bolsa !== 'PTAX');
  return { dolar: dolar ? toDTO(dolar) : null, commodities: commodities.map(toDTO) };
}

/** Todos os preços travados já salvos — filtrado por safra no client (mesmo padrão de culturaSafras). */
export async function listPrecosDefinidos(): Promise<PrecoDefinidoSafra[]> {
  await requireUser();
  const rows = await db.precoDefinidoSafra.findMany({ orderBy: [{ anoSafra: 'asc' }, { commodity: 'asc' }] });
  return rows.map(toPrecoDefinidoDTO);
}

/** Busca preços reais (AwesomeAPI + Yahoo Finance) e grava no banco. Falhas por ticker são ignoradas individualmente (fail-soft). */
export async function refreshCotacoes(): Promise<{ atualizados: number; falhas: string[] }> {
  await requireUser();
  const falhas: string[] = [];
  let atualizados = 0;

  const dolar = await fetchDolarBRL();
  if (dolar) {
    await db.cotacao.upsert({
      where: { commodity: 'Dólar Americano' },
      update: {
        precoOriginal: dolar.precoBrl,
        precoBrl: dolar.precoBrl,
        variacaoPercentual: dolar.variacaoPercentual,
        maxima: dolar.maxima,
        minima: dolar.minima,
        volume: 0,
        atualizadoEm: new Date()
      },
      create: {
        commodity: 'Dólar Americano',
        bolsa: 'PTAX',
        ticker: 'USD/BRL',
        precoOriginal: dolar.precoBrl,
        unidadeOriginal: 'R$',
        precoBrl: dolar.precoBrl,
        unidade: 'R$',
        variacaoPercentual: dolar.variacaoPercentual,
        maxima: dolar.maxima,
        minima: dolar.minima,
        volume: 0
      }
    });
    atualizados++;
  } else {
    falhas.push('Dólar Americano');
  }

  const taxaCambio = dolar?.precoBrl ?? null;

  for (const c of COMMODITIES) {
    const quote = await fetchYahooQuote(c.ticker, null); // null: não converte aqui, a conversão de unidade é feita abaixo
    if (!quote || quote.precoUsd == null) {
      falhas.push(c.commodity);
      continue;
    }

    // Sem câmbio disponível nesta rodada, não há como converter pra R$ —
    // marca falha em vez de gravar um preço incompleto/inconsistente.
    if (taxaCambio == null) {
      falhas.push(c.commodity);
      continue;
    }

    const conv = converterCotacaoCommodity(c.commodity, quote.precoUsd, taxaCambio);

    await db.cotacao.upsert({
      where: { commodity: c.commodity },
      update: {
        precoOriginal: conv.precoOriginal,
        unidadeOriginal: conv.unidadeOriginal,
        precoUsd: conv.precoUsd,
        precoBrl: conv.precoBrl,
        unidade: conv.unidadeFinal,
        variacaoPercentual: quote.variacaoPercentual,
        maxima: quote.maxima,
        minima: quote.minima,
        volume: BigInt(Math.round(quote.volume)),
        atualizadoEm: new Date()
      },
      create: {
        commodity: c.commodity,
        bolsa: c.bolsa,
        ticker: c.ticker,
        precoOriginal: conv.precoOriginal,
        unidadeOriginal: conv.unidadeOriginal,
        precoUsd: conv.precoUsd,
        precoBrl: conv.precoBrl,
        unidade: conv.unidadeFinal,
        variacaoPercentual: quote.variacaoPercentual,
        maxima: quote.maxima,
        minima: quote.minima,
        volume: BigInt(Math.round(quote.volume))
      }
    });
    atualizados++;
  }

  revalidatePath('/cotacoes');
  return { atualizados, falhas };
}

/** Trava o "Preço Definido" de uma commodity numa safra específica (input livre do usuário). */
export async function salvarPrecoDefinidoSafra(commodity: string, anoSafra: string, preco: number) {
  const user = await requireUser();
  await db.precoDefinidoSafra.upsert({
    where: { commodity_anoSafra: { commodity, anoSafra } },
    update: { precoBrl: preco, definidoEm: new Date() },
    create: { commodity, anoSafra, precoBrl: preco, createdById: user.id }
  });
  revalidatePath('/cotacoes');
  revalidatePath('/comercializacao');
  revalidatePath('/fluxo_safra');
}

/**
 * Botão "Aplicar Mercado": copia o preço de mercado atual (`Cotacao.precoBrl`)
 * de todas as commodities pra `PrecoDefinidoSafra` da safra informada, de uma
 * vez só. Sobrescreve qualquer preço já travado naquela safra — a confirmação
 * de sobrescrita é responsabilidade da UI (ver CotacoesView.tsx).
 */
export async function aplicarMercadoEmLote(anoSafra: string): Promise<{ aplicados: number }> {
  const user = await requireUser();
  const rows = await db.cotacao.findMany({ where: { bolsa: { not: 'PTAX' } } });

  await db.$transaction(
    rows.map((r) =>
      db.precoDefinidoSafra.upsert({
        where: { commodity_anoSafra: { commodity: r.commodity, anoSafra } },
        update: { precoBrl: r.precoBrl, definidoEm: new Date() },
        create: { commodity: r.commodity, anoSafra, precoBrl: r.precoBrl, createdById: user.id }
      })
    )
  );

  revalidatePath('/cotacoes');
  revalidatePath('/comercializacao');
  revalidatePath('/fluxo_safra');
  return { aplicados: rows.length };
}

/** Histórico de "Preço Definido" por safra, para o gráfico da aba "Histórico por Safra". */
export async function listHistoricoPrecoPorSafra(): Promise<PrecoDefinidoSafra[]> {
  return listPrecosDefinidos();
}

/**
 * Fallback de preço para Arrendamentos (src/lib/arrendamento-engine.ts) e
 * Comercialização (src/lib/comercializacao.ts) quando não há preço próprio
 * preenchido — corrige o BUG #1 da spec de Arrendamento sem inventar um
 * preço: usa só `PrecoDefinidoSafra` da safra informada (o preço que o
 * próprio usuário já confirmou manualmente na tela Cotações para aquela
 * safra), NUNCA `Cotacao.precoBrl` (a cotação bruta de mercado, que é só
 * referência até ser travada). Sem match de cultura ou sem preço definido
 * para a safra, devolve null — a UI mostra "—"/N/D, nunca um número
 * inventado.
 *
 * O cruzamento cultura->commodity tenta primeiro o mapa curado
 * (`commodityDaCultura`, src/lib/cultura-commodity.ts — nomes que legitimamente
 * não batem por substring, como "Bovino"->"Boi Gordo"); só cai no
 * `.includes()` fuzzy abaixo pra cultura ainda não mapeada explicitamente mas
 * cujo nome já contém o nome da commodity (ex: "Soja" em "Soja Grão").
 */
export async function resolverPrecoFallback(culturaNome: string, anoSafra: string): Promise<number | null> {
  await requireUser();
  const nomeCommodity =
    commodityDaCultura(culturaNome) ??
    COMMODITIES.find((c) => c.commodity.toLowerCase().includes(culturaNome.toLowerCase()))?.commodity;
  if (!nomeCommodity) return null;
  const row = await db.precoDefinidoSafra.findUnique({ where: { commodity_anoSafra: { commodity: nomeCommodity, anoSafra } } });
  return row ? Number(row.precoBrl) : null;
}

type CotacaoRow = {
  id: string;
  commodity: string;
  bolsa: string;
  ticker: string;
  precoOriginal: unknown;
  unidadeOriginal: string;
  precoUsd: unknown;
  precoBrl: unknown;
  unidade: string;
  variacaoPercentual: unknown;
  maxima: unknown;
  minima: unknown;
  volume: bigint;
  atualizadoEm: Date;
};

function toDTO(row: CotacaoRow): Cotacao {
  return {
    id: row.id,
    commodity: row.commodity,
    bolsa: row.bolsa as Cotacao['bolsa'],
    ticker: row.ticker,
    precoOriginal: Number(row.precoOriginal),
    unidadeOriginal: row.unidadeOriginal,
    precoUsd: row.precoUsd != null ? Number(row.precoUsd) : undefined,
    precoBrl: Number(row.precoBrl),
    unidade: row.unidade,
    variacaoPercentual: Number(row.variacaoPercentual),
    maxima: Number(row.maxima),
    minima: Number(row.minima),
    volume: Number(row.volume),
    atualizadoEm: row.atualizadoEm.toLocaleTimeString('pt-BR')
  };
}

function toPrecoDefinidoDTO(row: {
  id: string;
  commodity: string;
  anoSafra: string;
  precoBrl: unknown;
  definidoEm: Date;
}): PrecoDefinidoSafra {
  return {
    id: row.id,
    commodity: row.commodity,
    anoSafra: row.anoSafra,
    precoBrl: Number(row.precoBrl),
    definidoEm: row.definidoEm.toLocaleDateString('pt-BR')
  };
}
