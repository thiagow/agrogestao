import { safraDoAnoCivil, anoCivilDaSafra } from '@/lib/safra-periodo';
import type { MargemConsolidada } from '@/lib/agro';

// Cálculo puro do módulo de Pecuária (Bovinocultura) / Suinocultura / Avicultura
// — réplica confirmada da planilha real do cliente
// (docs/demandas/Template Agro_Banco_PECUARIA.xlsx, aba "Quadro Pecuaria").
// Sem I/O, mesmo critério de src/lib/agro.ts (calcularSafra): recebe o
// registro já carregado e devolve receita/custo/resultado/margem prontos
// pra UI e pros agregadores (Fluxo de Safra/Mensal, Análise Financeira).

export interface PecuariaBovinaCalculavel {
  femeas0a12: number;
  femeas12a24: number;
  femeas24a36: number;
  femeasAcima36: number;
  machos0a12: number;
  machos12a24: number;
  machos24a36: number;
  machosAcima36: number;

  custoAquisicaoPorCabeca: number;
  custoPastagemPorHectare: number;
  diariaConfinamento: number;
  diasConfinamento: number;
  qtdAnimaisConfinados: number;

  qtdMachosComercializados: number;
  pesoMedioMachos: number; // @
  precoMedioMachos: number; // R$/@
  qtdFemeasComercializadas: number;
  pesoMedioFemeas: number;
  precoMedioFemeas: number;
  qtdOutrasComercializadas: number;
  pesoMedioOutras: number;
  precoMedioOutras: number;
}

export interface ResultadoPecuaria {
  receitaBruta: number;
  despesa: number;
  receitaLiquida: number;
  margem: number; // % (0-100), mesma convenção de calcularSafra
}

/** Soma das 8 categorias de Estoque de Rebanho — cabeças totais em estoque no ano. */
export function estoqueTotalBovino(
  registro: Pick<
    PecuariaBovinaCalculavel,
    'femeas0a12' | 'femeas12a24' | 'femeas24a36' | 'femeasAcima36' | 'machos0a12' | 'machos12a24' | 'machos24a36' | 'machosAcima36'
  >
): number {
  return (
    registro.femeas0a12 +
    registro.femeas12a24 +
    registro.femeas24a36 +
    registro.femeasAcima36 +
    registro.machos0a12 +
    registro.machos12a24 +
    registro.machos24a36 +
    registro.machosAcima36
  );
}

/**
 * Valor do estoque de rebanho para o Ativo Circulante do Balanço — cabeças em
 * estoque × preço médio de aquisição já digitado no cadastro (decisão
 * confirmada com o usuário: não depende de cotação nem de preço de venda).
 */
export function valorEstoqueBovino(registro: PecuariaBovinaCalculavel): number {
  return Math.round(estoqueTotalBovino(registro) * registro.custoAquisicaoPorCabeca);
}

/**
 * Custo Total (R$/cabeça) — soma direta de 5 campos de unidades diferentes
 * (R$/cabeça + R$/hectare + R$/dia + dias + qtd. de animais confinados),
 * réplica literal da fórmula da planilha do cliente (aprovada mesmo assim;
 * funciona porque os 3 últimos ficam zerados quando a terminação é "A
 * Pasto" — ver nota em prisma/schema.prisma).
 */
export function custoTotalPorCabecaBovino(
  registro: Pick<
    PecuariaBovinaCalculavel,
    'custoAquisicaoPorCabeca' | 'custoPastagemPorHectare' | 'diariaConfinamento' | 'diasConfinamento' | 'qtdAnimaisConfinados'
  >
): number {
  return (
    registro.custoAquisicaoPorCabeca +
    registro.custoPastagemPorHectare +
    registro.diariaConfinamento +
    registro.diasConfinamento +
    registro.qtdAnimaisConfinados
  );
}

/** Bovinocultura — faturamento por grupo comercializado (Machos/Fêmeas/Outras) = quantidade × peso (@) × preço (R$/@). */
export function calcularPecuariaBovina(registro: PecuariaBovinaCalculavel): ResultadoPecuaria {
  const faturamentoMachos = registro.qtdMachosComercializados * registro.pesoMedioMachos * registro.precoMedioMachos;
  const faturamentoFemeas = registro.qtdFemeasComercializadas * registro.pesoMedioFemeas * registro.precoMedioFemeas;
  const faturamentoOutras = registro.qtdOutrasComercializadas * registro.pesoMedioOutras * registro.precoMedioOutras;
  const receitaBruta = Math.round(faturamentoMachos + faturamentoFemeas + faturamentoOutras);

  // "Outras Categorias" fica de fora do Custo Total de Produção — mesma
  // omissão da planilha do cliente (B43 = B23*(B31+B35), sem B39).
  const custoTotalPorCabeca = custoTotalPorCabecaBovino(registro);
  const despesa = Math.round(custoTotalPorCabeca * (registro.qtdMachosComercializados + registro.qtdFemeasComercializadas));

  const receitaLiquida = receitaBruta - despesa;
  const margem = receitaBruta > 0 ? (receitaLiquida / receitaBruta) * 100 : 0;

  return { receitaBruta, despesa, receitaLiquida, margem };
}

