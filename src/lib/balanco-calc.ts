// Cálculo puro da tela "Análise Financeira" — réplica confirmada do AgroFlow
// (spec fotografada em 26/08/2026, docs/demandas/SPEC_TELA_ANALISE_FINANCEIRA.md).
// Sem I/O — recebe os dados já carregados de Quadro Safra/Fornecedores/Bancos/
// Arrendamentos/Aquisição de Fazenda/Bens e Direitos (mesmo critério de
// fluxo-safra-calc.ts/fluxo-mensal-calc.ts) e devolve o Balanço/DRE/32
// indicadores + radar + patrimônio IRPF, tudo recomputado a cada chamada.
//
// Decisões confirmadas com o usuário (ver docs/demandas/SPEC_TELA_ANALISE_FINANCEIRA.md
// seção 8 e a sessão que motivou esta reconstrução):
// 1. BUG #1 da spec corrigido: "Bens IRPF" entra como linha explícita no Ativo
//    Não Circulante e no PL (nunca "por fora" da soma visível).
// 2. BUGs #2/#3 da spec não se reproduzem aqui: BemDireito.grupoIrpf já é a
//    taxonomia certa desde a origem (Imóveis Rurais/Bens Móveis/Aplicações),
//    diferente do AgroFlow original que categorizava tudo errado.
// 3. BUG #4 corrigido: indicador com denominador zero por AUSÊNCIA de operação
//    (sem arrendamento, sem estoque) vira `valor: null` + status 'Sem dados'
//    (badge neutro), nunca 'Crítico'.
// 4. CP/LP de Bancos e Aquisição de Fazenda calculado de verdade pelas datas
//    reais das parcelas (vencimento ≤ 12 meses de hoje = Curto Prazo), reaproveitando
//    isCurtoPrazo() — antes o schema não distinguia isso por contrato.
// 5. Radar "Saúde Financeira": fórmula de agregação própria (score 0-100 por
//    status, média por eixo) — a spec não confirma a fórmula exata do original.
// 6. Despesa Comercial usa `despesaComercialScHa` da conta (default 3), não um
//    "3" fixo — spec confirma que é configurável (corrige a suposição de
//    SPEC_TELA_FLUXO_DE_SAFRA.md).

import { calcularSafra, isCurtoPrazo } from '@/lib/agro';
import { anoInicioSafra } from '@/lib/safra-periodo';
import { commodityDaCultura } from '@/lib/cultura-commodity';
import type { AnoFluxo, FluxoContrato } from '@/server/contratos-bancarios';
import type {
  AtivoCalculado,
  Aquisicao,
  BalancoCalculado,
  BemDireito,
  CategoriaPatrimonioIrpf,
  ContratoArrendamento,
  CulturaSafraAno,
  DadosComplementaresFinanceiro,
  DreCalculada,
  IndicadorCalculado,
  PassivoCalculado,
  PatrimonioIrpfResumo,
  PlCalculado,
  PrecoDefinidoSafra,
  ReceitaPorCultura,
  StatusIndicador,
  Supplier
} from '@/types';

function valorBem(bem: BemDireito): number {
  return bem.valorMercadoEstimado ?? bem.valorDeclaradoIrpf ?? 0;
}

/** Soma de todo `BemDireito` de um grupo IRPF específico — mesmo fallback de valor já usado em patrimonio.ts/CadastroMestreView.tsx. */
function somaGrupoIrpf(bens: BemDireito[], grupo: BemDireito['grupoIrpf']): { valor: number; itens: number } {
  const doGrupo = bens.filter((b) => b.grupoIrpf === grupo);
  return { valor: doGrupo.reduce((s, b) => s + valorBem(b), 0), itens: doGrupo.length };
}

