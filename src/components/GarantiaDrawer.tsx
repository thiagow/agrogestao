'use client';

import React, { useState, useEffect } from 'react';
import { Garantia, GarantiaTipo, ContratoBancario } from '../types';
import { Drawer, Input, Select, Textarea, Button } from './ui';

interface GarantiaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Garantia>) => void;
  editingGarantia?: Garantia | null;
  contratosBancarios: ContratoBancario[];
}

export const GarantiaDrawer: React.FC<GarantiaDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  editingGarantia,
  contratosBancarios
}) => {
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState<GarantiaTipo>('Imóvel');
  const [valor, setValor] = useState('');
  const [contratoBancarioId, setContratoBancarioId] = useState('');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (editingGarantia) {
      setDescricao(editingGarantia.descricao);
      setTipo(editingGarantia.tipo);
      setValor(editingGarantia.valor.toString());
      setContratoBancarioId(editingGarantia.contratoBancarioId ?? '');
      setObservacoes(editingGarantia.observacoes ?? '');
    } else {
      setDescricao('');
      setTipo('Imóvel');
      setValor('');
      setContratoBancarioId('');
      setObservacoes('');
    }
  }, [editingGarantia, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) return;

    onSave({
      id: editingGarantia?.id,
      descricao: descricao.trim(),
      tipo,
      valor: parseFloat(valor) || 0,
      contratoBancarioId: contratoBancarioId || undefined,
      observacoes: observacoes.trim() || undefined
    });

    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={editingGarantia ? 'Editar Garantia' : 'Adicionar Garantia'}
      subtitle="Garantias oferecidas pelo grupo econômico"
    >
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        <Input
          label="Descrição"
          type="text"
          required
          placeholder="Ex: Fazenda Pedra — matrícula 1234"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />

        <Select label="Tipo" required value={tipo} onChange={(e) => setTipo(e.target.value as GarantiaTipo)}>
          <option value="Imóvel">Imóvel</option>
          <option value="Aval">Aval</option>
          <option value="Penhor">Penhor</option>
          <option value="Alienação Fiduciária">Alienação Fiduciária</option>
          <option value="Outros">Outros</option>
        </Select>

        <Input
          label="Valor (R$)"
          type="number"
          required
          min={0}
          step="0.01"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />

        <Select
          label="Contrato Bancário vinculado"
          value={contratoBancarioId}
          onChange={(e) => setContratoBancarioId(e.target.value)}
        >
          <option value="">—</option>
          {contratosBancarios.map((c) => (
            <option key={c.id} value={c.id}>
              {c.banco} — {c.tipoContrato}
            </option>
          ))}
        </Select>
        <p className="text-[11px] text-slate-500 -mt-2">Opcional — vincula esta garantia a um contrato de Bancos.</p>

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
            {editingGarantia ? 'Salvar' : 'Adicionar'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
};
