'use client';

import React, { useState, useEffect } from 'react';
import { BemDireito, GrupoIrpfBem, LiquidezBem, Socio } from '../types';
import { Drawer, Input, Select, Textarea, Button } from './ui';
import { formatCurrency } from '../lib/format';
import { TIPOS_BEM_DIREITO, isAnexoImovel } from '../lib/bens-direitos-constantes';

interface BemDireitoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<BemDireito>) => void;
  editingBem?: BemDireito | null;
  socios?: Socio[];
  /** Escolher Imóvel Rural/Urbano no select de um bem NOVO fecha este formulário e abre o
   * modal próprio (ANEXO A/B) — o botão "Adicionar" é o único ponto de entrada. */
  onEscolherImovel?: (grupo: GrupoIrpfBem) => void;
}

export const BemDireitoDrawer: React.FC<BemDireitoDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  editingBem,
  socios = [],
  onEscolherImovel
}) => {
  const [socioId, setSocioId] = useState('');
  const [grupoIrpf, setGrupoIrpf] = useState<GrupoIrpfBem>('Máquinas Agrícolas');
  const [descricao, setDescricao] = useState('');
  const [valorMercadoEstimado, setValorMercadoEstimado] = useState('');
  const [liquidez, setLiquidez] = useState<LiquidezBem>('Baixa');
  const [ltv, setLtv] = useState('65');
  const [elegivelGarantia, setElegivelGarantia] = useState(false);
  const [geraFluxoCaixa, setGeraFluxoCaixa] = useState(false);
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (editingBem) {
      setSocioId(editingBem.socioId ?? '');
      setGrupoIrpf(editingBem.grupoIrpf);
      setDescricao(editingBem.descricao);
      setValorMercadoEstimado(editingBem.valorMercadoEstimado?.toString() ?? '');
      setLiquidez(editingBem.liquidez);
      setLtv(editingBem.ltv?.toString() ?? '');
      setElegivelGarantia(editingBem.elegivelGarantia);
      setGeraFluxoCaixa(editingBem.geraFluxoCaixa);
      setObservacoes(editingBem.observacoes ?? '');
    } else {
      setSocioId('');
      setGrupoIrpf('Máquinas Agrícolas');
      setDescricao('');
      setValorMercadoEstimado('');
      setLiquidez('Baixa');
      setLtv('65');
      setElegivelGarantia(false);
      setGeraFluxoCaixa(false);
      setObservacoes('');
    }
  }, [editingBem, isOpen]);

  const valorGarantiaEstimado =
    elegivelGarantia && valorMercadoEstimado && ltv
      ? (parseFloat(valorMercadoEstimado) || 0) * ((parseFloat(ltv) || 0) / 100)
      : undefined;

  const handleTipoChange = (novo: GrupoIrpfBem) => {
    if (!editingBem && isAnexoImovel(novo) && onEscolherImovel) {
      onClose();
      onEscolherImovel(novo);
      return;
    }
    setGrupoIrpf(novo);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) return;

    onSave({
      id: editingBem?.id,
      socioId: socioId || undefined,
      grupoIrpf,
      descricao: descricao.trim(),
      valorMercadoEstimado: valorMercadoEstimado ? parseFloat(valorMercadoEstimado) : undefined,
      liquidez,
      ltv: ltv ? parseFloat(ltv) : undefined,
      elegivelGarantia,
      geraFluxoCaixa,
      observacoes: observacoes.trim() || undefined
    });

    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={editingBem ? 'Editar Bem / Direito' : 'Novo Bem / Direito'}
      subtitle="Patrimônio do grupo econômico"
    >
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        <Select
          label="Sócio Titular (opcional)"
          value={socioId}
          onChange={(e) => setSocioId(e.target.value)}
          hint="Vincule o bem a um integrante, ou deixe no Grupo."
        >
          <option value="">Grupo (sem sócio específico)</option>
          {socios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome}
            </option>
          ))}
        </Select>

        <Select
          label="Bem / Direito"
          required
          value={grupoIrpf}
          onChange={(e) => handleTipoChange(e.target.value as GrupoIrpfBem)}
        >
          {TIPOS_BEM_DIREITO.filter((g) => !editingBem || !isAnexoImovel(g)).map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </Select>

        <Textarea
          label="Descrição"
          rows={2}
          required
          placeholder="Ex: Fazenda Santa Maria, Mun. Sorriso/MT, 1.200 ha"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />

        <Input
          label="Valor de Mercado Estimado (R$)"
          type="number"
          min={0}
          step="0.01"
          value={valorMercadoEstimado}
          onChange={(e) => setValorMercadoEstimado(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select label="Liquidez" value={liquidez} onChange={(e) => setLiquidez(e.target.value as LiquidezBem)}>
            <option value="Alta">Alta</option>
            <option value="Média">Média</option>
            <option value="Baixa">Baixa</option>
          </Select>
          <Input
            label="LTV (%)"
            type="number"
            min={0}
            max={100}
            step="1"
            value={ltv}
            onChange={(e) => setLtv(e.target.value)}
          />
        </div>

        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={elegivelGarantia}
            onChange={(e) => setElegivelGarantia(e.target.checked)}
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
          />
          Elegível como Garantia
        </label>

        {elegivelGarantia && (
          <Input
            label="Valor de Garantia Estimado (R$)"
            type="text"
            disabled
            hint="Calculado automaticamente (Valor de Mercado Estimado × LTV)."
            value={valorGarantiaEstimado != null ? formatCurrency(valorGarantiaEstimado) : ''}
            placeholder="Calculado automaticamente"
            onChange={() => {}}
          />
        )}

        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={geraFluxoCaixa}
            onChange={(e) => setGeraFluxoCaixa(e.target.checked)}
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
          />
          Gera Fluxo de Caixa
        </label>

        <Textarea
          label="Observações"
          rows={3}
          placeholder="Matrícula, localização, datas (ex.: vencimento de contas a receber), observações relevantes..."
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
