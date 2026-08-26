// Cálculo puro do demonstrativo "Fluxo de Caixa Mensal" — réplica confirmada
// da tela do AgroFlow (spec fotografada em 26/08/2026,
// docs/demandas/SPEC_TELA_FLUXO_MENSAL.md). Sem I/O — recebe os dados já
// carregados de Quadro de Safra/Fornecedores/Bancos/Arrendamentos/Aquisição
// (mesmo critério de fluxo-safra-calc.ts) e devolve os lançamentos do
// calendário de 18 meses + os agregados usados pelos KPIs/Curva de Caixa.
//
// Decisões confirmadas com o usuário (ver docs/demandas/SPEC_TELA_FLUXO_MENSAL.md
// seção 8 e a sessão que motivou esta reconstrução):
// 1. Sem dupla contagem: a linha "SAFRA" (receita por competência) nunca soma
//    no caixa (`contaComoCaixa: false`) — só o espelho "PROJECAO" (+30 dias,
//    aproximado para +1 mês nesta granularidade mensal) conta como caixa.
// 2. Sem botões "Gerar Auto"/"Sincronizar Todos" — tudo é recomputado ao vivo
//    a cada chamada, mesmo padrão de montarFluxoSafraDTO/calcularFluxoSafra.
// 3. "Manual" do original virou "VINCULADO" aqui (BUG #1 da spec) — reservado
//    para o que vem de fato do modal "+ Lançamento" (ItemLancamentoManualMensal).
// 4. Badge "Situação" usa meses com Saldo Acumulado negativo, não saldo do mês
//    isolado (resolve o BUG #2 candidato da spec).

import { calcularSafra, mesLabel } from '@/lib/agro';
import { anoInicioSafra } from '@/lib/safra-periodo';
import { categoriaCalendarioDaCultura, etapaCalendarioDaCategoria, type FaseCalendarioAgricola } from '@/lib/calendario-agricola';
import type {
  Aquisicao,
  CategoriaLancamentoMensal,
  ContratoArrendamento,
  CulturaSafraAno,
  ItemLancamentoManualMensal,
  LancamentoMensal,
  Supplier,
  TipoLancamentoMensal
} from '@/types';

export interface MesHorizonte {
  mes: number; // 1-12
  ano: number;
}

/** Categorias do modal "+ Lançamento" por grupo — 11 saída + 8 entrada (spec seção 5.1/5.2). */
export const CATEGORIAS_SAIDA_LANCAMENTO_MENSAL: readonly CategoriaLancamentoMensal[] = [
  'CUSTEIO_AGRICOLA',
  'INSUMOS',
  'MAO_DE_OBRA',
  'ARRENDAMENTO_PAGO',
  'PARCELA_BANCARIA',
  'AQUISICAO_MAQUINAS',
  'AQUISICAO_FAZENDA',
  'DESPESAS_ADMINISTRATIVAS',
  'IMPOSTOS_TAXAS',
  'FRETE_LOGISTICA',
  'OUTRAS_DESPESAS'
];

export const CATEGORIAS_ENTRADA_LANCAMENTO_MENSAL: readonly CategoriaLancamentoMensal[] = [
  'VENDA_GRAOS',
  'VENDA_GADO',
  'VENDA_ALGODAO',
  'RECEBIMENTO_CPR',
  'ARRENDAMENTO_RECEBIDO',
  'DIVIDENDOS_DISTRIBUICAO',
  'SUBVENCAO_PREMIO_SEGURO',
  'OUTRAS_RECEITAS'
];

export function tipoDaCategoriaLancamentoMensal(categoria: CategoriaLancamentoMensal): TipoLancamentoMensal {
  return CATEGORIAS_SAIDA_LANCAMENTO_MENSAL.includes(categoria) ? 'SAIDA' : 'ENTRADA';
}

