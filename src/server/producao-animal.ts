'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireContext } from '@/lib/session';
import { producaoAnimalSchema } from '@/lib/validation';
import type { ProducaoAnimalAno, TipoProducaoAnimal } from '@/types';
import { TipoProducaoAnimal as PrismaTipoProducaoAnimal } from '@prisma/client';

// "Avicultura"/"Suinocultura" não têm acento — o enum ASCII do Prisma e o
// rótulo de UI são o mesmo texto, sem precisar de enum-maps.ts (diferente de
// EstadoCivil/GrupoIrpfBem, que têm acento).
const TIPO_TO_DB: Record<TipoProducaoAnimal, PrismaTipoProducaoAnimal> = {
  Avicultura: PrismaTipoProducaoAnimal.AVICULTURA,
  Suinocultura: PrismaTipoProducaoAnimal.SUINOCULTURA
};
const TIPO_FROM_DB: Record<PrismaTipoProducaoAnimal, TipoProducaoAnimal> = {
  AVICULTURA: 'Avicultura',
  SUINOCULTURA: 'Suinocultura'
};

export async function listQuadroProducaoAnimal(): Promise<ProducaoAnimalAno[]> {
  const ctx = await requireContext();
  if (!ctx.propriedade) return [];

  const rows = await db.quadroProducaoAnimal.findMany({
    where: { propriedadeId: ctx.propriedade.id, ativo: true },
    orderBy: [{ tipo: 'asc' }, { anoCivil: 'asc' }]
  });

  return rows.map(toProducaoAnimalDTO);
}

interface SaveProducaoAnimalInput {
  id?: string;
  tipo: TipoProducaoAnimal;
  anoCivil: number;
  producaoCabecas: number;
  precoMedioPorCabeca: number;
  custoMedioPorCabeca: number;
}

export async function saveQuadroProducaoAnimal(input: SaveProducaoAnimalInput): Promise<ProducaoAnimalAno> {
  const ctx = await requireContext();
  if (!ctx.propriedade) throw new Error('Nenhuma propriedade selecionada.');

  const parsed = producaoAnimalSchema.parse(input);
  const tipoDb = TIPO_TO_DB[parsed.tipo];

  const duplicado = await db.quadroProducaoAnimal.findFirst({
    where: {
      propriedadeId: ctx.propriedade.id,
      tipo: tipoDb,
      anoCivil: parsed.anoCivil,
      ativo: true,
      ...(input.id ? { id: { not: input.id } } : {})
    }
  });
  if (duplicado) throw new Error(`Já existe um registro de ${parsed.tipo} para o ano ${parsed.anoCivil}.`);

  const data = {
    tipo: tipoDb,
    anoCivil: parsed.anoCivil,
    producaoCabecas: parsed.producaoCabecas,
    precoMedioPorCabeca: parsed.precoMedioPorCabeca,
    custoMedioPorCabeca: parsed.custoMedioPorCabeca
  };

  const row = input.id
    ? await db.quadroProducaoAnimal.update({
        where: { id: input.id, propriedadeId: ctx.propriedade.id },
        data: { ...data, updatedById: ctx.user.id }
      })
    : await db.quadroProducaoAnimal.create({
        data: { ...data, propriedadeId: ctx.propriedade.id, createdById: ctx.user.id }
      });

  revalidatePath('/quadro_safra');
  revalidatePath('/fluxo_safra');
  revalidatePath('/fluxo_mensal');
  revalidatePath('/analise_financeira');
  return toProducaoAnimalDTO(row);
}

export async function deleteQuadroProducaoAnimal(id: string) {
  const ctx = await requireContext();
  if (!ctx.propriedade) throw new Error('Nenhuma propriedade selecionada.');

  await db.quadroProducaoAnimal.updateMany({
    where: { id, propriedadeId: ctx.propriedade.id },
    data: { ativo: false, updatedById: ctx.user.id }
  });

  revalidatePath('/quadro_safra');
  revalidatePath('/fluxo_safra');
  revalidatePath('/fluxo_mensal');
  revalidatePath('/analise_financeira');
}

type QuadroProducaoAnimalRow = {
  id: string;
  tipo: PrismaTipoProducaoAnimal;
  anoCivil: number;
  producaoCabecas: number;
  precoMedioPorCabeca: unknown;
  custoMedioPorCabeca: unknown;
};

function toProducaoAnimalDTO(row: QuadroProducaoAnimalRow): ProducaoAnimalAno {
  return {
    id: row.id,
    tipo: TIPO_FROM_DB[row.tipo],
    anoCivil: row.anoCivil,
    producaoCabecas: row.producaoCabecas,
    precoMedioPorCabeca: Number(row.precoMedioPorCabeca),
    custoMedioPorCabeca: Number(row.custoMedioPorCabeca)
  };
}
