'use server';

import { db } from '@/lib/db';
import { requireContext } from '@/lib/session';

/** Safras da conta atual — usado no select "Safra Vinculada" de Contrato Bancário. */
export async function listSafras() {
  const ctx = await requireContext();
  return db.safra.findMany({
    where: { contaId: ctx.conta.id, ativo: true },
    orderBy: { anoSafra: 'desc' }
  });
}
