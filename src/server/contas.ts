'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { requireSuperAdmin } from '@/lib/session';
import { contaSchema, usuarioOwnerSchema, usuarioSchema } from '@/lib/validation';
import { gerarSenhaProvisoria } from './senha';

export async function listContas() {
  await requireSuperAdmin();
  return db.conta.findMany({
    where: { ativo: true },
    include: { _count: { select: { memberships: true, propriedades: true } } },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getConta(contaId: string) {
  await requireSuperAdmin();
  return db.conta.findUnique({
    where: { id: contaId },
    include: {
      propriedades: { where: { ativo: true }, orderBy: { nome: 'asc' } },
      memberships: {
        where: { ativo: true },
        include: { user: true },
        orderBy: { createdAt: 'asc' }
      }
    }
  });
}

interface CreateContaComOwnerInput {
  conta: { nome: string; razaoSocial?: string; cnpj?: string };
  owner: { nome: string; email: string };
}

export interface CreateContaResult {
  contaId: string;
  ownerUserId: string;
  senhaProvisoria: string;
}

/** Cria a Conta e o usuário OWNER numa única operação, devolvendo a senha provisória — visível uma única vez. */
export async function createContaComOwner(input: CreateContaComOwnerInput): Promise<CreateContaResult> {
  const admin = await requireSuperAdmin();

  const conta = contaSchema.parse(input.conta);
  const owner = usuarioOwnerSchema.parse(input.owner);

  const existente = await db.user.findUnique({ where: { email: owner.email } });
  if (existente) {
    throw new Error('Já existe um usuário com este e-mail.');
  }
  if (conta.cnpj) {
    const cnpjExistente = await db.conta.findUnique({ where: { cnpj: conta.cnpj } });
    if (cnpjExistente) throw new Error('Já existe uma conta com este CNPJ.');
  }

  const senhaProvisoria = gerarSenhaProvisoria();
  const reqHeaders = await headers();

  const created = await auth.api.createUser({
    body: {
      email: owner.email,
      password: senhaProvisoria,
      name: owner.nome,
      data: { mustChangePassword: true }
    },
    headers: reqHeaders
  });

  const contaRow = await db.conta.create({
    data: {
      nome: conta.nome,
      razaoSocial: conta.razaoSocial || null,
      cnpj: conta.cnpj || null,
      createdById: admin.id,
      memberships: {
        create: { userId: created.user.id, role: 'OWNER' }
      }
    }
  });

  revalidatePath('/admin/contas');

  return { contaId: contaRow.id, ownerUserId: created.user.id, senhaProvisoria };
}

export async function suspenderConta(contaId: string) {
  await requireSuperAdmin();
  const reqHeaders = await headers();

  await db.$transaction(async (tx) => {
    await tx.conta.update({ where: { id: contaId }, data: { status: 'SUSPENSA' } });
    const memberships = await tx.membership.findMany({ where: { contaId }, select: { userId: true } });
    for (const m of memberships) {
      await auth.api.revokeUserSessions({ body: { userId: m.userId }, headers: reqHeaders });
    }
  });

  revalidatePath('/admin/contas');
  revalidatePath(`/admin/contas/${contaId}`);
}

export async function reativarConta(contaId: string) {
  await requireSuperAdmin();
  await db.conta.update({ where: { id: contaId }, data: { status: 'ATIVA' } });
  revalidatePath('/admin/contas');
  revalidatePath(`/admin/contas/${contaId}`);
}

interface CriarUsuarioInput {
  contaId: string;
  nome: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
}

export async function criarUsuarioNaConta(input: CriarUsuarioInput): Promise<CreateContaResult> {
  await requireSuperAdmin();
  const parsed = usuarioSchema.parse(input);

  const existente = await db.user.findUnique({ where: { email: parsed.email } });
  if (existente) throw new Error('Já existe um usuário com este e-mail.');

  const senhaProvisoria = gerarSenhaProvisoria();
  const reqHeaders = await headers();

  const created = await auth.api.createUser({
    body: {
      email: parsed.email,
      password: senhaProvisoria,
      name: parsed.nome,
      data: { mustChangePassword: true }
    },
    headers: reqHeaders
  });

  await db.membership.create({
    data: { userId: created.user.id, contaId: input.contaId, role: parsed.role }
  });

  revalidatePath(`/admin/contas/${input.contaId}`);

  return { contaId: input.contaId, ownerUserId: created.user.id, senhaProvisoria };
}

export async function resetarSenha(userId: string, contaId: string): Promise<string> {
  await requireSuperAdmin();
  const reqHeaders = await headers();

  const senhaProvisoria = gerarSenhaProvisoria();
  await auth.api.setUserPassword({ body: { userId, newPassword: senhaProvisoria }, headers: reqHeaders });
  await db.user.update({ where: { id: userId }, data: { mustChangePassword: true } });
  await auth.api.revokeUserSessions({ body: { userId }, headers: reqHeaders });

  revalidatePath(`/admin/contas/${contaId}`);
  return senhaProvisoria;
}

export async function desativarUsuario(membershipId: string, contaId: string) {
  await requireSuperAdmin();
  await db.membership.update({ where: { id: membershipId }, data: { ativo: false } });
  revalidatePath(`/admin/contas/${contaId}`);
}

export async function reativarUsuario(membershipId: string, contaId: string) {
  await requireSuperAdmin();
  await db.membership.update({ where: { id: membershipId }, data: { ativo: true } });
  revalidatePath(`/admin/contas/${contaId}`);
}