/** Bloco "Bens e Direitos IRPF — Detalhamento por Categoria" (spec seção 4.6). */
export function calcularPatrimonioIrpf(bens: BemDireito[], fazendasImobilizado: number): PatrimonioIrpfResumo {
  const fazendasProprias = somaGrupoIrpf(bens, 'Imóveis Rurais - ANEXO A');
  const maquinasEquipamentos = somaGrupoIrpf(bens, 'Bens Móveis');
  const aplicacoesFinanceiras = somaGrupoIrpf(bens, 'Aplicações e Investimentos');

  const gruposClassificados = new Set<BemDireito['grupoIrpf']>([
    'Imóveis Rurais - ANEXO A',
    'Bens Móveis',
    'Aplicações e Investimentos'
  ]);
  const outros = bens.filter((b) => !gruposClassificados.has(b.grupoIrpf));
  const outrosBens = { valor: outros.reduce((s, b) => s + valorBem(b), 0), itens: outros.length };

  const totalBensIrpf = fazendasProprias.valor + maquinasEquipamentos.valor + aplicacoesFinanceiras.valor + outrosBens.valor;

  const categorias: CategoriaPatrimonioIrpf[] = [
    {
      categoria: 'Imóveis Rurais (IRPF)',
      itens: bens.filter((b) => b.grupoIrpf === 'Imóveis Rurais - ANEXO A').map((b) => ({ descricao: b.descricao, valor: valorBem(b) })),
      subtotal: fazendasProprias.valor
    },
    {
      categoria: 'Imóveis Urbanos (IRPF)',
      itens: bens.filter((b) => b.grupoIrpf === 'Imóveis Urbanos - ANEXO B').map((b) => ({ descricao: b.descricao, valor: valorBem(b) })),
      subtotal: somaGrupoIrpf(bens, 'Imóveis Urbanos - ANEXO B').valor
    },
    {
      categoria: 'Máquinas e Equipamentos (IRPF)',
      itens: bens.filter((b) => b.grupoIrpf === 'Bens Móveis').map((b) => ({ descricao: b.descricao, valor: valorBem(b) })),
      subtotal: maquinasEquipamentos.valor
    },
    {
      categoria: 'Aplicações Financeiras',
      itens: bens.filter((b) => b.grupoIrpf === 'Aplicações e Investimentos').map((b) => ({ descricao: b.descricao, valor: valorBem(b) })),
      subtotal: aplicacoesFinanceiras.valor
    },
    {
      categoria: 'Outros Bens e Direitos (IRPF)',
      itens: outros.map((b) => ({ descricao: b.descricao, valor: valorBem(b) })),
      subtotal: outrosBens.valor
    }
  ].filter((c) => c.itens.length > 0);

  return {
    fazendasProprias,
    maquinasEquipamentos,
    aplicacoesFinanceiras,
    outrosBens,
    totalBensIrpf,
    patrimonioTotal: totalBensIrpf + fazendasImobilizado,
    categorias
  };
}

/** Curto Prazo = parcelas com vencimento em até 12 meses de hoje (mesmo critério de isCurtoPrazo, reaproveitado); Longo Prazo = o resto. */
function splitCpLp(parcelas: { data: string; valor: number }[]): { cp: number; lp: number } {
  let cp = 0;
  let lp = 0;
  for (const p of parcelas) {
    if (isCurtoPrazo(p.data)) cp += p.valor;
    else lp += p.valor;
  }
  return { cp, lp };
}

/** CP/LP de Bancos a partir do Fluxo Detalhado já computado (listFluxoDetalhado) — soma só a amortização (principal), não a parcela total, pra CP+LP fechar exatamente com o saldo devedor. */
export function splitBancosCpLp(contratos: Pick<FluxoContrato, 'anos'>[]): { cp: number; lp: number } {
  const parcelas = contratos.flatMap((c) =>
    c.anos.flatMap((a: AnoFluxo) => a.parcelas.map((p) => ({ data: p.data, valor: p.amortizacao })))
  );
  const { cp, lp: lpBrutoFuturo } = splitCpLp(parcelas);
  // A soma de todas as amortizações futuras já é o saldo devedor total (parcelas
  // passadas não entram na projeção gerada) — CP + LP = saldo devedor total.
  return { cp, lp: lpBrutoFuturo };
}

/** CP/LP de Aquisição de Fazenda a partir das parcelas já geradas (sem `pago`, mesmo critério de Bancos). */
export function splitAquisicaoCpLp(aquisicoes: Pick<Aquisicao, 'parcelas'>[]): { cp: number; lp: number } {
  const parcelas = aquisicoes.flatMap((a) => a.parcelas.map((p) => ({ data: p.dataPagamento, valor: p.valorTotal })));
  return splitCpLp(parcelas);
}

const LIMIAR_SOJA_SCHA_DEFAULT = 3;

export interface MontarBalancoInput {
  safra: string;
  quadroSafra: CulturaSafraAno[];
  suppliers: Supplier[];
  fluxoDetalhadoBancos: Pick<FluxoContrato, 'anos'>[];
  /** Mesma forma de AnoCronograma (listCronogramaConsolidado) — o ano bancário é resolvido aqui, mesma convenção de fluxo-safra-calc.ts. */
  anosCronograma: { ano: number; juros: number; amortizacao: number }[];
  arrendamentos: ContratoArrendamento[];
  aquisicoes: Aquisicao[];
  bensDireitos: BemDireito[];
  precosDefinidos: PrecoDefinidoSafra[];
  complementares: DadosComplementaresFinanceiro;
}

