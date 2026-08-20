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
    include: { participacoesNaEmpresa: { include: { socioPf: { select: { nome: true } } } } },
    orderBy: { nome: 'asc' }
  });
  return rows.map(toSocioDTO);
}

interface SaveParticipacaoInput {
  socioPfId: string;
  percentual: number;
}

interface SaveSocioInput {
  id?: string;
  tipoPessoa: 'PF' | 'PJ';
  nome: string;
  cpf?: string;
  cnpj?: string;
  cargoOuAtividade?: string;
  participacao: number;
  estadoCivil?: string;
  telefone?: string;
  email?: string;
  nacionalidade?: string;
  dataNascimento?: string;
  participacoes?: SaveParticipacaoInput[];
}

export async function saveSocio(input: SaveSocioInput): Promise<Socio> {
  const ctx = await requireContext();
  const parsed = socioSchema.parse(input);

  // Regra da engenharia reversa: soma das participações (no GRUPO) da conta não
  // pode passar de 100% — vale pra PF e PJ, é a mesma régua de participação
  // societária do grupo econômico como um todo.
  const outros = await db.socio.findMany({
    where: { contaId: ctx.conta.id, ativo: true, ...(input.id ? { id: { not: input.id } } : {}) },
    select: { participacao: true }
  });
  const somaOutros = outros.reduce((acc, s) => acc + Number(s.participacao), 0);
  if (somaOutros + parsed.participacao > 100) {
    throw new Error(`Soma das participações no grupo excede 100% (já alocado: ${somaOutros}%).`);
  }

  if (parsed.tipoPessoa === 'PF' && parsed.cpf) {
    const cpfDuplicado = await db.socio.findFirst({
      where: {
        contaId: ctx.conta.id,
        cpf: parsed.cpf,
        ativo: true,
        ...(input.id ? { id: { not: input.id } } : {})
      }
    });
    if (cpfDuplicado) throw new Error('Já existe um integrante com este CPF.');
  }

  if (parsed.tipoPessoa === 'PJ' && parsed.cnpj) {
    const cnpjDuplicado = await db.socio.findFirst({
      where: {
        contaId: ctx.conta.id,
        cnpj: parsed.cnpj,
        ativo: true,
        ...(input.id ? { id: { not: input.id } } : {})
      }
    });
    if (cnpjDuplicado) throw new Error('Já existe uma empresa com este CNPJ.');
  }

  // Cada dono do cap table precisa ser um integrante PF já cadastrado nesta conta —
  // não dá pra validar isso no Zod (depende de I/O), então checa aqui.
  const participacoes = parsed.tipoPessoa === 'PJ' ? (parsed.participacoes ?? []) : [];
  if (participacoes.length > 0) {
    const donosValidos = await db.socio.count({
      where: {
        contaId: ctx.conta.id,
        ativo: true,
        tipoPessoa: 'PF',
        id: { in: participacoes.map((p) => p.socioPfId) }
      }
    });
    if (donosValidos !== new Set(participacoes.map((p) => p.socioPfId)).size) {
      throw new Error('Um dos integrantes selecionados na participação societária é inválido.');
    }
  }

  const data = {
    tipoPessoa: parsed.tipoPessoa,
    nome: parsed.nome,
    cpf: parsed.tipoPessoa === 'PF' ? parsed.cpf || null : null,
    cnpj: parsed.tipoPessoa === 'PJ' ? parsed.cnpj || null : null,
    cargoOuAtividade: parsed.cargoOuAtividade || null,
    participacao: parsed.participacao,
    estadoCivil: parsed.tipoPessoa === 'PF' && parsed.estadoCivil ? ESTADO_CIVIL_TO_DB[parsed.estadoCivil] : null,
    telefone: parsed.telefone || null,
    email: parsed.email || null,
    nacionalidade: parsed.nacionalidade || null,
    dataNascimento: parsed.dataNascimento ? new Date(parsed.dataNascimento) : null
  };

  const socioId = await db.$transaction(async (tx) => {
    const row = input.id
      ? await tx.socio.update({ where: { id: input.id }, data: { ...data, updatedById: ctx.user.id } })
      : await tx.socio.create({ data: { ...data, contaId: ctx.conta.id, createdById: ctx.user.id } });

    // Cap table é sempre recriado do zero — mesmo critério de ParcelaAquisicao/Parcela
    // (não há UI de histórico de mudança de participação ainda).
    await tx.participacaoSocietaria.deleteMany({ where: { socioPjId: row.id } });
    if (participacoes.length > 0) {
      await tx.participacaoSocietaria.createMany({
        data: participacoes.map((p) => ({
          socioPjId: row.id,
          socioPfId: p.socioPfId,
          percentual: p.percentual
        }))
      });
    }

    return row.id;
  });

  revalidatePath('/cadastro_mestre');

  const saved = await db.socio.findUniqueOrThrow({
    where: { id: socioId },
    include: { participacoesNaEmpresa: { include: { socioPf: { select: { nome: true } } } } }
  });
  return toSocioDTO(saved);
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
  tipoPessoa: string;
  nome: string;
  cpf: string | null;
  cnpj: string | null;
  cargoOuAtividade: string | null;
  participacao: unknown;
  estadoCivil: string | null;
  telefone: string | null;
  email: string | null;
  nacionalidade: string | null;
  dataNascimento: Date | null;
  participacoesNaEmpresa: { socioPfId: string; percentual: unknown; socioPf: { nome: string } }[];
}): Socio {
  return {
    id: row.id,
    tipoPessoa: row.tipoPessoa as Socio['tipoPessoa'],
    nome: row.nome,
    cpf: row.cpf ?? undefined,
    cnpj: row.cnpj ?? undefined,
    cargoOuAtividade: row.cargoOuAtividade ?? undefined,
    participacao: Number(row.participacao),
    estadoCivil: row.estadoCivil ? ESTADO_CIVIL_FROM_DB[row.estadoCivil as keyof typeof ESTADO_CIVIL_FROM_DB] : undefined,
    telefone: row.telefone ?? undefined,
    email: row.email ?? undefined,
    nacionalidade: row.nacionalidade ?? undefined,
    dataNascimento: row.dataNascimento ? row.dataNascimento.toISOString().slice(0, 10) : undefined,
    participacoes:
      row.tipoPessoa === 'PJ'
        ? row.participacoesNaEmpresa.map((p) => ({
            socioPfId: p.socioPfId,
            socioPfNome: p.socioPf.nome,
            percentual: Number(p.percentual)
          }))
        : undefined
  };
}
