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
