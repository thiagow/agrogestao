// Ingestão de dados de mercado reais — três fontes públicas, nenhuma exige chave:
//  - AwesomeAPI (economia.awesomeapi.com): câmbio USD/BRL, mantida por
//    devs brasileiros, gratuita, sem cadastro.
//  - Yahoo Finance (query1.finance.yahoo.com/v8/finance/chart): cotação de
//    futuros de commodities pelos mesmos tickers que já estavam no mock
//    (ZS=F soja, ZC=F milho, CT=F algodão, GF=F boi, ZW=F trigo, KC=F café).
//    Endpoint não-oficial, mas amplamente usado publicamente para leitura;
//    se cair, o refresh simplesmente mantém o último preço salvo (fail-soft).
//  - Banco Central (api.bcb.gov.br, sistema SGS): CDI e IPCA, usados no cálculo
//    de juros dos contratos bancários indexados. Fonte primária e oficial do
//    dado — não é agregador nem scraping de portal.
//
// Todas seguem o mesmo contrato: retornam `null` em qualquer falha, nunca
// lançam. Quem chama decide o que fazer com a ausência (tipicamente: manter o
// último valor salvo e avisar na UI).

export interface QuoteResult {
  precoUsd?: number;
  precoBrl: number;
  variacaoPercentual: number;
  maxima: number;
  minima: number;
  volume: number;
}

export async function fetchDolarBRL(): Promise<QuoteResult | null> {
  try {
    const res = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL', {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) return null;
    const data = await res.json();
    const q = data?.USDBRL;
    if (!q) return null;

    return {
      precoBrl: Number(q.bid),
      variacaoPercentual: Number(q.pctChange),
      maxima: Number(q.high),
      minima: Number(q.low),
      volume: 0
    };
  } catch {
    return null;
  }
}

