// Geração de cronograma de amortização — regra da engenharia reversa do
// AgroFlow ("cronograma auto-gerado por SAC/PRICE/BULLET"). Função pura,
// sem I/O, para poder ser testada e reaproveitada tanto no server quanto
// numa eventual preview de client.

export type SistemaAmortizacao = 'SAC' | 'PRICE' | 'BULLET';
export type PeriodicidadePagamento = 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual';

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
  dataContratacao: string; // YYYY-MM-DD
  dataVencimento: string; // YYYY-MM-DD
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

export function gerarCronograma(params: GerarCronogramaParams): ParcelaCalculada[] {
  const inicio = new Date(params.dataContratacao);
  const fim = new Date(params.dataVencimento);
  const mesesTotais = Math.max(1, Math.round((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));

  if (params.sistemaAmortizacao === 'BULLET') {
    return gerarBullet(params, inicio, mesesTotais);
  }

  const periodosPorAno = PERIODOS_POR_ANO[params.periodicidade];
  const mesesPorPeriodo = 12 / periodosPorAno;
  const numParcelas = Math.max(1, Math.round(mesesTotais / mesesPorPeriodo));
  const taxaPeriodo = Math.pow(1 + params.taxaJurosAnual / 100, mesesPorPeriodo / 12) - 1;

  return params.sistemaAmortizacao === 'SAC'
    ? gerarSac(params.saldoInicial, taxaPeriodo, numParcelas, inicio, mesesPorPeriodo)
    : gerarPrice(params.saldoInicial, taxaPeriodo, numParcelas, inicio, mesesPorPeriodo);
}

function gerarSac(
  saldoInicial: number,
  taxaPeriodo: number,
  numParcelas: number,
  inicio: Date,
  mesesPorPeriodo: number
): ParcelaCalculada[] {
  const amortizacaoConstante = saldoInicial / numParcelas;
  let saldo = saldoInicial;
  const parcelas: ParcelaCalculada[] = [];

  for (let i = 1; i <= numParcelas; i++) {
    const juros = saldo * taxaPeriodo;
    const principal = i === numParcelas ? saldo : amortizacaoConstante;
    saldo = Math.max(0, saldo - principal);

    parcelas.push({
      numero: i,
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
  mesesPorPeriodo: number
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
      numero: i,
      dataPagamento: toDateStr(addMonths(inicio, Math.round(i * mesesPorPeriodo))),
      valorPrincipal: round2(principal),
      valorJuros: round2(juros),
      valorTotal: round2(principal + juros),
      saldoDevedor: round2(saldo)
    });
  }

  return parcelas;
}

/** BULLET: juros pagos periodicamente (anual), principal integral no vencimento. */
function gerarBullet(params: GerarCronogramaParams, inicio: Date, mesesTotais: number): ParcelaCalculada[] {
  const numAnos = Math.max(1, Math.round(mesesTotais / 12));
  const saldo = params.saldoInicial;
  const parcelas: ParcelaCalculada[] = [];

  for (let i = 1; i <= numAnos; i++) {
    const juros = saldo * (params.taxaJurosAnual / 100);
    const principal = i === numAnos ? saldo : 0;

    parcelas.push({
      numero: i,
      dataPagamento: toDateStr(addMonths(inicio, i * 12)),
      valorPrincipal: round2(principal),
      valorJuros: round2(juros),
      valorTotal: round2(principal + juros),
      saldoDevedor: round2(i === numAnos ? 0 : saldo)
    });
  }

  return parcelas;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
