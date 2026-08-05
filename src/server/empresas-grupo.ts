'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireContext } from '@/lib/session';
import { empresaGrupoSchema } from '@/lib/validation';
import { TIPO_RELACAO_EMPRESA_TO_DB, TIPO_RELACAO_EMPRESA_FROM_DB } from '@/lib/enum-maps';
import type { EmpresaGrupo } from '@/types';

export async function listEmpresasGrupo(): Promise<EmpresaGrupo[]> {
  const ctx = await requireContext();
  const rows = await db.empresaGrupo.findMany({
    where: { contaId: ctx.conta.id, ativo: true },
    orderBy: { nome: 'asc' }
  });
  return rows.map(toEmpresaGrupoDTO);
}

interface SaveEmpresaGrupoInput {
  id?: string;
  nome: string;
  cnpj?: string;
  tipoRelacao: string;
  participacaoPercentual?: number;
  observacoes?: string;
}

export async function saveEmpresaGrupo(input: SaveEmpresaGrupoInput): Promise<EmpresaGrupo> {
  const ctx = await requireContext();
  const parsed = empresaGrupoSchema.parse(input);

  const data = {
    nome: parsed.nome,
    cnpj: parsed.cnpj || null,
    tipoRelacao: TIPO_RELACAO_EMPRESA_TO_DB[parsed.tipoRelacao],
    participacaoPercentual: parsed.participacaoPercentual ?? null,
    observacoes: parsed.observacoes || null
  };

  const row = input.id
    ? await db.empresaGrupo.update({ where: { id: input.id }, data: { ...data, updatedById: ctx.user.id } })
    : await db.empresaGrupo.create({ data: { ...data, contaId: ctx.conta.id, createdById: ctx.user.id } });

  revalidatePath('/cadastro_mestre');
  return toEmpresaGrupoDTO(row);
}

export async function deleteEmpresaGrupo(id: string) {
  const ctx = await requireContext();
  await db.empresaGrupo.updateMany({
    where: { id, contaId: ctx.conta.id },
    data: { ativo: false, updatedById: ctx.user.id }
  });
  revalidatePath('/cadastro_mestre');
}

function toEmpresaGrupoDTO(row: {
  id: string;
  nome: string;
  cnpj: string | null;
  tipoRelacao: string;
  participacaoPercentual: unknown;
  observacoes: string | null;
}): EmpresaGrupo {
  return {
    id: row.id,
    nome: row.nome,
    cnpj: row.cnpj ?? undefined,
    tipoRelacao: TIPO_RELACAO_EMPRESA_FROM_DB[row.tipoRelacao as keyof typeof TIPO_RELACAO_EMPRESA_FROM_DB],
    participacaoPercentual: row.participacaoPercentual != null ? Number(row.participacaoPercentual) : undefined,
    observacoes: row.observacoes ?? undefined
  };
}