export interface ProducaoAnimalCalculavel {
  producaoCabecas: number;
  precoMedioPorCabeca: number;
  custoMedioPorCabeca: number;
}

/** Suinocultura/Avicultura — sem estoque, sem peso, tudo por cabeça. */
export function calcularProducaoAnimal(registro: ProducaoAnimalCalculavel): ResultadoPecuaria {
  const receitaBruta = Math.round(registro.producaoCabecas * registro.precoMedioPorCabeca);
  const despesa = Math.round(registro.producaoCabecas * registro.custoMedioPorCabeca);
  const receitaLiquida = receitaBruta - despesa;
  const margem = receitaBruta > 0 ? (receitaLiquida / receitaBruta) * 100 : 0;

  return { receitaBruta, despesa, receitaLiquida, margem };
}

/**
 * Receita/despesa consolidada de Pecuária (Bovino) + Suinocultura + Avicultura
 * para uma safra — ponte usada pelos 3 agregadores pensados em safra (Fluxo
 * de Safra, Fluxo Mensal, Análise Financeira), via safraDoAnoCivil()
 * (src/lib/safra-periodo.ts). Cada registro de ano civil entra na safra cujo
 * 2º ano é esse ano civil.
 */
export function receitaCustoPecuariaDaSafra(
  safra: string,
  pecuariaBovina: (PecuariaBovinaCalculavel & { anoCivil: number })[],
  producaoAnimal: (ProducaoAnimalCalculavel & { anoCivil: number })[]
): { receitaBruta: number; despesa: number } {
  const registrosBovino = pecuariaBovina.filter((r) => safraDoAnoCivil(r.anoCivil) === safra);
  const registrosAnimal = producaoAnimal.filter((r) => safraDoAnoCivil(r.anoCivil) === safra);

  const bovino = registrosBovino.map(calcularPecuariaBovina);
  const animal = registrosAnimal.map(calcularProducaoAnimal);

  return {
    receitaBruta: bovino.reduce((s, r) => s + r.receitaBruta, 0) + animal.reduce((s, r) => s + r.receitaBruta, 0),
    despesa: bovino.reduce((s, r) => s + r.despesa, 0) + animal.reduce((s, r) => s + r.despesa, 0)
  };
}

/**
 * Janela de anos exibida nas tabelas de Bovinocultura/Suinocultura/Avicultura
 * — 5 anos civis fixos ancorados na safra vigente do sistema: 3 Realizado +
 * Atual + Previsão (ex.: safra atual "2025/2026" -> ano civil 2026 ->
 * [2023, 2024, 2025, 2026, 2027]).
 *
 * Decisão revertida em 10/09/2026 (pedido explícito do usuário): a versão
 * anterior era uma janela ROLANTE de 3 anos calculada a partir de `new Date()`
 * (documentada como decisão confirmada em 02/09/2026) — a nova janela é fixa
 * e sempre derivada da mesma "safra vigente" central (getSafraAtual(),
 * src/server/safras.ts), nunca de `Date.now()` nem de um literal hardcoded.
 */
export function anosPecuariaVisiveis(safraAtual: string): number[] {
  const anoAtual = anoCivilDaSafra(safraAtual);
  return [anoAtual - 3, anoAtual - 2, anoAtual - 1, anoAtual, anoAtual + 1];
}

/**
 * Consolidado final do Quadro de Produção (item 2.5, 10/09/2026): soma a
 * margem da Lavoura (já calculada por `consolidarMargemLavoura`,
 * src/lib/agro.ts) com a receita/despesa de Bovino+Avícola+Suíno da mesma
 * safra (já somados por `receitaCustoPecuariaDaSafra`).
 */
export function consolidarProducaoTotal(
  lavoura: MargemConsolidada,
  pecuaria: { receitaBruta: number; despesa: number }
): MargemConsolidada {
  const receitaTotal = lavoura.receitaTotal + pecuaria.receitaBruta;
  const custoTotal = lavoura.custoTotal + pecuaria.despesa;
  const margemRs = receitaTotal - custoTotal;
  const margemPercent = receitaTotal > 0 ? (margemRs / receitaTotal) * 100 : 0;

  return { receitaTotal, custoTotal, margemRs, margemPercent };
}
