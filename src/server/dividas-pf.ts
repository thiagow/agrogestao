'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireContext } from '@/lib/session';
import { dividaPfSchema } from '@/lib/validation';
import type { DividaPf } from '@/types';

export async function listDividasPf(): Promise<DividaPf[]> {
  const ctx = await requireContext();
  const rows = await db.dividaPf.findMany({
    where: { contaId: ctx.conta.id, ativo: true },
    orderBy: { createdAt: 'desc' }
  });
  return rows.map(toDividaPfDTO);
}

interface SaveDividaPfInput {
  id?: string;
  tipoDivida: string;
  credor?: string;
  saldoDevedor: number;
  parcelaMensal?: number;
  vencimentoFinal?: string;
  observacoes?: string;
}

export async function saveDividaPf(input: SaveDividaPfInput): Promise<DividaPf> {
  const ctx = await requireContext();
  const parsed = dividaPfSchema.parse(input);

  const data = {
    tipoDivida: parsed.tipoDivida,
    credor: parsed.credor || null,
    saldoDevedor: parsed.saldoDevedor,
    parcelaMensal: parsed.parcelaMensal ?? null,
    vencimentoFinal: parsed.vencimentoFinal ? new Date(parsed.vencimentoFinal) : null,
    observacoes: parsed.observacoes || null
  };

  const row = input.id
    ? await db.dividaPf.update({ where: { id: input.id }, data: { ...data, updatedById: ctx.user.id } })
    : await db.dividaPf.create({ data: { ...data, contaId: ctx.conta.id, createdById: ctx.user.id } });

  revalidatePath('/cadastro_mestre');
  return toDividaPfDTO(row);
}

export async function deleteDividaPf(id: string) {
  const ctx = await requireContext();
  await db.dividaPf.updateMany({
    where: { id, contaId: ctx.conta.id },
    data: { ativo: false, updatedById: ctx.user.id }
  });
  revalidatePath('/cadastro_mestre');
}

function toDividaPfDTO(row: {
  id: string;
  tipoDivida: string;
  credor: string | null;
  saldoDevedor: unknown;
  parcelaMensal: unknown;
  vencimentoFinal: Date | null;
  observacoes: string | null;
}): DividaPf {
  return {
    id: row.id,
    tipoDivida: row.tipoDivida,
    credor: row.credor ?? undefined,
    saldoDevedor: Number(row.saldoDevedor),
    parcelaMensal: row.parcelaMensal != null ? Number(row.parcelaMensal) : undefined,
    vencimentoFinal: row.vencimentoFinal ? row.vencimentoFinal.toISOString().slice(0, 10) : undefined,
    observacoes: row.observacoes ?? undefined
  };
}
