'use server';

import { db } from '@/lib/db';
import { requireUser } from '@/lib/session';

/** Chamado pelo próprio usuário depois de trocar a senha provisória com sucesso. */
export async function clearMustChangePassword() {
  const user = await requireUser();
  await db.user.update({ where: { id: user.id }, data: { mustChangePassword: false } });
}
