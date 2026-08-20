// Extraído de BemDireitoDrawer.tsx (20/08/2026) — agora compartilhado porque a
// escolha de categoria decide qual formulário abrir (genérico vs. modal
// específico de ANEXO A/B), não só qual opção aparece no <Select>.
import type { GrupoIrpfBem } from '@/types';

export const GRUPOS_IRPF: GrupoIrpfBem[] = [
  'Bens Imóveis',
  'Bens Móveis',
  'Participações Societárias',
  'Aplicações e Investimentos',
  'Depósitos à Vista e Poupança',
  'Créditos e Outros Direitos',
  'Criptoativos',
  'Outros Bens e Direitos',
  'Imóveis Rurais - ANEXO A',
  'Imóveis Urbanos - ANEXO B'
];

export const ANEXOS_IMOVEL: GrupoIrpfBem[] = ['Imóveis Rurais - ANEXO A', 'Imóveis Urbanos - ANEXO B'];

export function isAnexoImovel(grupo: GrupoIrpfBem): boolean {
  return (ANEXOS_IMOVEL as string[]).includes(grupo);
}
