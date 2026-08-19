'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireContext } from '@/lib/session';
import { quadroSafraSchema } from '@/lib/validation';
import type { CulturaSafraAno } from '@/types';

export async function listQuadroSafra(): Promise<CulturaSafraAno[]> {
  const ctx = await requireContext();
  if (!ctx.propriedade) return [];

  const rows = await db.quadroSafra.findMany({
    where: { propriedadeId: ctx.propriedade.id, ativo: true },
    orderBy: [{ cultura: 'asc' }, { anoSafra: 'asc' }]
  });

  return rows.map(toQuadroSafraDTO);
}

interface SaveQuadroSafraInput {
  id?: string;
  cultura: string;
  anoSafra: string;
  hectares: number;
  haPropria: number;
  haArrendada: number;
  rendimento: number;
  unidadeProducao: string;
  precoMedio: number;
  custoProducao: number;
  producaoFixadaPercent?: number;
}

export async function saveQuadroSafra(input: SaveQuadroSafraInput): Promise<CulturaSafraAno> {
  const ctx = await requireContext();
  if (!ctx.propriedade) throw new Error('Nenhuma propriedade selecionada.');

  const parsed = quadroSafraSchema.parse(input);

  const duplicado = await db.quadroSafra.findFirst({
    where: {
      propriedadeId: ctx.propriedade.id,
      cultura: parsed.cultura,
      anoSafra: parsed.anoSafra,
      ativo: true,
      ...(input.id ? { id: { not: input.id } } : {})
    }
  });
  if (duplicado) throw new Error(`Já existe um registro de ${parsed.cultura} para a safra ${parsed.anoSafra}.`);

  const data = {
    cultura: parsed.cultura,
    anoSafra: parsed.anoSafra,
    hectares: parsed.hectares,
    haPropria: parsed.haPropria,
    haArrendada: parsed.haArrendada,
    rendimento: parsed.rendimento,
    unidadeProducao: parsed.unidadeProducao,
    precoMedio: parsed.precoMedio,
    custoProducao: parsed.custoProducao,
    producaoFixadaPercent: parsed.producaoFixadaPercent ?? null
  };

  const row = input.id
    ? await db.quadroSafra.update({
        where: { id: input.id, propriedadeId: ctx.propriedade.id },
        data: { ...data, updatedById: ctx.user.id }
      })
    : await db.quadroSafra.create({
        data: { ...data, propriedadeId: ctx.propriedade.id, createdById: ctx.user.id }
      });

  revalidatePath('/quadro_safra');
  revalidatePath('/resumo');
  return toQuadroSafraDTO(row);
}

export async function deleteQuadroSafra(id: string) {
  const ctx = await requireContext();
  if (!ctx.propriedade) throw new Error('Nenhuma propriedade selecionada.');

  await db.quadroSafra.updateMany({
    where: { id, propriedadeId: ctx.propriedade.id },
    data: { ativo: false, updatedById: ctx.user.id }
  });

  revalidatePath('/quadro_safra');
  revalidatePath('/resumo');
}

type QuadroSafraRow = {
  id: string;
  cultura: string;
  anoSafra: string;
  hectares: number;
  haPropria: number;
  haArrendada: number;
  rendimento: unknown;
  unidadeProducao: string;
  precoMedio: unknown;
  custoProducao: unknown;
  producaoFixadaPercent: unknown;
};

function toQuadroSafraDTO(row: QuadroSafraRow): CulturaSafraAno {
  return {
    id: row.id,
    cultura: row.cultura,
    anoSafra: row.anoSafra,
    hectares: row.hectares,
    haPropria: row.haPropria,
    haArrendada: row.haArrendada,
    rendimento: Number(row.rendimento),
    unidadeProducao: row.unidadeProducao,
    precoMedio: Number(row.precoMedio),
    custoProducao: Number(row.custoProducao),
    producaoFixadaPercent: row.producaoFixadaPercent != null ? Number(row.producaoFixadaPercent) : undefined
  };
}
