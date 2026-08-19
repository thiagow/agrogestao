// Geração de cronograma de amortização — réplica confirmada do formulário
// "Cadastrar Contrato Bancário" do AgroFlow (print fotografado pelo usuário em
// 07/08/2026). Função pura, sem I/O, para poder ser testada e reaproveitada tanto no
// server quanto numa eventual preview de client.
//
// Precisão: todo o cálculo de datas usa meses aproximados (30.44 dias/mês, mesmo
// critério já usado neste arquivo antes desta revisão) — não é um motor de
// contagem de dias banco-a-banco. "252 dias úteis" é aproximado a partir de dias
// corridos (dias corridos × 5/7), sem calendário real de feriados — não há fonte de
// feriados no projeto. Isso é suficiente para refletir a diferença entre as 3
// convenções de Base de Cálculo e as 2 de Capitalização de forma real no valor do
// cronograma, mas não substitui um cálculo bancário exato dia a dia.
//
// Fechamento ao centavo (garantido por amortizacao.test.ts): o saldo é mantido
// arredondado a cada período e a última parcela de principal liquida o
// remanescente, de modo que a soma dos principais bate exatamente com o valor
// contratado e o saldo final é exatamente zero.
//
// A taxa recebida em `taxaJurosAnual` é a taxa EFETIVA — indexador e spread já
// somados. Quem resolve CDI/IPCA/dólar é src/lib/taxa-efetiva.ts.
//
// ── Desacoplamento Principal × Juros (19/08/2026) ───────────────────────────
// Regra de negócio do cliente: Principal e Juros passam a ter periodicidades
// independentes (`periodicidadePrincipal`/`periodicidadeJuros`). BULLET e
// JUROS_PERIODICOS saíram do sistema — o mesmo comportamento se obtém com
// `periodicidadePrincipal`/`periodicidadeJuros = 'Final'` (pagamento único na
// data de vencimento, sem nenhum evento intermediário).
//
// Definição de SAC/PRICE nesse modelo (decisão do cliente): as duas siglas
// regem só a perna do PRINCIPAL. SAC = fatias de principal iguais em cada
// data de amortização. PRICE = as fatias de principal seguem a curva de uma
// anuidade calculada só sobre o cronograma de principal (uma "PRICE de
// principal" rodando isolada, com sua própria taxa por período de principal)
// — os juros efetivamente cobrados nunca vêm dessa anuidade auxiliar, só
// definem o formato de como o principal cresce/decresce ao longo do prazo.
// Juros são sempre o valor real incorrido (saldo devedor × taxa do sub-período
// desde o último pagamento de juros) — nunca uma fórmula de anuidade.
//
// Quando periodicidadePrincipal === periodicidadeJuros (caso comum, maioria
// dos contratos hoje), as duas pernas caem exatamente nas mesmas datas e o
// resultado é idêntico ao motor anterior, parcela a parcela — zero regressão.
//
// Internamente, tudo é calculado em "meses nominais" (offsets a partir da
// Data de Contratação, sempre múltiplos aproximados de 30.44 dias) — nunca em
// dias corridos reais entre as datas geradas — porque a composição de taxa
// por sub-período só é matematicamente exata (1+i)^a × (1+i)^b = (1+i)^(a+b)
// quando a e b são frações consistentes do mesmo referencial nominal usado
// para gerar as datas. Misturar dias reais com datas aproximadas quebraria
// a garantia de "parcela total constante" do PRICE.

export type SistemaAmortizacao = 'SAC' | 'PRICE';
export type PeriodicidadeLiquidacao = 'Mensal' | 'Bimestral' | 'Trimestral' | 'Quadrimestral' | 'Semestral' | 'Anual' | 'Final';
export type BaseCalculoJuros = '252 dias úteis' | '360 dias corridos' | '365 dias corridos';
export type TipoCapitalizacao = 'Composta' | 'Simples';

export interface ParcelaCalculada {
  numero: number;
  dataPagamento: string; // YYYY-MM-DD
  valorPrincipal: number;
  valorJuros: number;
  valorTotal: number;
  saldoDevedor: number; // saldo após o pagamento desta parcela
}

