'use client';

import React, { useState, useEffect } from 'react';
import { Capex, CapexCategoria } from '../types';
import { Drawer, Input, Select, Textarea, Button } from './ui';

interface CapexDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Capex>) => void;
  editingCapex?: Capex | null;
}

export const CapexDrawer: React.FC<CapexDrawerProps> = ({ isOpen, onClose, onSave, editingCapex }) => {
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState<CapexCategoria>('Maquinário');
  const [valor, setValor] = useState('');
  const [dataInvestimento, setDataInvestimento] = useState('');
  const [safra, setSafra] = useState('');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (editingCapex) {
      setDescricao(editingCapex.descricao);
      setCategoria(editingCapex.categoria);
      setValor(editingCapex.valor.toString());
      setDataInvestimento(editingCapex.dataInvestimento);
      setSafra(editingCapex.safra ?? '');
      setObservacoes(editingCapex.observacoes ?? '');
    } else {
      setDescricao('');
      setCategoria('Maquinário');
      setValor('');
      setDataInvestimento('');
      setSafra('');
      setObservacoes('');
    }
  }, [editingCapex, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim() || !dataInvestimento) return;

    onSave({
      id: editingCapex?.id,
      descricao: descricao.trim(),
      categoria,
      valor: parseFloat(valor) || 0,
      dataInvestimento,
      safra: safra.trim() || undefined,
      observacoes: observacoes.trim() || undefined
    });

    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={editingCapex ? 'Editar Investimento' : 'Adicionar Investimento'}
      subtitle="CAPEX — investimentos capitalizados do grupo"
    >
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        <Input
          label="Descrição"
          type="text"
          required
          placeholder="Ex: Construção de armazém"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />

        <Select
          label="Categoria"
          required
          value={categoria}
          onChange={(e) => setCategoria(e.target.value as CapexCategoria)}
        >
          <option value="Maquinário">Maquinário</option>
          <option value="Benfeitoria">Benfeitoria</option>
          <option value="Tecnologia">Tecnologia</option>
          <option value="Infraestrutura">Infraestrutura</option>
          <option value="Outros">Outros</option>
        </Select>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Valor (R$)"
            type="number"
            required
            min={0}
            step="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />
          <Input
            label="Data do Investimento"
            type="date"
            required
            value={dataInvestimento}
            onChange={(e) => setDataInvestimento(e.target.value)}
          />
        </div>

        <Input
          label="Safra"
          type="text"
          placeholder="2026/2027"
          value={safra}
          onChange={(e) => setSafra(e.target.value)}
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
            {editingCapex ? 'Salvar' : 'Adicionar'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
};
