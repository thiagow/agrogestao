'use client';

import React, { useEffect, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import type { CategoriaItemFluxoManual, ItemFluxoManual } from '../types';
import { CATEGORIA_ITEM_FLUXO_LABEL } from '../lib/fluxo-safra-calc';
import { Modal, Select, Input, Textarea, Button } from './ui';

interface FluxoManualItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<ItemFluxoManual>) => void;
  safra: string;
}

const GRUPO_ENTRADAS: CategoriaItemFluxoManual[] = [
  'RECEITA_VENDA_FAZENDA',
  'ESTOQUE_GRAOS_ENTRADA',
  'ESTOQUE_ALGODAO_ENTRADA',
  'ESTOQUE_GADO_ENTRADA',
  'OUTRAS_ENTRADAS'
];
const GRUPO_SAIDAS: CategoriaItemFluxoManual[] = ['DIVIDENDOS_RETIRADAS', 'MANUTENCAO_MAQUINAS', 'CORRECAO_SOLO', 'OUTRAS_SAIDAS'];

/**
 * Modal "Adicionar Item ao Fluxo" — spec seção 7. Diferente das demais
 * entidades do app (que usam Drawer), aqui é `Modal` central por decisão
 * confirmada na spec original ("Botões: Adicionar (submit) e Close (X)").
 * Categoria/Descrição/Valor marcados como obrigatórios (`*`) — a spec não
 * confirma obrigatoriedade, mas o app já marca campos obrigatórios em todo
 * outro modal/drawer; ponto de atenção #6 do documento fica corrigido aqui.
 */
export const FluxoManualItemModal: React.FC<FluxoManualItemModalProps> = ({ isOpen, onClose, onSave, safra }) => {
  const [categoria, setCategoria] = useState<CategoriaItemFluxoManual | ''>('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCategoria('');
      setDescricao('');
      setValor('');
      setObservacoes('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoria || !descricao.trim() || !valor) return;

    onSave({
      safra,
      categoria,
      descricao: descricao.trim(),
      valor: parseFloat(valor) || 0,
      observacoes: observacoes.trim() || undefined
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={<PlusCircle className="h-5 w-5" />}
      title="Adicionar Item ao Fluxo"
      subtitle={`Item extraordinário para a safra ${safra}`}
      footer={
        <div className="flex w-full justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="fluxo-manual-item-form" variant="primary">
            Adicionar
          </Button>
        </div>
      }
    >
      <form id="fluxo-manual-item-form" onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Categoria *"
          required
          value={categoria}
          onChange={(e) => setCategoria(e.target.value as CategoriaItemFluxoManual)}
        >
          <option value="">Selecione...</option>
          <optgroup label="ENTRADAS">
            {GRUPO_ENTRADAS.map((c) => (
              <option key={c} value={c}>
                {CATEGORIA_ITEM_FLUXO_LABEL[c]}
              </option>
            ))}
          </optgroup>
          <optgroup label="SAÍDAS">
            {GRUPO_SAIDAS.map((c) => (
              <option key={c} value={c}>
                {CATEGORIA_ITEM_FLUXO_LABEL[c]}
              </option>
            ))}
          </optgroup>
        </Select>

        <Input
          label="Descrição *"
          type="text"
          required
          placeholder="Detalhe o item..."
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

        <Textarea
          label="Observações"
          rows={3}
          placeholder="Opcional..."
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
        />
      </form>
    </Modal>
  );
};
