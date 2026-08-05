'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireContext } from '@/lib/session';
import { arrendamentoSchema } from '@/lib/validation';
import { PERIODICIDADE_ARRENDAMENTO_TO_DB, PERIODICIDADE_ARRENDAMENTO_FROM_DB } from '@/lib/enum-maps';
import type { ContratoArrendamento } from '@/types';

export async function listArrendamentos(): Promise<ContratoArrendamento[]> {
  const ctx = await requireContext();
  if (!ctx.propriedade) return [];

  const rows = await db.contratoArrendamento.findMany({
    where: { propriedadeId: ctx.propriedade.id, ativo: true },
    orderBy: { createdAt: 'desc' }
  });

  return rows.map(toDTO);
}

interface SaveArrendamentoInput {
  id?: string;
  nomePropriedade: string;
  localizacao: string;
  proprietarioNome: string;
  proprietarioCpfCnpj: string;
  areaHectares: number;
  culturaPrincipal: string;
  custoAnualHectare: number;
  sacasPorHectare?: number;
  dataInicio: string;
  dataFim: string;
  periodicidade: ContratoArrendamento['periodicidade'];
  renovavel: boolean;
  status: ContratoArrendamento['status'];
  safraInicio: string;
  safraFim: string;
  observacoes?: string;
}

export async function saveArrendamento(input: SaveArrendamentoInput): Promise<ContratoArrendamento> {
  const ctx = await requireContext();
  if (!ctx.propriedade) throw new Error('Nenhuma propriedade selecionada.');

  const parsed = arrendamentoSchema.parse(input);

  const data = {
    nomePropriedade: parsed.nomePropriedade,
    localizacao: parsed.localizacao,
    proprietarioNome: parsed.proprietarioNome,
    proprietarioCpfCnpj: parsed.proprietarioCpfCnpj,
    areaHectares: parsed.areaHectares,
    culturaPrincipal: parsed.culturaPrincipal,
    custoAnualHectare: parsed.custoAnualHectare,
    sacasPorHectare: parsed.sacasPorHectare ?? null,
    dataInicio: new Date(parsed.dataInicio),
    dataFim: new Date(parsed.dataFim),
    periodicidade: PERIODICIDADE_ARRENDAMENTO_TO_DB[parsed.periodicidade],
    renovavel: parsed.renovavel,
    status: parsed.status,
    safraInicio: parsed.safraInicio,
    safraFim: parsed.safraFim,
    observacoes: parsed.observacoes || null
  };

  const row = input.id
    ? await db.contratoArrendamento.update({
        where: { id: input.id, propriedadeId: ctx.propriedade.id },
        data: { ...data, updatedById: ctx.user.id }
      })
    : await db.contratoArrendamento.create({
        data: { ...data, propriedadeId: ctx.propriedade.id, createdById: ctx.user.id }
      });

  revalidatePath('/arrendamentos');
  revalidatePath('/resumo');
  return toDTO(row);
}

export async function deleteArrendamento(id: string) {
  const ctx = await requireContext();
  if (!ctx.propriedade) throw new Error('Nenhuma propriedade selecionada.');

  await db.contratoArrendamento.updateMany({
    where: { id, propriedadeId: ctx.propriedade.id },
    data: { ativo: false, updatedById: ctx.user.id }
  });

  revalidatePath('/arrendamentos');
  revalidatePath('/resumo');
}

type ArrendamentoRow = {
  id: string;
  nomePropriedade: string;
  localizacao: string;
  proprietarioNome: string;
  proprietarioCpfCnpj: string;
  areaHectares: number;
  culturaPrincipal: string;
  custoAnualHectare: unknown;
  sacasPorHectare: unknown;
  dataInicio: Date;
  dataFim: Date;
  periodicidade: string;
  renovavel: boolean;
  status: string;
  safraInicio: string;
  safraFim: string;
  observacoes: string | null;
};

function toDTO(row: ArrendamentoRow): ContratoArrendamento {
  return {
    id: row.id,
    nomePropriedade: row.nomePropriedade,
    localizacao: row.localizacao,
    proprietarioNome: row.proprietarioNome,
    proprietarioCpfCnpj: row.proprietarioCpfCnpj,
    areaHectares: row.areaHectares,
    culturaPrincipal: row.culturaPrincipal,
    custoAnualHectare: Number(row.custoAnualHectare),
    sacasPorHectare: row.sacasPorHectare != null ? Number(row.sacasPorHectare) : undefined,
    dataInicio: row.dataInicio.toISOString().slice(0, 10),
    dataFim: row.dataFim.toISOString().slice(0, 10),
    periodicidade: PERIODICIDADE_ARRENDAMENTO_FROM_DB[row.periodicidade as keyof typeof PERIODICIDADE_ARRENDAMENTO_FROM_DB],
    renovavel: row.renovavel,
    status: row.status as ContratoArrendamento['status'],
    safraInicio: row.safraInicio,
    safraFim: row.safraFim,
    observacoes: row.observacoes ?? undefined
  };
}
