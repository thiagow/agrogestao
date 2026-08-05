// Ingestão de cotações reais — duas fontes públicas, nenhuma exige chave:
//  - AwesomeAPI (economia.awesomeapi.com): câmbio USD/BRL, mantida por
//    devs brasileiros, gratuita, sem cadastro.
//  - Yahoo Finance (query1.finance.yahoo.com/v8/finance/chart): cotação de
//    futuros de commodities pelos mesmos tickers que já estavam no mock
//    (ZS=F soja, ZC=F milho, CT=F algodão, GF=F boi, ZW=F trigo, KC=F café).
//    Endpoint não-oficial, mas amplamente usado publicamente para leitura;
//    se cair, o refresh simplesmente mantém o último preço salvo (fail-soft).

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
