'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireContext } from '@/lib/session';
import { aquisicaoSchema } from '@/lib/validation';
import type { Aquisicao } from '@/types';

export async function listAquisicoes(): Promise<Aquisicao[]> {
  const ctx = await requireContext();
  if (!ctx.propriedade) return [];

  const rows = await db.aquisicao.findMany({
    where: { propriedadeId: ctx.propriedade.id, ativo: true },
    orderBy: { createdAt: 'desc' }
  });

  return rows.map(toDTO);
}

interface SaveAquisicaoInput {
  id?: string;
  nomeFazenda: string;
  localizacao: string;
  areaHectares: number;
  valorTotal: number;
  dataAquisicao: string;
  dataOcupacao?: string;
  culturaPrincipal?: string;
  safraInicio: string;
  safraFim: string;
  valorTotalFluxo: number;
  totalSacas: number;
}

export async function saveAquisicao(input: SaveAquisicaoInput): Promise<Aquisicao> {
  const ctx = await requireContext();
  if (!ctx.propriedade) throw new Error('Nenhuma propriedade selecionada.');

  const parsed = aquisicaoSchema.parse(input);

  const data = {
    nomeFazenda: parsed.nomeFazenda,
    localizacao: parsed.localizacao,
    areaHectares: parsed.areaHectares,
    valorTotal: parsed.valorTotal,
    dataAquisicao: new Date(parsed.dataAquisicao),
    dataOcupacao: parsed.dataOcupacao ? new Date(parsed.dataOcupacao) : null,
    culturaPrincipal: parsed.culturaPrincipal || null,
    safraInicio: parsed.safraInicio,
    safraFim: parsed.safraFim,
    valorTotalFluxo: parsed.valorTotalFluxo,
    totalSacas: parsed.totalSacas
  };

  const row = input.id
    ? await db.aquisicao.update({
        where: { id: input.id, propriedadeId: ctx.propriedade.id },
        data: { ...data, updatedById: ctx.user.id }
      })
    : await db.aquisicao.create({
        data: { ...data, propriedadeId: ctx.propriedade.id, createdById: ctx.user.id }
      });

  revalidatePath('/aquisicao_fazenda');
  revalidatePath('/resumo');
  return toDTO(row);
}

export async function deleteAquisicao(id: string) {
  const ctx = await requireContext();
  if (!ctx.propriedade) throw new Error('Nenhuma propriedade selecionada.');

  await db.aquisicao.updateMany({
    where: { id, propriedadeId: ctx.propriedade.id },
    data: { ativo: false, updatedById: ctx.user.id }
  });

  revalidatePath('/aquisicao_fazenda');
  revalidatePath('/resumo');
}

type AquisicaoRow = {
  id: string;
  nomeFazenda: string;
  localizacao: string;
  areaHectares: number;
  valorTotal: unknown;
  dataAquisicao: Date;
  dataOcupacao: Date | null;
  culturaPrincipal: string | null;
  safraInicio: string;
  safraFim: string;
  valorTotalFluxo: unknown;
  totalSacas: number;
};

function toDTO(row: AquisicaoRow): Aquisicao {
  return {
    id: row.id,
    nomeFazenda: row.nomeFazenda,
    localizacao: row.localizacao,
    areaHectares: row.areaHectares,
    valorTotal: Number(row.valorTotal),
    dataAquisicao: row.dataAquisicao.toISOString().slice(0, 10),
    dataOcupacao: row.dataOcupacao ? row.dataOcupacao.toISOString().slice(0, 10) : undefined,
    culturaPrincipal: row.culturaPrincipal ?? undefined,
    safraInicio: row.safraInicio,
    safraFim: row.safraFim,
    valorTotalFluxo: Number(row.valorTotalFluxo),
    totalSacas: row.totalSacas
  };
}
