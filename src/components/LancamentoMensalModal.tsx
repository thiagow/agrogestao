'use client';

import React, { useEffect, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import type { CategoriaLancamentoMensal, Cultura, ItemLancamentoManualMensal } from '../types';
import {
  CATEGORIA_LANCAMENTO_MENSAL_LABEL,
  CATEGORIAS_ENTRADA_LANCAMENTO_MENSAL,
  CATEGORIAS_SAIDA_LANCAMENTO_MENSAL,
  tipoDaCategoriaLancamentoMensal
} from '../lib/fluxo-mensal-calc';
import { mesLabel } from '../lib/agro';
import { Modal, Select, Input, Textarea, Button } from './ui';

interface LancamentoMensalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<ItemLancamentoManualMensal>) => void;
  culturas: Cultura[];
  /** Meses/anos do horizonte de 18 meses exibido — usados para preencher o combobox Mês/Ano. */
  horizonte: { mes: number; ano: number }[];
}

/**
 * Modal "Novo Lançamento Manual" — spec seção 5. Diferente das demais
 * entidades do app (Drawer lateral), aqui é `Modal` central, mesmo precedente
 * já aceito em Fluxo de Safra (FluxoManualItemModal.tsx) — a spec original
 * confirma esse padrão na tela real.
 */
export const LancamentoMensalModal: React.FC<LancamentoMensalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  culturas,
  horizonte
}) => {
  const [tipo, setTipo] = useState<'ENTRADA' | 'SAIDA'>('SAIDA');
  const [mesAno, setMesAno] = useState('');
  const [categoria, setCategoria] = useState<CategoriaLancamentoMensal | ''>('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [culturaId, setCulturaId] = useState('');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTipo('SAIDA');
      setMesAno(horizonte.length > 0 ? `${horizonte[0].ano}-${horizonte[0].mes}` : '');
      setCategoria('');
      setDescricao('');
      setValor('');
      setCulturaId('');
      setObservacoes('');
    }
  }, [isOpen, horizonte]);

  const categoriasDoTipo = tipo === 'ENTRADA' ? CATEGORIAS_ENTRADA_LANCAMENTO_MENSAL : CATEGORIAS_SAIDA_LANCAMENTO_MENSAL;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoria || !descricao.trim() || !valor || !mesAno) return;
    if (tipoDaCategoriaLancamentoMensal(categoria) !== tipo) return;

    const [anoStr, mesStr] = mesAno.split('-');

    onSave({
      mes: Number(mesStr),
      ano: Number(anoStr),
      categoria,
      descricao: descricao.trim(),
      valor: parseFloat(valor) || 0,
      culturaId: culturaId || undefined,
      observacoes: observacoes.trim() || undefined
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={<PlusCircle className="h-5 w-5" />}
      title="Novo Lançamento Manual"
      subtitle="Entrada ou saída extraordinária no calendário mensal"
      footer={
        <div className="flex w-full justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="lancamento-mensal-form" variant="primary">
            Adicionar
          </Button>
        </div>
      }
    >
      <form id="lancamento-mensal-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setTipo('ENTRADA');
              setCategoria('');
            }}
            className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
              tipo === 'ENTRADA'
                ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            ↑ Entrada
          </button>
          <button
            type="button"
            onClick={() => {
              setTipo('SAIDA');
              setCategoria('');
            }}
            className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
              tipo === 'SAIDA'
                ? 'border-rose-600 bg-rose-50 text-rose-800'
                : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            ↓ Saída
          </button>
        </div>

        <Select label="Mês *" required value={mesAno} onChange={(e) => setMesAno(e.target.value)}>
          <option value="">Selecione...</option>
          {horizonte.map(({ mes, ano }) => (
            <option key={`${ano}-${mes}`} value={`${ano}-${mes}`}>
              {mesLabel(mes)}/{ano}
            </option>
          ))}
        </Select>

        <Select
          label="Categoria *"
          required
          value={categoria}
          onChange={(e) => setCategoria(e.target.value as CategoriaLancamentoMensal)}
        >
          <option value="">Selecione...</option>
          {categoriasDoTipo.map((c) => (
            <option key={c} value={c}>
              {CATEGORIA_LANCAMENTO_MENSAL_LABEL[c]}
            </option>
          ))}
        </Select>

        <Input
          label="Descrição"
          type="text"
          placeholder="Ex: Venda de soja para Bunge"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />

        <Input
          label="Valor (R$) *"
          type="number"
          required
          min={0}
          step="0.01"
          prefix="R$"
          placeholder="0,00"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />

        <Select label="Cultura (opcional)" value={culturaId} onChange={(e) => setCulturaId(e.target.value)}>
          <option value="">Nenhuma</option>
          {culturas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </Select>

        <Textarea
          label="Observações"
          rows={3}
          placeholder="Informações adicionais..."
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
        />
      </form>
    </Modal>
  );
};
