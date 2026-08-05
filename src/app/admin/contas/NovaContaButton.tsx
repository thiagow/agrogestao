'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button, Drawer, Input } from '@/components/ui';
import { SenhaProvisoriaModal } from '@/components/SenhaProvisoriaModal';
import { createContaComOwner } from '@/server/contas';

export const NovaContaButton: React.FC = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ email: string; senha: string } | null>(null);

  const [nome, setNome] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [ownerNome, setOwnerNome] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');

  const resetForm = () => {
    setNome('');
    setRazaoSocial('');
    setCnpj('');
    setOwnerNome('');
    setOwnerEmail('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createContaComOwner({
        conta: { nome, razaoSocial, cnpj },
        owner: { nome: ownerNome, email: ownerEmail }
      });
      setIsOpen(false);
      resetForm();
      setResultado({ email: ownerEmail, senha: result.senhaProvisoria });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="primary"
        onClick={() => setIsOpen(true)}
        className="w-auto flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm"
      >
        <Plus className="w-4 h-4 stroke-[2.5]" />
        <span>Nova Conta</span>
      </Button>

      <Drawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Cadastrar Conta"
        subtitle="Cria a conta do cliente e o usuário administrador (OWNER)"
      >
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {error && (
            <div className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
              {error}
            </div>
          )}

          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Dados da conta</p>
          <Input
            label="Nome da Conta"
            required
            placeholder="Ex: Grupo Pereira"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
          <Input
            label="Razão Social"
            placeholder="Ex: Pereira Agropecuária Ltda"
            value={razaoSocial}
            onChange={(e) => setRazaoSocial(e.target.value)}
          />
          <Input
            label="CNPJ"
            placeholder="00.000.000/0000-00"
            value={cnpj}
            onChange={(e) => setCnpj(e.target.value)}
          />

          <div className="pt-3 border-t border-slate-200 space-y-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Usuário administrador (OWNER)</p>
            <Input
              label="Nome"
              required
              placeholder="Nome do responsável"
              value={ownerNome}
              onChange={(e) => setOwnerNome(e.target.value)}
            />
            <Input
              label="E-mail"
              type="email"
              required
              placeholder="responsavel@cliente.com.br"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
            />
          </div>

          <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-3">
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)} className="w-full">
              Cancelar
            </Button>
            <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Criando…' : 'Criar Conta'}
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
    </>
  );
};
