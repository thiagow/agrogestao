'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireContext } from '@/lib/session';
import { supplierSchema } from '@/lib/validation';
import { CATEGORY_TO_DB, CATEGORY_FROM_DB } from '@/lib/enum-maps';
import type { Supplier } from '@/types';

export async function listSuppliers(): Promise<Supplier[]> {
  const ctx = await requireContext();
  if (!ctx.propriedade) return [];

  const rows = await db.supplier.findMany({
    where: { propriedadeId: ctx.propriedade.id, ativo: true },
    include: { compras: { orderBy: { data: 'asc' } } },
    orderBy: { createdAt: 'desc' }
  });

  return rows.map(toSupplierDTO);
}

interface SaveSupplierInput {
  id?: string;
  nome: string;
  categoria: Supplier['categoria'];
  cultura: string;
  safra: string;
  dividaTotal: number;
  moeda: Supplier['moeda'];
  vencimento: string;
  observacoes?: string;
  imageUrl?: string;
  comprovanteUrl?: string;
  status?: Supplier['status'];
}

export async function saveSupplier(input: SaveSupplierInput): Promise<Supplier> {
  const ctx = await requireContext();
  if (!ctx.propriedade) throw new Error('Nenhuma propriedade selecionada.');

  const parsed = supplierSchema.parse(input);

  const data = {
    nome: parsed.nome,
    categoria: CATEGORY_TO_DB[parsed.categoria],
    cultura: parsed.cultura,
    safra: parsed.safra,
    dividaTotal: parsed.dividaTotal,
    moeda: parsed.moeda,
    vencimento: new Date(parsed.vencimento),
    observacoes: parsed.observacoes || null,
    imageUrl: parsed.imageUrl || null,
    comprovanteUrl: parsed.comprovanteUrl || null,
    status: parsed.status ?? 'PENDENTE'
  };

  const row = input.id
    ? await db.supplier.update({
        where: { id: input.id, propriedadeId: ctx.propriedade.id },
        data: { ...data, updatedById: ctx.user.id },
        include: { compras: { orderBy: { data: 'asc' } } }
      })
    : await db.supplier.create({
        data: { ...data, propriedadeId: ctx.propriedade.id, createdById: ctx.user.id },
        include: { compras: { orderBy: { data: 'asc' } } }
      });

  revalidatePath('/fornecedores');
  revalidatePath('/resumo');
  return toSupplierDTO(row);
}

export async function deleteSupplier(id: string) {
  const ctx = await requireContext();
  if (!ctx.propriedade) throw new Error('Nenhuma propriedade selecionada.');

  await db.supplier.updateMany({
    where: { id, propriedadeId: ctx.propriedade.id },
    data: { ativo: false, updatedById: ctx.user.id }
  });

  revalidatePath('/fornecedores');
  revalidatePath('/resumo');
}

type SupplierRow = {
  id: string;
  nome: string;
  categoria: string;
  cultura: string | null;
  safra: string | null;
  dividaTotal: unknown;
  moeda: string;
  vencimento: Date;
  observacoes: string | null;
  status: string;
  imageUrl: string | null;
  comprovanteUrl: string | null;
  compras: { id: string; data: Date; valor: unknown; descricao: string; culturaReferencia: string | null }[];
};

function toSupplierDTO(row: SupplierRow): Supplier {
  return {
    id: row.id,
    nome: row.nome,
    categoria: CATEGORY_FROM_DB[row.categoria as keyof typeof CATEGORY_FROM_DB],
    cultura: row.cultura ?? '—',
    safra: row.safra ?? '—',
    dividaTotal: Number(row.dividaTotal),
    moeda: row.moeda as Supplier['moeda'],
    vencimento: row.vencimento.toISOString().slice(0, 10),
    observacoes: row.observacoes ?? undefined,
    status: row.status as Supplier['status'],
    imageUrl: row.imageUrl ?? undefined,
    comprovanteUrl: row.comprovanteUrl ?? undefined,
    compras: row.compras.map((c) => ({
      id: c.id,
      data: c.data.toISOString().slice(0, 10),
      valor: Number(c.valor),
      descricao: c.descricao,
      culturaReferencia: c.culturaReferencia ?? undefined
    }))
  };
}