interface GerarCronogramaParams {
  saldoInicial: number;
  taxaJurosAnual: number; // % a.a. — taxa "atual", usada pra moldar a curva de Principal (SAC/PRICE) e como fallback dos Juros quando `taxaJurosAnualPorData` não é informada.
  sistemaAmortizacao: SistemaAmortizacao;
  periodicidadePrincipal: PeriodicidadeLiquidacao;
  periodicidadeJuros: PeriodicidadeLiquidacao;
  baseCalculo: BaseCalculoJuros;
  capitalizacao: TipoCapitalizacao;
  dataContratacao: string; // YYYY-MM-DD
  dataVencimento: string; // YYYY-MM-DD
  possuiCarencia: boolean;
  inicioPagamento?: string; // YYYY-MM-DD — usado só quando possuiCarencia = true; atrasa só a perna de Principal
  /**
   * Taxa efetiva anual (% a.a.) aplicável aos JUROS incorridos até uma data
   * específica (Fase 5, 19/08/2026) — realizado nas datas já passadas,
   * projeção (BCB Focus) nas futuras. Opcional: quando omitida, todo o
   * cronograma usa `taxaJurosAnual` uniformemente (comportamento anterior,
   * preservado por padrão). Só a perna de Juros consulta essa função — a
   * curva de Principal (SAC/PRICE) continua moldada pela taxa atual, único
   * jeito de manter uma curva de amortização previsível (ver
   * calcularFatiasPrincipal). Recebe a data do FIM do sub-período de acúmulo.
   */
  taxaJurosAnualPorData?: (dataISO: string) => number;
}

const MESES_POR_PERIODO: Record<Exclude<PeriodicidadeLiquidacao, 'Final'>, number> = {
  Mensal: 1,
  Bimestral: 2,
  Trimestral: 3,
  Quadrimestral: 4,
  Semestral: 6,
  Anual: 12
};

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function diasEntre(a: Date, b: Date): number {
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}

/** Converte dias corridos numa fração do ano, de acordo com a Base de Cálculo. */
function fracaoAno(diasCorridos: number, baseCalculo: BaseCalculoJuros): number {
  if (baseCalculo === '252 dias úteis') {
    const diasUteisAprox = diasCorridos * (5 / 7); // sem calendário de feriados real
    return diasUteisAprox / 252;
  }
  const diasBase = baseCalculo === '360 dias corridos' ? 360 : 365;
  return diasCorridos / diasBase;
}

/** Taxa efetiva do período, respeitando Base de Cálculo e Capitalização. */
function taxaDoPeriodo(
  taxaJurosAnualPercent: number,
  diasCorridos: number,
  baseCalculo: BaseCalculoJuros,
  capitalizacao: TipoCapitalizacao
): number {
  const fracao = fracaoAno(diasCorridos, baseCalculo);
  const taxaAnual = taxaJurosAnualPercent / 100;
  return capitalizacao === 'Composta' ? Math.pow(1 + taxaAnual, fracao) - 1 : taxaAnual * fracao;
}

/**
 * Gera os offsets (em meses nominais desde `inicioOffset`) de cada pagamento
 * de uma perna (Principal ou Juros), do offset inicial até `mesesTotal`
 * (offset final absoluto, relativo à Data de Contratação). O último offset é
 * sempre forçado a `mesesTotal`, para as duas pernas fecharem exatamente no
 * mesmo evento final.
 */
function gerarOffsets(inicioOffset: number, mesesTotal: number, periodicidade: PeriodicidadeLiquidacao): number[] {
  if (periodicidade === 'Final') return [mesesTotal];

  const mesesPorPeriodo = MESES_POR_PERIODO[periodicidade];
  const mesesDisponiveis = Math.max(1, mesesTotal - inicioOffset);
  const numPeriodos = Math.max(1, Math.round(mesesDisponiveis / mesesPorPeriodo));

  const offsets: number[] = [];
  for (let i = 1; i < numPeriodos; i++) {
    offsets.push(inicioOffset + i * mesesPorPeriodo);
  }
  offsets.push(mesesTotal);
  return offsets;
}

