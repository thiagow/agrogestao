// Ingestão de dados de mercado reais — fontes públicas, nenhuma exige chave:
//  - Banco Central (olinda.bcb.gov.br, serviço PTAX): câmbio USD/BRL oficial.
//    Fonte PRIMÁRIA do dólar desde 27/08/2026 — ver nota abaixo.
//  - Banco Central (api.bcb.gov.br, sistema SGS): CDI e IPCA, usados no cálculo
//    de juros dos contratos bancários indexados. Fonte primária e oficial do
//    dado — não é agregador nem scraping de portal.
//  - AwesomeAPI (economia.awesomeapi.com): câmbio USD/BRL, mantida por
//    devs brasileiros, gratuita, sem cadastro. Rebaixada a RESERVA do dólar.
//  - Yahoo Finance (query1.finance.yahoo.com/v8/finance/chart): cotação de
//    futuros de commodities pelos mesmos tickers que já estavam no mock
//    (ZS=F soja, ZC=F milho, CT=F algodão, GF=F boi, ZW=F trigo, KC=F café).
//    Endpoint não-oficial, mas amplamente usado publicamente para leitura;
//    se cair, o refresh simplesmente mantém o último preço salvo (fail-soft).
//
// POR QUE O DÓLAR MIGROU PARA A PTAX (27/08/2026): a AwesomeAPI responde 200
// de uma rede residencial mas nunca gravou uma única vez em produção (função
// serverless da Netlify, AWS us-east-2) — é um serviço brasileiro gratuito que
// limita/bloqueia faixas de IP de datacenter, e mandar User-Agent explícito
// não foi suficiente. Como o câmbio é o insumo que converte TODAS as
// commodities para R$, essa falha derrubava a tela inteira. A PTAX resolve
// isso por três motivos: é oficial, e é servida pelo MESMO host que
// `fetchExpectativasFocusAnuais` já consome com sucesso em produção (prova de
// alcançabilidade a partir do Netlify), e é semanticamente a taxa que o módulo
// Bancos já usa (`ContratoBancario.ptaxInicial`).
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
  /** Rótulo da fonte que efetivamente respondeu — gravado junto do valor para a série de índices não registrar a origem errada. */
  fonte?: string;
  /** Data de referência do valor (YYYY-MM-DD). Na PTAX não é necessariamente hoje: a cotação do dia só sai ~13h BRT, e fim de semana/feriado não tem publicação. */
  dataReferencia?: string;
}

/**
 * Uma tentativa de buscar o câmbio na AwesomeAPI — `null` em qualquer falha
 * (nunca lança). Envia `User-Agent`/`Accept` explícitos: sem eles, chamadas
 * saindo de IPs de datacenter (como as funções serverless da Netlify) têm
 * sido rejeitadas de forma silenciosa por essa fonte, mesmo com o endpoint
 * no ar — o mesmo request funciona sem esses cabeçalhos de uma rede
 * residencial/de desenvolvimento. `fetchYahooQuote` já manda User-Agent por
 * este mesmo motivo; aqui não mandava nenhum cabeçalho.
 */
async function tentarFetchDolarBRL(): Promise<QuoteResult | null> {
  try {
    const res = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL', {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(8000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AgroGestaoBot/1.0)',
        Accept: 'application/json'
      }
    });
    if (!res.ok) {
      console.error(`[market-data] AwesomeAPI USD-BRL respondeu ${res.status} ${res.statusText}`);
      return null;
    }
    const data = await res.json();
    const q = data?.USDBRL;
    if (!q) {
      console.error('[market-data] AwesomeAPI USD-BRL respondeu 200 mas sem o campo USDBRL esperado');
      return null;
    }

    return {
      precoBrl: Number(q.bid),
      variacaoPercentual: Number(q.pctChange),
      maxima: Number(q.high),
      minima: Number(q.low),
      volume: 0
    };
  } catch (e) {
    console.error('[market-data] AwesomeAPI USD-BRL falhou:', e instanceof Error ? e.message : e);
    return null;
  }
}

/**
 * Câmbio USD/BRL via AwesomeAPI, com uma retentativa imediata em caso de
 * falha — a fonte é sujeita a blips passageiros (timeout/rate limit) que uma
 * segunda tentativa costuma resolver sozinha. Continua fail-soft: `null` se
 * as duas tentativas falharem, nunca lança.
 */
async function fetchDolarAwesomeApi(): Promise<QuoteResult | null> {
  return (await tentarFetchDolarBRL()) ?? (await tentarFetchDolarBRL());
}

/** Dias corridos consultados para trás na PTAX — folga suficiente para qualquer emenda de feriado brasileiro. */
const JANELA_DIAS_PTAX = 12;

