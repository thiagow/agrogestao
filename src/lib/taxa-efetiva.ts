// Taxa efetiva de um contrato bancário — a ponte entre o "Tipo de Taxa"
// cadastrado e o número que o motor de amortização (src/lib/amortizacao.ts)
// realmente usa. Função pura, sem I/O, para rodar igual no server (geração do
// cronograma) e no client (memória de cálculo ao vivo no Drawer).
//
// Regra confirmada com o CTO em 13/08/2026, revisada em 19/08/2026 (Cenários
// Dólar Puro/USD e Variação Cambial/VC):
//
//   Pré-fixado (% a.a.), moeda BRL → taxa cheia do campo "Taxa"
//   Pré-fixado (% a.a.), moeda USD → Cenário "Dólar Puro": os juros (taxa
//                          cheia) incidem sobre o saldo em USD; o cronograma
//                          inteiro é gerado em USD e só convertido pra BRL na
//                          exibição, pela PTAX vigente no ciclo (ver
//                          ptaxVigenteNoCiclo). Ganho/perda cambial reflete
//                          integralmente na conversão — inclusive bonificação
//                          se o dólar cair.
//   CDI + spread         → CDI vigente  + "Taxa"
//   IPCA + spread        → IPCA vigente + "Taxa"
//   Dólar + juros         → Cenário "Variação Cambial (VC)" — moeda sempre
//                          BRL. A "Taxa" é o spread cadastrado; o indexador é
//                          a variação percentual do dólar desde a PTAX Inicial
//                          até a PTAX vigente no ciclo, com PISO EM ZERO (só
//                          conta se o dólar SUBIU — queda não reduz a dívida).
//                          Nunca converte parcela (já é tudo BRL).
//
// O campo "Taxa" é o único campo de taxa do cadastro: taxa cheia no pré-fixado
// (BRL ou USD), spread nos indexados (CDI/IPCA/VC).
//
// Simples vs. Composta e a Base de Cálculo NÃO são resolvidos aqui — quem
// converte a taxa anual em taxa do período é `taxaDoPeriodo()` em
// amortizacao.ts. Este módulo só entrega a taxa anual correta.

import type { TipoTaxaBancaria, Currency } from '@/types';
import type { ParcelaCalculada } from './amortizacao';

export interface IndicesVigentes {
  cdiAA: number | null; // % a.a.
  ipcaAA: number | null; // % a.a. (acumulado 12 meses)
  usdBrl: number | null; // BRL por USD
  atualizadoEm?: string; // YYYY-MM-DD — data de referência mais antiga entre os índices
}

/** Contexto extra necessário só nos Cenários Dólar Puro (USD) e Variação Cambial (VC). */
export interface ContextoCambial {
  moeda?: Currency;
  ptaxInicial?: number | null;
  dataContratacao?: string; // YYYY-MM-DD
  /** Data de referência pra decidir se já passou o aniversário do ciclo PTAX. Default: hoje. */
  hoje?: string; // YYYY-MM-DD
}

export interface TaxaEfetiva {
  /** % a.a. a passar para `gerarCronograma`. */
  taxaAnual: number;
  /** Moeda em que o cronograma é gerado. 'USD' só no Cenário Dólar Puro (moeda=USD, pré-fixado). */
  moedaCalculo: 'BRL' | 'USD';
  /** Cotação USD/BRL usada para converter as parcelas. `null` quando moedaCalculo === 'BRL'. */
  cotacaoAplicada: number | null;
  /** Valor do indexador aplicado (CDI, IPCA, PTAX ou % de variação cambial). `null` no pré-fixado BRL. */
  indiceUsado: number | null;
  /**
   * `true` quando o contrato depende de um índice/cotação que ainda não foi
   * buscado ou cuja fonte falhou. Nesse caso `taxaAnual` cai para o spread
   * puro — nunca se inventa um valor de índice. A UI marca o contrato como
   * pendente de atualização (mesmo critério de src/lib/indicadores.ts).
   */
  indisponivel: boolean;
  /** Memória de cálculo legível: "CDI 13,90% + 4,00% = 17,90% a.a." */
  memoria: string;
}