export function montarBalanco(input: MontarBalancoInput): BalancoCalculado {
  const { safra, complementares } = input;

  const anoBancario = anoInicioSafra(safra) + 1;
  const anoCronograma = input.anosCronograma.find((a) => a.ano === anoBancario);
  const jurosBancosAno = anoCronograma?.juros ?? 0;
  const amortizacaoBancosAno = anoCronograma?.amortizacao ?? 0;

  const registrosSafra = input.quadroSafra.filter((r) => r.anoSafra === safra);
  const areaTotalHa = registrosSafra.reduce((s, r) => s + r.hectares, 0);
  const receitaBruta = registrosSafra.reduce((s, r) => s + calcularSafra(r).receitaBruta, 0);
  const custos = registrosSafra.reduce((s, r) => s + calcularSafra(r).despesa, 0);

  // ---- DRE ----
  const deducoes = receitaBruta * (complementares.deducoesReceitaPercent / 100);
  const receitaLiquida = receitaBruta - deducoes;

  const arrendamentosDre = input.arrendamentos
    .flatMap((c) => c.parcelas)
    .filter((p) => p.safra === safra && p.valorTotal != null)
    .reduce((s, p) => s + (p.valorTotal ?? 0), 0);

  const lucroBruto = receitaLiquida - custos - arrendamentosDre;

  const areaSoja = registrosSafra.filter((r) => r.cultura.toLowerCase().includes('soja')).reduce((s, r) => s + r.hectares, 0);
  const nomeCommoditySoja = commodityDaCultura('Soja');
  const precoSoja = nomeCommoditySoja
    ? input.precosDefinidos.find((p) => p.commodity === nomeCommoditySoja && p.anoSafra === safra)?.precoBrl ?? null
    : null;
  const scHa = complementares.despesaComercialScHa || LIMIAR_SOJA_SCHA_DEFAULT;
  const despesaComercial =
    areaSoja === 0
      ? 0
      : precoSoja !== null
      ? areaSoja * scHa * precoSoja
      : complementares.despesaComercialFallback ?? null;

  const resultadoOperacional =
    lucroBruto - complementares.despesasOperacionais - complementares.despesasAdministrativas - (despesaComercial ?? 0);

  const ebitda = resultadoOperacional - complementares.dividendos;
  const ebit = ebitda - complementares.depreciacaoPeriodo;
  const custoFinanceiro = jurosBancosAno;
  const lair = ebit - custoFinanceiro;
  const irCsll = Math.max(lair, 0) * (complementares.aliquotaIrCsllPercent / 100);
  const resultadoLiquido = lair - irCsll;

  const dre: DreCalculada = {
    receitaBruta,
    deducoes,
    receitaLiquida,
    custos,
    arrendamentos: arrendamentosDre,
    lucroBruto,
    despesasOperacionais: complementares.despesasOperacionais,
    despesasAdministrativas: complementares.despesasAdministrativas,
    despesaComercial,
    resultadoOperacional,
    dividendos: complementares.dividendos,
    ebitda,
    custoFinanceiro,
    depreciacao: complementares.depreciacaoPeriodo,
    ebit,
    lair,
    irCsll,
    resultadoLiquido
  };

  const servicoDivida = complementares.servicoDividaManual ?? jurosBancosAno + amortizacaoBancosAno;

  // ---- Patrimônio IRPF ----
  const fazendasImobilizado = input.aquisicoes.reduce((s, a) => s + a.valorTotalFluxo, 0);
  const patrimonioIrpf = calcularPatrimonioIrpf(input.bensDireitos, fazendasImobilizado);
  const bensIrpfNaoCirculante = patrimonioIrpf.totalBensIrpf - patrimonioIrpf.aplicacoesFinanceiras.valor;

  // ---- Ativo ----
  const totalCirculante =
    complementares.caixaEquivalentes +
    patrimonioIrpf.aplicacoesFinanceiras.valor +
    receitaBruta +
    complementares.estoqueGraos +
    complementares.estoqueInsumos +
    complementares.outrosCreditosCp;

  const totalNaoCirculante =
    complementares.contasReceberLp +
    complementares.outrosCreditosLp +
    complementares.investimentos +
    complementares.maquinasEquipamentos +
    complementares.benfeitorias +
    fazendasImobilizado -
    complementares.depreciacaoAcumulada +
    bensIrpfNaoCirculante;

  const ativo: AtivoCalculado = {
    caixaEquivalentes: complementares.caixaEquivalentes,
    aplicacoesFinanceiras: patrimonioIrpf.aplicacoesFinanceiras.valor,
    contasReceberSafra: receitaBruta,
    estoqueGraos: complementares.estoqueGraos,
    estoqueInsumos: complementares.estoqueInsumos,
    outrosCreditosCp: complementares.outrosCreditosCp,
    totalCirculante,
    contasReceberLp: complementares.contasReceberLp,
    outrosCreditosLp: complementares.outrosCreditosLp,
    investimentos: complementares.investimentos,
    maquinasEquipamentos: complementares.maquinasEquipamentos,
    benfeitorias: complementares.benfeitorias,
    fazendas: fazendasImobilizado,
    depreciacaoAcumulada: complementares.depreciacaoAcumulada,
    bensIrpf: bensIrpfNaoCirculante,
    totalNaoCirculante,
    total: totalCirculante + totalNaoCirculante
  };

  // ---- Passivo ----
  const { cp: bancosCp, lp: bancosLp } = splitBancosCpLp(input.fluxoDetalhadoBancos);
  const { cp: aquisicaoFazendasCp, lp: aquisicaoFazendasLp } = splitAquisicaoCpLp(input.aquisicoes);

  const fornecedoresAtivos = input.suppliers;
  const fornecedoresCp = fornecedoresAtivos.filter((s) => isCurtoPrazo(s.vencimento)).reduce((s, x) => s + x.dividaTotal, 0);
  const fornecedoresLp = fornecedoresAtivos.filter((s) => !isCurtoPrazo(s.vencimento)).reduce((s, x) => s + x.dividaTotal, 0);

  const totalPassivoCirculante =
    bancosCp +
    fornecedoresCp +
    arrendamentosDre +
    aquisicaoFazendasCp +
    complementares.obrigTrabalhistasCp +
    complementares.obrigFiscaisCp +
    complementares.outrasObrigCp;

  const totalPassivoNaoCirculante =
    bancosLp +
    aquisicaoFazendasLp +
    fornecedoresLp +
    complementares.obrigFiscaisLp +
    complementares.outrasObrigLp +
    complementares.partesRelacionadas;

  const passivo: PassivoCalculado = {
    bancosCp,
    fornecedoresCp,
    arrendamentos: arrendamentosDre,
    aquisicaoFazendasCp,
    obrigTrabalhistasCp: complementares.obrigTrabalhistasCp,
    obrigFiscaisCp: complementares.obrigFiscaisCp,
    outrasObrigCp: complementares.outrasObrigCp,
    totalCirculante: totalPassivoCirculante,
    bancosLp,
    aquisicaoFazendasLp,
    fornecedoresLp,
    obrigFiscaisLp: complementares.obrigFiscaisLp,
    outrasObrigLp: complementares.outrasObrigLp,
    partesRelacionadas: complementares.partesRelacionadas,
    totalNaoCirculante: totalPassivoNaoCirculante,
    total: totalPassivoCirculante + totalPassivoNaoCirculante
  };

  // ---- Patrimônio Líquido ----
  // PL.total é SEMPRE o residual Ativo - Passivo (fecha o balanço por
  // definição, como em qualquer balanço patrimonial real). A linha "Bens
  // IRPF" exibida aqui é derivada desse residual (não é a mesma soma
  // independente usada no Ativo) — quando "Custos" (estimados pelo Quadro de
  // Safra) e "Fornecedores"/outros passivos reais divergem, a diferença
  // aparece nessa linha. O próprio AgroFlow original tem esse mesmo
  // comportamento (BUG #1 da spec): os dois "Bens IRPF" implícitos que ele
  // expõe em telas diferentes (Balanço vs Consolidado Grupo) também não
  // batem entre si.
  const plTotal = ativo.total - passivo.total;
  const plBensIrpf = plTotal - complementares.capitalSocial - complementares.reservasLucrosAcumulados - resultadoLiquido;
  const pl: PlCalculado = {
    capitalSocial: complementares.capitalSocial,
    reservasLucrosAcumulados: complementares.reservasLucrosAcumulados,
    resultadoSafra: resultadoLiquido,
    bensIrpf: plBensIrpf,
    total: plTotal
  };

  const ccl = ativo.totalCirculante - passivo.totalCirculante;

  const indicadores = calcularIndicadores({ ativo, passivo, pl, dre, ccl, servicoDivida, areaTotalHa, capex: complementares.capex });
  const radar = calcularScoreRadar(indicadores);
  const receitaPorCultura = calcularReceitaPorCultura(input.quadroSafra, safra);

  return { safra, areaTotalHa, ativo, passivo, pl, ccl, dre, servicoDivida, indicadores, radar, patrimonioIrpf, receitaPorCultura };
}

