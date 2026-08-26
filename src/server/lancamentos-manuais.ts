'use server';

// Única escrita própria da tela "Fluxo Mensal" (réplica confirmada do
// AgroFlow, docs/demandas/SPEC_TELA_FLUXO_MENSAL.md seção 5/9): o lançamento
// genuinamente manual do modal "+ Lançamento". A agregação do demonstrativo
// em si (Quadro Safra + Fornecedores + Bancos + Arrendamentos + Aquisição +
// Calendário Agrícola) não tem server action própria — é montada no client a
// partir dos dados já carregados por page.tsx, mesmo critério de
// src/server/fluxo-safra.ts.
//
// `listItensLancamentoManualMensal()` busca TODOS os itens ativos da
// propriedade (não filtra por mês/ano/safra) — o seletor de safra da tela
// filtra no client, igual às demais fontes do demonstrativo.

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireContext } from '@/lib/session';
import { itemLancamentoManualMensalSchema } from '@/lib/validation';
import { tipoDaCategoriaLancamentoMensal } from '@/lib/fluxo-mensal-calc';
import type { CategoriaLancamentoMensal, ItemLancamentoManualMensal } from '@/types';

export async function listItensLancamentoManualMensal(): Promise<ItemLancamentoManualMensal[]> {
  const ctx = await requireContext();
  if (!ctx.propriedade) return [];

  const rows = await db.lancamentoManualMensal.findMany({
    where: { propriedadeId: ctx.propriedade.id, ativo: true },
    include: { cultura: true },
    orderBy: [{ ano: 'asc' }, { mes: 'asc' }]
  });

  return rows.map(toDTO);
}

interface SaveItemLancamentoManualMensalInput {
  id?: string;
  mes: number;
  ano: number;
  categoria: CategoriaLancamentoMensal;
  descricao: string;
  valor: number;
  culturaId?: string;
  observacoes?: string;
}

export async function saveItemLancamentoManualMensal(input: SaveItemLancamentoManualMensalInput): Promise<ItemLancamentoManualMensal> {
  const ctx = await requireContext();
  if (!ctx.propriedade) throw new Error('Nenhuma propriedade selecionada.');

  const parsed = itemLancamentoManualMensalSchema.parse(input);

  const data = {
    mes: parsed.mes,
    ano: parsed.ano,
    categoria: parsed.categoria,
    descricao: parsed.descricao,
    valor: parsed.valor,
    culturaId: parsed.culturaId || null,
    observacoes: parsed.observacoes || null
  };

  const row = input.id
    ? await db.lancamentoManualMensal.update({
        where: { id: input.id, propriedadeId: ctx.propriedade.id },
        data: { ...data, updatedById: ctx.user.id },
        include: { cultura: true }
      })
    : await db.lancamentoManualMensal.create({
        data: { ...data, propriedadeId: ctx.propriedade.id, createdById: ctx.user.id },
        include: { cultura: true }
      });

  revalidatePath('/fluxo_mensal');
  return toDTO(row);
}

export async function deleteItemLancamentoManualMensal(id: string) {
  const ctx = await requireContext();
  if (!ctx.propriedade) throw new Error('Nenhuma propriedade selecionada.');

  await db.lancamentoManualMensal.updateMany({
    where: { id, propriedadeId: ctx.propriedade.id },
    data: { ativo: false, updatedById: ctx.user.id }
  });

  revalidatePath('/fluxo_mensal');
}

type LancamentoManualMensalRow = {
  id: string;
  mes: number;
  ano: number;
  categoria: string;
  descricao: string;
  valor: unknown;
  culturaId: string | null;
  cultura: { nome: string } | null;
  observacoes: string | null;
};

function toDTO(row: LancamentoManualMensalRow): ItemLancamentoManualMensal {
  const categoria = row.categoria as CategoriaLancamentoMensal;
  return {
    id: row.id,
    mes: row.mes,
    ano: row.ano,
    categoria,
    tipo: tipoDaCategoriaLancamentoMensal(categoria),
    descricao: row.descricao,
    valor: Number(row.valor),
    culturaId: row.culturaId ?? undefined,
    culturaNome: row.cultura?.nome,
    observacoes: row.observacoes ?? undefined
  };
}
