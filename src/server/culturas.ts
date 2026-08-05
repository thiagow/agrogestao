'use server';

import { db } from '@/lib/db';
import { requireContext } from '@/lib/session';

/** Catálogo global (contaId null) + culturas próprias da conta atual — usado nos selects dos módulos. */
export async function listCulturas() {
  const ctx = await requireContext();
  return db.cultura.findMany({
    where: { ativo: true, OR: [{ contaId: null }, { contaId: ctx.conta.id }] },
    orderBy: { nome: 'asc' }
  });
}