// ---------------------------------------------------------------------------
// Indicadores (32, em 6 grupos) — fórmulas/thresholds conforme a spec seção 3.4
// ---------------------------------------------------------------------------

function classificar(valor: number, thresholds: [number, number, number, number], invertido = false): StatusIndicador {
  const [excelente, bom, adequado, atencao] = thresholds;
  const cmp = invertido
    ? [valor <= excelente, valor <= bom, valor <= adequado, valor <= atencao]
    : [valor >= excelente, valor >= bom, valor >= adequado, valor >= atencao];
  if (cmp[0]) return 'Excelente';
  if (cmp[1]) return 'Bom';
  if (cmp[2]) return 'Adequado';
  if (cmp[3]) return 'Atenção';
  return 'Crítico';
}

/** Indicador cujo denominador é zero por ausência de operação (não por resultado ruim) — nunca 'Crítico' (BUG #4 da spec). */
function semDados(base: Omit<IndicadorCalculado, 'valor' | 'status'>): IndicadorCalculado {
  return { ...base, valor: null, status: 'Sem dados' };
}

interface CalcularIndicadoresInput {
  ativo: AtivoCalculado;
  passivo: PassivoCalculado;
  pl: PlCalculado;
  dre: DreCalculada;
  ccl: number;
  servicoDivida: number;
  areaTotalHa: number;
  capex: number;
}

