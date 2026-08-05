'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireContext } from '@/lib/session';
import { balancoPatrimonialSchema } from '@/lib/validation';
import type { BalancoPatrimonial } from '@/types';

/** Balanço mais recente da conta (maior `safra` em ordem alfabética — "AAAA/AAAA" ordena corretamente como string). */
export async function getBalancoAtual(): Promise<BalancoPatrimonial | null> {
  const ctx = await requireContext();

  const row = await db.balancoPatrimonial.findFirst({
    where: { contaId: ctx.conta.id, ativo: true },
    orderBy: { safra: 'desc' }
  });

  return row ? toDTO(row) : null;
}

interface SaveBalancoInput {
  safra: string;
  ativoCirculante: number;
  ativoNaoCirculante: number;
  passivoCirculante: number;
  passivoNaoCirculante: number;
  capitalReservas: number;
  resultadoSafra: number;
}

export async function saveBalanco(input: SaveBalancoInput): Promise<BalancoPatrimonial> {
  const ctx = await requireContext();
  const parsed = balancoPatrimonialSchema.parse(input);

  const row = await db.balancoPatrimonial.upsert({
    where: { contaId_safra: { contaId: ctx.conta.id, safra: parsed.safra } },
    update: { ...parsed, updatedById: ctx.user.id },
    create: { ...parsed, contaId: ctx.conta.id, createdById: ctx.user.id }
  });

  revalidatePath('/analise_financeira');
  return toDTO(row);
}

type BalancoRow = {
  safra: string;
  ativoCirculante: unknown;
  ativoNaoCirculante: unknown;
  passivoCirculante: unknown;
  passivoNaoCirculante: unknown;
  capitalReservas: unknown;
  resultadoSafra: unknown;
};

function toDTO(row: BalancoRow): BalancoPatrimonial {
  return {
    safra: row.safra,
    ativoCirculante: Number(row.ativoCirculante),
    ativoNaoCirculante: Number(row.ativoNaoCirculante),
    passivoCirculante: Number(row.passivoCirculante),
    passivoNaoCirculante: Number(row.passivoNaoCirculante),
    capitalReservas: Number(row.capitalReservas),
    resultadoSafra: Number(row.resultadoSafra)
  };
}
