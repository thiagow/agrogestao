'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireContext } from '@/lib/session';
import { perfilGrupoSchema } from '@/lib/validation';
import type { PerfilGrupoEconomico } from '@/types';

export async function getPerfilGrupo(): Promise<PerfilGrupoEconomico | null> {
  const ctx = await requireContext();
  const row = await db.perfilGrupoEconomico.findUnique({ where: { contaId: ctx.conta.id } });
  return row ? toPerfilGrupoDTO(row) : null;
}

// Upsert parcial — usado tanto pelo Drawer de edição do perfil (email/telefone/...)
// quanto pelo botão "Salvar Histórico" (só o campo historico), por isso todo campo é
// opcional e um `undefined` não sobrescreve o que já está salvo. Nome/razaoSocial/cnpj do
// grupo não entram aqui — são de Conta, geridos só pelo Admin Master (src/server/contas.ts).
export async function savePerfilGrupo(input: Partial<PerfilGrupoEconomico>): Promise<PerfilGrupoEconomico> {
  const ctx = await requireContext();
  const parsed = perfilGrupoSchema.parse(input);

  const data = {
    ...(parsed.email !== undefined && { email: parsed.email || null }),
    ...(parsed.telefone !== undefined && { telefone: parsed.telefone || null }),
    ...(parsed.atividadePrincipal !== undefined && { atividadePrincipal: parsed.atividadePrincipal || null }),
    ...(parsed.fundacao !== undefined && { fundacao: parsed.fundacao ? new Date(parsed.fundacao) : null }),
    ...(parsed.sede !== undefined && { sede: parsed.sede || null }),
    ...(parsed.consultorResponsavel !== undefined && {
      consultorResponsavel: parsed.consultorResponsavel || null
    }),
    ...(parsed.historico !== undefined && { historico: parsed.historico || null }),
    ...(parsed.sucessao !== undefined && { sucessao: parsed.sucessao || null }),
    ...(parsed.modusOperandiAgricultura !== undefined && { modusOperandiAgricultura: parsed.modusOperandiAgricultura || null }),
    ...(parsed.modusOperandiPecuaria !== undefined && { modusOperandiPecuaria: parsed.modusOperandiPecuaria || null }),
    ...(parsed.empresasColigadas !== undefined && { empresasColigadas: parsed.empresasColigadas || null }),
    updatedById: ctx.user.id
  };

  const row = await db.perfilGrupoEconomico.upsert({
    where: { contaId: ctx.conta.id },
    update: data,
    create: { ...data, contaId: ctx.conta.id }
  });

  revalidatePath('/cadastro_mestre');
  return toPerfilGrupoDTO(row);
}

function toPerfilGrupoDTO(row: {
  email: string | null;
  telefone: string | null;
  atividadePrincipal: string | null;
  fundacao: Date | null;
  sede: string | null;
  consultorResponsavel: string | null;
  historico: string | null;
  sucessao: string | null;
  modusOperandiAgricultura: string | null;
  modusOperandiPecuaria: string | null;
  empresasColigadas: string | null;
}): PerfilGrupoEconomico {
  return {
    email: row.email ?? undefined,
    telefone: row.telefone ?? undefined,
    atividadePrincipal: row.atividadePrincipal ?? undefined,
    fundacao: row.fundacao ? row.fundacao.toISOString().slice(0, 10) : undefined,
    sede: row.sede ?? undefined,
    consultorResponsavel: row.consultorResponsavel ?? undefined,
    historico: row.historico ?? undefined,
    sucessao: row.sucessao ?? undefined,
    modusOperandiAgricultura: row.modusOperandiAgricultura ?? undefined,
    modusOperandiPecuaria: row.modusOperandiPecuaria ?? undefined,
    empresasColigadas: row.empresasColigadas ?? undefined
  };
}
