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
// quanto pelo Salvar de cada bloco do Histórico do Grupo, por isso todo campo é
// opcional e um `undefined` não sobrescreve o que já está salvo. Nome/razaoSocial/cnpj do
// grupo não entram aqui — são de Conta, geridos só pelo Admin Master (src/server/contas.ts).
const CAMPOS_TEXTO = [
  'email',
  'telefone',
  'atividadePrincipal',
  'sede',
  'consultorResponsavel',
  'missao',
  'visao',
  'valores'
] as const;

export async function savePerfilGrupo(input: Partial<PerfilGrupoEconomico>): Promise<PerfilGrupoEconomico> {
  const ctx = await requireContext();
  const parsed = perfilGrupoSchema.parse(input);

  const data: Record<string, unknown> = { updatedById: ctx.user.id };
  for (const campo of CAMPOS_TEXTO) {
    const valor = parsed[campo];
    if (valor !== undefined) data[campo] = valor || null;
  }
  if (parsed.fundacao !== undefined) data.fundacao = parsed.fundacao ? new Date(parsed.fundacao) : null;
  if (parsed.respostas !== undefined) {
    // Merge com o que já está salvo: salvar um subconjunto de perguntas nunca apaga as
    // outras; resposta vazia remove a chave.
    const atual = await db.perfilGrupoEconomico.findUnique({
      where: { contaId: ctx.conta.id },
      select: { respostas: true }
    });
    const merged: Record<string, string> = { ...(atual?.respostas as Record<string, string> | null) };
    for (const [chave, valor] of Object.entries(parsed.respostas)) {
      if (valor.trim()) merged[chave] = valor.trim();
      else delete merged[chave];
    }
    data.respostas = merged;
  }
  if (parsed.pecuariaTaxaDesfrutePercent !== undefined) {
    data.pecuariaTaxaDesfrutePercent = parsed.pecuariaTaxaDesfrutePercent ?? null;
  }

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
  respostas: unknown;
  pecuariaTaxaDesfrutePercent: unknown;
  missao: string | null;
  visao: string | null;
  valores: string | null;
}): PerfilGrupoEconomico {
  return {
    email: row.email ?? undefined,
    telefone: row.telefone ?? undefined,
    atividadePrincipal: row.atividadePrincipal ?? undefined,
    fundacao: row.fundacao ? row.fundacao.toISOString().slice(0, 10) : undefined,
    sede: row.sede ?? undefined,
    consultorResponsavel: row.consultorResponsavel ?? undefined,
    respostas: (row.respostas as Record<string, string> | null) ?? undefined,
    pecuariaTaxaDesfrutePercent: row.pecuariaTaxaDesfrutePercent != null ? Number(row.pecuariaTaxaDesfrutePercent) : undefined,
    missao: row.missao ?? undefined,
    visao: row.visao ?? undefined,
    valores: row.valores ?? undefined
  };
}
