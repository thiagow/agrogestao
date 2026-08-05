'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireContext } from '@/lib/session';
import { garantiaSchema } from '@/lib/validation';
import { GARANTIA_TIPO_TO_DB, GARANTIA_TIPO_FROM_DB } from '@/lib/enum-maps';
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
  descricao: string;
  tipo: string;
  valor: number;
  contratoBancarioId?: string;
  observacoes?: string;
}

export async function saveGarantia(input: SaveGarantiaInput): Promise<Garantia> {
  const ctx = await requireContext();
  const parsed = garantiaSchema.parse(input);

  // contratoBancarioId, quando informado, precisa pertencer a uma propriedade
  // desta conta — não confiar em id vindo do client sem checar tenancy.
  if (parsed.contratoBancarioId) {
    const contrato = await db.contratoBancario.findFirst({
      where: { id: parsed.contratoBancarioId, propriedade: { contaId: ctx.conta.id } }
    });
    if (!contrato) throw new Error('Contrato bancário inválido.');
  }

  const data = {
    descricao: parsed.descricao,
    tipo: GARANTIA_TIPO_TO_DB[parsed.tipo],
    valor: parsed.valor,
    contratoBancarioId: parsed.contratoBancarioId || null,
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
  descricao: string;
  tipo: string;
  valor: unknown;
  contratoBancarioId: string | null;
  observacoes: string | null;
}): Garantia {
  return {
    id: row.id,
    descricao: row.descricao,
    tipo: GARANTIA_TIPO_FROM_DB[row.tipo as keyof typeof GARANTIA_TIPO_FROM_DB],
    valor: Number(row.valor),
    contratoBancarioId: row.contratoBancarioId ?? undefined,
    observacoes: row.observacoes ?? undefined
  };
}
