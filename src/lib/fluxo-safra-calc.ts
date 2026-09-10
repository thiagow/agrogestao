// Cálculo puro do Demonstrativo de Fluxo de Safra — réplica confirmada da
// tela "Fluxo de Safra Projetado" do AgroFlow (spec fotografada em 20/08/2026,
// docs/demandas/SPEC_TELA_FLUXO_DE_SAFRA.md). Sem I/O — recebe o FluxoSafraDTO
// já montado por src/server/fluxo-safra.ts e devolve todas as linhas do
// demonstrativo + KPIs derivados, testável isoladamente (mesmo particionamento
// de amortizacao.ts/taxa-efetiva.ts/indicadores.ts).
//
// Desvio deliberado da spec (BUG #1, seção 6/10 do documento): no AgroFlow
// original o badge "Análise — Próxima Safra" é positivo mesmo com
// Déficit/Superávit negativo, sem nenhuma explicação visível ao usuário. Aqui
// o status desse bloco usa o mesmo `statusCobertura` dos KPIs do topo — nunca
// um selo verde ao lado de um número vermelho sem critério.
//
// `montarFluxoSafraDTO` segue o mesmo critério de src/lib/comercializacao.ts:
// as 6 telas de origem já chegam totalmente carregadas por props (buscadas
// uma vez em page.tsx, mesmo padrão de todo o app) e a troca de safra no
// seletor local é pura filtragem/soma no client — sem round-trip ao servidor.

import { calcularSafra } from '@/lib/agro';
import { anoInicioSafra, safraDoAno, janelaSafra } from '@/lib/safra-periodo';
import { receitaCustoPecuariaDaSafra } from '@/lib/pecuaria-calc';
import type {
  CategoriaItemFluxoManual,
  ContratoBancario,
  ContratoComercial,
  CulturaSafraAno,
  FluxoSafraCalculado,
  FluxoSafraDTO,
  FluxoSafraLinha,
  ItemFluxoManual,
  PecuariaBovinaAno,
  ProducaoAnimalAno,
  StatusIndiceCobertura,
  Supplier
} from '@/types';

/** Categorias do modal "Adicionar Item" cujo grupo é ENTRADAS — as demais são SAÍDAS (spec seção 7). */
const CATEGORIAS_ENTRADA: readonly CategoriaItemFluxoManual[] = [
  'RECEITA_VENDA_FAZENDA',
  'ESTOQUE_GRAOS_ENTRADA',
  'ESTOQUE_ALGODAO_ENTRADA',
  'ESTOQUE_GADO_ENTRADA',
  'OUTRAS_ENTRADAS'
];

export function tipoDaCategoria(categoria: CategoriaItemFluxoManual): 'ENTRADA' | 'SAIDA' {
  return CATEGORIAS_ENTRADA.includes(categoria) ? 'ENTRADA' : 'SAIDA';
}

/** Rótulos exibidos no combobox "Categoria" do modal "Adicionar Item" — spec seção 7. */
export const CATEGORIA_ITEM_FLUXO_LABEL: Record<CategoriaItemFluxoManual, string> = {
  RECEITA_VENDA_FAZENDA: 'Receita Venda de Fazenda',
  ESTOQUE_GRAOS_ENTRADA: 'Estoques de Grãos (entrada)',
  ESTOQUE_ALGODAO_ENTRADA: 'Estoques de Algodão (entrada)',
  ESTOQUE_GADO_ENTRADA: 'Estoques de Gado (entrada)',
  OUTRAS_ENTRADAS: 'Outras Entradas',
  DIVIDENDOS_RETIRADAS: 'Dividendos / Retiradas',
  MANUTENCAO_MAQUINAS: 'Manutenção de Máquinas',
  CORRECAO_SOLO: 'Correção de Solo',
  OUTRAS_SAIDAS: 'Outras Saídas'
};

const LIMIAR_SAUDAVEL = 1.2;
const LIMIAR_ATENCAO = 1.0;

