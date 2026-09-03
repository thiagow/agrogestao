'use client';

import React, { useEffect, useState } from 'react';
import { ProducaoAnimalAno, TipoProducaoAnimal } from '../types';
import { calcularProducaoAnimal } from '../lib/pecuaria-calc';
import { formatCurrency } from '../data/initialData';
import { Drawer, Input, Button } from './ui';

interface ProducaoAnimalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<ProducaoAnimalAno>) => void;
  editingRegistro?: ProducaoAnimalAno | null;
  tipo: TipoProducaoAnimal;
  anosDisponiveis: number[];
  /** Pré-seleciona o ano ao abrir em modo "novo" (atalho de "Adicionar" numa coluna de ano vazia) — ignorado se `editingRegistro` estiver definido. */
  presetAnoCivil?: number;
}

export const ProducaoAnimalDrawer: React.FC<ProducaoAnimalDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  editingRegistro,
  tipo,
  anosDisponiveis,
  presetAnoCivil
}) => {
  const [anoCivil, setAnoCivil] = useState('');
  const [producaoCabecas, setProducaoCabecas] = useState('');
  const [precoMedioPorCabeca, setPrecoMedioPorCabeca] = useState('');
  const [custoMedioPorCabeca, setCustoMedioPorCabeca] = useState('');

  useEffect(() => {
    if (editingRegistro) {
      setAnoCivil(String(editingRegistro.anoCivil));
      setProducaoCabecas(String(editingRegistro.producaoCabecas));
      setPrecoMedioPorCabeca(String(editingRegistro.precoMedioPorCabeca));
      setCustoMedioPorCabeca(String(editingRegistro.custoMedioPorCabeca));
    } else {
      setAnoCivil(String(presetAnoCivil ?? anosDisponiveis[anosDisponiveis.length - 1] ?? new Date().getFullYear()));
      setProducaoCabecas('');
      setPrecoMedioPorCabeca('');
      setCustoMedioPorCabeca('');
    }
  }, [editingRegistro, isOpen, anosDisponiveis, presetAnoCivil]);

  const preview = calcularProducaoAnimal({
    producaoCabecas: parseFloat(producaoCabecas) || 0,
    precoMedioPorCabeca: parseFloat(precoMedioPorCabeca) || 0,
    custoMedioPorCabeca: parseFloat(custoMedioPorCabeca) || 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!anoCivil) return;

    onSave({
      id: editingRegistro?.id,
      tipo,
      anoCivil: parseInt(anoCivil, 10),
      producaoCabecas: parseFloat(producaoCabecas) || 0,
      precoMedioPorCabeca: parseFloat(precoMedioPorCabeca) || 0,
      custoMedioPorCabeca: parseFloat(custoMedioPorCabeca) || 0
    });
    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={editingRegistro ? `Editar ${tipo}` : `Novo Ano — ${tipo}`}
      subtitle="Produção, preço e custo médio por cabeça"
    >
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        <Input label="Ano" type="number" required value={anoCivil} onChange={(e) => setAnoCivil(e.target.value)} />
        <Input
          label="Produção (cabeças)"
          type="number"
          required
          min={0}
          value={producaoCabecas}
          onChange={(e) => setProducaoCabecas(e.target.value)}
        />
        <Input
          label="Preço Médio (R$/cabeça)"
          type="number"
          required
          min={0}
          step="0.01"
          value={precoMedioPorCabeca}
          onChange={(e) => setPrecoMedioPorCabeca(e.target.value)}
        />
        <Input
          label="Custo Médio de Produção (R$/cabeça)"
          type="number"
          required
          min={0}
          step="0.01"
          value={custoMedioPorCabeca}
          onChange={(e) => setCustoMedioPorCabeca(e.target.value)}
        />

        <div className="pt-3 border-t border-slate-200 space-y-1.5 text-xs">
          <p className="text-[11px] font-bold uppercase text-slate-500">Calculado automaticamente</p>
          <div className="flex justify-between text-slate-600">
            <span>Receita Total</span>
            <span className="font-semibold text-slate-800">{formatCurrency(preview.receitaBruta)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Custo Total de Produção</span>
            <span className="font-semibold text-slate-800">{formatCurrency(preview.despesa)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Resultado Bruto</span>
            <span className="font-semibold text-slate-800">{formatCurrency(preview.receitaLiquida)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Margem Bruta</span>
            <span className="font-semibold text-slate-800">{preview.margem.toFixed(1)}%</span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full">
            Cancelar
          </Button>
          <Button type="submit" variant="primary" className="w-full">
            {editingRegistro ? 'Salvar' : 'Cadastrar'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
};
