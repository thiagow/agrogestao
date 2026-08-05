'use client';

import React, { useState, useEffect } from 'react';
import { Garantia, Currency } from '../types';
import { Drawer, Input, Select, Textarea, Button } from './ui';

interface GarantiaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Garantia>) => void;
  editingGarantia?: Garantia | null;
}

// Listas provisórias — os prints do AgroFlow mostram os selects "Tipo de Ativo" e "Tipo de
// Garantia" fechados, sem a lista completa de opções. Usuário vai passar a lista real
// depois; até lá, ficam esses valores razoáveis (trocar aqui não precisa de migration,
// ver comentário em prisma/schema.prisma).
const TIPOS_ATIVO = ['Imóvel', 'Veículo', 'Maquinário', 'Aplicação Financeira', 'Outros'];
const TIPOS_GARANTIA = ['Hipoteca', 'Penhor', 'Alienação Fiduciária', 'Aval', 'Fiança', 'Outros'];

const BANCOS_SUGERIDOS = [
  'Sicoob',
  'Bradesco',
  'Banco do Brasil',
  'BRB',
  'Banco do Nordeste',
  'BTG Pactual',
  'Caixa Econômica Federal'
];

export const GarantiaDrawer: React.FC<GarantiaDrawerProps> = ({ isOpen, onClose, onSave, editingGarantia }) => {
  const [tipoAtivo, setTipoAtivo] = useState('');
  const [tipoGarantia, setTipoGarantia] = useState('');
  const [descricao, setDescricao] = useState('');
  const [bancoVinculado, setBancoVinculado] = useState('');
  const [numeroOperacao, setNumeroOperacao] = useState('');
  const [valor, setValor] = useState('');
  const [moeda, setMoeda] = useState<Currency>('BRL');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (editingGarantia) {
      setTipoAtivo(editingGarantia.tipoAtivo);
      setTipoGarantia(editingGarantia.tipoGarantia);
      setDescricao(editingGarantia.descricao);
      setBancoVinculado(editingGarantia.bancoVinculado ?? '');
      setNumeroOperacao(editingGarantia.numeroOperacao ?? '');
      setValor(editingGarantia.valor.toString());
      setMoeda(editingGarantia.moeda);
      setObservacoes(editingGarantia.observacoes ?? '');
    } else {
      setTipoAtivo('');
      setTipoGarantia('');
      setDescricao('');
      setBancoVinculado('');
      setNumeroOperacao('');
      setValor('');
      setMoeda('BRL');
      setObservacoes('');
    }
  }, [editingGarantia, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim() || !tipoAtivo || !tipoGarantia) return;

    onSave({
      id: editingGarantia?.id,
      tipoAtivo,
      tipoGarantia,
      descricao: descricao.trim(),
      bancoVinculado: bancoVinculado.trim() || undefined,
      numeroOperacao: numeroOperacao.trim() || undefined,
      valor: parseFloat(valor) || 0,
      moeda,
      observacoes: observacoes.trim() || undefined
    });

    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={editingGarantia ? 'Editar Garantia' : 'Nova Garantia'}
      subtitle="Garantias oferecidas pelo grupo econômico"
    >
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        <div className="grid grid-cols-2 gap-3">
          <Select label="Tipo de Ativo" required value={tipoAtivo} onChange={(e) => setTipoAtivo(e.target.value)}>
            <option value="">Selecione</option>
            {TIPOS_ATIVO.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Select
            label="Tipo de Garantia"
            required
            value={tipoGarantia}
            onChange={(e) => setTipoGarantia(e.target.value)}
          >
            <option value="">Selecione</option>
            {TIPOS_GARANTIA.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>

        <Input
          label="Descrição do Ativo"
          type="text"
          required
          placeholder="Ex: Fazenda Santa Maria, 500 ha, MT"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Banco Vinculado</label>
          <p className="text-[11px] text-slate-500 mb-1.5">
            Sugestões:{' '}
            {BANCOS_SUGERIDOS.map((banco) => (
              <button
                key={banco}
                type="button"
                onClick={() => setBancoVinculado(banco)}
                className="inline-block m-0.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700 transition text-[11px] font-medium"
              >
                {banco}
              </button>
            ))}
          </p>
          <Input
            type="text"
            placeholder="Ex: Banco do Brasil, Bradesco..."
            value={bancoVinculado}
            onChange={(e) => setBancoVinculado(e.target.value)}
          />
        </div>

        <Input
          label="Nº da Operação"
          type="text"
          value={numeroOperacao}
          onChange={(e) => setNumeroOperacao(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Valor da Garantia"
            type="number"
            required
            min={0}
            step="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />
          <Select label="Moeda" value={moeda} onChange={(e) => setMoeda(e.target.value as Currency)}>
            <option value="BRL">BRL</option>
            <option value="USD">USD</option>
          </Select>
        </div>

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
