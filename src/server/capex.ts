'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireContext } from '@/lib/session';
import { capexSchema } from '@/lib/validation';
import { CAPEX_CATEGORIA_TO_DB, CAPEX_CATEGORIA_FROM_DB } from '@/lib/enum-maps';
import type { Capex } from '@/types';

export async function listCapex(): Promise<Capex[]> {
  const ctx = await requireContext();
  const rows = await db.capex.findMany({
    where: { contaId: ctx.conta.id, ativo: true },
    orderBy: { dataInvestimento: 'desc' }
  });
  return rows.map(toCapexDTO);
}

interface SaveCapexInput {
  id?: string;
  descricao: string;
  categoria: string;
  valor: number;
  dataInvestimento: string;
  safra?: string;
  observacoes?: string;
}

export async function saveCapex(input: SaveCapexInput): Promise<Capex> {
  const ctx = await requireContext();
  const parsed = capexSchema.parse(input);

  const data = {
    descricao: parsed.descricao,
    categoria: CAPEX_CATEGORIA_TO_DB[parsed.categoria],
    valor: parsed.valor,
    dataInvestimento: new Date(parsed.dataInvestimento),
    safra: parsed.safra || null,
    observacoes: parsed.observacoes || null
  };

  const row = input.id
    ? await db.capex.update({ where: { id: input.id }, data: { ...data, updatedById: ctx.user.id } })
    : await db.capex.create({ data: { ...data, contaId: ctx.conta.id, createdById: ctx.user.id } });

  revalidatePath('/cadastro_mestre');
  return toCapexDTO(row);
}

export async function deleteCapex(id: string) {
  const ctx = await requireContext();
  await db.capex.updateMany({
    where: { id, contaId: ctx.conta.id },
    data: { ativo: false, updatedById: ctx.user.id }
  });
  revalidatePath('/cadastro_mestre');
}

function toCapexDTO(row: {
  id: string;
  descricao: string;
  categoria: string;
  valor: unknown;
  dataInvestimento: Date;
  safra: string | null;
  observacoes: string | null;
}): Capex {
  return {
    id: row.id,
    descricao: row.descricao,
    categoria: CAPEX_CATEGORIA_FROM_DB[row.categoria as keyof typeof CAPEX_CATEGORIA_FROM_DB],
    valor: Number(row.valor),
    dataInvestimento: row.dataInvestimento.toISOString().slice(0, 10),
    safra: row.safra ?? undefined,
    observacoes: row.observacoes ?? undefined
  };
}