/** Rótulos do combobox "Categoria" do modal "+ Lançamento" — spec seção 5.1/5.2. */
export const CATEGORIA_LANCAMENTO_MENSAL_LABEL: Record<CategoriaLancamentoMensal, string> = {
  CUSTEIO_AGRICOLA: 'Custeio Agrícola',
  INSUMOS: 'Insumos',
  MAO_DE_OBRA: 'Mão de Obra',
  ARRENDAMENTO_PAGO: 'Arrendamento Pago',
  PARCELA_BANCARIA: 'Parcela Bancária',
  AQUISICAO_MAQUINAS: 'Aquisição de Máquinas',
  AQUISICAO_FAZENDA: 'Aquisição de Fazenda',
  DESPESAS_ADMINISTRATIVAS: 'Despesas Administrativas',
  IMPOSTOS_TAXAS: 'Impostos e Taxas',
  FRETE_LOGISTICA: 'Frete e Logística',
  OUTRAS_DESPESAS: 'Outras Despesas',
  VENDA_GRAOS: 'Venda de Grãos',
  VENDA_GADO: 'Venda de Gado',
  VENDA_ALGODAO: 'Venda de Algodão',
  RECEBIMENTO_CPR: 'Recebimento de CPR',
  ARRENDAMENTO_RECEBIDO: 'Arrendamento Recebido',
  DIVIDENDOS_DISTRIBUICAO: 'Dividendos / Distribuição',
  SUBVENCAO_PREMIO_SEGURO: 'Subvenção / Prêmio de Seguro',
  OUTRAS_RECEITAS: 'Outras Receitas'
};

/** Jan do ano de início da safra até Jun do ano seguinte — 18 meses, mesma janela da spec (Jan/2026-Jun/2027 para a safra 2026/2027). */
export function horizonteMeses(safra: string): MesHorizonte[] {
  const anoInicio = anoInicioSafra(safra);
  const meses: MesHorizonte[] = [];
  for (let mes = 1; mes <= 12; mes++) meses.push({ mes, ano: anoInicio });
  for (let mes = 1; mes <= 6; mes++) meses.push({ mes, ano: anoInicio + 1 });
  return meses;
}

function chaveMes(m: { mes: number; ano: number }): string {
  return `${m.ano}-${m.mes}`;
}

function deslocaUmMes(m: MesHorizonte): MesHorizonte {
  return m.mes === 12 ? { mes: 1, ano: m.ano + 1 } : { mes: m.mes + 1, ano: m.ano };
}

/** Extrai ano/mês de "YYYY-MM-DD" sem passar por `new Date(...)` — mesmo cuidado de fuso já documentado em safra-periodo.ts. */
function anoMesDeIso(dataISO: string): { ano: number; mes: number } {
  const [ano, mes] = dataISO.split('-').map(Number);
  return { ano, mes };
}

/**
 * Ano civil de um mês de fase do calendário agrícola, dado o ano de início da
 * safra: Jul-Dez pertence ao 1º ano da safra, Jan-Jun ao 2º — mesma convenção
 * de ciclo agrícola (jul-jun) usada implicitamente em dataReferenciaDaSafra().
 */
function anoDoMesDeFase(mes: number, anoInicio: number): number {
  return mes >= 7 ? anoInicio : anoInicio + 1;
}

function mesesDaFase(
  fasesPorMes: (FaseCalendarioAgricola | null)[],
  fase: FaseCalendarioAgricola,
  anoSafra: string
): MesHorizonte[] {
  const anoInicio = anoInicioSafra(anoSafra);
  const meses: MesHorizonte[] = [];
  fasesPorMes.forEach((f, idx) => {
    if (f === fase) meses.push({ mes: idx + 1, ano: anoDoMesDeFase(idx + 1, anoInicio) });
  });
  return meses;
}

interface GerarCusteioSafraInput {
  quadroSafra: CulturaSafraAno[];
  safraSelecionada: string;
  multiSafra: boolean;
  horizonte: MesHorizonte[];
}

