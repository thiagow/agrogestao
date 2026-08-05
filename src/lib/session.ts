import 'server-only';
import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from './auth';
import { db } from './db';

export const PROPRIEDADE_COOKIE = 'ag_prop';

/** `cache()` colapsa múltiplas chamadas dentro do mesmo request em uma única leitura de sessão. */
export const getCurrentSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

export async function requireUser() {
  const session = await getCurrentSession();
  if (!session?.user) redirect('/login');
  return session.user;
}

export async function requireSuperAdmin() {
  const user = await requireUser();
  if (user.role !== 'superadmin') redirect('/login');
  return user;
}

/**
 * Resolve o contexto completo de um request de cliente: usuário → conta ativa
 * (via Membership) → propriedade ativa (cookie, validado contra as
 * propriedades da própria conta a cada request). Qualquer elo quebrado
 * redireciona para /login — nunca expõe dado parcial.
 */
export async function requireContext() {
  const user = await requireUser();

  if (user.role === 'superadmin') redirect('/admin');
  if (user.mustChangePassword) redirect('/trocar-senha');

  const membership = await db.membership.findFirst({
    where: { userId: user.id, ativo: true, conta: { ativo: true, status: 'ATIVA' } },
    include: { conta: true }
  });

  if (!membership) redirect('/login');

  const propriedades = await db.propriedade.findMany({
    where: { contaId: membership.contaId, ativo: true },
    orderBy: { nome: 'asc' }
  });

  const cookieStore = await cookies();
  const cookiePropId = cookieStore.get(PROPRIEDADE_COOKIE)?.value;
  const propriedade = propriedades.find((p) => p.id === cookiePropId) ?? propriedades[0] ?? null;

  return {
    user,
    conta: membership.conta,
    membership,
    propriedades,
    propriedade
  };
}

export type RequestContext = Awaited<ReturnType<typeof requireContext>>;