export function classificarCobertura(indice: number): StatusIndiceCobertura {
  if (indice >= LIMIAR_SAUDAVEL) return 'Saudável';
  if (indice >= LIMIAR_ATENCAO) return 'Atenção';
  return 'Crítico';
}

export interface MontarFluxoSafraInput {
  safra: string;
  quadroSafra: CulturaSafraAno[];
  /** Pecuária/Suinocultura/Avicultura (organizadas por ano civil) — somam em receitaProjetada/custoProducao via receitaCustoPecuariaDaSafra. */
  pecuariaBovina: PecuariaBovinaAno[];
  producaoAnimal: ProducaoAnimalAno[];
  suppliers: Supplier[];
  contratosBancarios: ContratoBancario[];
  /** Parcelas cruas (sem agregação por ano) — mesma forma de ParcelaCronograma (listCronogramaConsolidado). Filtradas aqui pela janela jul-jun da safra (23/08/2026), não pelo ano calendário. */
  parcelasBancos: { data: string; juros: number; amortizacao: number }[];
  /** Mesma forma de LinhaFluxoConsolidadoArrendamento (listFluxoConsolidadoArrendamentos). */
  linhasArrendamento: { safra: string; direcao: 'A_PAGAR' | 'A_RECEBER'; valorTotal: number | null }[];
  /** Mesma forma de LinhaFluxoConsolidado (listFluxoConsolidadoAquisicoes). */
  linhasAquisicao: { safra: string; valorTotal: number }[];
  contratosComerciais: ContratoComercial[];
  itensManuais: ItemFluxoManual[];
  /**
   * Preço de soja a usar na Despesa Comercial (3 sc/ha) — resolvido no client
   * (FluxoSafraView) com prioridade: PrecoDefinidoSafra da safra ativa; se
   * ausente, fallback para a cotação de mercado do dia (Cotacao.precoBrl).
   * `null` = nenhuma das duas fontes disponível.
   */
  precoSoja: number | null;
  /** De onde veio `precoSoja` — usado só para o texto de `origem` da linha. */
  precoSojaFonte: 'DEFINIDO' | 'MERCADO' | null;
}

/**
 * Monta o FluxoSafraDTO de uma safra a partir das 6 telas de origem já
 * carregadas por completo.
 *
 * Período da safra (23/08/2026, review do cliente): o ano agrícola vai de
 * julho a junho (janelaSafra/safraDaData, src/lib/safra-periodo.ts) — Bancos
 * e Fornecedores são filtrados por essa janela real de datas, não mais por
 * "ano calendário" (Bancos, era o BUG que perdia jul-dez do 1º ano da safra e
 * ganhava jan-jun do ano seguinte) nem pelo campo de texto livre `safra` de
 * Fornecedores (sujeito a inconsistência de digitação — usa `vencimento`
 * agora, que é DateTime confiável).
 */