/** Gera os lançamentos CUSTEIO (saída)/SAFRA (entrada informativa)/PROJEÇÃO (entrada de caixa, +1 mês) a partir do Quadro de Safra + Calendário Agrícola. */
export function gerarLancamentosCusteioSafraProjecao(input: GerarCusteioSafraInput): LancamentoMensal[] {
  const registros = input.multiSafra
    ? input.quadroSafra
    : input.quadroSafra.filter((q) => q.anoSafra === input.safraSelecionada);

  const horizonteSet = new Set(input.horizonte.map(chaveMes));
  const lancamentos: LancamentoMensal[] = [];
  let seq = 1;

  for (const registro of registros) {
    const { despesa, receitaBruta } = calcularSafra(registro);
    const categoria = categoriaCalendarioDaCultura(registro.cultura);
    const etapa = etapaCalendarioDaCategoria(categoria);

    // Pecuária (e qualquer categoria marcada como contínua): custeio/receita
    // recorrentes em todos os meses do horizonte, não por fase de calendário.
    if (etapa.distribuicaoContinua) {
      const valorCusteioMes = despesa / 12;
      const valorReceitaMes = receitaBruta / 12;
      for (const { mes, ano } of input.horizonte) {
        if (valorCusteioMes > 0) {
          lancamentos.push({
            id: `custeio-${seq++}`,
            mes,
            ano,
            tipo: 'SAIDA',
            origem: 'CUSTEIO',
            categoriaLabel: `Custeio ${registro.cultura}`,
            descricao: `Custeio ${registro.cultura}`,
            cultura: registro.cultura,
            valor: valorCusteioMes,
            contaComoCaixa: true
          });
        }
        if (valorReceitaMes > 0) {
          lancamentos.push({
            id: `safra-${seq++}`,
            mes,
            ano,
            tipo: 'ENTRADA',
            origem: 'SAFRA',
            categoriaLabel: `Receita ${registro.cultura} (estimativa safra)`,
            descricao: `Receita ${registro.cultura} (estimativa safra)`,
            cultura: registro.cultura,
            valor: valorReceitaMes,
            contaComoCaixa: false
          });
          const projecao = deslocaUmMes({ mes, ano });
          if (horizonteSet.has(chaveMes(projecao))) {
            lancamentos.push({
              id: `projecao-${seq++}`,
              mes: projecao.mes,
              ano: projecao.ano,
              tipo: 'ENTRADA',
              origem: 'PROJECAO',
              categoriaLabel: `[PROJEÇÃO] ${registro.cultura} — 30d após colheita`,
              descricao: `[PROJEÇÃO] ${registro.cultura} — 30d após colheita`,
              cultura: registro.cultura,
              valor: valorReceitaMes,
              contaComoCaixa: true
            });
          }
        }
      }
      continue;
    }

    const mesesCusteio = mesesDaFase(etapa.fasesPorMes, 'PLANTIO_CUSTEIO', registro.anoSafra).filter((m) =>
      horizonteSet.has(chaveMes(m))
    );
    const mesesColheita = mesesDaFase(etapa.fasesPorMes, 'COLHEITA_RECEITA', registro.anoSafra).filter((m) =>
      horizonteSet.has(chaveMes(m))
    );

    if (despesa > 0 && mesesCusteio.length > 0) {
      const valorPorMes = despesa / mesesCusteio.length;
      for (const { mes, ano } of mesesCusteio) {
        lancamentos.push({
          id: `custeio-${seq++}`,
          mes,
          ano,
          tipo: 'SAIDA',
          origem: 'CUSTEIO',
          categoriaLabel: `Custeio ${registro.cultura}`,
          descricao: `Custeio ${registro.cultura}`,
          cultura: registro.cultura,
          valor: valorPorMes,
          contaComoCaixa: true
        });
      }
    }

    if (receitaBruta > 0 && mesesColheita.length > 0) {
      const valorPorMes = receitaBruta / mesesColheita.length;
      for (const { mes, ano } of mesesColheita) {
        lancamentos.push({
          id: `safra-${seq++}`,
          mes,
          ano,
          tipo: 'ENTRADA',
          origem: 'SAFRA',
          categoriaLabel: `Receita ${registro.cultura} (estimativa safra)`,
          descricao: `Receita ${registro.cultura} (estimativa safra)`,
          cultura: registro.cultura,
          valor: valorPorMes,
          contaComoCaixa: false
        });
        const projecao = deslocaUmMes({ mes, ano });
        if (horizonteSet.has(chaveMes(projecao))) {
          lancamentos.push({
            id: `projecao-${seq++}`,
            mes: projecao.mes,
            ano: projecao.ano,
            tipo: 'ENTRADA',
            origem: 'PROJECAO',
            categoriaLabel: `[PROJEÇÃO] ${registro.cultura} — 30d após colheita`,
            descricao: `[PROJEÇÃO] ${registro.cultura} — 30d após colheita`,
            cultura: registro.cultura,
            valor: valorPorMes,
            contaComoCaixa: true
          });
        }
      }
    }
  }

  return lancamentos;
}

