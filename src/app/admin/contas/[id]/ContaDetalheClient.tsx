'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, KeyRound, UserX, UserCheck, Ban, PlayCircle, MapPin } from 'lucide-react';
import { Card, Badge, Button, Drawer, Input, Select } from '@/components/ui';
import { SenhaProvisoriaModal } from '@/components/SenhaProvisoriaModal';
import {
  criarUsuarioNaConta,
  resetarSenha,
  desativarUsuario,
  reativarUsuario,
  suspenderConta,
  reativarConta
} from '@/server/contas';

interface MembershipRow {
  id: string;
  role: string;
  ativo: boolean;
  user: { id: string; name: string; email: string; mustChangePassword: boolean };
}

interface PropriedadeRow {
  id: string;
  nome: string;
  cidade: string | null;
  estado: string | null;
}

interface ContaDetalheProps {
  conta: {
    id: string;
    nome: string;
    razaoSocial: string | null;
    cnpj: string | null;
    status: string;
    createdAt: Date;
    propriedades: PropriedadeRow[];
    memberships: MembershipRow[];
  };
}

const ROLE_LABEL: Record<string, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MEMBER: 'Membro',
  VIEWER: 'Visualizador'
};

export const ContaDetalheClient: React.FC<ContaDetalheProps> = ({ conta }) => {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ email: string; senha: string } | null>(null);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'MEMBER' | 'VIEWER'>('MEMBER');

  const handleToggleConta = async () => {
    setIsBusy(true);
    try {
      if (conta.status === 'ATIVA') await suspenderConta(conta.id);
      else await reativarConta(conta.id);
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  };

  const handleCriarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsBusy(true);
    try {
      const result = await criarUsuarioNaConta({ contaId: conta.id, nome, email, role });
      setIsDrawerOpen(false);
      setNome('');
      setEmail('');
      setRole('MEMBER');
      setResultado({ email, senha: result.senhaProvisoria });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar usuário.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleResetarSenha = async (userId: string, userEmail: string) => {
    if (!window.confirm(`Gerar nova senha provisória para ${userEmail}? A sessão atual dele será encerrada.`)) return;
    setIsBusy(true);
    try {
      const senha = await resetarSenha(userId, conta.id);
      setResultado({ email: userEmail, senha });
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  };

  const handleToggleUsuario = async (membership: MembershipRow) => {
    setIsBusy(true);
    try {
      if (membership.ativo) await desativarUsuario(membership.id, conta.id);
      else await reativarUsuario(membership.id, conta.id);
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link href="/admin/contas" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-white">
        <ArrowLeft className="w-3.5 h-3.5" /> Voltar para Contas
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight font-sans">{conta.nome}</h1>
            <Badge tone={conta.status === 'ATIVA' ? 'emerald' : 'rose'}>{conta.status}</Badge>
          </div>
          {conta.razaoSocial && <p className="text-xs md:text-sm text-slate-500 mt-1">{conta.razaoSocial}</p>}
          {conta.cnpj && <p className="text-xs text-slate-600 font-mono mt-0.5">{conta.cnpj}</p>}
        </div>

        <Button
          variant={conta.status === 'ATIVA' ? 'ghost' : 'primary'}
          onClick={handleToggleConta}
          disabled={isBusy}
          className="w-auto flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm"
        >
          {conta.status === 'ATIVA' ? <Ban className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
          {conta.status === 'ATIVA' ? 'Suspender Conta' : 'Reativar Conta'}
        </Button>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-900">Propriedades ({conta.propriedades.length})</h3>
        </div>
        {conta.propriedades.length === 0 ? (
          <p className="text-xs text-slate-400">Nenhuma propriedade cadastrada ainda — o OWNER cria a primeira no primeiro acesso.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {conta.propriedades.map((p) => (
              <span key={p.id} className="text-xs font-medium text-slate-700 bg-slate-100 rounded-lg px-3 py-1.5">
                {p.nome}
                {p.cidade && <span className="text-slate-400"> · {p.cidade}{p.estado ? `/${p.estado}` : ''}</span>}
              </span>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900">Usuários ({conta.memberships.length})</h3>
          <Button
            variant="primary"
            onClick={() => setIsDrawerOpen(true)}
            className="w-auto flex items-center gap-1.5 px-3.5 py-2 text-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Novo Usuário
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-600 font-bold">
                <th className="py-3 px-4">Nome</th>
                <th className="py-3 px-4">E-mail</th>
                <th className="py-3 px-4">Papel</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {conta.memberships.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{m.user.name}</td>
                  <td className="py-3 px-4 text-slate-600">{m.user.email}</td>
                  <td className="py-3 px-4">
                    <Badge tone="blue">{ROLE_LABEL[m.role] ?? m.role}</Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge tone={m.ativo ? 'emerald' : 'slate'}>{m.ativo ? 'Ativo' : 'Inativo'}</Badge>
                    {m.user.mustChangePassword && m.ativo && (
                      <span className="ml-2 text-[10px] text-amber-600 font-semibold">Aguardando 1º acesso</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleResetarSenha(m.user.id, m.user.email)}
                        title="Resetar senha"
                        disabled={isBusy}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleUsuario(m)}
                        title={m.ativo ? 'Desativar usuário' : 'Reativar usuário'}
                        disabled={isBusy}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                      >
                        {m.ativo ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Novo Usuário"
        subtitle={`Adicionar um usuário à conta ${conta.nome}`}
      >
        <form onSubmit={handleCriarUsuario} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {error && (
            <div className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
              {error}
            </div>
          )}
          <Input label="Nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
          <Input label="E-mail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Select label="Papel" value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
            <option value="ADMIN">Admin — CRUD total dos dados</option>
            <option value="MEMBER">Membro — CRUD dos módulos</option>
            <option value="VIEWER">Visualizador — somente leitura</option>
          </Select>

          <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-3">
            <Button type="button" variant="secondary" onClick={() => setIsDrawerOpen(false)} className="w-full">
              Cancelar
            </Button>
            <Button type="submit" variant="primary" className="w-full" disabled={isBusy}>
              {isBusy ? 'Criando…' : 'Criar Usuário'}
            </Button>
          </div>
        </form>
      </Drawer>

      {resultado && (
        <SenhaProvisoriaModal
          isOpen={!!resultado}
          onClose={() => setResultado(null)}
          email={resultado.email}
          senha={resultado.senha}
        />
      )}
    </div>
  );
};
