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
import { anoInicioSafra, safraAnterior, safraSeguinte } from '@/lib/safra-periodo';
import { categoriaCalendarioDaCultura, etapaCalendarioDaCategoria, type FaseCalendarioAgricola } from '@/lib/calendario-agricola';
import { calcularPecuariaBovina, calcularProducaoAnimal } from '@/lib/pecuaria-calc';
import type {
  Aquisicao,
  CategoriaLancamentoMensal,
  ContratoArrendamento,
  CulturaSafraAno,
  ItemLancamentoManualMensal,
  LancamentoMensal,
  PecuariaBovinaAno,
  ProducaoAnimalAno,
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

/**
 * As duas safras da Curva de Caixa (13/10/2026, validação do cliente): a
 * selecionada + a seguinte; se a selecionada é a última cadastrada, a anterior
 * + ela. Com uma única safra cadastrada não há "anterior", então usa a seguinte.
 */
export function safrasDaJanela(safraSelecionada: string, safrasDisponiveis: string[]): [string, string] {
  const ehUltima = safrasDisponiveis.length > 1 && safrasDisponiveis[safrasDisponiveis.length - 1] === safraSelecionada;
  return ehUltima ? [safraAnterior(safraSelecionada), safraSelecionada] : [safraSelecionada, safraSeguinte(safraSelecionada)];
}

/** 24 meses: 01/07 do ano de início da 1ª safra da janela até 30/06 do fim da 2ª (duas safras agrícolas completas). */
export function horizonteMeses(primeiraSafra: string): MesHorizonte[] {
  const anoInicio = anoInicioSafra(primeiraSafra);
  const meses: MesHorizonte[] = [];
  for (let i = 0; i < 24; i++) {
    const mesCorrido = 6 + i; // 0-indexado a partir de Julho
    meses.push({ mes: (mesCorrido % 12) + 1, ano: anoInicio + Math.floor(mesCorrido / 12) });
  }
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

/**
 * Todo mês civil entre duas datas "YYYY-MM-DD", inclusive — usado quando a
 * cultura tem período real de Custeio/Colheita cadastrado (16/09/2026), no
 * lugar do calendário agrícola genérico. `guard` evita loop infinito num
 * intervalo cadastrado ao contrário (fim antes do início).
 */
function mesesNoIntervalo(inicioISO: string, fimISO: string): MesHorizonte[] {
  const inicio = anoMesDeIso(inicioISO);
  const fim = anoMesDeIso(fimISO);
  const meses: MesHorizonte[] = [];
  let { ano, mes } = inicio;
  let guard = 0;
  while ((ano < fim.ano || (ano === fim.ano && mes <= fim.mes)) && guard < 240) {
    meses.push({ mes, ano });
    mes++;
    if (mes > 12) {
      mes = 1;
      ano++;
    }
    guard++;
  }
  return meses;
}

/** Gera os lançamentos CUSTEIO/SAFRA/PROJEÇÃO de uma linha de distribuição contínua (1/12 do valor anual em cada mês do horizonte, sem fase de plantio/colheita). `horizonte` já vem restrito aos meses a que o valor anual se refere — nunca todos os meses da janela, senão o anual seria contado mais de uma vez (bug corrigido em 13/10/2026). `horizonteSet` é a janela completa, usada só para decidir se a PROJEÇÃO (+1 mês) cabe nela. */
function gerarLancamentosContinuos(
  cultura: string,
  despesa: number,
  receitaBruta: number,
  horizonte: MesHorizonte[],
  horizonteSet: Set<string>,
  seqRef: { current: number }
): LancamentoMensal[] {
  const lancamentos: LancamentoMensal[] = [];
  const valorCusteioMes = despesa / 12;
  const valorReceitaMes = receitaBruta / 12;

  for (const { mes, ano } of horizonte) {
    if (valorCusteioMes > 0) {
      lancamentos.push({
        id: `custeio-${seqRef.current++}`,
        mes,
        ano,
        tipo: 'SAIDA',
        origem: 'CUSTEIO',
        categoriaLabel: `Custeio ${cultura}`,
        descricao: `Custeio ${cultura}`,
        cultura,
        valor: valorCusteioMes,
        contaComoCaixa: true
      });
    }
    if (valorReceitaMes > 0) {
      lancamentos.push({
        id: `safra-${seqRef.current++}`,
        mes,
        ano,
        tipo: 'ENTRADA',
        origem: 'SAFRA',
        categoriaLabel: `Receita ${cultura} (estimativa safra)`,
        descricao: `Receita ${cultura} (estimativa safra)`,
        cultura,
        valor: valorReceitaMes,
        contaComoCaixa: false
      });
      const projecao = deslocaUmMes({ mes, ano });
      if (horizonteSet.has(chaveMes(projecao))) {
        lancamentos.push({
          id: `projecao-${seqRef.current++}`,
          mes: projecao.mes,
          ano: projecao.ano,
          tipo: 'ENTRADA',
          origem: 'PROJECAO',
          categoriaLabel: `[PROJEÇÃO] ${cultura} — 30d após colheita`,
          descricao: `[PROJEÇÃO] ${cultura} — 30d após colheita`,
          cultura,
          valor: valorReceitaMes,
          contaComoCaixa: true
        });
      }
    }
  }

  return lancamentos;
}

const LABEL_TIPO_PRODUCAO_ANIMAL: Record<ProducaoAnimalAno['tipo'], string> = {
  Avicultura: 'Avicultura',
  Suinocultura: 'Suinocultura'
};

interface GerarCusteioSafraInput {
  quadroSafra: CulturaSafraAno[];
  /** Pecuária/Suinocultura/Avicultura — organizadas por ano civil, sempre distribuição contínua (1/12 por mês do ano civil, sem fase de plantio/colheita). */
  pecuariaBovina: PecuariaBovinaAno[];
  producaoAnimal: ProducaoAnimalAno[];
  /** As duas safras da janela da curva (ver `safrasDaJanela`) — a lavoura de ambas entra sempre. */
  safrasDaJanela: string[];
  /** Multi-Safra OFF = só lavoura; ON = lavoura + Bovino/Suinocultura/Avicultura (13/10/2026, validação do cliente). */
  multiSafra: boolean;
  horizonte: MesHorizonte[];
}

/** Gera os lançamentos CUSTEIO (saída)/SAFRA (entrada informativa)/PROJEÇÃO (entrada de caixa, +1 mês) a partir do Quadro de Safra + Calendário Agrícola + Pecuária/Suinocultura/Avicultura. */
export function gerarLancamentosCusteioSafraProjecao(input: GerarCusteioSafraInput): LancamentoMensal[] {
  const registros = input.quadroSafra.filter((q) => input.safrasDaJanela.includes(q.anoSafra));

  const horizonteSet = new Set(input.horizonte.map(chaveMes));
  const seqRef = { current: 1 };
  const lancamentos: LancamentoMensal[] = [];

  // Pecuária é atividade de ANO CIVIL (Jan-Dez): cada registro distribui o valor anual
  // /12 só nos meses do próprio ano civil que caem na janela de 24 meses.
  const mesesDoAnoCivil = (anoCivil: number) => input.horizonte.filter((m) => m.ano === anoCivil);

  if (input.multiSafra) {
    for (const registro of input.pecuariaBovina) {
      const meses = mesesDoAnoCivil(registro.anoCivil);
      if (meses.length === 0) continue;
      const { despesa, receitaBruta } = calcularPecuariaBovina(registro);
      lancamentos.push(...gerarLancamentosContinuos('Bovino', despesa, receitaBruta, meses, horizonteSet, seqRef));
    }
    for (const registro of input.producaoAnimal) {
      const meses = mesesDoAnoCivil(registro.anoCivil);
      if (meses.length === 0) continue;
      const { despesa, receitaBruta } = calcularProducaoAnimal(registro);
      lancamentos.push(
        ...gerarLancamentosContinuos(LABEL_TIPO_PRODUCAO_ANIMAL[registro.tipo], despesa, receitaBruta, meses, horizonteSet, seqRef)
      );
    }
  }

  for (const registro of registros) {
    const { despesa, receitaBruta } = calcularSafra(registro);
    const categoria = categoriaCalendarioDaCultura(registro.cultura);
    const etapa = etapaCalendarioDaCategoria(categoria);

    // Qualquer categoria marcada como contínua (hoje nenhuma cultura de grão
    // cai aqui — Bovino saiu de Quadro Safra e passou a ser tratado acima):
    // custeio/receita recorrentes em todos os meses do horizonte.
    if (etapa.distribuicaoContinua) {
      lancamentos.push(...gerarLancamentosContinuos(registro.cultura, despesa, receitaBruta, input.horizonte, horizonteSet, seqRef));
      continue;
    }

    // Datas reais de Custeio/Colheita cadastradas na safra (16/09/2026) têm
    // prioridade sobre o calendário agrícola genérico — só caem no
    // calendário quando o par início/fim não foi preenchido.
    const mesesCusteio = (
      registro.custoPlantioInicio && registro.custoPlantioFim
        ? mesesNoIntervalo(registro.custoPlantioInicio, registro.custoPlantioFim)
        : mesesDaFase(etapa.fasesPorMes, 'PLANTIO_CUSTEIO', registro.anoSafra)
    ).filter((m) => horizonteSet.has(chaveMes(m)));
    const mesesColheita = (
      registro.colheitaInicio && registro.colheitaFim
        ? mesesNoIntervalo(registro.colheitaInicio, registro.colheitaFim)
        : mesesDaFase(etapa.fasesPorMes, 'COLHEITA_RECEITA', registro.anoSafra)
    ).filter((m) => horizonteSet.has(chaveMes(m)));

    if (despesa > 0 && mesesCusteio.length > 0) {
      const valorPorMes = despesa / mesesCusteio.length;
      for (const { mes, ano } of mesesCusteio) {
        lancamentos.push({
          id: `custeio-${seqRef.current++}`,
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
          id: `safra-${seqRef.current++}`,
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
            id: `projecao-${seqRef.current++}`,
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
  /** Safras da janela de 24 meses (ver `safrasDaJanela`): Fornecedores e Arrendamentos só entram se a safra deles estiver aqui. */
  safrasDaJanela: string[];
}

/** Gera os lançamentos VINCULADO — sincronizados ao vivo de Fornecedores/Bancos/Arrendamentos/Aquisição (BUG #1 da spec: nunca chamado "Manual"). */
export function gerarLancamentosVinculados(input: GerarVinculadosInput): LancamentoMensal[] {
  const lancamentos: LancamentoMensal[] = [];
  let seq = 1;

  for (const s of input.suppliers) {
    if (!input.safrasDaJanela.includes(s.safra)) continue;
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

  // Bancos: sem tag de safra (parcela é só uma data real) — sempre entram pela data.
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
      if (!input.safrasDaJanela.includes(parcela.safra)) continue;
      // Preço de referência não definido -> sem valor a lançar (nunca um 0 que mente, mesmo critério do BUG #1 de Arrendamentos).
      if (parcela.valorTotal == null) continue;
      // Direção (23/08/2026): reaproveita as categorias ARRENDAMENTO_PAGO/
      // ARRENDAMENTO_RECEBIDO já existentes (antes só usadas em lançamento manual).
      const aReceber = contrato.direcao === 'A_RECEBER';
      lancamentos.push({
        id: `vinc-arr-${seq++}`,
        mes: mesRef,
        ano: anoInicioSafra(parcela.safra) + 1,
        tipo: aReceber ? 'ENTRADA' : 'SAIDA',
        origem: 'VINCULADO',
        categoriaLabel: aReceber ? 'Arrendamento Recebido' : 'Arrendamento Pago',
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
