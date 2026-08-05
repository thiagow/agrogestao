'use server';

import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { requireUser } from '@/lib/session';

/**
 * Chamado pelo próprio usuário depois de trocar a senha provisória com sucesso.
 *
 * O update é feito direto via Prisma (mustChangePassword tem `input: false`
 * no Better Auth — não pode ser setado pelo endpoint público /update-user,
 * de propósito, senão qualquer usuário logado poderia se autodesbloquear).
 * Só que isso deixa o cookie de cache da sessão (session.cookieCache, até 5min)
 * com o valor antigo — sem o getSession com disableCookieCache abaixo, o
 * próximo requireContext() leria o cache stale e mandaria o usuário de volta
 * pra /trocar-senha, sem erro nenhum aparente.
 */
export async function clearMustChangePassword() {
  const user = await requireUser();
  await db.user.update({ where: { id: user.id }, data: { mustChangePassword: false } });

  const requestHeaders = await headers();
  await auth.api.getSession({ headers: requestHeaders, query: { disableCookieCache: true } });
}
