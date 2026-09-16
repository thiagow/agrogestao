// Conversão de unidade dos futuros de commodities (Yahoo Finance) para a
// unidade de referência usada no restante do sistema (saca de 60kg, arroba de
// 15kg, ou a unidade nativa do próprio contrato quando não há saca agrícola
// equivalente confirmada) — pedido pela spec da tela Cotações
// (docs/demandas/SPEC_TELA_COTACOES.md, seção 3.3), ampliado em 16/09/2026
// para cobrir Açúcar/Farelo de Soja/Óleo de Soja/Arroz/Álcool/Petróleo/Óleo de
// Aquecimento.
//
// Função pura, sem I/O — mesmo critério de amortizacao.ts/aquisicao-engine.ts.
//
// Cada linha do catálogo abaixo descreve DUAS coisas independentes sobre como
// a bolsa cota o contrato:
//   - `centavos`: a Yahoo devolve o preço em centavos de dólar (USX, comum em
//     grãos/soft commodities da CBOT/ICE) ou já em dólares inteiros (comum em
//     energia/açúcar processado da NYMEX/CBOT)? Precisa saber isso ANTES de
//     aplicar qualquer fator de peso.
//   - `fator`: depois de já estar em USD/unidade-nativa-da-bolsa, quanto
//     multiplicar pra chegar em USD/unidade-final. `1` = sem conversão,
//     mantém a unidade nativa (ex.: barril de petróleo, sem "saca" análoga).
//
// Os fatores de peso (bushel/lb/cwt/ton -> kg) são constantes físicas
// padronizadas (USDA/contrato-futuro), não uma regra de negócio inventada —
// só a definição de "quantos kg tem uma saca/arroba" é convenção comercial
// brasileira, também padrão (saca de soja/milho/trigo/açúcar/arroz, arroba de
// boi/algodão).
//
// Óleo de Soja é a única exceção que fica sem conversão de peso (mantém
// USD/lb bruto) — mesmo critério que valia pro Algodão antes de 16/09/2026:
// não existe uma unidade comercial brasileira padronizada e confirmada pra
// óleo de soja a granel (varia por embalagem/apresentação). Álcool, Petróleo
// e Óleo de Aquecimento são pra ACOMPANHAMENTO DE CUSTO (diesel/etanol/
// petróleo como proxy de insumo), não pra apuração de receita agrícola —
// aqui sim vale converter galão -> litro, que é conversão física pura (1 US
// gal = 3,785411784 L), sem ambiguidade nenhuma de "quanto pesa uma saca".

const KG_POR_LB = 0.45359237;
const KG_POR_BUSHEL_SOJA_TRIGO = 27.2155; // soja e trigo: bushel de 60 lb
const KG_POR_BUSHEL_MILHO = 25.4012; // milho: bushel de 56 lb
const KG_POR_CWT = 45.359237; // hundredweight (arroz): 100 lb
const KG_POR_TONELADA_CURTA = 907.18474; // short ton (farelo de soja): 2.000 lb
const KG_POR_TONELADA_METRICA = 1000;
const KG_POR_SACA = 60;
const KG_POR_SACA_ACUCAR = 50;
const KG_POR_SACA_ARROZ = 50;
const KG_POR_ARROBA = 15;
const LITROS_POR_GALAO = 3.785411784;

export interface FatorConversaoCommodity {
  commodity: string;
  /** A Yahoo devolve o preço em centavos de dólar (USX)? Se `false`, já vem em dólares inteiros. */
  centavos: boolean;
  /** Multiplica USD/unidade-bolsa (já em dólares, pós `centavos`) para virar USD/unidade-final. `1` = mantém a unidade nativa da bolsa. */
  fator: number;
  /** Rótulo da unidade nativa da bolsa, para exibir o valor "Original". */
  unidadeOriginal: string;
  /** Rótulo da unidade final (agrícola ou nativa, quando não há conversão de peso confirmada). */
  unidadeFinal: string;
}

