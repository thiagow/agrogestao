'use client';

import React, { useState, useEffect } from 'react';
import { DividaPf } from '../types';
import { Drawer, Input, Select, Textarea, Button } from './ui';

interface DividaPfDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<DividaPf>) => void;
  editingDivida?: DividaPf | null;
}

// Lista provisória — o print do AgroFlow mostra o select "Tipo de Dívida" fechado com
// "Financiamento" como padrão; as demais opções foram inferidas do texto do estado
// vazio da própria tela ("Financiamentos, cartões, empréstimos pessoais e crédito
// rural PF"). Trocar aqui não precisa de migration (ver nota em schema.prisma).
const TIPOS_DIVIDA = ['Financiamento', 'Cartão', 'Empréstimo Pessoal', 'Crédito Rural PF', 'Outros'];

export const DividaPfDrawer: React.FC<DividaPfDrawerProps> = ({ isOpen, onClose, onSave, editingDivida }) => {
  const [tipoDivida, setTipoDivida] = useState('Financiamento');
  const [credor, setCredor] = useState('');
  const [saldoDevedor, setSaldoDevedor] = useState('');
  const [parcelaMensal, setParcelaMensal] = useState('');
  const [vencimentoFinal, setVencimentoFinal] = useState('');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (editingDivida) {
      setTipoDivida(editingDivida.tipoDivida);
      setCredor(editingDivida.credor ?? '');
      setSaldoDevedor(editingDivida.saldoDevedor.toString());
      setParcelaMensal(editingDivida.parcelaMensal?.toString() ?? '');
      setVencimentoFinal(editingDivida.vencimentoFinal ?? '');
      setObservacoes(editingDivida.observacoes ?? '');
    } else {
      setTipoDivida('Financiamento');
      setCredor('');
      setSaldoDevedor('');
      setParcelaMensal('');
      setVencimentoFinal('');
      setObservacoes('');
    }
  }, [editingDivida, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saldoDevedor) return;

    onSave({
      id: editingDivida?.id,
      tipoDivida,
      credor: credor.trim(),
      saldoDevedor: parseFloat(saldoDevedor) || 0,
      parcelaMensal: parcelaMensal ? parseFloat(parcelaMensal) : undefined,
      vencimentoFinal: vencimentoFinal || undefined,
      observacoes: observacoes.trim() || undefined
    });

    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={editingDivida ? 'Editar Dívida' : 'Nova Dívida'}
      subtitle="Dívidas pessoais dos sócios (não capturadas no Balanço PJ)"
    >
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        <Select label="Tipo de Dívida" value={tipoDivida} onChange={(e) => setTipoDivida(e.target.value)}>
          {TIPOS_DIVIDA.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>

        <Input
          label="Credor"
          type="text"
          placeholder="Nome do banco ou credor"
          value={credor}
          onChange={(e) => setCredor(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Saldo Devedor (R$)"
            type="number"
            required
            min={0}
            step="0.01"
            value={saldoDevedor}
            onChange={(e) => setSaldoDevedor(e.target.value)}
          />
          <Input
            label="Parcela Mensal (R$)"
            type="number"
            min={0}
            step="0.01"
            value={parcelaMensal}
            onChange={(e) => setParcelaMensal(e.target.value)}
          />
        </div>

        <Input
          label="Vencimento Final"
          type="date"
          value={vencimentoFinal}
          onChange={(e) => setVencimentoFinal(e.target.value)}
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
            Salvar
          </Button>
        </div>
      </form>
    </Drawer>
  );
};
