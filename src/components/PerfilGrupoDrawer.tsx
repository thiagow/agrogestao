'use client';

import React, { useState, useEffect } from 'react';
import { PerfilGrupoEconomico } from '../types';
import { Drawer, Input, Button } from './ui';

interface PerfilGrupoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<PerfilGrupoEconomico>) => void;
  perfil: PerfilGrupoEconomico | null;
}

export const PerfilGrupoDrawer: React.FC<PerfilGrupoDrawerProps> = ({ isOpen, onClose, onSave, perfil }) => {
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [atividadePrincipal, setAtividadePrincipal] = useState('');
  const [fundacao, setFundacao] = useState('');
  const [sede, setSede] = useState('');
  const [consultorResponsavel, setConsultorResponsavel] = useState('');

  useEffect(() => {
    setEmail(perfil?.email ?? '');
    setTelefone(perfil?.telefone ?? '');
    setAtividadePrincipal(perfil?.atividadePrincipal ?? '');
    setFundacao(perfil?.fundacao ?? '');
    setSede(perfil?.sede ?? '');
    setConsultorResponsavel(perfil?.consultorResponsavel ?? '');
  }, [perfil, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSave({
      email: email.trim() || undefined,
      telefone: telefone.trim() || undefined,
      atividadePrincipal: atividadePrincipal.trim() || undefined,
      fundacao: fundacao || undefined,
      sede: sede.trim() || undefined,
      consultorResponsavel: consultorResponsavel.trim() || undefined
    });

    onClose();
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Editar Grupo Econômico" subtitle="Perfil do grupo econômico">
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        <p className="text-[11px] text-slate-500 -mt-1">
          Nome, Razão Social e CNPJ do grupo são cadastrados pelo Admin Master na criação da conta e não são
          editáveis aqui.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Telefone" type="text" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
        </div>

        <Input
          label="Atividade Principal"
          type="text"
          placeholder="Ex: Misto (Grãos + Pecuária)"
          value={atividadePrincipal}
          onChange={(e) => setAtividadePrincipal(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input label="Fundação" type="date" value={fundacao} onChange={(e) => setFundacao(e.target.value)} />
          <Input
            label="Sede"
            type="text"
            placeholder="Ex: GO"
            value={sede}
            onChange={(e) => setSede(e.target.value)}
          />
        </div>

        <Input
          label="Consultor Responsável"
          type="text"
          value={consultorResponsavel}
          onChange={(e) => setConsultorResponsavel(e.target.value)}
        />

        <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full">
            Cancelar
          </Button>
          <Button type="submit" variant="primary" className="w-full">
            Salvar
          </Button>
        </div>
      </form>
    </Drawer>
  );
};
