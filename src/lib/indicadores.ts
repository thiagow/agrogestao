// Indicadores financeiros computados ao vivo a partir do BalancoPatrimonial
// (6 contas agregadas). Nunca persistidos como número solto — sempre
// recalculados na leitura, para nunca dessincronizar do balanço real.
//
// O BalancoPatrimonial só tem 6 contas agregadas (sem caixa, estoques,
// EBITDA, EBIT, despesas financeiras). Os indicadores do AgroFlow original
// que dependem dessas contas mais finas ficam explicitamente listados como
// indisponíveis — nunca aproximados ou inventados com um número que pareça
// preciso.

export interface BalancoInput {
  ativoCirculante: number;
  ativoNaoCirculante: number;
  passivoCirculante: number;
  passivoNaoCirculante: number;
  capitalReservas: number;
  resultadoSafra: number;
}

export type StatusIndicador = 'Excelente' | 'Bom' | 'Atenção' | 'Crítico';

export interface IndicadorCalculado {
  id: string;
  grupo: 'Liquidez' | 'Estrutura de Capital';
  nome: string;
  valor: number;
  unidade: string;
  status: StatusIndicador;
  formula: string;
  referencia: string;
}

export interface IndicadorIndisponivel {
  nome: string;
  motivo: string;
}

function classificar(valor: number, thresholds: [number, number, number], invertido = false): StatusIndicador {
  const [excelente, bom, atencao] = thresholds;
  const cmp = invertido
    ? [valor <= excelente, valor <= bom, valor <= atencao]
    : [valor >= excelente, valor >= bom, valor >= atencao];
  if (cmp[0]) return 'Excelente';
  if (cmp[1]) return 'Bom';
  if (cmp[2]) return 'Atenção';
  return 'Crítico';
}

export function calcularIndicadores(b: BalancoInput): {
  indicadores: IndicadorCalculado[];
  indisponiveis: IndicadorIndisponivel[];
} {
  const ativoTotal = b.ativoCirculante + b.ativoNaoCirculante;
  const passivoTotal = b.passivoCirculante + b.passivoNaoCirculante;
  const patrimonioLiquido = b.capitalReservas + b.resultadoSafra;

  const liquidezCorrente = b.passivoCirculante > 0 ? b.ativoCirculante / b.passivoCirculante : 0;
  const endividamentoGeral = ativoTotal > 0 ? (passivoTotal / ativoTotal) * 100 : 0;
  const composicaoCpLp = passivoTotal > 0 ? (b.passivoCirculante / passivoTotal) * 100 : 0;
  const grauEndividamento = patrimonioLiquido > 0 ? passivoTotal / patrimonioLiquido : 0;
  const alavancagem = patrimonioLiquido > 0 ? ativoTotal / patrimonioLiquido : 0;
  const imobilizacaoPl = patrimonioLiquido > 0 ? (b.ativoNaoCirculante / patrimonioLiquido) * 100 : 0;

  const indicadores: IndicadorCalculado[] = [
    {
      id: 'liquidez-corrente',
      grupo: 'Liquidez',
      nome: 'Liquidez Corrente',
      valor: liquidezCorrente,
      unidade: 'x',
      status: classificar(liquidezCorrente, [2.0, 1.5, 1.0]),
      formula: 'Ativo Circulante / Passivo Circulante',
      referencia: 'Agro: 1,5 (bom)'
    },
    {
      id: 'endividamento-geral',
      grupo: 'Estrutura de Capital',
      nome: 'Endividamento Geral',
      valor: endividamentoGeral,
      unidade: '%',
      status: classificar(endividamentoGeral, [15, 30, 50], true),
      formula: 'Passivo Total / Ativo Total',
      referencia: '< 30% (bom)'
    },
    {
      id: 'composicao-cp-lp',
      grupo: 'Estrutura de Capital',
      nome: 'Composição CP/LP',
      valor: composicaoCpLp,
      unidade: '%',
      status: classificar(composicaoCpLp, [20, 40, 60], true),
      formula: 'Passivo Circulante / Passivo Total',
      referencia: '< 40% (bom)'
    },
    {
      id: 'endividamento-cp',
      grupo: 'Estrutura de Capital',
      nome: 'Endividamento CP',
      valor: composicaoCpLp,
      unidade: '%',
      status: classificar(composicaoCpLp, [20, 40, 60], true),
      formula: 'Passivo Circulante / Passivo Total',
      referencia: '< 40% (bom)'
    },
    {
      id: 'grau-endividamento',
      grupo: 'Estrutura de Capital',
      nome: 'Grau de Endividamento',
      valor: grauEndividamento,
      unidade: 'x',
      status: classificar(grauEndividamento, [0.5, 1.0, 2.0], true),
      formula: 'Passivo Total / Patrimônio Líquido',
      referencia: '< 1,0x (bom)'
    },
    {
      id: 'alavancagem',
      grupo: 'Estrutura de Capital',
      nome: 'Alavancagem Financeira',
      valor: alavancagem,
      unidade: 'x',
      status: classificar(alavancagem, [1.2, 2.0, 3.0], true),
      formula: 'Ativo Total / Patrimônio Líquido',
      referencia: '< 2,0x (bom)'
    },
    {
      id: 'imobilizacao-pl',
      grupo: 'Estrutura de Capital',
      nome: 'Imobilização do PL',
      valor: imobilizacaoPl,
      unidade: '%',
      status: classificar(imobilizacaoPl, [70, 90, 110], true),
      formula: 'Ativo Não Circulante / Patrimônio Líquido',
      referencia: '< 90% (bom)'
    }
  ];

  const indisponiveis: IndicadorIndisponivel[] = [
    { nome: 'Liquidez Seca', motivo: 'Requer conta "Estoques", ainda não modelada' },
    { nome: 'Liquidez Imediata', motivo: 'Requer conta "Caixa", ainda não modelada' },
    { nome: 'Liquidez Geral', motivo: 'Requer detalhamento de Realizável/Exigível de Longo Prazo' },
    { nome: 'Dívida / EBITDA', motivo: 'Requer EBITDA, ainda não modelado' },
    { nome: 'Cobertura de Juros', motivo: 'Requer EBIT e Despesas Financeiras, ainda não modelados' }
  ];

  return { indicadores, indisponiveis };
}
