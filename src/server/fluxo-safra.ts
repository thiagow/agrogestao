'use server';

// Única escrita própria da tela "Fluxo de Safra Projetado" (réplica confirmada
// do AgroFlow, docs/demandas/SPEC_TELA_FLUXO_DE_SAFRA.md seção 7/9): itens
// manuais extraordinários (dividendos, estoques, retiradas, manutenções) que
// não são capturados automaticamente pelos módulos de origem. A agregação do
// demonstrativo em si (Quadro Safra + Fornecedores + Bancos + Arrendamentos +
// Aquisição) não tem server action própria — é montada no client a partir dos
// dados já carregados por page.tsx, mesmo critério de src/lib/comercializacao.ts.
//
// `listItensFluxoManual()` busca TODOS os itens ativos da propriedade (não
// filtra por safra) — o seletor de safra da tela filtra no client, igual às
// demais fontes do demonstrativo.

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireContext } from '@/lib/session';
import { itemFluxoManualSchema } from '@/lib/validation';
import { tipoDaCategoria } from '@/lib/fluxo-safra-calc';
import type { CategoriaItemFluxoManual, ItemFluxoManual } from '@/types';

export async function listItensFluxoManual(): Promise<ItemFluxoManual[]> {
  const ctx = await requireContext();
  if (!ctx.propriedade) return [];

  const rows = await db.itemFluxoManual.findMany({
    where: { propriedadeId: ctx.propriedade.id, ativo: true },
    orderBy: { createdAt: 'asc' }
  });

  return rows.map(toDTO);
}

interface SaveItemFluxoManualInput {
  id?: string;
  safra: string;
  categoria: CategoriaItemFluxoManual;
  descricao: string;
  valor: number;
  observacoes?: string;
}

export async function saveItemFluxoManual(input: SaveItemFluxoManualInput): Promise<ItemFluxoManual> {
  const ctx = await requireContext();
  if (!ctx.propriedade) throw new Error('Nenhuma propriedade selecionada.');

  const parsed = itemFluxoManualSchema.parse(input);

  const data = {
    safra: parsed.safra,
    categoria: parsed.categoria,
    descricao: parsed.descricao,
    valor: parsed.valor,
    observacoes: parsed.observacoes || null
  };

  const row = input.id
    ? await db.itemFluxoManual.update({
        where: { id: input.id, propriedadeId: ctx.propriedade.id },
        data: { ...data, updatedById: ctx.user.id }
      })
    : await db.itemFluxoManual.create({
        data: { ...data, propriedadeId: ctx.propriedade.id, createdById: ctx.user.id }
      });

  revalidatePath('/fluxo_safra');
  return toDTO(row);
}

export async function deleteItemFluxoManual(id: string) {
  const ctx = await requireContext();
  if (!ctx.propriedade) throw new Error('Nenhuma propriedade selecionada.');

  await db.itemFluxoManual.updateMany({
    where: { id, propriedadeId: ctx.propriedade.id },
    data: { ativo: false, updatedById: ctx.user.id }
  });

  revalidatePath('/fluxo_safra');
}

type ItemFluxoManualRow = {
  id: string;
  safra: string;
  categoria: string;
  descricao: string;
  valor: unknown;
  observacoes: string | null;
};

function toDTO(row: ItemFluxoManualRow): ItemFluxoManual {
  const categoria = row.categoria as CategoriaItemFluxoManual;
  return {
    id: row.id,
    safra: row.safra,
    categoria,
    tipo: tipoDaCategoria(categoria),
    descricao: row.descricao,
    valor: Number(row.valor),
    observacoes: row.observacoes ?? undefined
  };
}
