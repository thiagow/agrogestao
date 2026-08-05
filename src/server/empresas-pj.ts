'use server';

import { db } from '@/lib/db';
import { requireContext } from '@/lib/session';
import type { EmpresaBalanco } from '@/types';

/** Só leitura nesta fase — sem Drawer de cadastro ainda (decisão explícita, ver docs/PLANO_BACKEND_FASE1.md). */
export async function listEmpresasPJ(): Promise<EmpresaBalanco[]> {
  const ctx = await requireContext();

  const rows = await db.empresaPJ.findMany({
    where: { contaId: ctx.conta.id, ativo: true },
    orderBy: { empresa: 'asc' }
  });

  return rows.map((row) => ({
    id: row.id,
    empresa: row.empresa,
    safra: row.safra,
    ativoCirculante: Number(row.ativoCirculante),
    ativoNaoCirculante: Number(row.ativoNaoCirculante),
    passivoCirculante: Number(row.passivoCirculante),
    passivoNaoCirculante: Number(row.passivoNaoCirculante),
    capitalReservas: Number(row.capitalReservas),
    receitaBruta: Number(row.receitaBruta),
    custos: Number(row.custos),
    despesasOperacionais: Number(row.despesasOperacionais)
  }));
}
