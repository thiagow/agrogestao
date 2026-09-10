// Utilitários puros de conversão data <-> safra, compartilhados por todos os
// motores de fluxo por safra (Aquisição de Fazendas, Arrendamentos). Extraído
// de aquisicao-engine.ts em 20/08/2026 quando Arrendamentos ganhou seu próprio
// motor (arrendamento-engine.ts) e passou a precisar da mesma conversão —
// mesmo critério de reuso de amortizacao.ts/taxa-efetiva.ts: função pura, sem
// I/O, testável isoladamente.

/** "2026/2027" -> 2026 */
export function anoInicioSafra(safra: string): number {
  const [ano] = safra.split('/').map(Number);
  return ano || 0;
}

export function safraDoAno(anoInicio: number): string {
  return `${anoInicio}/${anoInicio + 1}`;
}

/** Data convencionada para um evento associado a uma safra: 31/03 do segundo ano da safra. */
export function dataReferenciaDaSafra(safra: string): string {
  const anoPagamento = anoInicioSafra(safra) + 1;
  return `${anoPagamento}-03-31`;
}

/**
 * Extrai ano/mês de uma string "YYYY-MM-DD" sem passar por `new Date(...)` —
 * `new Date('2026-01-01').getFullYear()` interpreta a string como UTC-meia-
 * noite e, em qualquer timezone negativo (Brasil, UTC-3 incluso), devolve o
 * ano/mês ANTERIOR ao digitado. Como os inputs aqui são sempre datas puras
 * (sem hora, vindas de `<input type="date">`), lemos os componentes direto da
 * string em vez de arriscar esse desvio de fuso.
 */
function anoMes(dataISO: string): { ano: number; mes: number } {
  const [ano, mes] = dataISO.split('-').map(Number);
  return { ano, mes: mes - 1 }; // mês 0-indexado, mesma convenção de Date#getMonth()
}

export function diffMeses(inicioISO: string, fimISO: string): number {
  const inicio = anoMes(inicioISO);
  const fim = anoMes(fimISO);
  return (fim.ano - inicio.ano) * 12 + (fim.mes - inicio.mes);
}

/** Lista de safras cobertas por um intervalo de datas — usada tanto no motor de geração de parcelas quanto no formulário (chips + selects de safra). */
export function listarSafrasCobertas(dataInicioISO: string, dataFimISO: string): string[] {
  if (!dataInicioISO || !dataFimISO) return [];
  const numAnos = Math.max(Math.round(diffMeses(dataInicioISO, dataFimISO) / 12), 1);
  const anoInicio = anoMes(dataInicioISO).ano;
  return Array.from({ length: numAnos }, (_, i) => safraDoAno(anoInicio + i));
}

// ── Janela do ano agrícola (23/08/2026, review do cliente) ─────────────────
//
// Distinto de `dataReferenciaDaSafra`/`listarSafrasCobertas` acima (que
// convencionam UM ponto no tempo pra um evento de parcelamento — 31/03 do 2º
// ano) e também distinto da janela fixa de 18 meses do Fluxo Mensal
// (horizonte de EXIBIÇÃO, não o ano agrícola de uma safra específica — não
// reaproveitar um pelo outro). Aqui é o INTERVALO real do ano agrícola: a
// safra "2026/2027" cobre 01/07/2026 a 30/06/2027, calendário usado nos
// grandes produtores de grão do Centro-Oeste (mesma convenção documentada em
// docs/demandas/SPEC_TELA_FLUXO_DE_SAFRA.md). Usado por fluxo-safra-calc.ts
// pra filtrar Bancos/Fornecedores pela data real, em vez de "ano calendário"
// ou o campo de texto livre `Supplier.safra`.

/** Janela [início, fim] (YYYY-MM-DD, ambos inclusivos) do ano agrícola de uma safra. "2026/2027" -> 01/07/2026 .. 30/06/2027. */
export function janelaSafra(safra: string): { inicio: string; fim: string } {
  const anoInicio = anoInicioSafra(safra);
  return { inicio: `${anoInicio}-07-01`, fim: `${anoInicio + 1}-06-30` };
}

/** Bucketing inverso: em qual safra (ano agrícola jul-jun) uma data cai. Jan-Jun -> safra iniciada no ano anterior; Jul-Dez -> safra iniciada no ano corrente. */
export function safraDaData(dataISO: string): string {
  const { ano, mes } = anoMes(dataISO); // mes 0-indexado: 0=Jan .. 11=Dez
  const anoInicio = mes >= 6 ? ano : ano - 1; // mes 6 = Julho
  return safraDoAno(anoInicio);
}

// ── Ponte ano civil <-> safra (02/09/2026, módulo de Pecuária) ─────────────
//
// Pecuária/Suinocultura/Avicultura são organizadas por ANO CIVIL (confirmado
// com o cliente — atividade contínua, sem plantio/colheita, diferente do
// resto do sistema que pensa em safra). Para essas linhas continuarem
// alimentando Fluxo de Safra/Mensal e Análise Financeira (todos pensados em
// safra), usamos a mesma convenção já estabelecida no projeto: "o ano
// relevante de uma safra é o segundo ano" (ver CLAUDE.md, Fluxo de Safra).
// Ou seja, o ano civil 2026 corresponde à safra "2025/2026".

/** Ano civil (2º ano da safra) -> safra. 2026 -> "2025/2026". */
export function safraDoAnoCivil(anoCivil: number): string {
  return safraDoAno(anoCivil - 1);
}

/** Safra -> ano civil (2º ano da safra). "2025/2026" -> 2026. */
export function anoCivilDaSafra(safra: string): number {
  return anoInicioSafra(safra) + 1;
}

// ── Classificação Realizado/Atual/Previsão (10/09/2026) ────────────────────
//
// Fonte única de "qual safra é a vigente": o model `Safra` (contaId+anoSafra,
// campo `atual`), resolvido por `getSafraAtual()`/`setSafraAtual()`
// (src/server/safras.ts). Esta função pura só compara duas strings de safra —
// não sabe de onde vem `safraAtual`, então é reaproveitável tanto pelo Quadro
// de Produção (colunas por `anoSafra`) quanto pela Pecuária (colunas por
// `anoCivil`, via `safraDoAnoCivil`) sem duplicar a lógica de comparação.

export type StatusSafra = 'Realizado' | 'Atual' | 'Previsão';

export function classificarSafra(anoSafra: string, safraAtual: string): StatusSafra {
  const inicio = anoInicioSafra(anoSafra);
  const inicioAtual = anoInicioSafra(safraAtual);
  if (inicio < inicioAtual) return 'Realizado';
  if (inicio === inicioAtual) return 'Atual';
  return 'Previsão';
}
