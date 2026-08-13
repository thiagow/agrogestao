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
