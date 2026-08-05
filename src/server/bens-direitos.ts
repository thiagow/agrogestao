'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireContext } from '@/lib/session';
import { bemDireitoSchema } from '@/lib/validation';
import { BEM_TIPO_TO_DB, BEM_TIPO_FROM_DB } from '@/lib/enum-maps';
import type { BemDireito } from '@/types';

export async function listBensDireitos(): Promise<BemDireito[]> {
  const ctx = await requireContext();
  const rows = await db.bemDireito.findMany({
    where: { contaId: ctx.conta.id, ativo: true },
    orderBy: { dataAquisicao: 'desc' }
  });
  return rows.map(toBemDireitoDTO);
}

interface SaveBemDireitoInput {
  id?: string;
  descricao: string;
  tipo: string;
  valorContabil: number;
  dataAquisicao: string;
  depreciacaoAcumulada?: number;
  observacoes?: string;
}

export async function saveBemDireito(input: SaveBemDireitoInput): Promise<BemDireito> {
  const ctx = await requireContext();
  const parsed = bemDireitoSchema.parse(input);

  const data = {
    descricao: parsed.descricao,
    tipo: BEM_TIPO_TO_DB[parsed.tipo],
    valorContabil: parsed.valorContabil,
    dataAquisicao: new Date(parsed.dataAquisicao),
    depreciacaoAcumulada: parsed.depreciacaoAcumulada,
    observacoes: parsed.observacoes || null
  };

  const row = input.id
    ? await db.bemDireito.update({ where: { id: input.id }, data: { ...data, updatedById: ctx.user.id } })
    : await db.bemDireito.create({ data: { ...data, contaId: ctx.conta.id, createdById: ctx.user.id } });

  revalidatePath('/cadastro_mestre');
  return toBemDireitoDTO(row);
}

export async function deleteBemDireito(id: string) {
  const ctx = await requireContext();
  await db.bemDireito.updateMany({
    where: { id, contaId: ctx.conta.id },
    data: { ativo: false, updatedById: ctx.user.id }
  });
  revalidatePath('/cadastro_mestre');
}

function toBemDireitoDTO(row: {
  id: string;
  descricao: string;
  tipo: string;
  valorContabil: unknown;
  dataAquisicao: Date;
  depreciacaoAcumulada: unknown;
  observacoes: string | null;
}): BemDireito {
  return {
    id: row.id,
    descricao: row.descricao,
    tipo: BEM_TIPO_FROM_DB[row.tipo as keyof typeof BEM_TIPO_FROM_DB],
    valorContabil: Number(row.valorContabil),
    dataAquisicao: row.dataAquisicao.toISOString().slice(0, 10),
    depreciacaoAcumulada: Number(row.depreciacaoAcumulada),
    observacoes: row.observacoes ?? undefined
  };
}
