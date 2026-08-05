'use client';

import React, { useState, useEffect } from 'react';
import { EmpresaGrupo, TipoRelacaoEmpresa } from '../types';
import { Drawer, Input, Select, Textarea, Button } from './ui';

interface EmpresaGrupoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<EmpresaGrupo>) => void;
  editingEmpresa?: EmpresaGrupo | null;
}

export const EmpresaGrupoDrawer: React.FC<EmpresaGrupoDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  editingEmpresa
}) => {
  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [tipoRelacao, setTipoRelacao] = useState<TipoRelacaoEmpresa>('Controladora');
  const [participacaoPercentual, setParticipacaoPercentual] = useState('');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (editingEmpresa) {
      setNome(editingEmpresa.nome);
      setCnpj(editingEmpresa.cnpj ?? '');
      setTipoRelacao(editingEmpresa.tipoRelacao);
      setParticipacaoPercentual(editingEmpresa.participacaoPercentual?.toString() ?? '');
      setObservacoes(editingEmpresa.observacoes ?? '');
    } else {
      setNome('');
      setCnpj('');
      setTipoRelacao('Controladora');
      setParticipacaoPercentual('');
      setObservacoes('');
    }
  }, [editingEmpresa, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    onSave({
      id: editingEmpresa?.id,
      nome: nome.trim(),
      cnpj: cnpj.trim() || undefined,
      tipoRelacao,
      participacaoPercentual: participacaoPercentual ? parseFloat(participacaoPercentual) : undefined,
      observacoes: observacoes.trim() || undefined
    });

    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={editingEmpresa ? 'Editar Empresa' : 'Adicionar Empresa'}
      subtitle="Empresas relacionadas ao grupo econômico"
    >
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        <Input
          label="Nome"
          type="text"
          required
          placeholder="Razão social"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />

        <Input
          label="CNPJ"
          type="text"
          placeholder="00.000.000/0000-00"
          value={cnpj}
          onChange={(e) => setCnpj(e.target.value)}
        />

        <Select
          label="Tipo de Relação"
          required
          value={tipoRelacao}
          onChange={(e) => setTipoRelacao(e.target.value as TipoRelacaoEmpresa)}
        >
          <option value="Controladora">Controladora</option>
          <option value="Controlada">Controlada</option>
          <option value="Coligada">Coligada</option>
          <option value="Outras">Outras</option>
        </Select>

        <Input
          label="Participação (%)"
          type="number"
          min={0}
          max={100}
          step="0.1"
          value={participacaoPercentual}
          onChange={(e) => setParticipacaoPercentual(e.target.value)}
        />

        <Textarea
          label="Observações"
          rows={3}
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
        />

        <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full">
            Cancelar
          </Button>
          <Button type="submit" variant="primary" className="w-full">
            {editingEmpresa ? 'Salvar' : 'Adicionar'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
};