/** Date -> "MM-DD-YYYY" (formato exigido pelos parâmetros de data da API PTAX, não é ISO). */
function dataParamPtax(d: Date): string {
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${mm}-${dd}-${d.getUTCFullYear()}`;
}

interface CotacaoPtaxRow {
  cotacaoCompra: number;
  cotacaoVenda: number;
  /** "2026-08-26 13:05:20.847747" */
  dataHoraCotacao: string;
}

/**
 * PTAX (dólar oficial do Banco Central) — fonte primária do câmbio.
 *
 * Usa `CotacaoDolarPeriodo` (e não `CotacaoDolarDia`) de propósito: a PTAX só
 * é publicada em dia útil, então consultar "hoje" devolve lista vazia em todo
 * fim de semana e feriado. Pedir uma janela de dias e ordenar decrescente
 * resolve isso numa única requisição, sem laço de retentativa por data.
 *
 * `$top=2` traz o último dia útil publicado E o anterior — é o que permite
 * calcular a variação percentual de verdade, em vez de gravar zero.
 *
 * Sem cabeçalhos: `fetchExpectativasFocusAnuais` já chama este mesmo host sem
 * nenhum e funciona em produção.
 */
export async function fetchPtaxDolar(): Promise<QuoteResult | null> {
  try {
    const hojeUtc = new Date();
    const inicio = new Date(hojeUtc.getTime() - JANELA_DIAS_PTAX * 24 * 60 * 60 * 1000);
    const url =
      'https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/' +
      'CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)' +
      `?@dataInicial='${dataParamPtax(inicio)}'&@dataFinalCotacao='${dataParamPtax(hojeUtc)}'` +
      '&$top=2&$orderby=dataHoraCotacao%20desc&$format=json';

    const res = await fetch(url, { next: { revalidate: 0 }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      console.error(`[market-data] PTAX respondeu ${res.status} ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    const rows: CotacaoPtaxRow[] = data?.value ?? [];
    const atual = rows[0];
    if (!atual || !Number.isFinite(Number(atual.cotacaoVenda))) {
      console.error(`[market-data] PTAX respondeu 200 mas sem cotação utilizável (${rows.length} linha(s))`);
      return null;
    }

    // `cotacaoVenda` é a leitura usada em Bancos (ContratoBancario.ptaxInicial).
    const venda = Number(atual.cotacaoVenda);
    const anterior = rows[1] ? Number(rows[1].cotacaoVenda) : null;
    const variacaoPercentual = anterior && anterior > 0 ? ((venda - anterior) / anterior) * 100 : 0;

    return {
      precoBrl: venda,
      variacaoPercentual,
      // A PTAX é uma cotação de fechamento, não tem máxima/mínima intradiária.
      maxima: venda,
      minima: venda,
      volume: 0,
      fonte: 'BCB PTAX (cotação de venda)',
      dataReferencia: atual.dataHoraCotacao?.slice(0, 10)
    };
  } catch (e) {
    console.error('[market-data] PTAX falhou:', e instanceof Error ? e.message : e);
    return null;
  }
}

/**
 * Câmbio USD/BRL: PTAX oficial primeiro, AwesomeAPI como reserva.
 *
 * A AwesomeAPI segue no código (e não foi apagada) porque entrega máxima e
 * mínima intradiárias que a PTAX não tem — quando ela está alcançável, o card
 * do dólar fica mais rico. Mas ela nunca mais decide sozinha se a tela
 * funciona.
 */
export async function fetchDolarBRL(): Promise<QuoteResult | null> {
  const ptax = await fetchPtaxDolar();
  if (ptax) return ptax;

  console.error('[market-data] PTAX indisponível — tentando AwesomeAPI como reserva');
  const awesome = await fetchDolarAwesomeApi();
  return awesome ? { ...awesome, fonte: 'AwesomeAPI USD-BRL', dataReferencia: hojeIso() } : null;
}

/** Hoje em YYYY-MM-DD (UTC), usado como data de referência quando a fonte não informa uma. */
function hojeIso(): string {
  return new Date().toISOString().slice(0, 10);
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
    if (!res.ok) {
      console.error(`[market-data] Yahoo Finance ${ticker} respondeu ${res.status} ${res.statusText}`);
      return null;
    }
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta || typeof meta.regularMarketPrice !== 'number') {
      console.error(`[market-data] Yahoo Finance ${ticker} respondeu 200 mas sem regularMarketPrice`);
      return null;
    }

    const precoUsd = meta.regularMarketPrice as number;
    const anterior = (meta.previousClose ?? meta.chartPreviousClose ?? precoUsd) as number;
    const variacaoPercentual = anterior > 0 ? ((precoUsd - anterior) / anterior) * 100 : 0;
    // `??` só cobre null/undefined: um volume não-numérico passaria adiante e
    // estouraria em BigInt(NaN) na hora de gravar.
    const volumeBruto = Number(meta.regularMarketVolume);

    return {
      precoUsd,
      precoBrl: usdBrl ? precoUsd * usdBrl : precoUsd,
      variacaoPercentual,
      maxima: (meta.regularMarketDayHigh as number) ?? precoUsd,
      minima: (meta.regularMarketDayLow as number) ?? precoUsd,
      volume: Number.isFinite(volumeBruto) ? volumeBruto : 0,
      fonte: 'Yahoo Finance',
      dataReferencia: hojeIso()
    };
  } catch (e) {
    console.error(`[market-data] Yahoo Finance ${ticker} falhou:`, e instanceof Error ? e.message : e);
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
