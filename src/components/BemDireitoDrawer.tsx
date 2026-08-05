'use client';

import React, { useState, useEffect } from 'react';
import { BemDireito, GrupoIrpfBem, LiquidezBem, Socio } from '../types';
import { Drawer, Input, Select, Textarea, Button } from './ui';
import { formatCurrency } from '../lib/format';

interface BemDireitoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<BemDireito>) => void;
  editingBem?: BemDireito | null;
  socios?: Socio[];
}

const GRUPOS_IRPF: GrupoIrpfBem[] = [
  'Bens Imóveis',
  'Bens Móveis',
  'Participações Societárias',
  'Aplicações e Investimentos',
  'Depósitos à Vista e Poupança',
  'Créditos e Outros Direitos',
  'Criptoativos',
  'Outros Bens e Direitos'
];

export const BemDireitoDrawer: React.FC<BemDireitoDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  editingBem,
  socios = []
}) => {
  const [socioId, setSocioId] = useState('');
  const [grupoIrpf, setGrupoIrpf] = useState<GrupoIrpfBem>('Bens Imóveis');
  const [codigoTipo, setCodigoTipo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valorDeclaradoIrpf, setValorDeclaradoIrpf] = useState('');
  const [valorMercadoEstimado, setValorMercadoEstimado] = useState('');
  const [dataAquisicao, setDataAquisicao] = useState('');
  const [valorAquisicao, setValorAquisicao] = useState('');
  const [liquidez, setLiquidez] = useState<LiquidezBem>('Baixa');
  const [ltv, setLtv] = useState('65');
  const [elegivelGarantia, setElegivelGarantia] = useState(false);
  const [geraFluxoCaixa, setGeraFluxoCaixa] = useState(false);
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (editingBem) {
      setSocioId(editingBem.socioId ?? '');
      setGrupoIrpf(editingBem.grupoIrpf);
      setCodigoTipo(editingBem.codigoTipo);
      setDescricao(editingBem.descricao);
      setValorDeclaradoIrpf(editingBem.valorDeclaradoIrpf?.toString() ?? '');
      setValorMercadoEstimado(editingBem.valorMercadoEstimado?.toString() ?? '');
      setDataAquisicao(editingBem.dataAquisicao ?? '');
      setValorAquisicao(editingBem.valorAquisicao?.toString() ?? '');
      setLiquidez(editingBem.liquidez);
      setLtv(editingBem.ltv?.toString() ?? '');
      setElegivelGarantia(editingBem.elegivelGarantia);
      setGeraFluxoCaixa(editingBem.geraFluxoCaixa);
      setObservacoes(editingBem.observacoes ?? '');
    } else {
      setSocioId('');
      setGrupoIrpf('Bens Imóveis');
      setCodigoTipo('');
      setDescricao('');
      setValorDeclaradoIrpf('');
      setValorMercadoEstimado('');
      setDataAquisicao('');
      setValorAquisicao('');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim() || !codigoTipo.trim()) return;

    onSave({
      id: editingBem?.id,
      socioId: socioId || undefined,
      grupoIrpf,
      codigoTipo: codigoTipo.trim(),
      descricao: descricao.trim(),
      valorDeclaradoIrpf: valorDeclaradoIrpf ? parseFloat(valorDeclaradoIrpf) : undefined,
      valorMercadoEstimado: valorMercadoEstimado ? parseFloat(valorMercadoEstimado) : undefined,
      dataAquisicao: dataAquisicao || undefined,
      valorAquisicao: valorAquisicao ? parseFloat(valorAquisicao) : undefined,
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
          hint="Vincule ao sócio para calcular o PL ponderado pela participação societária."
        >
          <option value="">Grupo (sem sócio específico)</option>
          {socios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome}
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Grupo IRPF"
            required
            value={grupoIrpf}
            onChange={(e) => setGrupoIrpf(e.target.value as GrupoIrpfBem)}
          >
            {GRUPOS_IRPF.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
          <Input
            label="Código / Tipo"
            required
            placeholder="Ex: 18 — Imóvel Rural"
            hint="Código da Declaração de Bens e Direitos (IRPF)."
            value={codigoTipo}
            onChange={(e) => setCodigoTipo(e.target.value)}
          />
        </div>

        <Textarea
          label="Descrição"
          rows={2}
          required
          placeholder="Ex: Fazenda Santa Maria, Mun. Sorriso/MT, 1.200 ha"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Valor Declarado IRPF (R$)"
            type="number"
            min={0}
            step="0.01"
            value={valorDeclaradoIrpf}
            onChange={(e) => setValorDeclaradoIrpf(e.target.value)}
          />
          <Input
            label="Valor de Mercado Estimado (R$)"
            type="number"
            min={0}
            step="0.01"
            value={valorMercadoEstimado}
            onChange={(e) => setValorMercadoEstimado(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Data de Aquisição"
            type="date"
            value={dataAquisicao}
            onChange={(e) => setDataAquisicao(e.target.value)}
          />
          <Input
            label="Valor de Aquisição (R$)"
            type="number"
            min={0}
            step="0.01"
            value={valorAquisicao}
            onChange={(e) => setValorAquisicao(e.target.value)}
          />
        </div>

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
          placeholder="Matrícula, localização, observações relevantes..."
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