/** Forma mínima de FluxoContrato (src/server/contratos-bancarios.ts) que este cálculo precisa — evita importar o server action num módulo puro. */
export interface ContratoBancarioParcelaFluxo {
  banco: string;
  anos: { parcelas: { data: string; parcela: number }[] }[];
}

interface GerarVinculadosInput {
  suppliers: Supplier[];
  contratosBancarios: ContratoBancarioParcelaFluxo[];
  arrendamentos: ContratoArrendamento[];
  aquisicoes: Aquisicao[];
  safraSelecionada: string;
  multiSafra: boolean;
}

/** Gera os lançamentos VINCULADO — sincronizados ao vivo de Fornecedores/Bancos/Arrendamentos/Aquisição (BUG #1 da spec: nunca chamado "Manual"). */
export function gerarLancamentosVinculados(input: GerarVinculadosInput): LancamentoMensal[] {
  const lancamentos: LancamentoMensal[] = [];
  let seq = 1;

  for (const s of input.suppliers) {
    if (!input.multiSafra && s.safra !== input.safraSelecionada) continue;
    const { ano, mes } = anoMesDeIso(s.vencimento);
    lancamentos.push({
      id: `vinc-forn-${seq++}`,
      mes,
      ano,
      tipo: 'SAIDA',
      origem: 'VINCULADO',
      categoriaLabel: 'Fornecedor',
      descricao: `${s.nome} — ${s.categoria}`,
      cultura: s.cultura,
      valor: s.dividaTotal,
      contaComoCaixa: true
    });
  }

  // Bancos: sem tag de safra (parcela é só uma data real) — sempre entram pela data, com ou sem Multi-Safra.
  for (const contrato of input.contratosBancarios) {
    const todasParcelas = contrato.anos.flatMap((a) => a.parcelas);
    todasParcelas.forEach((p, idx) => {
      const { ano, mes } = anoMesDeIso(p.data);
      const descricao =
        todasParcelas.length > 1 ? `${contrato.banco} — Parcela ${idx + 1}/${todasParcelas.length}` : `${contrato.banco} — Vencimento`;
      lancamentos.push({
        id: `vinc-banco-${seq++}`,
        mes,
        ano,
        tipo: 'SAIDA',
        origem: 'VINCULADO',
        categoriaLabel: 'Parcela Bancária',
        descricao,
        valor: p.parcela,
        contaComoCaixa: true
      });
    });
  }

  // Arrendamentos: ParcelaArrendamento não tem data própria — usa o mês do
  // vencimento do contrato (evento anual) + o ano do 2º ano da safra da
  // parcela (mesma convenção de dataReferenciaDaSafra()).
  for (const contrato of input.arrendamentos) {
    const { mes: mesRef } = anoMesDeIso(contrato.dataVencimento);
    for (const parcela of contrato.parcelas) {
      if (!input.multiSafra && parcela.safra !== input.safraSelecionada) continue;
      // Preço de referência não definido -> sem valor a lançar (nunca um 0 que mente, mesmo critério do BUG #1 de Arrendamentos).
      if (parcela.valorTotal == null) continue;
      lancamentos.push({
        id: `vinc-arr-${seq++}`,
        mes: mesRef,
        ano: anoInicioSafra(parcela.safra) + 1,
        tipo: 'SAIDA',
        origem: 'VINCULADO',
        categoriaLabel: 'Arrendamento',
        descricao: `${contrato.nomeFazenda} — Arrendamento Anual`,
        cultura: contrato.culturaNome,
        valor: parcela.valorTotal,
        contaComoCaixa: true
      });
    }
  }

  // Aquisição de Fazenda: cada parcela já tem data real própria — sempre entra, mesmo critério de Bancos.
  for (const aquisicao of input.aquisicoes) {
    for (const parcela of aquisicao.parcelas) {
      const { ano, mes } = anoMesDeIso(parcela.dataPagamento);
      const ordinal = aquisicao.parcelas.indexOf(parcela) + 1;
      lancamentos.push({
        id: `vinc-aq-${seq++}`,
        mes,
        ano,
        tipo: 'SAIDA',
        origem: 'VINCULADO',
        categoriaLabel: 'Aquisição de Fazenda',
        descricao: `${aquisicao.nomeFazenda} — Parcela ${ordinal}/${aquisicao.parcelas.length}`,
        cultura: aquisicao.culturaNome,
        valor: parcela.valorTotal,
        contaComoCaixa: true
      });
    }
  }

  return lancamentos;
}

