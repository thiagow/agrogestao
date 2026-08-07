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

export type SistemaAmortizacao = 'SAC' | 'PRICE' | 'BULLET' | 'JUROS_PERIODICOS';
export type PeriodicidadePagamento = 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual';
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
  taxaJurosAnual: number; // % a.a.
  sistemaAmortizacao: SistemaAmortizacao;
  periodicidade: PeriodicidadePagamento;
  baseCalculo: BaseCalculoJuros;
  capitalizacao: TipoCapitalizacao;
  dataContratacao: string; // YYYY-MM-DD
  dataVencimento: string; // YYYY-MM-DD
  possuiCarencia: boolean;
  inicioPagamento?: string; // YYYY-MM-DD — usado só quando possuiCarencia = true
}

const PERIODOS_POR_ANO: Record<PeriodicidadePagamento, number> = {
  Mensal: 12,
  Trimestral: 4,
  Semestral: 2,
  Anual: 1
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

export function gerarCronograma(params: GerarCronogramaParams): ParcelaCalculada[] {
  const inicioContrato = new Date(params.dataContratacao);
  const fim = new Date(params.dataVencimento);
  const temCarencia = params.possuiCarencia && !!params.inicioPagamento;
  const inicioPagto = temCarencia ? new Date(params.inicioPagamento as string) : inicioContrato;

  const periodosPorAno = PERIODOS_POR_ANO[params.periodicidade];
  const mesesPorPeriodo = 12 / periodosPorAno;
  const diasPeriodoAprox = mesesPorPeriodo * 30.44;
  const taxaPeriodo = taxaDoPeriodo(params.taxaJurosAnual, diasPeriodoAprox, params.baseCalculo, params.capitalizacao);

  const parcelasCarencia = temCarencia
    ? gerarCarencia(params.saldoInicial, taxaPeriodo, inicioContrato, inicioPagto, mesesPorPeriodo)
    : [];
  const numeroInicial = parcelasCarencia.length;

  if (params.sistemaAmortizacao === 'BULLET') {
    // Pagamento único no vencimento: principal + juros acumulados desde o início do
    // pagamento (ou da contratação, se não houver carência) até o vencimento.
    const diasTotais = diasEntre(inicioPagto, fim);
    const taxaTotal = taxaDoPeriodo(params.taxaJurosAnual, diasTotais, params.baseCalculo, params.capitalizacao);
    const juros = params.saldoInicial * taxaTotal;

    return [
      ...parcelasCarencia,
      {
        numero: numeroInicial + 1,
        dataPagamento: toDateStr(fim),
        valorPrincipal: round2(params.saldoInicial),
        valorJuros: round2(juros),
        valorTotal: round2(params.saldoInicial + juros),
        saldoDevedor: 0
      }
    ];
  }

  const mesesRestantes = Math.max(1, Math.round(diasEntre(inicioPagto, fim) / 30.44));

  if (params.sistemaAmortizacao === 'JUROS_PERIODICOS') {
    const numParcelas = Math.max(1, Math.round(mesesRestantes / mesesPorPeriodo));
    return [
      ...parcelasCarencia,
      ...gerarJurosPeriodicos(params.saldoInicial, taxaPeriodo, numParcelas, inicioPagto, mesesPorPeriodo, numeroInicial)
    ];
  }

  const numParcelas = Math.max(1, Math.round(mesesRestantes / mesesPorPeriodo));
  const parcelasPrincipal =
    params.sistemaAmortizacao === 'SAC'
      ? gerarSac(params.saldoInicial, taxaPeriodo, numParcelas, inicioPagto, mesesPorPeriodo, numeroInicial)
      : gerarPrice(params.saldoInicial, taxaPeriodo, numParcelas, inicioPagto, mesesPorPeriodo, numeroInicial);

  return [...parcelasCarencia, ...parcelasPrincipal];
}

/** Parcelas de carência: só juros, sem amortizar principal, entre a contratação e o início do pagamento. */
function gerarCarencia(
  saldo: number,
  taxaPeriodo: number,
  inicio: Date,
  fimCarencia: Date,
  mesesPorPeriodo: number
): ParcelaCalculada[] {
  const mesesCarencia = Math.round(diasEntre(inicio, fimCarencia) / 30.44);
  if (mesesCarencia <= 0) return [];

  const numPeriodos = Math.max(1, Math.round(mesesCarencia / mesesPorPeriodo));
  const parcelas: ParcelaCalculada[] = [];

  for (let i = 1; i <= numPeriodos; i++) {
    const juros = saldo * taxaPeriodo;
    parcelas.push({
      numero: i,
      dataPagamento: toDateStr(addMonths(inicio, Math.round(i * mesesPorPeriodo))),
      valorPrincipal: 0,
      valorJuros: round2(juros),
      valorTotal: round2(juros),
      saldoDevedor: round2(saldo)
    });
  }

  return parcelas;
}

function gerarSac(
  saldoInicial: number,
  taxaPeriodo: number,
  numParcelas: number,
  inicio: Date,
  mesesPorPeriodo: number,
  numeroInicial: number
): ParcelaCalculada[] {
  const amortizacaoConstante = saldoInicial / numParcelas;
  let saldo = saldoInicial;
  const parcelas: ParcelaCalculada[] = [];

  for (let i = 1; i <= numParcelas; i++) {
    const juros = saldo * taxaPeriodo;
    const principal = i === numParcelas ? saldo : amortizacaoConstante;
    saldo = Math.max(0, saldo - principal);

    parcelas.push({
      numero: numeroInicial + i,
      dataPagamento: toDateStr(addMonths(inicio, Math.round(i * mesesPorPeriodo))),
      valorPrincipal: round2(principal),
      valorJuros: round2(juros),
      valorTotal: round2(principal + juros),
      saldoDevedor: round2(saldo)
    });
  }

  return parcelas;
}

function gerarPrice(
  saldoInicial: number,
  taxaPeriodo: number,
  numParcelas: number,
  inicio: Date,
  mesesPorPeriodo: number,
  numeroInicial: number
): ParcelaCalculada[] {
  const parcelaConstante =
    taxaPeriodo === 0
      ? saldoInicial / numParcelas
      : (saldoInicial * taxaPeriodo) / (1 - Math.pow(1 + taxaPeriodo, -numParcelas));

  let saldo = saldoInicial;
  const parcelas: ParcelaCalculada[] = [];

  for (let i = 1; i <= numParcelas; i++) {
    const juros = saldo * taxaPeriodo;
    const principal = i === numParcelas ? saldo : parcelaConstante - juros;
    saldo = Math.max(0, saldo - principal);

    parcelas.push({
      numero: numeroInicial + i,
      dataPagamento: toDateStr(addMonths(inicio, Math.round(i * mesesPorPeriodo))),
      valorPrincipal: round2(principal),
      valorJuros: round2(juros),
      valorTotal: round2(principal + juros),
      saldoDevedor: round2(saldo)
    });
  }

  return parcelas;
}

/** Juros pagos a cada período sobre o saldo integral; principal só na última parcela. */
function gerarJurosPeriodicos(
  saldo: number,
  taxaPeriodo: number,
  numParcelas: number,
  inicio: Date,
  mesesPorPeriodo: number,
  numeroInicial: number
): ParcelaCalculada[] {
  const parcelas: ParcelaCalculada[] = [];

  for (let i = 1; i <= numParcelas; i++) {
    const juros = saldo * taxaPeriodo;
    const principal = i === numParcelas ? saldo : 0;

    parcelas.push({
      numero: numeroInicial + i,
      dataPagamento: toDateStr(addMonths(inicio, Math.round(i * mesesPorPeriodo))),
      valorPrincipal: round2(principal),
      valorJuros: round2(juros),
      valorTotal: round2(principal + juros),
      saldoDevedor: round2(i === numParcelas ? 0 : saldo)
    });
  }

  return parcelas;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
