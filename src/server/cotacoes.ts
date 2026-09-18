'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/session';
import { fetchDolarBRL, fetchEuroBRL, fetchYahooQuote, type QuoteResult } from '@/lib/market-data';
import { converterCotacaoCommodity } from '@/lib/commodity-unidade';
import { commodityDaCultura } from '@/lib/cultura-commodity';
import type { Cotacao, PrecoDefinidoSafra } from '@/types';

// Catálogo de commodities acompanhadas via bolsa (Yahoo Finance) — mesmos
// tickers do mock original + os 7 itens novos de 16/09/2026 (Açúcar/Farelo de
// Soja/Óleo de Soja/Arroz/Álcool/Petróleo/Óleo de Aquecimento), pedidos pelo
// usuário pra acompanhamento de receita (grãos/proteína bovina) e de CUSTO
// (Álcool/Petróleo/Óleo de Aquecimento como proxy de diesel/combustível).
// Fator de conversão de unidade vive em commodity-unidade.ts, aplicado em
// refreshCotacoes() antes de gravar `precoUsd`/`precoBrl`. Todos podem ter
// "Preço Definido" travado por safra, igual às commodities originais.
const COMMODITIES: { commodity: string; bolsa: 'CBOT' | 'CME' | 'ICE'; ticker: string }[] = [
  { commodity: 'Soja Grão', bolsa: 'CBOT', ticker: 'ZS=F' },
  { commodity: 'Milho Grão', bolsa: 'CBOT', ticker: 'ZC=F' },
  { commodity: 'Algodão Pluma', bolsa: 'ICE', ticker: 'CT=F' },
  { commodity: 'Boi Gordo', bolsa: 'CME', ticker: 'GF=F' },
  { commodity: 'Trigo', bolsa: 'CBOT', ticker: 'ZW=F' },
  { commodity: 'Café Arábica', bolsa: 'ICE', ticker: 'KC=F' },
  { commodity: 'Açúcar', bolsa: 'ICE', ticker: 'SB=F' },
  { commodity: 'Farelo de Soja', bolsa: 'CBOT', ticker: 'ZM=F' },
  { commodity: 'Óleo de Soja', bolsa: 'CBOT', ticker: 'ZL=F' },
  { commodity: 'Arroz', bolsa: 'CBOT', ticker: 'ZR=F' },
  { commodity: 'Álcool', bolsa: 'CBOT', ticker: 'EH=F' },
  { commodity: 'Petróleo', bolsa: 'CME', ticker: 'CL=F' },
  { commodity: 'Óleo de Aquecimento', bolsa: 'CME', ticker: 'HO=F' }
];

/**
 * Commodities SEM cotação de bolsa (16/09/2026) — Frango e Suíno. O preço
 * varia por região e é sempre informado pelo cliente via "Preço Definido"
 * (nunca por "Atualizar"): `refreshCotacoes()` nunca toca nelas. Precisam de
 * uma linha `Cotacao` só pra aparecer na listagem — criada aqui uma única vez
 * (idempotente, nunca sobrescreve) e nunca mais atualizada por este caminho.
 */
const COMMODITIES_MANUAIS: { commodity: string; unidade: string }[] = [
  { commodity: 'Frango', unidade: 'kg' },
  { commodity: 'Suíno', unidade: 'kg' }
];

async function garantirCommoditiesManuais() {
  await db.cotacao.createMany({
    data: COMMODITIES_MANUAIS.map((c) => ({
      commodity: c.commodity,
      bolsa: 'MANUAL' as const,
      ticker: '—',
      precoOriginal: 0,
      unidadeOriginal: 'R$/kg',
      precoBrl: 0,
      unidade: c.unidade,
      variacaoPercentual: 0,
      maxima: 0,
      minima: 0
    })),
    skipDuplicates: true
  });
}

export async function listCotacoes(): Promise<{ dolar: Cotacao | null; euro: Cotacao | null; commodities: Cotacao[] }> {
  await requireUser();
  await garantirCommoditiesManuais();
  const rows = await db.cotacao.findMany({ orderBy: { commodity: 'asc' } });
  const dolar = rows.find((r) => r.commodity === 'Dólar Americano') ?? null;
  const euro = rows.find((r) => r.commodity === 'Euro') ?? null;
  const commodities = rows.filter((r) => r.bolsa !== 'PTAX');
  return { dolar: dolar ? toDTO(dolar) : null, euro: euro ? toDTO(euro) : null, commodities: commodities.map(toDTO) };
}

/** Todos os preços travados já salvos — filtrado por safra no client (mesmo padrão de culturaSafras). */
export async function listPrecosDefinidos(): Promise<PrecoDefinidoSafra[]> {
  await requireUser();
  const rows = await db.precoDefinidoSafra.findMany({ orderBy: [{ anoSafra: 'asc' }, { commodity: 'asc' }] });
  return rows.map(toPrecoDefinidoDTO);
}

export interface FalhaCotacao {
  item: string;
  /** Por que falhou — sem isso a mensagem da tela é só uma lista de nomes, sem ação possível. */
  motivo: string;
}

export interface CambioUsado {
  valor: number;
  /** YYYY-MM-DD da cotação efetivamente aplicada na conversão. */
  data: string;
  fonte: string;
  /** false = veio do banco (rodada anterior), não da consulta de agora — a tela avisa. */
  aoVivo: boolean;
}

export interface ResultadoRefreshCotacoes {
  atualizados: number;
  falhas: FalhaCotacao[];
  cambioUsado: CambioUsado | null;
}