export function montarFluxoSafraDTO(input: MontarFluxoSafraInput): FluxoSafraDTO {
  const { safra } = input;
  const proximaSafra = safraDoAno(anoInicioSafra(safra) + 1);
  const janela = janelaSafra(safra);
  const janelaProxima = janelaSafra(proximaSafra);

  const registrosSafra = input.quadroSafra.filter((q) => q.anoSafra === safra);
  const pecuaria = receitaCustoPecuariaDaSafra(safra, input.pecuariaBovina, input.producaoAnimal);
  const receitaProjetada = registrosSafra.reduce((sum, q) => sum + calcularSafra(q).receitaBruta, 0) + pecuaria.receitaBruta;
  const custoProducao = registrosSafra.reduce((sum, q) => sum + calcularSafra(q).despesa, 0) + pecuaria.despesa;

  const areaSoja = registrosSafra.filter((q) => q.cultura.toLowerCase().includes('soja')).reduce((sum, q) => sum + q.hectares, 0);
  const despesaComercial = areaSoja === 0 ? 0 : input.precoSoja !== null ? areaSoja * 3 * input.precoSoja : null;

  const fornecedores = input.suppliers
    .filter((s) => s.vencimento >= janela.inicio && s.vencimento <= janela.fim)
    .reduce((sum, s) => sum + s.dividaTotal, 0);
  const fornecedoresProximaSafra = input.suppliers
    .filter((s) => s.vencimento >= janelaProxima.inicio && s.vencimento <= janelaProxima.fim)
    .reduce((sum, s) => sum + s.dividaTotal, 0);

  const parcelasBancosDaSafra = input.parcelasBancos.filter((p) => p.data >= janela.inicio && p.data <= janela.fim);
  const amortizacaoBancos = parcelasBancosDaSafra.reduce((sum, p) => sum + p.amortizacao, 0);
  const jurosBancos = parcelasBancosDaSafra.reduce((sum, p) => sum + p.juros, 0);
  const saldoDevedorBancos = input.contratosBancarios.reduce((sum, c) => sum + c.saldoAtual, 0);

  const linhasArrendamentoSafra = input.linhasArrendamento.filter((l) => l.safra === safra);
  const arrendamentos = linhasArrendamentoSafra
    .filter((l) => l.direcao === 'A_PAGAR')
    .reduce((sum, l) => sum + (l.valorTotal ?? 0), 0);
  const arrendamentosReceber = linhasArrendamentoSafra
    .filter((l) => l.direcao === 'A_RECEBER')
    .reduce((sum, l) => sum + (l.valorTotal ?? 0), 0);

  const parcelasAquisicao = input.linhasAquisicao.filter((l) => l.safra === safra).reduce((sum, l) => sum + l.valorTotal, 0);

  const receitaRealizada = input.contratosComerciais
    .filter((c) => c.safra === safra && c.status === 'LIQUIDADO')
    .reduce((sum, c) => sum + c.quantidadeSc * c.precoFixado, 0);

  const itensManuais = input.itensManuais.filter((i) => i.safra === safra);

  return {
    safra,
    receitaProjetada,
    receitaRealizada,
    custoProducao,
    fornecedores,
    amortizacaoBancos,
    jurosBancos,
    arrendamentos,
    arrendamentosReceber,
    despesaComercial,
    precoSojaFonte: areaSoja === 0 ? null : input.precoSojaFonte,
    parcelasAquisicao,
    saldoDevedorBancos,
    fornecedoresProximaSafra,
    itensManuais
  };
}

/**
 * Texto de origem da linha "Despesa Comercial" — diferencia explicitamente
 * preço travado pelo cliente (PrecoDefinidoSafra) de fallback para a cotação
 * de mercado do dia (Cotacao), para transparência da fonte usada na projeção
 * financeira (10/09/2026).
 */
function origemDespesaComercial(
  despesaComercial: number | null,
  precoSojaFonte: 'DEFINIDO' | 'MERCADO' | null
): string {
  if (despesaComercial === null) {
    return precoSojaFonte === null
      ? 'Estimativa indisponível: nenhum preço de Soja definido em Cotações e nenhuma cotação de mercado do dia disponível'
      : 'Estimativa indisponível: nenhuma área de Soja no Quadro de Produção desta safra';
  }
  return precoSojaFonte === 'MERCADO'
    ? 'Estimativa de despesa comercial: 3 sacas de soja por hectare plantado, à cotação de mercado do dia (nenhum preço travado em Cotações para esta safra)'
    : 'Estimativa de despesa comercial: 3 sacas de soja por hectare plantado, ao preço definido em Cotações';
}

