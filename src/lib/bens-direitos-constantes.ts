// Tipos de Bem / Direito (lista gerencial validada pelo cliente em 09/10/2026 —
// substituiu a taxonomia IRPF). A ordem aqui é a ordem de exibição na tela e no select.
// A escolha do tipo decide qual formulário abre: Imóveis Rurais/Urbanos têm modal
// próprio (ANEXO A/B); os demais usam o formulário genérico.
import type { GrupoIrpfBem } from '@/types';

export const TIPOS_BEM_DIREITO: GrupoIrpfBem[] = [
  'Imóveis Rurais - ANEXO A',
  'Imóveis Urbanos - ANEXO B',
  'Benfeitorias e Instalações',
  'Máquinas Agrícolas',
  'Implementos',
  'Veículos',
  'Estoque (Insumos e Grãos)',
  'Participações Societárias',
  'Disponibilidade e aplicações',
  'Contas a receber',
  'Direitos e bens diversos'
];

export const ANEXOS_IMOVEL: GrupoIrpfBem[] = ['Imóveis Rurais - ANEXO A', 'Imóveis Urbanos - ANEXO B'];

export function isAnexoImovel(grupo: GrupoIrpfBem): boolean {
  return (ANEXOS_IMOVEL as string[]).includes(grupo);
}