/** `usdBrl` converte o preço em USD do contrato futuro para BRL, quando aplicável. */
export async function fetchYahooQuote(ticker: string, usdBrl: number | null): Promise<QuoteResult | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`,
      {
        next: { revalidate: 0 },
        signal: AbortSignal.timeout(8000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AgroGestaoBot/1.0)' }
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta || typeof meta.regularMarketPrice !== 'number') return null;

    const precoUsd = meta.regularMarketPrice as number;
    const anterior = (meta.previousClose ?? meta.chartPreviousClose ?? precoUsd) as number;
    const variacaoPercentual = anterior > 0 ? ((precoUsd - anterior) / anterior) * 100 : 0;

    return {
      precoUsd,
      precoBrl: usdBrl ? precoUsd * usdBrl : precoUsd,
      variacaoPercentual,
      maxima: (meta.regularMarketDayHigh as number) ?? precoUsd,
      minima: (meta.regularMarketDayLow as number) ?? precoUsd,
      volume: (meta.regularMarketVolume as number) ?? 0
    };
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------
// Banco Central — Sistema Gerenciador de Séries Temporais (SGS)
// ------------------------------------------------------------------

/** Códigos das séries do SGS usadas pelo projeto. */
export const SERIE_BCB = {
  /** CDI anualizado, base 252 dias úteis (% a.a.) — divulgação diária. */
  CDI: 4389,
  /** IPCA acumulado em 12 meses (%) — divulgação mensal. */
  IPCA: 13522
} as const;

export interface IndiceResult {
  valor: number;
  dataReferencia: string; // YYYY-MM-DD
}

/**
 * Último valor publicado de uma série do SGS.
 *
 * A resposta vem como `[{ "data": "12/08/2026", "valor": "13.90" }]` — data em
 * dd/MM/yyyy e valor como string com ponto decimal.
 */
export async function fetchSerieBcb(codigo: number): Promise<IndiceResult | null> {
  try {
    const res = await fetch(
      `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigo}/dados/ultimos/1?formato=json`,
      { next: { revalidate: 0 }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;

    const data = await res.json();
    const ultimo = Array.isArray(data) ? data[data.length - 1] : null;
    if (!ultimo) return null;

    const valor = Number(ultimo.valor);
    const dataReferencia = parseDataBcb(ultimo.data);
    if (!Number.isFinite(valor) || !dataReferencia) return null;

    return { valor, dataReferencia };
  } catch {
    return null;
  }
}

/** "12/08/2026" -> "2026-08-12". Retorna null se o formato não bater. */
function parseDataBcb(data: unknown): string | null {
  if (typeof data !== 'string') return null;
  const m = data.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

/**
 * Série histórica (realizada) do SGS num intervalo de datas — usado pra
 * backfill de "índice realizado" em períodos passados (Fase 5, 19/08/2026).
 * Formato de resposta idêntico a `fetchSerieBcb`, só que com N pontos.
 */
export async function fetchSerieBcbIntervalo(
  codigo: number,
  dataInicial: string, // YYYY-MM-DD
  dataFinal: string // YYYY-MM-DD
): Promise<IndiceResult[] | null> {
  try {
    const fmt = (iso: string) => {
      const [y, m, d] = iso.split('-');
      return `${d}/${m}/${y}`;
    };
    const res = await fetch(
      `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigo}/dados?formato=json&dataInicial=${fmt(dataInicial)}&dataFinal=${fmt(dataFinal)}`,
      { next: { revalidate: 0 }, signal: AbortSignal.timeout(15000) }
    );
    if (!res.ok) return null;

    const data = await res.json();
    if (!Array.isArray(data)) return null;

    const pontos: IndiceResult[] = [];
    for (const item of data) {
      const valor = Number(item.valor);
      const dataReferencia = parseDataBcb(item.data);
      if (Number.isFinite(valor) && dataReferencia) pontos.push({ valor, dataReferencia });
    }
    return pontos.length > 0 ? pontos : null;
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------
// Banco Central — API de Expectativas de Mercado (Focus)
// ------------------------------------------------------------------
//
// Fonte oficial de PROJEÇÃO (não realizado) — pesquisa diária com analistas
// de mercado. Confirmado por consulta direta em 19/08/2026 (Olinda/OData):
//   https://olinda.bcb.gov.br/olinda/servico/Expectativas/versao/v1/odata/ExpectativasMercadoAnuais
// Indicadores confirmados com dado real: 'Selic', 'IPCA', 'Câmbio'.
//
// IMPORTANTE — não existe indicador "CDI" na Focus. A prática padrão de
// mercado é usar a projeção de Selic como proxy do CDI (o CDI acompanha a
// Selic com spread mínimo e estável) — isso precisa ficar visível na UI e no
// relatório ao cliente, nunca apresentado como "CDI projetado" sem essa nota.
//
// Granularidade: só o endpoint ANUAL (`ExpectativasMercadoAnuais`) é usado —
// um ponto de projeção por ano-calendário, mesmo critério de precisão "meses
// aproximados" já adotado no resto do projeto (ver amortizacao.ts). Existe
// também um endpoint mensal (`ExpectativasMercadoMensais`) para granularidade
// fina, fora de escopo por ora.
export type IndicadorFocus = 'Selic' | 'IPCA' | 'Câmbio';

export interface ProjecaoAnual {
  ano: number;
  valor: number; // % a.a. (Selic/IPCA) ou BRL/USD (Câmbio) — média das respostas
}

/**
 * Projeções anuais mais recentes de um indicador Focus, uma por ano-calendário
 * (a API devolve o histórico de todas as pesquisas diárias — filtra só a
 * pesquisa mais recente disponível).
 */
export async function fetchExpectativasFocusAnuais(indicador: IndicadorFocus): Promise<ProjecaoAnual[] | null> {
  try {
    const filtro = encodeURIComponent(`Indicador eq '${indicador}'`);
    const url = `https://olinda.bcb.gov.br/olinda/servico/Expectativas/versao/v1/odata/ExpectativasMercadoAnuais?$filter=${filtro}&$orderby=Data desc&$top=500&$format=json`;
    const res = await fetch(url, { next: { revalidate: 0 }, signal: AbortSignal.timeout(12000) });
    if (!res.ok) return null;

    const data = await res.json();
    const rows: Array<{ Data: string; DataReferencia: string; Media: number }> = data?.value ?? [];
    if (rows.length === 0) return null;

    // A pesquisa mais recente é publicada no mesmo dia pra todos os anos —
    // filtra só as linhas do dia de pesquisa mais recente presente no resultado.
    const dataMaisRecente = rows.reduce((max, r) => (r.Data > max ? r.Data : max), rows[0].Data);
    const doDiaMaisRecente = rows.filter((r) => r.Data === dataMaisRecente);

    const projecoes: ProjecaoAnual[] = [];
    for (const r of doDiaMaisRecente) {
      const ano = Number(r.DataReferencia);
      const valor = Number(r.Media);
      if (Number.isFinite(ano) && Number.isFinite(valor)) projecoes.push({ ano, valor });
    }
    projecoes.sort((a, b) => a.ano - b.ano);
    return projecoes.length > 0 ? projecoes : null;
  } catch {
    return null;
  }
}
