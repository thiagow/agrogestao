'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireContext } from '@/lib/session';
import { capexSchema } from '@/lib/validation';
import type { Capex } from '@/types';

export async function listCapex(): Promise<Capex[]> {
  const ctx = await requireContext();
  const rows = await db.capex.findMany({
    where: { contaId: ctx.conta.id, ativo: true },
    orderBy: [{ ano: 'desc' }, { createdAt: 'desc' }]
  });
  return rows.map(toCapexDTO);
}

interface SaveCapexInput {
  id?: string;
  descricao: string;
  tipo: string;
  ano: number;
  valorPlanejado: number;
  valorExecutado?: number;
  percentualFinanciamento?: number;
  status?: string;
  observacoes?: string;
}

export async function saveCapex(input: SaveCapexInput): Promise<Capex> {
  const ctx = await requireContext();
  const parsed = capexSchema.parse(input);

  const data = {
    descricao: parsed.descricao,
    tipo: parsed.tipo,
    ano: parsed.ano,
    valorPlanejado: parsed.valorPlanejado,
    valorExecutado: parsed.valorExecutado,
    percentualFinanciamento: parsed.percentualFinanciamento ?? null,
    status: parsed.status,
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
  tipo: string;
  ano: number;
  valorPlanejado: unknown;
  valorExecutado: unknown;
  percentualFinanciamento: unknown;
  status: string;
  observacoes: string | null;
}): Capex {
  return {
    id: row.id,
    descricao: row.descricao,
    tipo: row.tipo,
    ano: row.ano,
    valorPlanejado: Number(row.valorPlanejado),
    valorExecutado: Number(row.valorExecutado),
    percentualFinanciamento: row.percentualFinanciamento != null ? Number(row.percentualFinanciamento) : undefined,
    status: row.status,
    observacoes: row.observacoes ?? undefined
  };
}