/** Fatias de principal por data (SAC = constante; PRICE = curva de anuidade só da perna de principal). */
function calcularFatiasPrincipal(
  saldoInicial: number,
  sistemaAmortizacao: SistemaAmortizacao,
  offsetsPrincipal: number[],
  periodicidadePrincipal: PeriodicidadeLiquidacao,
  taxaJurosAnual: number,
  baseCalculo: BaseCalculoJuros,
  capitalizacao: TipoCapitalizacao
): number[] {
  const n = offsetsPrincipal.length;
  if (sistemaAmortizacao === 'SAC') {
    return Array(n).fill(saldoInicial / n);
  }

  // PRICE: anuidade calculada só sobre o cronograma de principal — taxa do
  // "período de principal" nominal (mesmo critério usado em toda a base:
  // meses nominais × 30.44 dias), independente de eventual carência.
  const mesesPorPeriodoPrincipal = periodicidadePrincipal === 'Final' ? n : MESES_POR_PERIODO[periodicidadePrincipal];
  const taxaPeriodoPrincipal = taxaDoPeriodo(taxaJurosAnual, mesesPorPeriodoPrincipal * 30.44, baseCalculo, capitalizacao);

  if (taxaPeriodoPrincipal === 0) return Array(n).fill(saldoInicial / n);

  const parcelaConstante = (saldoInicial * taxaPeriodoPrincipal) / (1 - Math.pow(1 + taxaPeriodoPrincipal, -n));
  const fatias: number[] = [];
  let saldoAuxiliar = saldoInicial;
  for (let i = 0; i < n; i++) {
    const jurosImplicito = saldoAuxiliar * taxaPeriodoPrincipal;
    const fatia = i === n - 1 ? saldoAuxiliar : parcelaConstante - jurosImplicito;
    fatias.push(fatia);
    saldoAuxiliar -= fatia;
  }
  return fatias;
}

export function gerarCronograma(params: GerarCronogramaParams): ParcelaCalculada[] {
  const inicioContrato = new Date(params.dataContratacao);
  const fim = new Date(params.dataVencimento);
  const temCarencia = params.possuiCarencia && !!params.inicioPagamento;
  const inicioPrincipal = temCarencia ? new Date(params.inicioPagamento as string) : inicioContrato;

  const mesesTotal = Math.max(1, Math.round(diasEntre(inicioContrato, fim) / 30.44));
  const mesesCarencia = temCarencia ? Math.max(0, Math.round(diasEntre(inicioContrato, inicioPrincipal) / 30.44)) : 0;

  const offsetsJuros = gerarOffsets(0, mesesTotal, params.periodicidadeJuros);
  const offsetsPrincipal = gerarOffsets(mesesCarencia, mesesTotal, params.periodicidadePrincipal);

  const fatiasPrincipal = calcularFatiasPrincipal(
    params.saldoInicial,
    params.sistemaAmortizacao,
    offsetsPrincipal,
    params.periodicidadePrincipal,
    params.taxaJurosAnual,
    params.baseCalculo,
    params.capitalizacao
  );

  const setJuros = new Set(offsetsJuros);
  const setPrincipal = new Set(offsetsPrincipal);
  const eventos = Array.from(new Set([...offsetsJuros, ...offsetsPrincipal])).sort((a, b) => a - b);
  const ultimoEvento = eventos[eventos.length - 1];

  let saldoPrincipal = round2(params.saldoInicial);
  let jurosAcumulados = 0;
  let offsetAnterior = 0;
  let idxPrincipal = 0;
  const parcelas: ParcelaCalculada[] = [];

  eventos.forEach((offset, idx) => {
    const data = offset === ultimoEvento ? fim : addMonths(inicioContrato, Math.round(offset));
    const deltaMeses = offset - offsetAnterior;
    // A taxa por data (quando informada) resolve o índice REALIZADO/PROJETADO
    // vigente no fim deste sub-período — ver GerarCronogramaParams.
    const taxaJurosSubPeriodo = params.taxaJurosAnualPorData ? params.taxaJurosAnualPorData(toDateStr(data)) : params.taxaJurosAnual;
    const taxaSubPeriodo = taxaDoPeriodo(taxaJurosSubPeriodo, deltaMeses * 30.44, params.baseCalculo, params.capitalizacao);
    jurosAcumulados += saldoPrincipal * taxaSubPeriodo;

    let principalPago = 0;
    if (setPrincipal.has(offset)) {
      const ultimaDoPrincipal = idxPrincipal === offsetsPrincipal.length - 1;
      principalPago = ultimaDoPrincipal ? saldoPrincipal : Math.min(round2(fatiasPrincipal[idxPrincipal]), saldoPrincipal);
      saldoPrincipal = round2(saldoPrincipal - principalPago);
      idxPrincipal++;
    }

    let jurosPago = 0;
    if (setJuros.has(offset)) {
      jurosPago = round2(jurosAcumulados);
      jurosAcumulados = 0;
    }

    parcelas.push({
      numero: idx + 1,
      dataPagamento: toDateStr(data),
      valorPrincipal: principalPago,
      valorJuros: jurosPago,
      valorTotal: round2(principalPago + jurosPago),
      saldoDevedor: saldoPrincipal
    });

    offsetAnterior = offset;
  });

  return parcelas;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