/**
 * Resolve o câmbio da rodada em três degraus, parando no primeiro que
 * responder: (1) consulta ao vivo, (2) linha `Cotacao` do dólar já salva,
 * (3) último ponto `USD` REALIZADO da série `IndiceMercado`.
 *
 * O 3º degrau é o que evita o modo de falha real observado em produção: a
 * `Cotacao` de dólar pode nunca ter sido gravada (se a fonte de câmbio nunca
 * funcionou naquele ambiente), enquanto `IndiceMercado` costuma ter USD vindo
 * do seed/da aba Cronograma de Bancos. Sem esse degrau, uma falha de câmbio
 * derruba as 6 commodities mesmo com a bolsa respondendo perfeitamente.
 */
async function resolverCambio(aoVivo: QuoteResult | null): Promise<CambioUsado | null> {
  if (aoVivo) {
    return {
      valor: aoVivo.precoBrl,
      data: aoVivo.dataReferencia ?? new Date().toISOString().slice(0, 10),
      fonte: aoVivo.fonte ?? 'consulta ao vivo',
      aoVivo: true
    };
  }

  const dolarSalvo = await db.cotacao.findUnique({ where: { commodity: 'Dólar Americano' } });
  if (dolarSalvo) {
    return {
      valor: Number(dolarSalvo.precoBrl),
      data: dolarSalvo.atualizadoEm.toISOString().slice(0, 10),
      fonte: 'último câmbio salvo em Cotações',
      aoVivo: false
    };
  }

  const indiceUsd = await db.indiceMercado.findFirst({
    where: { tipo: 'USD', origem: 'REALIZADO' },
    orderBy: { dataReferencia: 'desc' }
  });
  if (indiceUsd) {
    return {
      valor: Number(indiceUsd.valor),
      data: indiceUsd.dataReferencia.toISOString().slice(0, 10),
      fonte: indiceUsd.fonte,
      aoVivo: false
    };
  }

  return null;
}

/** Busca preços reais (PTAX + Yahoo Finance) e grava no banco. Falhas por ticker são isoladas (fail-soft). */
export async function refreshCotacoes(): Promise<ResultadoRefreshCotacoes> {
  await requireUser();
  const falhas: FalhaCotacao[] = [];
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
    falhas.push({ item: 'Dólar Americano', motivo: 'nenhuma fonte de câmbio respondeu' });
  }

  // Euro (16/09/2026) — só informativo no Painel de Indicadores, nunca usado
  // pra converter commodities (isso continua sendo só o Dólar).
  const euro = await fetchEuroBRL();
  if (euro) {
    await db.cotacao.upsert({
      where: { commodity: 'Euro' },
      update: {
        precoOriginal: euro.precoBrl,
        precoBrl: euro.precoBrl,
        variacaoPercentual: euro.variacaoPercentual,
        maxima: euro.maxima,
        minima: euro.minima,
        volume: 0,
        atualizadoEm: new Date()
      },
      create: {
        commodity: 'Euro',
        bolsa: 'PTAX',
        ticker: 'EUR/BRL',
        precoOriginal: euro.precoBrl,
        unidadeOriginal: 'R$',
        precoBrl: euro.precoBrl,
        unidade: 'R$',
        variacaoPercentual: euro.variacaoPercentual,
        maxima: euro.maxima,
        minima: euro.minima,
        volume: 0
      }
    });
    atualizados++;
  } else {
    falhas.push({ item: 'Euro', motivo: 'nenhuma fonte de câmbio respondeu' });
  }

  const cambioUsado = await resolverCambio(dolar);

  for (const c of COMMODITIES) {
    const quote = await fetchYahooQuote(c.ticker, null); // null: não converte aqui, a conversão de unidade é feita abaixo
    if (!quote || quote.precoUsd == null) {
      falhas.push({ item: c.commodity, motivo: 'a bolsa não respondeu' });
      continue;
    }

    // Só falha quando NENHUM câmbio existe — nem ao vivo, nem salvo, nem na
    // série de índices. Aí de fato não há como converter para R$.
    if (!cambioUsado) {
      falhas.push({ item: c.commodity, motivo: 'sem câmbio para converter em R$' });
      continue;
    }

    const conv = converterCotacaoCommodity(c.commodity, quote.precoUsd, cambioUsado.valor, quote.moedaOriginal);
    // Máxima/mínima passam pelo MESMO fator do preço: gravadas cruas (em USX),
    // ficavam numa escala diferente do `precoBrl` já convertido — a tela
    // mostrava Café a R$ 2.275 ao lado de uma "máxima" de 336.
    const maxima = converterCotacaoCommodity(c.commodity, quote.maxima, cambioUsado.valor, quote.moedaOriginal).precoBrl;
    const minima = converterCotacaoCommodity(c.commodity, quote.minima, cambioUsado.valor, quote.moedaOriginal).precoBrl;
    const volume = BigInt(Math.round(Number.isFinite(quote.volume) ? quote.volume : 0));

    await db.cotacao.upsert({
      where: { commodity: c.commodity },
      update: {
        precoOriginal: conv.precoOriginal,
        unidadeOriginal: conv.unidadeOriginal,
        precoUsd: conv.precoUsd,
        precoBrl: conv.precoBrl,
        unidade: conv.unidadeFinal,
        variacaoPercentual: quote.variacaoPercentual,
        maxima,
        minima,
        volume,
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
        maxima,
        minima,
        volume
      }
    });
    atualizados++;
  }

  revalidatePath('/cotacoes');
  return { atualizados, falhas, cambioUsado };
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
  // MANUAL (Frango/Suíno) fica de fora: nunca tem preço de mercado de verdade
  // pra copiar — sobrescrever com 0 apagaria um preço regional já digitado.
  const rows = await db.cotacao.findMany({ where: { bolsa: { notIn: ['PTAX', 'MANUAL'] } } });

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
    atualizadoEm: row.atualizadoEm.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })
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