export function calcularFluxoSafra(dto: FluxoSafraDTO): FluxoSafraCalculado {
  const itensEntrada = dto.itensManuais.filter((i) => i.tipo === 'ENTRADA');
  const itensSaida = dto.itensManuais.filter((i) => i.tipo === 'SAIDA');
  const totalItensEntrada = itensEntrada.reduce((s, i) => s + i.valor, 0);
  const totalItensSaida = itensSaida.reduce((s, i) => s + i.valor, 0);

  const entradas: FluxoSafraLinha[] = [
    {
      id: 'receita_projetada',
      label: 'Receita Projetada da Safra',
      valor: dto.receitaProjetada,
      origem: 'Soma da receita bruta de todas as culturas e pecuária cadastradas no Quadro Safra'
    },
    ...(dto.arrendamentosReceber > 0
      ? [
          {
            id: 'arrendamentos_receber',
            label: 'Arrendamentos a Receber',
            valor: dto.arrendamentosReceber,
            origem: 'Total anual de contratos de arrendamento com direção "A Receber" cadastrados para esta safra'
          }
        ]
      : []),
    ...itensEntrada.map((i) => ({
      id: i.id,
      label: i.descricao,
      valor: i.valor,
      origem: 'Item adicional lançado manualmente nesta tela'
    }))
  ];

  const saidas: FluxoSafraLinha[] = [
    {
      id: 'custo_producao',
      label: 'Custo de Produção da Safra',
      valor: dto.custoProducao,
      origem: 'Custo total calculado pelo Quadro Safra (R$/ha × área total)'
    },
    {
      id: 'fornecedores',
      label: 'Fornecedores (insumos e serviços)',
      valor: dto.fornecedores,
      origem: 'Total de dívidas com fornecedores cadastrados para esta safra'
    },
    {
      id: 'amortizacao_bancos',
      label: 'Amortização Programada (Bancos)',
      valor: dto.amortizacaoBancos,
      origem: 'Principal a amortizar no ano conforme cronograma de cada contrato'
    },
    {
      id: 'juros_bancos',
      label: 'Juros Programados (Bancos)',
      valor: dto.jurosBancos,
      origem: 'Juros calculados pelo cronograma de amortização de cada contrato (SAC/PRICE)'
    },
    {
      id: 'arrendamentos',
      label: 'Arrendamentos a Pagar',
      valor: dto.arrendamentos,
      origem: 'Custo total anual de arrendamentos com direção "A Pagar" cadastrados para esta safra'
    },
    {
      id: 'despesa_comercial',
      label: 'Despesa Comercial (3 sc/ha soja)',
      valor: dto.despesaComercial,
      origem: origemDespesaComercial(dto.despesaComercial, dto.precoSojaFonte)
    },
    {
      id: 'parcelas_aquisicao',
      label: 'Parcelas de Aquisição de Fazenda',
      valor: dto.parcelasAquisicao,
      origem: 'Parcelas de aquisição de fazendas (sacas × cotação ou valor em R$) para esta safra'
    },
    ...itensSaida.map((i) => ({
      id: i.id,
      label: i.descricao,
      valor: i.valor,
      origem: 'Item adicional lançado manualmente nesta tela'
    }))
  ];

  const totalEntradas = dto.receitaProjetada + dto.arrendamentosReceber + totalItensEntrada;
  const totalSaidas =
    dto.custoProducao +
    dto.fornecedores +
    dto.amortizacaoBancos +
    dto.jurosBancos +
    dto.arrendamentos +
    (dto.despesaComercial ?? 0) +
    dto.parcelasAquisicao +
    totalItensSaida;

  const fluxoLiquido = totalEntradas - totalSaidas;
  const indiceCobertura = totalSaidas > 0 ? totalEntradas / totalSaidas : 0;
  const statusCobertura = classificarCobertura(indiceCobertura);

  const totalRecursosEstruturar = dto.saldoDevedorBancos + dto.fornecedoresProximaSafra;

  const custoProximaSafra = dto.custoProducao;
  const deficitSuperavitProximaSafra = fluxoLiquido - custoProximaSafra;

  return {
    entradas,
    saidas,
    totalEntradas,
    totalSaidas,
    fluxoLiquido,
    indiceCobertura,
    statusCobertura,
    totalRecursosEstruturar,
    custoProximaSafra,
    deficitSuperavitProximaSafra
  };
}
