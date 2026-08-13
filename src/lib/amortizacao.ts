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
// arredondado a cada período e a última parcela liquida o remanescente, de modo
// que a soma dos principais bate exatamente com o valor contratado, o saldo
// final é exatamente zero e `valorTotal === valorPrincipal + valorJuros` em toda
// parcela. Antes desta revisão o cronograma acumulava resíduo de arredondamento
// e não reconciliava com o contrato.
//
// A taxa recebida em `taxaJurosAnual` é a taxa EFETIVA — indexador e spread já
// somados. Quem resolve CDI/IPCA/dólar é src/lib/taxa-efetiva.ts.

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
    const principal = round2(params.saldoInicial);
    const juros = round2(principal * taxaTotal);

    return [
      ...parcelasCarencia,
      {
        numero: numeroInicial + 1,
        dataPagamento: toDateStr(fim),
        valorPrincipal: principal,
        valorJuros: juros,
        valorTotal: round2(principal + juros),
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
  const saldoBase = round2(saldo);
  const juros = round2(saldoBase * taxaPeriodo);

  for (let i = 1; i <= numPeriodos; i++) {
    parcelas.push({
      numero: i,
      dataPagamento: toDateStr(addMonths(inicio, Math.round(i * mesesPorPeriodo))),
      valorPrincipal: 0,
      valorJuros: juros,
      valorTotal: juros,
      saldoDevedor: saldoBase
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
  let saldo = round2(saldoInicial);
  const parcelas: ParcelaCalculada[] = [];

  for (let i = 1; i <= numParcelas; i++) {
    const juros = round2(saldo * taxaPeriodo);
    // A última parcela liquida o saldo remanescente — como o saldo é mantido em
    // centavos exatos, isso faz a soma dos principais fechar com o contratado.
    const principal = i === numParcelas ? saldo : Math.min(round2(amortizacaoConstante), saldo);
    saldo = round2(saldo - principal);

    parcelas.push({
      numero: numeroInicial + i,
      dataPagamento: toDateStr(addMonths(inicio, Math.round(i * mesesPorPeriodo))),
      valorPrincipal: principal,
      valorJuros: juros,
      valorTotal: round2(principal + juros),
      saldoDevedor: saldo
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

  let saldo = round2(saldoInicial);
  const parcelas: ParcelaCalculada[] = [];

  for (let i = 1; i <= numParcelas; i++) {
    const juros = round2(saldo * taxaPeriodo);
    const principal = i === numParcelas ? saldo : Math.min(round2(parcelaConstante - juros), saldo);
    saldo = round2(saldo - principal);

    parcelas.push({
      numero: numeroInicial + i,
      dataPagamento: toDateStr(addMonths(inicio, Math.round(i * mesesPorPeriodo))),
      valorPrincipal: principal,
      valorJuros: juros,
      valorTotal: round2(principal + juros),
      saldoDevedor: saldo
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
  const saldoBase = round2(saldo);
  const juros = round2(saldoBase * taxaPeriodo);

  for (let i = 1; i <= numParcelas; i++) {
    const principal = i === numParcelas ? saldoBase : 0;

    parcelas.push({
      numero: numeroInicial + i,
      dataPagamento: toDateStr(addMonths(inicio, Math.round(i * mesesPorPeriodo))),
      valorPrincipal: principal,
      valorJuros: juros,
      valorTotal: round2(principal + juros),
      saldoDevedor: i === numParcelas ? 0 : saldoBase
    });
  }

  return parcelas;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
