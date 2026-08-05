'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/session';
import { fetchDolarBRL, fetchYahooQuote } from '@/lib/market-data';
import type { Cotacao } from '@/types';

// Catálogo de commodities acompanhadas — mesmos tickers já usados no mock.
// IMPORTANTE: `precoUsd` é a cotação bruta do contrato futuro devolvida pela
// Yahoo Finance (ex.: cents/bushel em grãos, cents/lb em algodão/café/boi),
// sem conversão para saca de 60kg. `precoBrl` só converte MOEDA (USD→BRL pelo
// câmbio do dia) — não é um preço por saca pronto para fechar negócio. Uma
// tabela de fatores de conversão por commodity (bushel/lb → saca) fica para
// quando o módulo de Comercialização precisar de precisão de fechamento.
const COMMODITIES: { commodity: string; bolsa: 'CBOT' | 'CME' | 'ICE'; ticker: string; unidade: string }[] = [
  { commodity: 'Soja Grão', bolsa: 'CBOT', ticker: 'ZS=F', unidade: 'R$' },
  { commodity: 'Milho Grão', bolsa: 'CBOT', ticker: 'ZC=F', unidade: 'R$' },
  { commodity: 'Algodão Pluma', bolsa: 'ICE', ticker: 'CT=F', unidade: 'R$' },
  { commodity: 'Boi Gordo', bolsa: 'CME', ticker: 'GF=F', unidade: 'R$' },
  { commodity: 'Trigo', bolsa: 'CBOT', ticker: 'ZW=F', unidade: 'R$' },
  { commodity: 'Café Arábica', bolsa: 'ICE', ticker: 'KC=F', unidade: 'R$' }
];

export async function listCotacoes(): Promise<{ dolar: Cotacao | null; commodities: Cotacao[] }> {
  await requireUser();
  const rows = await db.cotacao.findMany({ orderBy: { commodity: 'asc' } });
  const dolar = rows.find((r) => r.bolsa === 'PTAX') ?? null;
  const commodities = rows.filter((r) => r.bolsa !== 'PTAX');
  return { dolar: dolar ? toDTO(dolar) : null, commodities: commodities.map(toDTO) };
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
    const quote = await fetchYahooQuote(c.ticker, taxaCambio);
    if (!quote) {
      falhas.push(c.commodity);
      continue;
    }
    await db.cotacao.upsert({
      where: { commodity: c.commodity },
      update: {
        precoUsd: quote.precoUsd,
        precoBrl: quote.precoBrl,
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
        precoUsd: quote.precoUsd,
        precoBrl: quote.precoBrl,
        unidade: c.unidade,
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

export async function salvarPrecoDefinidoSafra(commodity: string, preco: number) {
  await requireUser();
  await db.cotacao.update({ where: { commodity }, data: { precoDefinidoSafra: preco } });
  revalidatePath('/cotacoes');
}

type CotacaoRow = {
  id: string;
  commodity: string;
  bolsa: string;
  ticker: string;
  precoUsd: unknown;
  precoBrl: unknown;
  unidade: string;
  variacaoPercentual: unknown;
  maxima: unknown;
  minima: unknown;
  volume: bigint;
  precoDefinidoSafra: unknown;
  atualizadoEm: Date;
};

function toDTO(row: CotacaoRow): Cotacao {
  return {
    id: row.id,
    commodity: row.commodity,
    bolsa: row.bolsa as Cotacao['bolsa'],
    ticker: row.ticker,
    precoUsd: row.precoUsd != null ? Number(row.precoUsd) : undefined,
    precoBrl: Number(row.precoBrl),
    unidade: row.unidade,
    variacaoPercentual: Number(row.variacaoPercentual),
    maxima: Number(row.maxima),
    minima: Number(row.minima),
    volume: Number(row.volume),
    precoDefinidoSafra: row.precoDefinidoSafra != null ? Number(row.precoDefinidoSafra) : undefined,
    atualizadoEm: row.atualizadoEm.toLocaleTimeString('pt-BR')
  };
}