export const FATORES_CONVERSAO_COMMODITY: readonly FatorConversaoCommodity[] = [
  { commodity: 'Soja Grão', centavos: true, fator: KG_POR_SACA / KG_POR_BUSHEL_SOJA_TRIGO, unidadeOriginal: 'USX/bu', unidadeFinal: 'sc' },
  { commodity: 'Milho Grão', centavos: true, fator: KG_POR_SACA / KG_POR_BUSHEL_MILHO, unidadeOriginal: 'USX/bu', unidadeFinal: 'sc' },
  { commodity: 'Trigo', centavos: true, fator: KG_POR_SACA / KG_POR_BUSHEL_SOJA_TRIGO, unidadeOriginal: 'USX/bu', unidadeFinal: 'sc' },
  { commodity: 'Boi Gordo', centavos: true, fator: KG_POR_ARROBA / KG_POR_LB, unidadeOriginal: 'USX/lb', unidadeFinal: '@' },
  { commodity: 'Café Arábica', centavos: true, fator: KG_POR_SACA / KG_POR_LB, unidadeOriginal: 'USX/lb', unidadeFinal: 'sc' },
  // Algodão (16/09/2026): passou a usar arroba (@), a pedido do usuário — mesma
  // regra de peso do Boi Gordo (arroba de 15kg), a unidade nativa da bolsa
  // (ICE, USX/lb) sendo a mesma dos dois.
  { commodity: 'Algodão Pluma', centavos: true, fator: KG_POR_ARROBA / KG_POR_LB, unidadeOriginal: 'USX/lb', unidadeFinal: '@' },
  { commodity: 'Açúcar', centavos: true, fator: KG_POR_SACA_ACUCAR / KG_POR_LB, unidadeOriginal: 'USX/lb', unidadeFinal: 'sc' },
  { commodity: 'Farelo de Soja', centavos: false, fator: KG_POR_TONELADA_METRICA / KG_POR_TONELADA_CURTA, unidadeOriginal: 'USD/ton curta', unidadeFinal: 'ton' },
  { commodity: 'Óleo de Soja', centavos: true, fator: 1, unidadeOriginal: 'USX/lb', unidadeFinal: 'lb' },
  { commodity: 'Arroz', centavos: true, fator: KG_POR_SACA_ARROZ / KG_POR_CWT, unidadeOriginal: 'USX/cwt', unidadeFinal: 'sc' },
  { commodity: 'Álcool', centavos: false, fator: 1 / LITROS_POR_GALAO, unidadeOriginal: 'USD/gal', unidadeFinal: 'L' },
  { commodity: 'Petróleo', centavos: false, fator: 1, unidadeOriginal: 'USD/bbl', unidadeFinal: 'bbl' },
  { commodity: 'Óleo de Aquecimento', centavos: true, fator: 1 / LITROS_POR_GALAO, unidadeOriginal: 'USX/gal', unidadeFinal: 'L' }
] as const;

export function fatorConversaoCommodity(commodity: string): FatorConversaoCommodity | undefined {
  return FATORES_CONVERSAO_COMMODITY.find((f) => f.commodity === commodity);
}

export interface ConversaoCotacao {
  /** Preço bruto por unidade nativa da bolsa — igual ao valor recebido da Yahoo, sem nenhuma conversão. */
  precoOriginal: number;
  unidadeOriginal: string;
  /** USD por unidade final. */
  precoUsd: number;
  /** R$ na mesma unidade de `precoUsd`. */
  precoBrl: number;
  unidadeFinal: string;
}

/**
 * Converte a cotação bruta de um futuro (na escala e unidade nativas da
 * bolsa) para USD e R$ na unidade final de referência.
 * `precoBruto` é o valor cru devolvido pela Yahoo Finance, na escala nativa
 * do ticker (centavos para a maioria dos softs/grãos, dólares inteiros para
 * energia) — ver `centavos` no catálogo acima.
 */
export function converterCotacaoCommodity(commodity: string, precoBruto: number, cambioUsdBrl: number): ConversaoCotacao {
  const info = fatorConversaoCommodity(commodity);
  const centavos = info?.centavos ?? true; // sem fator confirmado -> assume USX (mesma convenção da maioria)
  const precoUsdBolsa = centavos ? precoBruto / 100 : precoBruto;
  const fator = info?.fator ?? 1;
  const precoUsd = precoUsdBolsa * fator;
  const precoBrl = precoUsd * cambioUsdBrl;

  return {
    precoOriginal: precoBruto,
    unidadeOriginal: info?.unidadeOriginal ?? 'USX/lb',
    precoUsd,
    precoBrl,
    unidadeFinal: info?.unidadeFinal ?? 'lb'
  };
}
