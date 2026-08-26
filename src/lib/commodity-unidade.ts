// Conversão de unidade dos futuros de commodities (Yahoo Finance) para a
// unidade agrícola de referência usada no restante do sistema (saca de 60kg,
// arroba de 15kg) — pedido pela spec da tela Cotações
// (docs/demandas/SPEC_TELA_COTACOES.md, seção 3.3).
//
// Função pura, sem I/O — mesmo critério de amortizacao.ts/aquisicao-engine.ts.
//
// Os tickers de grão (ZS=F soja, ZC=F milho, ZW=F trigo) e de algodão/boi/café
// (CT=F, GF=F, KC=F) vêm da Yahoo Finance em USX (centavos de dólar) por
// unidade NATIVA da bolsa: bushel para grãos, libra-peso (lb) para os demais.
// Os fatores bushel/lb -> kg abaixo são constantes físicas padronizadas
// (USDA), não uma regra de negócio inventada — só a definição de "quantos kg
// tem uma saca/arroba" já é convenção de mercado brasileira, também padrão.
//
// Algodão (pluma) é a única exceção: a "saca de pluma" não tem peso
// padronizado confirmado (varia por praça/convenção comercial) — decisão
// registrada com o usuário em 26/08/2026: fica SEM fator de conversão nesta
// rodada, mostrando só USD/lb bruto, até o cliente confirmar o peso usado.
// Nunca inventar esse número.

const KG_POR_LB = 0.45359237;
const KG_POR_BUSHEL_SOJA_TRIGO = 27.2155; // soja e trigo: bushel de 60 lb
const KG_POR_BUSHEL_MILHO = 25.4012; // milho: bushel de 56 lb
const KG_POR_SACA = 60;
const KG_POR_ARROBA = 15;

export interface FatorConversaoCommodity {
  commodity: string;
  /** Multiplica USD/unidade-bolsa (já convertido de centavos) para virar USD/unidade-agrícola. `null` = sem fator confirmado (ver Algodão). */
  fator: number | null;
  /** Rótulo da unidade nativa da bolsa, para exibir o valor "Original". */
  unidadeOriginal: 'USX/bu' | 'USX/lb';
  /** Rótulo da unidade final (agrícola) quando há fator — "lb" quando não há conversão ainda. */
  unidadeFinal: 'sc' | '@' | 'lb';
}

export const FATORES_CONVERSAO_COMMODITY: readonly FatorConversaoCommodity[] = [
  { commodity: 'Soja Grão', fator: KG_POR_SACA / KG_POR_BUSHEL_SOJA_TRIGO, unidadeOriginal: 'USX/bu', unidadeFinal: 'sc' },
  { commodity: 'Milho Grão', fator: KG_POR_SACA / KG_POR_BUSHEL_MILHO, unidadeOriginal: 'USX/bu', unidadeFinal: 'sc' },
  { commodity: 'Trigo', fator: KG_POR_SACA / KG_POR_BUSHEL_SOJA_TRIGO, unidadeOriginal: 'USX/bu', unidadeFinal: 'sc' },
  { commodity: 'Boi Gordo', fator: KG_POR_ARROBA / KG_POR_LB, unidadeOriginal: 'USX/lb', unidadeFinal: '@' },
  { commodity: 'Café Arábica', fator: KG_POR_SACA / KG_POR_LB, unidadeOriginal: 'USX/lb', unidadeFinal: 'sc' },
  { commodity: 'Algodão Pluma', fator: null, unidadeOriginal: 'USX/lb', unidadeFinal: 'lb' }
] as const;

export function fatorConversaoCommodity(commodity: string): FatorConversaoCommodity | undefined {
  return FATORES_CONVERSAO_COMMODITY.find((f) => f.commodity === commodity);
}

export interface ConversaoCotacao {
  /** Preço bruto (USX) por unidade nativa da bolsa — igual ao valor recebido da Yahoo, sem nenhuma conversão. */
  precoOriginal: number;
  unidadeOriginal: string;
  /** USD por unidade agrícola final (sc/@), ou USD/lb bruto quando não há fator (Algodão). */
  precoUsd: number;
  /** R$ na mesma unidade de `precoUsd`. */
  precoBrl: number;
  unidadeFinal: string;
}

/**
 * Converte a cotação bruta de um futuro (USX = centavos de dólar por unidade
 * da bolsa) para USD e R$ na unidade agrícola de referência.
 * `precoUsxBruto` é o valor cru devolvido pela Yahoo Finance (ex.: 1233.50
 * para soja = 1233,50 centavos de dólar por bushel).
 */
export function converterCotacaoCommodity(
  commodity: string,
  precoUsxBruto: number,
  cambioUsdBrl: number
): ConversaoCotacao {
  const info = fatorConversaoCommodity(commodity);
  const precoUsdBolsa = precoUsxBruto / 100; // USX -> USD, por unidade nativa da bolsa
  const fator = info?.fator ?? 1; // sem fator confirmado (Algodão) -> mantém USD/lb bruto
  const precoUsd = precoUsdBolsa * fator;
  const precoBrl = precoUsd * cambioUsdBrl;

  return {
    precoOriginal: precoUsxBruto,
    unidadeOriginal: info?.unidadeOriginal ?? 'USX/lb',
    precoUsd,
    precoBrl,
    unidadeFinal: info?.unidadeFinal ?? 'lb'
  };
}
