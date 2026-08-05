'use client';

import React, { useState, useEffect } from 'react';
import { BemDireito, BemTipo } from '../types';
import { Drawer, Input, Select, Textarea, Button } from './ui';

interface BemDireitoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<BemDireito>) => void;
  editingBem?: BemDireito | null;
}

export const BemDireitoDrawer: React.FC<BemDireitoDrawerProps> = ({ isOpen, onClose, onSave, editingBem }) => {
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState<BemTipo>('Imóvel');
  const [valorContabil, setValorContabil] = useState('');
  const [dataAquisicao, setDataAquisicao] = useState('');
  const [depreciacaoAcumulada, setDepreciacaoAcumulada] = useState('');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (editingBem) {
      setDescricao(editingBem.descricao);
      setTipo(editingBem.tipo);
      setValorContabil(editingBem.valorContabil.toString());
      setDataAquisicao(editingBem.dataAquisicao);
      setDepreciacaoAcumulada(editingBem.depreciacaoAcumulada.toString());
      setObservacoes(editingBem.observacoes ?? '');
    } else {
      setDescricao('');
      setTipo('Imóvel');
      setValorContabil('');
      setDataAquisicao('');
      setDepreciacaoAcumulada('0');
      setObservacoes('');
    }
  }, [editingBem, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim() || !dataAquisicao) return;

    onSave({
      id: editingBem?.id,
      descricao: descricao.trim(),
      tipo,
      valorContabil: parseFloat(valorContabil) || 0,
      dataAquisicao,
      depreciacaoAcumulada: parseFloat(depreciacaoAcumulada) || 0,
      observacoes: observacoes.trim() || undefined
    });

    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={editingBem ? 'Editar Bem' : 'Adicionar Bem'}
      subtitle="Patrimônio do grupo econômico"
    >
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        <Input
          label="Descrição"
          type="text"
          required
          placeholder="Ex: Trator John Deere 6110J"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />

        <Select label="Tipo" required value={tipo} onChange={(e) => setTipo(e.target.value as BemTipo)}>
          <option value="Imóvel">Imóvel</option>
          <option value="Veículo">Veículo</option>
          <option value="Equipamento">Equipamento</option>
          <option value="Outros">Outros</option>
        </Select>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Valor Contábil (R$)"
            type="number"
            required
            min={0}
            step="0.01"
            value={valorContabil}
            onChange={(e) => setValorContabil(e.target.value)}
          />
          <Input
            label="Data de Aquisição"
            type="date"
            required
            value={dataAquisicao}
            onChange={(e) => setDataAquisicao(e.target.value)}
          />
        </div>

        <Input
          label="Depreciação Acumulada (R$)"
          type="number"
          min={0}
          step="0.01"
          hint="Valor líquido é calculado automaticamente (contábil - depreciação)."
          value={depreciacaoAcumulada}
          onChange={(e) => setDepreciacaoAcumulada(e.target.value)}
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
            {editingBem ? 'Salvar' : 'Adicionar'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
};
