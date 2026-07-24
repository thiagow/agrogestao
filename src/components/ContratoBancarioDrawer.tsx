import React, { useState, useEffect } from 'react';
import {
  ContratoBancario,
  TipoContratoBancario,
  TipoTaxaBancaria,
  SistemaAmortizacao,
  PeriodicidadePagamento,
  FinalidadeContrato
} from '../types';
import { Drawer, Input, Select, Textarea, Button } from './ui';

interface ContratoBancarioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<ContratoBancario>) => void;
  editingContrato?: ContratoBancario | null;
}

export const ContratoBancarioDrawer: React.FC<ContratoBancarioDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  editingContrato
}) => {
  const [banco, setBanco] = useState('');
  const [tipoContrato, setTipoContrato] = useState<TipoContratoBancario>('CUSTEO');
  const [saldoInicial, setSaldoInicial] = useState('');
  const [taxaJuros, setTaxaJuros] = useState('');
  const [tipoTaxa, setTipoTaxa] = useState<TipoTaxaBancaria>('CDI');
  const [taxaAdicional, setTaxaAdicional] = useState('0');
  const [dataContratacao, setDataContratacao] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [sistemaAmortizacao, setSistemaAmortizacao] = useState<SistemaAmortizacao>('SAC');
  const [periodicidade, setPeriodicidade] = useState<PeriodicidadePagamento>('Mensal');
  const [finalidade, setFinalidade] = useState<FinalidadeContrato>('CUSTEIO');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (editingContrato) {
      setBanco(editingContrato.banco);
      setTipoContrato(editingContrato.tipoContrato);
      setSaldoInicial(editingContrato.saldoInicial.toString());
      setTaxaJuros(editingContrato.taxaJuros.toString());
      setTipoTaxa(editingContrato.tipoTaxa);
      setTaxaAdicional((editingContrato.taxaAdicional ?? 0).toString());
      setDataContratacao(editingContrato.dataContratacao);
      setDataVencimento(editingContrato.dataVencimento);
      setSistemaAmortizacao(editingContrato.sistemaAmortizacao);
      setPeriodicidade(editingContrato.periodicidade);
      setFinalidade(editingContrato.finalidade);
      setObservacoes(editingContrato.observacoes ?? '');
    } else {
      setBanco('');
      setTipoContrato('CUSTEO');
      setSaldoInicial('');
      setTaxaJuros('');
      setTipoTaxa('CDI');
      setTaxaAdicional('0');
      setDataContratacao(new Date().toISOString().split('T')[0]);
      setDataVencimento('');
      setSistemaAmortizacao('SAC');
      setPeriodicidade('Mensal');
      setFinalidade('CUSTEIO');
      setObservacoes('');
    }
  }, [editingContrato, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!banco.trim()) return;

    onSave({
      id: editingContrato?.id,
      banco: banco.trim(),
      tipoContrato,
      saldoInicial: parseFloat(saldoInicial) || 0,
      saldoAtual: editingContrato?.saldoAtual ?? (parseFloat(saldoInicial) || 0),
      taxaJuros: parseFloat(taxaJuros) || 0,
      tipoTaxa,
      taxaAdicional: tipoTaxa === 'CDI' ? parseFloat(taxaAdicional) || 0 : undefined,
      dataContratacao,
      dataVencimento,
      sistemaAmortizacao,
      periodicidade,
      finalidade,
      moeda: 'BRL',
      observacoes: observacoes.trim() || undefined
    });

    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={editingContrato ? 'Editar Contrato Bancário' : 'Novo Contrato Bancário'}
      subtitle="Financiamento, custeio ou CPR junto a instituição financeira"
    >
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        <Input
          label="Banco/Credor"
          type="text"
          required
          placeholder="Ex: Sicoob, Bradesco..."
          value={banco}
          onChange={(e) => setBanco(e.target.value)}
        />

        <Select
          label="Tipo de Contrato"
          value={tipoContrato}
          onChange={(e) => setTipoContrato(e.target.value as TipoContratoBancario)}
        >
          <option value="CUSTEO">CUSTEO</option>
          <option value="CPR">CPR</option>
          <option value="FINANCIAMENTO">FINANCIAMENTO</option>
          <option value="CREDIARIO">CREDIÁRIO</option>
        </Select>

        <Input
          label="Saldo Inicial"
          type="number"
          required
          min={0}
          prefix="R$"
          value={saldoInicial}
          onChange={(e) => setSaldoInicial(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Taxa de Juros (% a.a.)"
            type="number"
            required
            min={0}
            step="0.01"
            value={taxaJuros}
            onChange={(e) => setTaxaJuros(e.target.value)}
          />
          <Select
            label="Tipo de Taxa"
            value={tipoTaxa}
            onChange={(e) => setTipoTaxa(e.target.value as TipoTaxaBancaria)}
          >
            <option value="CDI">CDI</option>
            <option value="PRIME">PRIME</option>
            <option value="PRÉ">PRÉ</option>
            <option value="FLUTUANTE">FLUTUANTE</option>
          </Select>
        </div>

        {tipoTaxa === 'CDI' && (
          <Input
            label="Taxa Adicional / Spread (% a.a.)"
            type="number"
            min={0}
            step="0.01"
            value={taxaAdicional}
            onChange={(e) => setTaxaAdicional(e.target.value)}
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Data de Contratação"
            type="date"
            required
            disabled={!!editingContrato}
            value={dataContratacao}
            onChange={(e) => setDataContratacao(e.target.value)}
          />
          <Input
            label="Data de Vencimento"
            type="date"
            required
            value={dataVencimento}
            onChange={(e) => setDataVencimento(e.target.value)}
          />
        </div>

        <Select
          label="Sistema de Amortização"
          value={sistemaAmortizacao}
          onChange={(e) => setSistemaAmortizacao(e.target.value as SistemaAmortizacao)}
        >
          <option value="SAC">SAC</option>
          <option value="PRICE">PRICE</option>
          <option value="BULLET">BULLET</option>
        </Select>

        <Select
          label="Periodicidade"
          disabled={sistemaAmortizacao === 'BULLET'}
          value={sistemaAmortizacao === 'BULLET' ? 'Anual' : periodicidade}
          onChange={(e) => setPeriodicidade(e.target.value as PeriodicidadePagamento)}
        >
          <option value="Mensal">Mensal</option>
          <option value="Trimestral">Trimestral</option>
          <option value="Semestral">Semestral</option>
          <option value="Anual">Anual</option>
        </Select>

        <Select
          label="Finalidade"
          value={finalidade}
          onChange={(e) => setFinalidade(e.target.value as FinalidadeContrato)}
        >
          <option value="CUSTEIO">CUSTEIO</option>
          <option value="INVESTIMENTO">INVESTIMENTO</option>
          <option value="CAPITAL_GIRO">CAPITAL DE GIRO</option>
        </Select>

        <Textarea
          label="Observações"
          rows={3}
          placeholder="Garantias, condições especiais..."
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
        />

        <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full">
            Cancelar
          </Button>
          <Button type="submit" variant="primary" className="w-full">
            {editingContrato ? 'Salvar' : 'Cadastrar'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
};