export function gerarLancamentosManuais(itens: ItemLancamentoManualMensal[]): LancamentoMensal[] {
  return itens.map((item) => ({
    id: item.id,
    mes: item.mes,
    ano: item.ano,
    tipo: item.tipo,
    origem: 'MANUAL',
    categoriaLabel: CATEGORIA_LANCAMENTO_MENSAL_LABEL[item.categoria],
    descricao: item.descricao,
    cultura: item.culturaNome,
    valor: item.valor,
    contaComoCaixa: true
  }));
}

export interface ResumoMesFluxoMensal {
  mes: number;
  ano: number;
  label: string;
  entradas: number;
  saidas: number;
  saldoMes: number;
  saldoAcumulado: number;
  lancamentos: LancamentoMensal[];
}

export interface FluxoMensalCalculado {
  resumoPorMes: ResumoMesFluxoMensal[];
  totalEntradas: number;
  totalSaidas: number;
  resultadoLiquido: number;
  /** Base do badge "Situação" (resolve o BUG #2 candidato da spec: saldo acumulado, não saldo do mês isolado). */
  mesesSaldoAcumuladoNegativo: number;
  totalLancamentos: number;
}

export function calcularFluxoMensal(lancamentos: LancamentoMensal[], horizonte: MesHorizonte[]): FluxoMensalCalculado {
  let saldoAcumulado = 0;
  let mesesSaldoAcumuladoNegativo = 0;

  const resumoPorMes: ResumoMesFluxoMensal[] = horizonte.map(({ mes, ano }) => {
    const doMes = lancamentos
      .filter((l) => l.mes === mes && l.ano === ano)
      .sort((a, b) => Number(b.tipo === 'ENTRADA') - Number(a.tipo === 'ENTRADA'));
    const doMesCaixa = doMes.filter((l) => l.contaComoCaixa);
    const entradas = doMesCaixa.filter((l) => l.tipo === 'ENTRADA').reduce((s, l) => s + l.valor, 0);
    const saidas = doMesCaixa.filter((l) => l.tipo === 'SAIDA').reduce((s, l) => s + l.valor, 0);
    const saldoMes = entradas - saidas;
    saldoAcumulado += saldoMes;
    if (saldoAcumulado < 0) mesesSaldoAcumuladoNegativo++;

    return {
      mes,
      ano,
      label: `${mesLabel(mes)}/${String(ano).slice(2)}`,
      entradas,
      saidas,
      saldoMes,
      saldoAcumulado,
      lancamentos: doMes
    };
  });

  const totalEntradas = resumoPorMes.reduce((s, m) => s + m.entradas, 0);
  const totalSaidas = resumoPorMes.reduce((s, m) => s + m.saidas, 0);
  const totalLancamentos = lancamentos.length;

  return {
    resumoPorMes,
    totalEntradas,
    totalSaidas,
    resultadoLiquido: totalEntradas - totalSaidas,
    mesesSaldoAcumuladoNegativo,
    totalLancamentos
  };
}
