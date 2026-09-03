'use client';

import React, { useEffect, useState } from 'react';
import { PecuariaBovinaAno } from '../types';
import { calcularPecuariaBovina, custoTotalPorCabecaBovino, estoqueTotalBovino } from '../lib/pecuaria-calc';
import { formatCurrency } from '../data/initialData';
import { Drawer, Input, Button } from './ui';

interface PecuariaBovinaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<PecuariaBovinaAno>) => void;
  editingRegistro?: PecuariaBovinaAno | null;
  anosDisponiveis: number[];
  /** Pré-seleciona o ano ao abrir em modo "novo" (atalho de "Adicionar" numa coluna de ano vazia) — ignorado se `editingRegistro` estiver definido. */
  presetAnoCivil?: number;
}

const CAMPOS_NUMERICOS = [
  'femeas0a12',
  'femeas12a24',
  'femeas24a36',
  'femeasAcima36',
  'machos0a12',
  'machos12a24',
  'machos24a36',
  'machosAcima36',
  'areaPastagemPropria',
  'areaPastagemArrendada',
  'custoAquisicaoPorCabeca',
  'custoPastagemPorHectare',
  'diariaConfinamento',
  'diasConfinamento',
  'qtdAnimaisConfinados',
  'qtdMachosComercializados',
  'pesoMedioMachos',
  'precoMedioMachos',
  'qtdFemeasComercializadas',
  'pesoMedioFemeas',
  'precoMedioFemeas',
  'qtdOutrasComercializadas',
  'pesoMedioOutras',
  'precoMedioOutras',
  'capacidadeLotacaoConfinamento',
  'ganhoPesoMedioDiarioKg',
  'diasConfinamentoPorLote'
] as const;

type CampoNumerico = (typeof CAMPOS_NUMERICOS)[number];

const CAMPOS_VAZIOS: Record<CampoNumerico, string> = Object.fromEntries(CAMPOS_NUMERICOS.map((c) => [c, ''])) as Record<
  CampoNumerico,
  string
>;