export function calcularIndicadores(input: CalcularIndicadoresInput): IndicadorCalculado[] {
  const { ativo, passivo, pl, dre, servicoDivida, areaTotalHa, capex } = input;
  const ativoTotal = ativo.total;
  const passivoTotal = passivo.total;
  const plTotal = pl.total;
  const indicadores: IndicadorCalculado[] = [];

  const push = (i: IndicadorCalculado) => indicadores.push(i);

  // GRUPO 1 — Liquidez
  const estoques = ativo.estoqueGraos + ativo.estoqueInsumos;
  const liquidezCorrente = passivo.totalCirculante > 0 ? ativo.totalCirculante / passivo.totalCirculante : 0;
  const liquidezSeca = passivo.totalCirculante > 0 ? (ativo.totalCirculante - estoques) / passivo.totalCirculante : 0;
  const liquidezImediata = passivo.totalCirculante > 0 ? ativo.caixaEquivalentes / passivo.totalCirculante : 0;
  const liquidezGeral =
    passivo.totalCirculante + passivo.totalNaoCirculante > 0
      ? (ativo.totalCirculante + ativo.contasReceberLp) / (passivo.totalCirculante + passivo.totalNaoCirculante)
      : 0;

  push({ id: 'liquidez-corrente', grupo: 'Liquidez', nome: 'Liquidez Corrente', valor: liquidezCorrente, unidade: 'x', status: classificar(liquidezCorrente, [2.0, 1.5, 1.2, 1.0]), formula: 'Ativo Circulante / Passivo Circulante', referencia: 'Agro: ≥ 1,5 (bom)' });
  push({ id: 'liquidez-seca', grupo: 'Liquidez', nome: 'Liquidez Seca', valor: liquidezSeca, unidade: 'x', status: classificar(liquidezSeca, [1.5, 1.0, 0.8, 0.6]), formula: '(Ativo Circulante - Estoques) / Passivo Circulante', referencia: 'Agro: ≥ 1,0 (bom)' });
  push({ id: 'liquidez-imediata', grupo: 'Liquidez', nome: 'Liquidez Imediata', valor: liquidezImediata, unidade: 'x', status: classificar(liquidezImediata, [0.5, 0.3, 0.15, 0.05]), formula: 'Caixa / Passivo Circulante', referencia: '≥ 0,3 (bom)' });
  push({ id: 'liquidez-geral', grupo: 'Liquidez', nome: 'Liquidez Geral', valor: liquidezGeral, unidade: 'x', status: classificar(liquidezGeral, [1.5, 1.2, 1.0, 0.8]), formula: '(AC + ARLP) / (PC + PELP)', referencia: '≥ 1,0 (adequado)' });

  // GRUPO 2 — Estrutura de Capital e Endividamento
  const endividamentoGeral = ativoTotal > 0 ? (passivoTotal / ativoTotal) * 100 : 0;
  const composicaoCpLp = passivoTotal > 0 ? (passivo.totalCirculante / passivoTotal) * 100 : 0;
  const dividaTotal = passivo.bancosCp + passivo.bancosLp + passivo.aquisicaoFazendasCp + passivo.aquisicaoFazendasLp;
  const dividaEbitda = dre.ebitda > 0 ? Math.max(dividaTotal - ativo.caixaEquivalentes, 0) / dre.ebitda : null;
  const imobilizacaoPl = plTotal > 0 ? (ativo.totalNaoCirculante / plTotal) * 100 : 0;
  const grauEndividamento = plTotal > 0 ? passivoTotal / plTotal : 0;
  const alavancagem = plTotal > 0 ? ativoTotal / plTotal : 0;
  const coberturaJuros = dre.custoFinanceiro > 0 ? dre.ebit / dre.custoFinanceiro : null;

  push({ id: 'endividamento-geral', grupo: 'Estrutura de Capital', nome: 'Endividamento Geral', valor: endividamentoGeral, unidade: '%', status: classificar(endividamentoGeral, [15, 30, 40, 50], true), formula: 'Passivo Total / Ativo Total', referencia: 'Agro: ≤ 50% (bom)' });
  push({ id: 'composicao-cp-lp', grupo: 'Estrutura de Capital', nome: 'Composição CP/LP', valor: composicaoCpLp, unidade: '%', status: classificar(composicaoCpLp, [20, 40, 50, 60], true), formula: 'Passivo CP / Passivo Total', referencia: '≤ 40% (bom)' });
  if (dividaEbitda === null) {
    push(semDados({ id: 'divida-ebitda', grupo: 'Estrutura de Capital', nome: 'Dívida / EBITDA', unidade: 'x', formula: '(Dívida - Caixa) / EBITDA', referencia: 'Agro: ≤ 3,0x (bom)' }));
  } else {
    push({ id: 'divida-ebitda', grupo: 'Estrutura de Capital', nome: 'Dívida / EBITDA', valor: dividaEbitda, unidade: 'x', status: classificar(dividaEbitda, [1.0, 2.0, 2.5, 3.0], true), formula: '(Dívida - Caixa) / EBITDA', referencia: 'Agro: ≤ 3,0x (bom)' });
  }
  push({ id: 'imobilizacao-pl', grupo: 'Estrutura de Capital', nome: 'Imobilização do PL', valor: imobilizacaoPl, unidade: '%', status: classificar(imobilizacaoPl, [50, 70, 90, 110], true), formula: 'Ativo Imobilizado / PL', referencia: '≤ 70% (bom)' });
  push({ id: 'grau-endividamento', grupo: 'Estrutura de Capital', nome: 'Grau de Endividamento', valor: grauEndividamento, unidade: 'x', status: classificar(grauEndividamento, [0.3, 1.0, 1.5, 2.0], true), formula: 'Passivo Total / PL', referencia: '≤ 1,0x (bom)' });
  push({ id: 'alavancagem', grupo: 'Estrutura de Capital', nome: 'Alavancagem Financeira', valor: alavancagem, unidade: 'x', status: classificar(alavancagem, [1.2, 2.5, 3.0, 3.5], true), formula: 'Ativo Total / PL', referencia: '≤ 2,5x (bom)' });
  if (coberturaJuros === null) {
    push(semDados({ id: 'cobertura-juros', grupo: 'Estrutura de Capital', nome: 'Cobertura de Juros', unidade: 'x', formula: 'EBIT / Despesas Financeiras', referencia: '≥ 3,0x (bom)' }));
  } else {
    push({ id: 'cobertura-juros', grupo: 'Estrutura de Capital', nome: 'Cobertura de Juros', valor: coberturaJuros, unidade: 'x', status: classificar(coberturaJuros, [8, 3, 2, 1], false), formula: 'EBIT / Despesas Financeiras', referencia: '≥ 3,0x (bom)' });
  }
  push({ id: 'endividamento-cp', grupo: 'Estrutura de Capital', nome: 'Endividamento CP', valor: composicaoCpLp, unidade: '%', status: classificar(composicaoCpLp, [15, 25, 30, 35], true), formula: 'Passivo CP / Passivo Total', referencia: '≤ 35% (bom)' });

  // GRUPO 3 — Rentabilidade e Lucratividade
  const margemBruta = dre.receitaLiquida > 0 ? (dre.lucroBruto / dre.receitaLiquida) * 100 : 0;
  const margemEbitda = dre.receitaLiquida > 0 ? (dre.ebitda / dre.receitaLiquida) * 100 : 0;
  const margemOperacional = dre.receitaLiquida > 0 ? (dre.ebit / dre.receitaLiquida) * 100 : 0;
  const margemLiquida = dre.receitaLiquida > 0 ? (dre.resultadoLiquido / dre.receitaLiquida) * 100 : 0;
  const roe = plTotal > 0 ? (dre.resultadoLiquido / plTotal) * 100 : 0;
  const roa = ativoTotal > 0 ? (dre.resultadoLiquido / ativoTotal) * 100 : 0;
  const capitalInvestido = plTotal + dividaTotal;
  const roic = capitalInvestido > 0 ? (dre.ebit / capitalInvestido) * 100 : 0;
  const giroAtivo = ativoTotal > 0 ? dre.receitaLiquida / ativoTotal : 0;

  push({ id: 'margem-bruta', grupo: 'Rentabilidade', nome: 'Margem Bruta', valor: margemBruta, unidade: '%', status: classificar(margemBruta, [40, 25, 15, 5]), formula: 'Lucro Bruto / Receita Líquida', referencia: 'Soja: 25-40%' });
  push({ id: 'margem-ebitda', grupo: 'Rentabilidade', nome: 'Margem EBITDA', valor: margemEbitda, unidade: '%', status: classificar(margemEbitda, [30, 20, 10, 5]), formula: 'EBITDA / Receita Líquida', referencia: 'Agro: ≥ 20% (bom)' });
  push({ id: 'margem-operacional', grupo: 'Rentabilidade', nome: 'Margem Operacional', valor: margemOperacional, unidade: '%', status: classificar(margemOperacional, [25, 15, 8, 3]), formula: 'EBIT / Receita Líquida', referencia: 'Agro: ≥ 15% (bom)' });
  push({ id: 'margem-liquida', grupo: 'Rentabilidade', nome: 'Margem Líquida', valor: margemLiquida, unidade: '%', status: classificar(margemLiquida, [15, 10, 5, 2]), formula: 'Lucro Líquido / Receita Líquida', referencia: 'Agro: ≥ 10% (bom)' });
  push({ id: 'roe', grupo: 'Rentabilidade', nome: 'ROE', valor: roe, unidade: '%', status: classificar(roe, [18, 12, 8, 4]), formula: 'Lucro Líquido / PL', referencia: '≥ 12% (bom)' });
  push({ id: 'roa', grupo: 'Rentabilidade', nome: 'ROA', valor: roa, unidade: '%', status: classificar(roa, [10, 6, 4, 2]), formula: 'Lucro Líquido / Ativo Total', referencia: '≥ 6% (bom)' });
  push({ id: 'roic', grupo: 'Rentabilidade', nome: 'ROIC', valor: roic, unidade: '%', status: classificar(roic, [15, 10, 7, 4]), formula: 'EBIT(1-t) / Capital Investido', referencia: '≥ 10% (bom)' });
  push({ id: 'giro-ativo', grupo: 'Rentabilidade', nome: 'Giro do Ativo', valor: giroAtivo, unidade: 'x', status: classificar(giroAtivo, [0.8, 0.4, 0.25, 0.1]), formula: 'Receita Líquida / Ativo Total', referencia: 'Agro: 0,4-0,8x' });

  // GRUPO 4 — Cobertura e Capacidade de Pagamento
  const dscr = servicoDivida > 0 ? dre.ebitda / servicoDivida : null;
  const coberturaCp = passivo.totalCirculante > 0 ? (ativo.caixaEquivalentes + ativo.contasReceberSafra) / passivo.totalCirculante : 0;
  const capacidadePagamento = servicoDivida > 0 ? (dre.ebitda - capex) / servicoDivida : null;
  const coberturaArrendamento = passivo.arrendamentos > 0 ? dre.ebitda / passivo.arrendamentos : null;

  if (dscr === null) {
    push(semDados({ id: 'dscr', grupo: 'Cobertura', nome: 'DSCR (Cobertura Dívida)', unidade: 'x', formula: 'EBITDA / Serviço da Dívida', referencia: 'Bancos: ≥ 1,3x' }));
  } else {
    push({ id: 'dscr', grupo: 'Cobertura', nome: 'DSCR (Cobertura Dívida)', valor: dscr, unidade: 'x', status: classificar(dscr, [2.5, 1.3, 1.1, 1.0]), formula: 'EBITDA / Serviço da Dívida', referencia: 'Bancos: ≥ 1,3x' });
  }
  push({ id: 'cobertura-cp', grupo: 'Cobertura', nome: 'Cobertura CP', valor: coberturaCp, unidade: 'x', status: classificar(coberturaCp, [2.0, 1.0, 0.8, 0.5]), formula: '(Caixa + CR) / Passivo CP', referencia: '≥ 1,0x (bom)' });
  if (capacidadePagamento === null) {
    push(semDados({ id: 'capacidade-pagamento', grupo: 'Cobertura', nome: 'Capacidade de Pagamento', unidade: 'x', formula: '(EBITDA - CAPEX) / Serviço da Dívida', referencia: '≥ 1,2x (bom)' }));
  } else {
    push({ id: 'capacidade-pagamento', grupo: 'Cobertura', nome: 'Capacidade de Pagamento', valor: capacidadePagamento, unidade: 'x', status: classificar(capacidadePagamento, [2.0, 1.2, 1.0, 0.8]), formula: '(EBITDA - CAPEX) / Serviço da Dívida', referencia: '≥ 1,2x (bom)' });
  }
  if (coberturaArrendamento === null) {
    push(semDados({ id: 'cobertura-arrendamento', grupo: 'Cobertura', nome: 'Cobertura Arrendamento', unidade: 'x', formula: 'EBITDA / Custo Arrendamento', referencia: '≥ 2,5x (bom)' }));
  } else {
    push({ id: 'cobertura-arrendamento', grupo: 'Cobertura', nome: 'Cobertura Arrendamento', valor: coberturaArrendamento, unidade: 'x', status: classificar(coberturaArrendamento, [5, 2.5, 1.5, 1.0]), formula: 'EBITDA / Custo Arrendamento', referencia: '≥ 2,5x (bom)' });
  }

  // GRUPO 5 — Eficiência Operacional
  const pmr = dre.receitaBruta > 0 ? ativo.contasReceberSafra / (dre.receitaBruta / 365) : 0;
  const pmp = dre.custos > 0 ? passivo.fornecedoresCp / (dre.custos / 365) : 0;
  const estoqueMedio = estoques;
  const giroEstoque = estoqueMedio > 0 ? dre.custos / estoqueMedio : null;
  const bancabilidade = passivoTotal > 0 ? (plTotal / passivoTotal) * 100 : 0;

  push({ id: 'pmr', grupo: 'Eficiência', nome: 'PMR (Recebimento)', valor: pmr, unidade: ' dias', status: classificar(pmr, [30, 60, 90, 120], true), formula: 'CR / (Receita / 365)', referencia: '≤ 60 dias (bom)' });
  push({ id: 'pmp', grupo: 'Eficiência', nome: 'PMP (Pagamento)', valor: pmp, unidade: ' dias', status: classificar(pmp, [90, 45, 30, 15]), formula: 'Fornecedores / (CPV / 365)', referencia: '≥ 45 dias (bom)' });
  if (giroEstoque === null) {
    push(semDados({ id: 'giro-estoque', grupo: 'Eficiência', nome: 'Giro de Estoque', unidade: 'x', formula: 'CPV / Estoque Médio', referencia: 'Agro: 2-4x/ano' }));
  } else {
    push({ id: 'giro-estoque', grupo: 'Eficiência', nome: 'Giro de Estoque', valor: giroEstoque, unidade: 'x', status: classificar(giroEstoque, [4, 2, 1.5, 1], false), formula: 'CPV / Estoque Médio', referencia: 'Agro: 2-4x/ano' });
  }
  push({ id: 'bancabilidade', grupo: 'Eficiência', nome: 'Índice de Bancabilidade', valor: bancabilidade, unidade: '%', status: classificar(bancabilidade, [100, 30, 15, 5]), formula: 'PL / Passivo Total', referencia: '≥ 30% (bom)' });

  // GRUPO 6 — Indicadores do Agronegócio (referência fixa "Soja" — spec seção 3.4/8)
  const receitaHa = areaTotalHa > 0 ? dre.receitaLiquida / areaTotalHa : 0;
  const custoHa = areaTotalHa > 0 ? dre.custos / areaTotalHa : 0;
  const margemHa = areaTotalHa > 0 ? dre.lucroBruto / areaTotalHa : 0;
  const dividaHa = areaTotalHa > 0 ? dividaTotal / areaTotalHa : 0;

  push({ id: 'receita-ha', grupo: 'Agronegócio', nome: 'Receita / HA', valor: receitaHa, unidade: 'R$', status: classificar(receitaHa, [8000, 5000, 3500, 2000]), formula: 'Receita Líquida / Área Total', referencia: 'Soja: R$ 5-8k/ha' });
  push({ id: 'custo-ha', grupo: 'Agronegócio', nome: 'Custo / HA', valor: custoHa, unidade: 'R$', status: classificar(custoHa, [3000, 5000, 6000, 7000], true), formula: 'Custo Total / Área Total', referencia: 'Soja: R$ 3-5k/ha' });
  push({ id: 'margem-ha', grupo: 'Agronegócio', nome: 'Margem / HA', valor: margemHa, unidade: 'R$', status: classificar(margemHa, [2000, 1000, 500, 100]), formula: 'Lucro Bruto / Área Total', referencia: 'Soja: R$ 1-2k/ha' });
  push({ id: 'divida-ha', grupo: 'Agronegócio', nome: 'Dívida / HA', valor: dividaHa, unidade: 'R$', status: classificar(dividaHa, [1000, 2500, 4000, 6000], true), formula: 'Dívida Total / Área Total', referencia: '≤ R$ 2,5k/ha (bom)' });

  return indicadores;
}

