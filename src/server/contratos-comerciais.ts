'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireContext } from '@/lib/session';
import { contratoComercialSchema } from '@/lib/validation';
import type { ContratoComercial } from '@/types';

export async function listContratosComerciais(): Promise<ContratoComercial[]> {
  const ctx = await requireContext();
  if (!ctx.propriedade) return [];

  const rows = await db.contratoComercial.findMany({
    where: { propriedadeId: ctx.propriedade.id, ativo: true },
    orderBy: { createdAt: 'desc' }
  });

  return rows.map(toDTO);
}

interface SaveContratoComercialInput {
  id?: string;
  cultura: string;
  safra: string;
  quantidadeSc: number;
  precoFixado: number;
  tipoContrato: ContratoComercial['tipoContrato'];
  dataContrato: string;
  dataVencimento: string;
  status: ContratoComercial['status'];
  compradorNome?: string;
  observacoes?: string;
}

export async function saveContratoComercial(input: SaveContratoComercialInput): Promise<ContratoComercial> {
  const ctx = await requireContext();
  if (!ctx.propriedade) throw new Error('Nenhuma propriedade selecionada.');

  const parsed = contratoComercialSchema.parse(input);

  const data = {
    cultura: parsed.cultura,
    safra: parsed.safra,
    quantidadeSc: parsed.quantidadeSc,
    precoFixado: parsed.precoFixado,
    tipoContrato: parsed.tipoContrato,
    dataContrato: new Date(parsed.dataContrato),
    dataVencimento: new Date(parsed.dataVencimento),
    status: parsed.status,
    compradorNome: parsed.compradorNome || null,
    observacoes: parsed.observacoes || null
  };

  const row = input.id
    ? await db.contratoComercial.update({
        where: { id: input.id, propriedadeId: ctx.propriedade.id },
        data: { ...data, updatedById: ctx.user.id }
      })
    : await db.contratoComercial.create({
        data: { ...data, propriedadeId: ctx.propriedade.id, createdById: ctx.user.id }
      });

  revalidatePath('/comercializacao');
  return toDTO(row);
}

export async function deleteContratoComercial(id: string) {
  const ctx = await requireContext();
  if (!ctx.propriedade) throw new Error('Nenhuma propriedade selecionada.');

  await db.contratoComercial.updateMany({
    where: { id, propriedadeId: ctx.propriedade.id },
    data: { ativo: false, updatedById: ctx.user.id }
  });

  revalidatePath('/comercializacao');
}

type ContratoComercialRow = {
  id: string;
  cultura: string;
  safra: string;
  quantidadeSc: number;
  precoFixado: unknown;
  tipoContrato: string;
  dataContrato: Date;
  dataVencimento: Date;
  status: string;
  compradorNome: string | null;
  observacoes: string | null;
};

function toDTO(row: ContratoComercialRow): ContratoComercial {
  return {
    id: row.id,
    cultura: row.cultura,
    safra: row.safra,
    quantidadeSc: row.quantidadeSc,
    precoFixado: Number(row.precoFixado),
    tipoContrato: row.tipoContrato as ContratoComercial['tipoContrato'],
    dataContrato: row.dataContrato.toISOString().slice(0, 10),
    dataVencimento: row.dataVencimento.toISOString().slice(0, 10),
    status: row.status as ContratoComercial['status'],
    compradorNome: row.compradorNome ?? undefined,
    observacoes: row.observacoes ?? undefined
  };
}