export const INDICES_VAZIOS: IndicesVigentes = { cdiAA: null, ipcaAA: null, usdBrl: null };

/**
 * PTAX de referência pro ciclo vigente: dentro do 1º ano do contrato, usa a
 * PTAX Inicial cadastrada (trava a referência); a partir do 1º aniversário,
 * passa a usar a cotação de mercado corrente — que por natureza já "renova"
 * a cada vez que o cronograma é regravado (ver src/server/indices.ts,
 * "Atualizar Índices"). Simplificação deliberada: o projeto ainda não guarda
 * série histórica de PTAX por data (isso é Fase 5 — src/server/indices.ts
 * série temporal), então não há como travar exatamente "a cotação do
 * aniversário passado" — o efeito prático é o mesmo (só a conversão de
 * exibição muda; o saldo em USD nunca é re-marcado).
 */
export function ptaxVigenteNoCiclo(
  dataContratacao: string | undefined,
  ptaxInicial: number,
  ptaxMercadoAtual: number,
  hoje?: string
): number {
  if (!dataContratacao) return ptaxMercadoAtual;
  const inicio = new Date(dataContratacao);
  const ref = hoje ? new Date(hoje) : new Date();
  const anosDecorridos = Math.floor((ref.getTime() - inicio.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  return anosDecorridos <= 0 ? ptaxInicial : ptaxMercadoAtual;
}

export function calcularTaxaEfetiva(
  tipoTaxa: TipoTaxaBancaria,
  taxa: number,
  indices: IndicesVigentes,
  contexto: ContextoCambial = {}
): TaxaEfetiva {
  switch (tipoTaxa) {
    case 'CDI + spread':
      return comIndexador('CDI', indices.cdiAA, taxa);

    case 'IPCA + spread':
      return comIndexador('IPCA', indices.ipcaAA, taxa);

    case 'Dólar + juros':
      return calcularVariacaoCambial(taxa, indices, contexto);

    case 'Pré-fixado (% a.a.)':
    default:
      if (contexto.moeda === 'USD') return calcularDolarPuro(taxa, indices, contexto);
      return {
        taxaAnual: taxa,
        moedaCalculo: 'BRL',
        cotacaoAplicada: null,
        indiceUsado: null,
        indisponivel: false,
        memoria: `${pct(taxa)} a.a. (pré-fixado)`
      };
  }
}

/** Cenário "Dólar Puro" — moeda=USD, tipoTaxa Pré-fixado. */
function calcularDolarPuro(taxa: number, indices: IndicesVigentes, contexto: ContextoCambial): TaxaEfetiva {
  const ptaxInicial = contexto.ptaxInicial ?? null;
  if (ptaxInicial === null || ptaxInicial <= 0) {
    return {
      taxaAnual: taxa,
      moedaCalculo: 'BRL',
      cotacaoAplicada: null,
      indiceUsado: null,
      indisponivel: true,
      memoria: `${pct(taxa)} a.a. em USD — PTAX Inicial não cadastrada, parcelas sem conversão`
    };
  }

  const ptaxMercado = indices.usdBrl;
  const cotacao =
    ptaxMercado !== null && ptaxMercado > 0
      ? ptaxVigenteNoCiclo(contexto.dataContratacao, ptaxInicial, ptaxMercado, contexto.hoje)
      : ptaxInicial; // sem cotação corrente disponível, mantém a PTAX Inicial em vez de travar a conversão

  return {
    taxaAnual: taxa,
    moedaCalculo: 'USD',
    cotacaoAplicada: cotacao,
    indiceUsado: cotacao,
    indisponivel: false,
    memoria: `${pct(taxa)} a.a. sobre o saldo em USD (Dólar Puro) · PTAX Inicial ${brl(ptaxInicial)} · convertido a ${brl(cotacao)}/US$`
  };
}

/** Cenário "Variação Cambial (VC)" — moeda=BRL, tipoTaxa='Dólar + juros'. Só conta valorização (piso zero). */
function calcularVariacaoCambial(taxa: number, indices: IndicesVigentes, contexto: ContextoCambial): TaxaEfetiva {
  const ptaxInicial = contexto.ptaxInicial ?? null;
  const ptaxMercado = indices.usdBrl;

  if (ptaxInicial === null || ptaxInicial <= 0 || ptaxMercado === null || ptaxMercado <= 0) {
    return {
      taxaAnual: taxa,
      moedaCalculo: 'BRL',
      cotacaoAplicada: null,
      indiceUsado: null,
      indisponivel: true,
      memoria: `Variação Cambial (VC) indisponível — projeção com apenas ${pct(taxa)} de spread`
    };
  }

  const ptaxCiclo = ptaxVigenteNoCiclo(contexto.dataContratacao, ptaxInicial, ptaxMercado, contexto.hoje);
  const variacaoPercent = Math.max(0, ((ptaxCiclo - ptaxInicial) / ptaxInicial) * 100);
  const total = variacaoPercent + taxa;

  return {
    taxaAnual: total,
    moedaCalculo: 'BRL',
    cotacaoAplicada: null,
    indiceUsado: variacaoPercent,
    indisponivel: false,
    memoria:
      variacaoPercent > 0
        ? `Variação Cambial (VC) ${pct(variacaoPercent)} (PTAX ${brl(ptaxInicial)} → ${brl(ptaxCiclo)}) + ${pct(taxa)} = ${pct(total)} a.a.`
        : `Dólar não valorizou desde a PTAX Inicial (${brl(ptaxInicial)}) — só o spread de ${pct(taxa)} a.a.`
  };
}

function comIndexador(nome: 'CDI' | 'IPCA', valor: number | null, spread: number): TaxaEfetiva {
  if (valor === null) {
    return {
      taxaAnual: spread,
      moedaCalculo: 'BRL',
      cotacaoAplicada: null,
      indiceUsado: null,
      indisponivel: true,
      memoria: `${nome} indisponível — projeção com apenas ${pct(spread)} de spread`
    };
  }

  const total = valor + spread;
  return {
    taxaAnual: total,
    moedaCalculo: 'BRL',
    cotacaoAplicada: null,
    indiceUsado: valor,
    indisponivel: false,
    memoria: `${nome} ${pct(valor)} + ${pct(spread)} = ${pct(total)} a.a.`
  };
}

function pct(n: number): string {
  return `${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function brl(n: number): string {
  return `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Um contrato é indexado quando depende de uma fonte externa para ser projetado. */
export function ehIndexado(tipoTaxa: TipoTaxaBancaria): boolean {
  return tipoTaxa !== 'Pré-fixado (% a.a.)';
}

// ── Fase 5 (19/08/2026) — taxa por período: realizado no passado, projeção no futuro ──
//
// Escopo: só CDI + spread e IPCA + spread consultam a série temporal abaixo.
// Os Cenários Dólar Puro/VC (Fase 4) já têm seu próprio mecanismo de ciclo
// anual (ptaxVigenteNoCiclo) e continuam como estão — estender também pra
// projeção Focus de Câmbio ficaria pra uma rodada futura, sem pedido explícito
// disso. `calcularTaxaEfetiva()` acima continua a função "resolve UMA taxa",
// usada tanto pra memória de cálculo exibida na UI quanto como fallback.

export interface PontoIndice {
  valor: number;
  dataReferencia: string; // YYYY-MM-DD
}

export interface SerieIndice {
  /** Ordenado por dataReferencia crescente. Valores efetivamente apurados (SGS). */
  realizados: PontoIndice[];
  /** Um ponto por ano-calendário (BCB Focus), dataReferencia = 1º de janeiro daquele ano. */
  projetados: PontoIndice[];
}

export interface IndicesSerieTemporal {
  cdi: SerieIndice;
  ipca: SerieIndice;
}

/**
 * Valor de um indicador numa data específica: o REALIZADO mais recente com
 * `dataReferencia <= data` quando a data já passou (ou não há projeção
 * cobrindo esse horizonte); a PROJEÇÃO do ano-calendário da data quando ela é
 * futura. `null` quando não há nem realizado nem projeção aplicável — nunca
 * inventa número (mesmo critério de `calcularTaxaEfetiva`).
 */
export function resolverIndiceNaData(serie: SerieIndice, dataISO: string, hojeISO: string): number | null {
  if (dataISO <= hojeISO) {
    const candidatos = serie.realizados.filter((p) => p.dataReferencia <= dataISO);
    if (candidatos.length > 0) return candidatos[candidatos.length - 1].valor;
    // Sem realizado que cubra essa data (ex: contrato mais antigo que o
    // histórico disponível) — cai pro realizado mais antigo conhecido, se
    // houver, em vez de deixar a parcela sem taxa nenhuma.
    return serie.realizados.length > 0 ? serie.realizados[0].valor : null;
  }

  const ano = dataISO.slice(0, 4);
  const doAno = serie.projetados.find((p) => p.dataReferencia.startsWith(ano));
  if (doAno) return doAno.valor;
  // Fora do horizonte de projeção (Focus cobre ~5 anos à frente) — usa o
  // último ano projetado disponível como aproximação, em vez de nada.
  if (serie.projetados.length > 0) return serie.projetados[serie.projetados.length - 1].valor;
  return null;
}

/**
 * Constrói a função `taxaJurosAnualPorData` que `gerarCronograma` (Fase 5)
 * consome — resolve CDI/IPCA + spread na data de cada sub-período de juros.
 * Só se aplica a contratos CDI+spread/IPCA+spread; para os demais tipos de
 * taxa, devolve sempre `taxaAtualFallback` (a mesma taxa efetiva de sempre).
 */
export function criarTaxaPorData(
  tipoTaxa: TipoTaxaBancaria,
  spread: number,
  series: IndicesSerieTemporal,
  hojeISO: string,
  taxaAtualFallback: number
): (dataISO: string) => number {
  return (dataISO: string) => {
    if (tipoTaxa === 'CDI + spread') {
      const valor = resolverIndiceNaData(series.cdi, dataISO, hojeISO);
      return valor !== null ? valor + spread : spread;
    }
    if (tipoTaxa === 'IPCA + spread') {
      const valor = resolverIndiceNaData(series.ipca, dataISO, hojeISO);
      return valor !== null ? valor + spread : spread;
    }
    return taxaAtualFallback;
  };
}

/**
 * Converte um cronograma gerado em USD para BRL.
 *
 * `Parcela` é sempre persistida em BRL — é a moeda de consolidação de todo o app
 * (KPIs de Bancos, Resumo, Fluxo de Caixa Mensal), e parcela em moeda mista
 * quebraria toda soma a jusante.
 *
 * `cambio` nulo ou não positivo devolve o cronograma intacto: sem cotação
 * confiável, é melhor mostrar o valor em moeda de origem e sinalizar na UI do
 * que multiplicar por um número inventado.
 */
export function converterParcelasParaBrl(
  parcelas: ParcelaCalculada[],
  cambio: number | null
): ParcelaCalculada[] {
  if (!cambio || cambio <= 0) return parcelas;

  const conv = (v: number) => Math.round(v * cambio * 100) / 100;

  return parcelas.map((p) => ({
    ...p,
    valorPrincipal: conv(p.valorPrincipal),
    valorJuros: conv(p.valorJuros),
    valorTotal: conv(p.valorTotal),
    saldoDevedor: conv(p.saldoDevedor)
  }));
}
