'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireContext } from '@/lib/session';
import { culturaSchema } from '@/lib/validation';
import type { Cultura } from '@/types';

/** Catálogo global (contaId null) + culturas próprias da conta atual — usado nos selects dos módulos. */
export async function listCulturas(): Promise<Cultura[]> {
  const ctx = await requireContext();
  const rows = await db.cultura.findMany({
    where: { ativo: true, OR: [{ contaId: null }, { contaId: ctx.conta.id }] },
    orderBy: { nome: 'asc' }
  });
  return rows.map((row) => ({
    id: row.id,
    nome: row.nome,
    unidadeMedida: row.unidadeMedida as any,
    contaId: row.contaId
  }));
}

interface SaveCulturaInput {
  nome: string;
  unidadeMedida: string;
}

export async function saveCultura(input: SaveCulturaInput): Promise<Cultura> {
  const ctx = await requireContext();

  const parsed = culturaSchema.parse(input);

  // Verifica se já existe cultura com esse nome nessa conta
  const existente = await db.cultura.findFirst({
    where: { contaId: ctx.conta.id, nome: parsed.nome, ativo: true }
  });

  if (existente) {
    throw new Error('Já existe uma cultura com esse nome nessa conta.');
  }

  const row = await db.cultura.create({
    data: {
      nome: parsed.nome,
      unidadeMedida: parsed.unidadeMedida,
      contaId: ctx.conta.id,
      createdById: ctx.user.id
    }
  });

  revalidatePath('/');

  return {
    id: row.id,
    nome: row.nome,
    unidadeMedida: row.unidadeMedida as any,
    contaId: row.contaId
  };
}

export async function deleteCultura(id: string): Promise<void> {
  const ctx = await requireContext();

  // Soft delete com proteção: só deleta se for cultura própria da conta (contaId preenchido)
  // Isso impede que culturas padrão (contaId null) sejam deletadas
  const cultura = await db.cultura.findUnique({ where: { id } });

  if (!cultura || cultura.contaId !== ctx.conta.id) {
    throw new Error('Você não tem permissão para excluir essa cultura.');
  }

  await db.cultura.update({
    where: { id },
    data: { ativo: false }
  });

  revalidatePath('/');
}