// ---------------------------------------------------------------------------
// Radar "Saúde Financeira" — score próprio (decisão documentada, spec não confirma a fórmula original)
// ---------------------------------------------------------------------------

const SCORE_POR_STATUS: Record<StatusIndicador, number> = {
  Excelente: 100,
  Bom: 75,
  Adequado: 50,
  Atenção: 25,
  Crítico: 0,
  'Sem dados': 50 // neutro — não puxa o eixo pra baixo por ausência de dado
};

/** Mapeamento de quais indicadores compõem cada eixo do radar — decisão própria, a spec não confirma a fórmula original (seção 3.2). */
const EIXOS_RADAR: Record<string, string[]> = {
  Liquidez: ['liquidez-corrente', 'liquidez-seca', 'liquidez-imediata', 'liquidez-geral'],
  Endividamento: ['endividamento-geral', 'composicao-cp-lp', 'grau-endividamento', 'alavancagem', 'endividamento-cp'],
  Rentabilidade: ['margem-bruta', 'margem-ebitda', 'margem-operacional', 'margem-liquida', 'roe', 'roa', 'roic', 'giro-ativo'],
  Cobertura: ['dscr', 'cobertura-cp', 'capacidade-pagamento', 'cobertura-arrendamento', 'divida-ebitda', 'cobertura-juros'],
  Eficiência: ['pmr', 'pmp', 'giro-estoque'],
  Solvência: ['imobilizacao-pl', 'bancabilidade']
};

