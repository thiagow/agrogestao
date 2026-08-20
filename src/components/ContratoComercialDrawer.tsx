'use client';

import React, { useState, useEffect } from 'react';
import { ContratoComercial, TipoContratoComercial, StatusContratoComercial, Cultura } from '../types';
import { Drawer, Input, Select, Textarea, Button } from './ui';

interface ContratoComercialDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<ContratoComercial>) => void;
  editingContrato?: ContratoComercial | null;
  culturas: Cultura[];
}

// 14 traders confirmados na spec (docs/demandas/SPEC_TELA_COMERCIALIZACAO.md,
// seção 8) + "Outros" liberando texto livre — mesmo critério da lista fechada
// de UFs em Aquisição de Fazendas: catálogo genérico do mercado, não dado
// inventado.
const COMPRADORES = [
  'Bunge',
  'Cargill',
  'ADM',
  'Amaggi',
  'COFCO',
  'BTG Commodities',
  'Louis Dreyfus',
  'Viterra',
  'Glencore',
  'Agroavance',
  'Coamo',
  'Caramuru',
  'Multigrain',
  'Outros'
];

const TIPO_CONTRATO_LABEL: Record<TipoContratoComercial, string> = {
  FUTURO: 'Futuro',
  VENDA_A_TERMO: 'Venda a Termo',
  HEDGE_CALL: 'Hedge Call',
  HEDGE_PUT: 'Hedge Put'
};

export const ContratoComercialDrawer: React.FC<ContratoComercialDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  editingContrato,
  culturas
}) => {
  const [cultura, setCultura] = useState('');
  const [safra, setSafra] = useState('2026/2027');
  const [quantidadeSc, setQuantidadeSc] = useState('');
  const [precoFixado, setPrecoFixado] = useState('');
  const [tipoContrato, setTipoContrato] = useState<TipoContratoComercial>('FUTURO');
  const [dataContrato, setDataContrato] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [status, setStatus] = useState<StatusContratoComercial>('ATIVO');
  const [comprador, setComprador] = useState('');
  const [compradorOutro, setCompradorOutro] = useState('');
  const [cambioUsd, setCambioUsd] = useState('');
  const [dataLiquidacaoFinanceira, setDataLiquidacaoFinanceira] = useState('');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (editingContrato) {
      setCultura(editingContrato.cultura);
      setSafra(editingContrato.safra);
      setQuantidadeSc(editingContrato.quantidadeSc.toString());
      setPrecoFixado(editingContrato.precoFixado.toString());
      setTipoContrato(editingContrato.tipoContrato);
      setDataContrato(editingContrato.dataContrato);
      setDataVencimento(editingContrato.dataVencimento);
      setStatus(editingContrato.status);
      const compradorExistente = editingContrato.compradorNome ?? '';
      if (compradorExistente && COMPRADORES.includes(compradorExistente)) {
        setComprador(compradorExistente);
        setCompradorOutro('');
      } else if (compradorExistente) {
        setComprador('Outros');
        setCompradorOutro(compradorExistente);
      } else {
        setComprador('');
        setCompradorOutro('');
      }
      setCambioUsd(editingContrato.cambioUsd?.toString() ?? '');
      setDataLiquidacaoFinanceira(editingContrato.dataLiquidacaoFinanceira ?? '');
      setObservacoes(editingContrato.observacoes ?? '');
    } else {
      setCultura(culturas[0]?.nome ?? '');
      setSafra('2026/2027');
      setQuantidadeSc('');
      setPrecoFixado('');
      setTipoContrato('FUTURO');
      setDataContrato(new Date().toISOString().split('T')[0]);
      setDataVencimento('');
      setStatus('ATIVO');
      setComprador('');
      setCompradorOutro('');
      setCambioUsd('');
      setDataLiquidacaoFinanceira('');
      setObservacoes('');
    }
  }, [editingContrato, isOpen, culturas]);

  const compradorNomeFinal = comprador === 'Outros' ? compradorOutro.trim() : comprador;
  const contratoEmUsd = tipoContrato === 'FUTURO'; // FUTURO cobre CBOT no dropdown de tipo hoje — câmbio segue opcional em qualquer tipo

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cultura) return;

    onSave({
      id: editingContrato?.id,
      cultura,
      safra: safra.trim(),
      quantidadeSc: parseFloat(quantidadeSc) || 0,
      precoFixado: parseFloat(precoFixado) || 0,
      tipoContrato,
      dataContrato,
      dataVencimento,
      status,
      compradorNome: compradorNomeFinal || undefined,
      cambioUsd: cambioUsd ? parseFloat(cambioUsd) : undefined,
      dataLiquidacaoFinanceira: dataLiquidacaoFinanceira || undefined,
      observacoes: observacoes.trim() || undefined
    });

    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={editingContrato ? 'Editar Contrato Comercial' : 'Novo Contrato Comercial'}
      subtitle="Fixação de preço via futuros, termo ou hedge"
    >
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        <Select label="Cultura" required value={cultura} onChange={(e) => setCultura(e.target.value)}>
          {culturas.map((c) => (
            <option key={c.id} value={c.nome}>
              {c.nome}
            </option>
          ))}
        </Select>

        <Input label="Safra" type="text" required value={safra} onChange={(e) => setSafra(e.target.value)} />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Quantidade (sc)"
            type="number"
            required
            min={0}
            value={quantidadeSc}
            onChange={(e) => setQuantidadeSc(e.target.value)}
          />
          <Input
            label="Preço Fixado (R$/sc)"
            type="number"
            required
            min={0}
            step="0.01"
            value={precoFixado}
            onChange={(e) => setPrecoFixado(e.target.value)}
          />
        </div>

        <Select
          label="Tipo de Contrato"
          value={tipoContrato}
          onChange={(e) => setTipoContrato(e.target.value as TipoContratoComercial)}
        >
          {(Object.keys(TIPO_CONTRATO_LABEL) as TipoContratoComercial[]).map((t) => (
            <option key={t} value={t}>
              {TIPO_CONTRATO_LABEL[t]}
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Data do Contrato"
            type="date"
            required
            value={dataContrato}
            onChange={(e) => setDataContrato(e.target.value)}
          />
          <Input
            label="Data de Vencimento"
            type="date"
            required
            value={dataVencimento}
            onChange={(e) => setDataVencimento(e.target.value)}
          />
        </div>

        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as StatusContratoComercial)}>
          <option value="ATIVO">ATIVO</option>
          <option value="LIQUIDADO">LIQUIDADO</option>
          <option value="CANCELADO">CANCELADO</option>
        </Select>

        <div>
          <Select label="Comprador" value={comprador} onChange={(e) => setComprador(e.target.value)}>
            <option value="">Selecione…</option>
            {COMPRADORES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          {comprador === 'Outros' && (
            <Input
              className="mt-2"
              type="text"
              placeholder="Nome do comprador"
              value={compradorOutro}
              onChange={(e) => setCompradorOutro(e.target.value)}
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Câmbio (R$/USD)"
            type="number"
            min={0}
            step="0.0001"
            value={cambioUsd}
            onChange={(e) => setCambioUsd(e.target.value)}
            hint={contratoEmUsd ? 'Cotação do dólar na data da contratação.' : 'Só preencha se o contrato for em dólar.'}
          />
          <Input
            label="Data de Liquidação Financeira"
            type="date"
            value={dataLiquidacaoFinanceira}
            onChange={(e) => setDataLiquidacaoFinanceira(e.target.value)}
            hint="Data em que o pagamento é esperado."
          />
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
            {editingContrato ? 'Salvar' : 'Cadastrar'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
};
