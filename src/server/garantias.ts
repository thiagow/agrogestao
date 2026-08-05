'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireContext } from '@/lib/session';
import { garantiaSchema } from '@/lib/validation';
import type { Garantia } from '@/types';

export async function listGarantias(): Promise<Garantia[]> {
  const ctx = await requireContext();
  const rows = await db.garantia.findMany({
    where: { contaId: ctx.conta.id, ativo: true },
    orderBy: { createdAt: 'desc' }
  });
  return rows.map(toGarantiaDTO);
}

interface SaveGarantiaInput {
  id?: string;
  tipoAtivo: string;
  tipoGarantia: string;
  descricao: string;
  bancoVinculado?: string;
  numeroOperacao?: string;
  valor: number;
  moeda?: string;
  observacoes?: string;
}

export async function saveGarantia(input: SaveGarantiaInput): Promise<Garantia> {
  const ctx = await requireContext();
  const parsed = garantiaSchema.parse(input);

  const data = {
    tipoAtivo: parsed.tipoAtivo,
    tipoGarantia: parsed.tipoGarantia,
    descricao: parsed.descricao,
    bancoVinculado: parsed.bancoVinculado || null,
    numeroOperacao: parsed.numeroOperacao || null,
    valor: parsed.valor,
    moeda: parsed.moeda,
    observacoes: parsed.observacoes || null
  };

  const row = input.id
    ? await db.garantia.update({ where: { id: input.id }, data: { ...data, updatedById: ctx.user.id } })
    : await db.garantia.create({ data: { ...data, contaId: ctx.conta.id, createdById: ctx.user.id } });

  revalidatePath('/cadastro_mestre');
  return toGarantiaDTO(row);
}

export async function deleteGarantia(id: string) {
  const ctx = await requireContext();
  await db.garantia.updateMany({
    where: { id, contaId: ctx.conta.id },
    data: { ativo: false, updatedById: ctx.user.id }
  });
  revalidatePath('/cadastro_mestre');
}

function toGarantiaDTO(row: {
  id: string;
  tipoAtivo: string;
  tipoGarantia: string;
  descricao: string;
  bancoVinculado: string | null;
  numeroOperacao: string | null;
  valor: unknown;
  moeda: string;
  observacoes: string | null;
}): Garantia {
  return {
    id: row.id,
    tipoAtivo: row.tipoAtivo,
    tipoGarantia: row.tipoGarantia,
    descricao: row.descricao,
    bancoVinculado: row.bancoVinculado ?? undefined,
    numeroOperacao: row.numeroOperacao ?? undefined,
    valor: Number(row.valor),
    moeda: row.moeda as Garantia['moeda'],
    observacoes: row.observacoes ?? undefined
  };
}
