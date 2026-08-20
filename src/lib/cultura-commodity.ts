// Mapa curado cultura (Quadro de Safra) <-> commodity cotada (src/server/cotacoes.ts).
// Não é fuzzy matching: os nomes de cultura e de commodity legitimamente
// divergem (ex: "Bovino" vs "Boi Gordo", "Café Irrigado" vs "Café Arábica"),
// então um `.includes()` nunca bateria certo — e inventar um cruzamento errado
// é pior do que não cruzar. Culturas fora deste mapa (Seringueira,
// Cana-de-Açúcar, Eucalipto, Arroz, Outras Culturas) não têm commodity cotada
// hoje — mostram "—"/N/D em vez de um preço inventado, mesmo critério usado em
// toda cotação/preço de referência ausente no projeto.

export const CULTURA_COMMODITY_MAP: Record<string, string> = {
  Soja: 'Soja Grão',
  Milho: 'Milho Grão',
  'Algodão Safra': 'Algodão Pluma',
  'Algodão Safrinha': 'Algodão Pluma',
  Bovino: 'Boi Gordo',
  'Café Irrigado': 'Café Arábica'
};

/** Nome exato da commodity cotada correspondente a uma cultura, ou null se não houver cruzamento mapeado. */
export function commodityDaCultura(culturaNome: string): string | null {
  const alvo = culturaNome.trim().toLowerCase();
  const match = Object.entries(CULTURA_COMMODITY_MAP).find(([cultura]) => cultura.toLowerCase() === alvo);
  return match ? match[1] : null;
}
