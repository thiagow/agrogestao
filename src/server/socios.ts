'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireContext } from '@/lib/session';
import { socioSchema } from '@/lib/validation';
import { ESTADO_CIVIL_TO_DB, ESTADO_CIVIL_FROM_DB } from '@/lib/enum-maps';
import type { Socio } from '@/types';

export async function listSocios(): Promise<Socio[]> {
  const ctx = await requireContext();
  const rows = await db.socio.findMany({
    where: { contaId: ctx.conta.id, ativo: true },
    orderBy: { nome: 'asc' }
  });
  return rows.map(toSocioDTO);
}

interface SaveSocioInput {
  id?: string;
  nome: string;
  cpf: string;
  participacao: number;
  estadoCivil?: string;
  telefone?: string;
  email?: string;
  nacionalidade?: string;
  dataNascimento?: string;
}

export async function saveSocio(input: SaveSocioInput): Promise<Socio> {
  const ctx = await requireContext();
  const parsed = socioSchema.parse(input);

  // Regra da engenharia reversa: soma das participações da conta não pode passar de 100%.
  const outros = await db.socio.findMany({
    where: { contaId: ctx.conta.id, ativo: true, ...(input.id ? { id: { not: input.id } } : {}) },
    select: { participacao: true }
  });
  const somaOutros = outros.reduce((acc, s) => acc + Number(s.participacao), 0);
  if (somaOutros + parsed.participacao > 100) {
    throw new Error(`Soma das participações excede 100% (já alocado: ${somaOutros}%).`);
  }

  const cpfDuplicado = await db.socio.findFirst({
    where: {
      contaId: ctx.conta.id,
      cpf: parsed.cpf,
      ativo: true,
      ...(input.id ? { id: { not: input.id } } : {})
    }
  });
  if (cpfDuplicado) throw new Error('Já existe um sócio com este CPF.');

  const data = {
    nome: parsed.nome,
    cpf: parsed.cpf,
    participacao: parsed.participacao,
    estadoCivil: parsed.estadoCivil ? ESTADO_CIVIL_TO_DB[parsed.estadoCivil] : null,
    telefone: parsed.telefone || null,
    email: parsed.email || null,
    nacionalidade: parsed.nacionalidade || null,
    dataNascimento: parsed.dataNascimento ? new Date(parsed.dataNascimento) : null
  };

  const row = input.id
    ? await db.socio.update({ where: { id: input.id }, data: { ...data, updatedById: ctx.user.id } })
    : await db.socio.create({ data: { ...data, contaId: ctx.conta.id, createdById: ctx.user.id } });

  revalidatePath('/cadastro_mestre');
  return toSocioDTO(row);
}

export async function deleteSocio(id: string) {
  const ctx = await requireContext();
  await db.socio.updateMany({
    where: { id, contaId: ctx.conta.id },
    data: { ativo: false, updatedById: ctx.user.id }
  });
  revalidatePath('/cadastro_mestre');
}

function toSocioDTO(row: {
  id: string;
  nome: string;
  cpf: string;
  participacao: unknown;
  estadoCivil: string | null;
  telefone: string | null;
  email: string | null;
  nacionalidade: string | null;
  dataNascimento: Date | null;
}): Socio {
  return {
    id: row.id,
    nome: row.nome,
    cpf: row.cpf,
    participacao: Number(row.participacao),
    estadoCivil: row.estadoCivil ? ESTADO_CIVIL_FROM_DB[row.estadoCivil as keyof typeof ESTADO_CIVIL_FROM_DB] : undefined,
    telefone: row.telefone ?? undefined,
    email: row.email ?? undefined,
    nacionalidade: row.nacionalidade ?? undefined,
    dataNascimento: row.dataNascimento ? row.dataNascimento.toISOString().slice(0, 10) : undefined
  };
}
