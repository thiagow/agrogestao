'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireContext, requireUser, PROPRIEDADE_COOKIE } from '@/lib/session';
import { propriedadeSchema } from '@/lib/validation';

export async function criarPropriedade(input: unknown) {
  // Não usa requireContext() aqui: uma conta recém-criada ainda não tem
  // propriedade, e requireContext() precisa de uma para resolver o contexto.
  const user = await requireUser();

  const membership = await db.membership.findFirst({
    where: { userId: user.id, ativo: true, conta: { ativo: true, status: 'ATIVA' } }
  });
  if (!membership) throw new Error('Usuário sem conta ativa.');

  const parsed = propriedadeSchema.parse(input);

  const propriedade = await db.propriedade.create({
    data: {
      contaId: membership.contaId,
      nome: parsed.nome,
      cidade: parsed.cidade || null,
      estado: parsed.estado || null,
      areaTotalHectares: parsed.areaTotalHectares ?? null,
      createdById: user.id
    }
  });

  const cookieStore = await cookies();
  cookieStore.set(PROPRIEDADE_COOKIE, propriedade.id, { httpOnly: true, sameSite: 'lax', path: '/' });

  revalidatePath('/', 'layout');
  return propriedade;
}

export async function selecionarPropriedade(propriedadeId: string) {
  const ctx = await requireContext();
  const pertence = ctx.propriedades.some((p) => p.id === propriedadeId);
  if (!pertence) throw new Error('Propriedade não pertence à conta atual.');

  const cookieStore = await cookies();
  cookieStore.set(PROPRIEDADE_COOKIE, propriedadeId, { httpOnly: true, sameSite: 'lax', path: '/' });

  revalidatePath('/', 'layout');
}