export const PecuariaBovinaDrawer: React.FC<PecuariaBovinaDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  editingRegistro,
  anosDisponiveis,
  presetAnoCivil
}) => {
  const [anoCivil, setAnoCivil] = useState('');
  const [cicloProdutivo, setCicloProdutivo] = useState('Ciclo Completo');
  const [tipoTerminacao, setTipoTerminacao] = useState('A Pasto');
  const [campos, setCampos] = useState<Record<CampoNumerico, string>>(CAMPOS_VAZIOS);

  useEffect(() => {
    if (editingRegistro) {
      setAnoCivil(String(editingRegistro.anoCivil));
      setCicloProdutivo(editingRegistro.cicloProdutivo);
      setTipoTerminacao(editingRegistro.tipoTerminacao);
      setCampos(
        Object.fromEntries(CAMPOS_NUMERICOS.map((c) => [c, String(editingRegistro[c] ?? 0)])) as Record<CampoNumerico, string>
      );
    } else {
      setAnoCivil(String(presetAnoCivil ?? anosDisponiveis[anosDisponiveis.length - 1] ?? new Date().getFullYear()));
      setCicloProdutivo('Ciclo Completo');
      setTipoTerminacao('A Pasto');
      setCampos(CAMPOS_VAZIOS);
    }
  }, [editingRegistro, isOpen, anosDisponiveis, presetAnoCivil]);

  const setCampo = (campo: CampoNumerico, valor: string) => setCampos((prev) => ({ ...prev, [campo]: valor }));
  const num = (campo: CampoNumerico) => parseFloat(campos[campo]) || 0;

  const preview = calcularPecuariaBovina({
    femeas0a12: num('femeas0a12'),
    femeas12a24: num('femeas12a24'),
    femeas24a36: num('femeas24a36'),
    femeasAcima36: num('femeasAcima36'),
    machos0a12: num('machos0a12'),
    machos12a24: num('machos12a24'),
    machos24a36: num('machos24a36'),
    machosAcima36: num('machosAcima36'),
    custoAquisicaoPorCabeca: num('custoAquisicaoPorCabeca'),
    custoPastagemPorHectare: num('custoPastagemPorHectare'),
    diariaConfinamento: num('diariaConfinamento'),
    diasConfinamento: num('diasConfinamento'),
    qtdAnimaisConfinados: num('qtdAnimaisConfinados'),
    qtdMachosComercializados: num('qtdMachosComercializados'),
    pesoMedioMachos: num('pesoMedioMachos'),
    precoMedioMachos: num('precoMedioMachos'),
    qtdFemeasComercializadas: num('qtdFemeasComercializadas'),
    pesoMedioFemeas: num('pesoMedioFemeas'),
    precoMedioFemeas: num('precoMedioFemeas'),
    qtdOutrasComercializadas: num('qtdOutrasComercializadas'),
    pesoMedioOutras: num('pesoMedioOutras'),
    precoMedioOutras: num('precoMedioOutras')
  });
  const estoqueTotal = estoqueTotalBovino({
    femeas0a12: num('femeas0a12'),
    femeas12a24: num('femeas12a24'),
    femeas24a36: num('femeas24a36'),
    femeasAcima36: num('femeasAcima36'),
    machos0a12: num('machos0a12'),
    machos12a24: num('machos12a24'),
    machos24a36: num('machos24a36'),
    machosAcima36: num('machosAcima36')
  });
  const custoTotalPorCabeca = custoTotalPorCabecaBovino({
    custoAquisicaoPorCabeca: num('custoAquisicaoPorCabeca'),
    custoPastagemPorHectare: num('custoPastagemPorHectare'),
    diariaConfinamento: num('diariaConfinamento'),
    diasConfinamento: num('diasConfinamento'),
    qtdAnimaisConfinados: num('qtdAnimaisConfinados')
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!anoCivil) return;

    onSave({
      id: editingRegistro?.id,
      anoCivil: parseInt(anoCivil, 10),
      cicloProdutivo,
      tipoTerminacao,
      ...Object.fromEntries(CAMPOS_NUMERICOS.map((c) => [c, num(c)]))
    });
    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={editingRegistro ? 'Editar Pecuária (Bovino)' : 'Novo Ano — Pecuária (Bovino)'}
      subtitle="Estoque de rebanho, custos e comercialização por ano civil"
    >
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Ano" type="number" required value={anoCivil} onChange={(e) => setAnoCivil(e.target.value)} />
          <Input label="Ciclo Produtivo" type="text" value={cicloProdutivo} onChange={(e) => setCicloProdutivo(e.target.value)} />
        </div>
        <Input label="Tipo de Terminação" type="text" value={tipoTerminacao} onChange={(e) => setTipoTerminacao(e.target.value)} />

        <div>
          <p className="text-[11px] font-bold uppercase text-slate-500 mb-2">Estoque de Rebanho (cabeças)</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Fêmeas 0-12m" type="number" min={0} value={campos.femeas0a12} onChange={(e) => setCampo('femeas0a12', e.target.value)} />
            <Input label="Machos 0-12m" type="number" min={0} value={campos.machos0a12} onChange={(e) => setCampo('machos0a12', e.target.value)} />
            <Input label="Fêmeas 12-24m" type="number" min={0} value={campos.femeas12a24} onChange={(e) => setCampo('femeas12a24', e.target.value)} />
            <Input label="Machos 12-24m" type="number" min={0} value={campos.machos12a24} onChange={(e) => setCampo('machos12a24', e.target.value)} />
            <Input label="Fêmeas 24-36m" type="number" min={0} value={campos.femeas24a36} onChange={(e) => setCampo('femeas24a36', e.target.value)} />
            <Input label="Machos 24-36m" type="number" min={0} value={campos.machos24a36} onChange={(e) => setCampo('machos24a36', e.target.value)} />
            <Input label="Fêmeas +36m" type="number" min={0} value={campos.femeasAcima36} onChange={(e) => setCampo('femeasAcima36', e.target.value)} />
            <Input label="Machos +36m" type="number" min={0} value={campos.machosAcima36} onChange={(e) => setCampo('machosAcima36', e.target.value)} />
          </div>
          <div className="flex justify-between text-xs mt-2 text-slate-600">
            <span>Estoque Total</span>
            <span className="font-semibold text-slate-800">{estoqueTotal.toLocaleString('pt-BR')} cabeças</span>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase text-slate-500 mb-2">Área de Pastagem (ha)</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Própria" type="number" min={0} value={campos.areaPastagemPropria} onChange={(e) => setCampo('areaPastagemPropria', e.target.value)} />
            <Input label="Arrendada" type="number" min={0} value={campos.areaPastagemArrendada} onChange={(e) => setCampo('areaPastagemArrendada', e.target.value)} />
          </div>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase text-slate-500 mb-2">Custos de Produção</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Aquisição (R$/cabeça)" type="number" min={0} value={campos.custoAquisicaoPorCabeca} onChange={(e) => setCampo('custoAquisicaoPorCabeca', e.target.value)} />
            <Input label="Pastagem (R$/ha)" type="number" min={0} value={campos.custoPastagemPorHectare} onChange={(e) => setCampo('custoPastagemPorHectare', e.target.value)} />
            <Input label="Diária Confinamento (R$/dia)" type="number" min={0} value={campos.diariaConfinamento} onChange={(e) => setCampo('diariaConfinamento', e.target.value)} />
            <Input label="Dias de Confinamento" type="number" min={0} value={campos.diasConfinamento} onChange={(e) => setCampo('diasConfinamento', e.target.value)} />
            <Input label="Qtd. Animais Confinados" type="number" min={0} value={campos.qtdAnimaisConfinados} onChange={(e) => setCampo('qtdAnimaisConfinados', e.target.value)} />
          </div>
          <div className="flex justify-between text-xs mt-2 text-slate-600">
            <span>Custo Total (R$/cabeça)</span>
            <span className="font-semibold text-slate-800">{formatCurrency(custoTotalPorCabeca)}</span>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase text-slate-500 mb-2">Animais Comercializados — Machos</p>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Quantidade" type="number" min={0} value={campos.qtdMachosComercializados} onChange={(e) => setCampo('qtdMachosComercializados', e.target.value)} />
            <Input label="Peso Médio (@)" type="number" min={0} step="0.01" value={campos.pesoMedioMachos} onChange={(e) => setCampo('pesoMedioMachos', e.target.value)} />
            <Input label="Preço Médio (R$/@)" type="number" min={0} step="0.01" value={campos.precoMedioMachos} onChange={(e) => setCampo('precoMedioMachos', e.target.value)} />
          </div>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase text-slate-500 mb-2">Animais Comercializados — Fêmeas</p>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Quantidade" type="number" min={0} value={campos.qtdFemeasComercializadas} onChange={(e) => setCampo('qtdFemeasComercializadas', e.target.value)} />
            <Input label="Peso Médio (@)" type="number" min={0} step="0.01" value={campos.pesoMedioFemeas} onChange={(e) => setCampo('pesoMedioFemeas', e.target.value)} />
            <Input label="Preço Médio (R$/@)" type="number" min={0} step="0.01" value={campos.precoMedioFemeas} onChange={(e) => setCampo('precoMedioFemeas', e.target.value)} />
          </div>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase text-slate-500 mb-2">Animais Comercializados — Outras Categorias</p>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Quantidade" type="number" min={0} value={campos.qtdOutrasComercializadas} onChange={(e) => setCampo('qtdOutrasComercializadas', e.target.value)} />
            <Input label="Peso Médio (@)" type="number" min={0} step="0.01" value={campos.pesoMedioOutras} onChange={(e) => setCampo('pesoMedioOutras', e.target.value)} />
            <Input label="Preço Médio (R$/@)" type="number" min={0} step="0.01" value={campos.precoMedioOutras} onChange={(e) => setCampo('precoMedioOutras', e.target.value)} />
          </div>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase text-slate-500 mb-2">Dados Confinamento (informativo)</p>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Capacidade (cab)" type="number" min={0} value={campos.capacidadeLotacaoConfinamento} onChange={(e) => setCampo('capacidadeLotacaoConfinamento', e.target.value)} />
            <Input label="GMD (kg/dia)" type="number" min={0} step="0.001" value={campos.ganhoPesoMedioDiarioKg} onChange={(e) => setCampo('ganhoPesoMedioDiarioKg', e.target.value)} />
            <Input label="Dias/Lote" type="number" min={0} value={campos.diasConfinamentoPorLote} onChange={(e) => setCampo('diasConfinamentoPorLote', e.target.value)} />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 space-y-1.5 text-xs">
          <p className="text-[11px] font-bold uppercase text-slate-500">Calculado automaticamente</p>
          <div className="flex justify-between text-slate-600">
            <span>Receita Bruta</span>
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
