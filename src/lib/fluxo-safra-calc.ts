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
import { anoInicioSafra, safraDoAno } from '@/lib/safra-periodo';
import type {
  CategoriaItemFluxoManual,
  ContratoBancario,
  ContratoComercial,
  CulturaSafraAno,
  FluxoSafraCalculado,
  FluxoSafraDTO,
  FluxoSafraLinha,
  ItemFluxoManual,
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
  suppliers: Supplier[];
  contratosBancarios: ContratoBancario[];
  /** Um item por ano de calendário — mesma forma de AnoCronograma (listCronogramaConsolidado). */
  anosCronograma: { ano: number; juros: number; amortizacao: number }[];
  /** Mesma forma de LinhaFluxoConsolidadoArrendamento (listFluxoConsolidadoArrendamentos). */
  linhasArrendamento: { safra: string; valorTotal: number | null }[];
  /** Mesma forma de LinhaFluxoConsolidado (listFluxoConsolidadoAquisicoes). */
  linhasAquisicao: { safra: string; valorTotal: number }[];
  contratosComerciais: ContratoComercial[];
  itensManuais: ItemFluxoManual[];
  /** Cotacao.precoDefinidoSafra de Soja (src/server/cotacoes.ts, resolverPrecoFallback) — null = não definida. */
  precoSoja: number | null;
}

/**
 * Monta o FluxoSafraDTO de uma safra a partir das 6 telas de origem já
 * carregadas por completo — a conversão safra→ano de calendário para o
 * cronograma bancário usa a mesma convenção de dataReferenciaDaSafra()
 * (src/lib/safra-periodo.ts): o ano relevante é o segundo ano da safra.
 */
export function montarFluxoSafraDTO(input: MontarFluxoSafraInput): FluxoSafraDTO {
  const { safra } = input;
  const proximaSafra = safraDoAno(anoInicioSafra(safra) + 1);
  const anoBancario = anoInicioSafra(safra) + 1;

  const registrosSafra = input.quadroSafra.filter((q) => q.anoSafra === safra);
  const receitaProjetada = registrosSafra.reduce((sum, q) => sum + calcularSafra(q).receitaBruta, 0);
  const custoProducao = registrosSafra.reduce((sum, q) => sum + calcularSafra(q).despesa, 0);

  const areaSoja = registrosSafra.filter((q) => q.cultura.toLowerCase().includes('soja')).reduce((sum, q) => sum + q.hectares, 0);
  const despesaComercial = areaSoja === 0 ? 0 : input.precoSoja !== null ? areaSoja * 3 * input.precoSoja : null;

  const fornecedores = input.suppliers.filter((s) => s.safra === safra).reduce((sum, s) => sum + s.dividaTotal, 0);
  const fornecedoresProximaSafra = input.suppliers
    .filter((s) => s.safra === proximaSafra)
    .reduce((sum, s) => sum + s.dividaTotal, 0);

  const anoCronograma = input.anosCronograma.find((a) => a.ano === anoBancario);
  const amortizacaoBancos = anoCronograma?.amortizacao ?? 0;
  const jurosBancos = anoCronograma?.juros ?? 0;
  const saldoDevedorBancos = input.contratosBancarios.reduce((sum, c) => sum + c.saldoAtual, 0);

  const arrendamentos = input.linhasArrendamento.filter((l) => l.safra === safra).reduce((sum, l) => sum + (l.valorTotal ?? 0), 0);
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
    despesaComercial,
    parcelasAquisicao,
    saldoDevedorBancos,
    fornecedoresProximaSafra,
    itensManuais
  };
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
      label: 'Arrendamentos',
      valor: dto.arrendamentos,
      origem: 'Custo total anual de arrendamentos cadastrados para esta safra'
    },
    {
      id: 'despesa_comercial',
      label: 'Despesa Comercial (3 sc/ha soja)',
      valor: dto.despesaComercial,
      origem:
        dto.despesaComercial === null
          ? 'Estimativa indisponível: nenhuma cotação de Soja definida em Cotações e nenhuma área de Soja no Quadro Safra desta safra'
          : 'Estimativa de despesa comercial: 3 sacas de soja por hectare plantado, ao preço definido em Cotações'
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

  const totalEntradas = dto.receitaProjetada + totalItensEntrada;
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