export function calcularScoreRadar(indicadores: IndicadorCalculado[]): { dimensao: string; valor: number }[] {
  const porId = new Map(indicadores.map((i) => [i.id, i]));
  return Object.entries(EIXOS_RADAR).map(([dimensao, ids]) => {
    const scores = ids.map((id) => porId.get(id)).filter((i): i is IndicadorCalculado => !!i).map((i) => SCORE_POR_STATUS[i.status]);
    const valor = scores.length > 0 ? scores.reduce((s, v) => s + v, 0) / scores.length : 0;
    return { dimensao, valor: Math.round(valor) };
  });
}

export function calcularReceitaPorCultura(quadroSafra: CulturaSafraAno[], safra: string): ReceitaPorCultura[] {
  const registros = quadroSafra.filter((r) => r.anoSafra === safra);
  const porCultura = registros.map((r) => ({ cultura: r.cultura, receita: calcularSafra(r).receitaBruta }));
  const total = porCultura.reduce((s, c) => s + c.receita, 0);
  return porCultura
    .filter((c) => c.receita > 0)
    .map((c) => ({ ...c, percentual: total > 0 ? (c.receita / total) * 100 : 0 }))
    .sort((a, b) => b.receita - a.receita);
}

/** Retorna um `DadosComplementaresFinanceiro` zerado (nenhum registro salvo ainda para a safra). */
export function complementaresVazio(safra: string): DadosComplementaresFinanceiro {
  return {
    safra,
    caixaEquivalentes: 0,
    estoqueGraos: 0,
    estoqueInsumos: 0,
    outrosCreditosCp: 0,
    contasReceberLp: 0,
    outrosCreditosLp: 0,
    investimentos: 0,
    maquinasEquipamentos: 0,
    benfeitorias: 0,
    depreciacaoAcumulada: 0,
    obrigTrabalhistasCp: 0,
    obrigFiscaisCp: 0,
    outrasObrigCp: 0,
    obrigFiscaisLp: 0,
    outrasObrigLp: 0,
    partesRelacionadas: 0,
    capitalSocial: 0,
    reservasLucrosAcumulados: 0,
    deducoesReceitaPercent: 0,
    despesasOperacionais: 0,
    despesasAdministrativas: 0,
    despesaComercialScHa: LIMIAR_SOJA_SCHA_DEFAULT,
    dividendos: 0,
    depreciacaoPeriodo: 0,
    aliquotaIrCsllPercent: 0,
    capex: 0
  };
}
