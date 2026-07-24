import React, { useState, useEffect } from 'react';
import { ContratoComercial, TipoContratoComercial, StatusContratoComercial } from '../types';
import { Drawer, Input, Select, Textarea, Button } from './ui';

interface ContratoComercialDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<ContratoComercial>) => void;
  editingContrato?: ContratoComercial | null;
  culturasDisponiveis: string[];
}

export const ContratoComercialDrawer: React.FC<ContratoComercialDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  editingContrato,
  culturasDisponiveis
}) => {
  const [cultura, setCultura] = useState('');
  const [safra, setSafra] = useState('2026/2027');
  const [quantidadeSc, setQuantidadeSc] = useState('');
  const [precoFixado, setPrecoFixado] = useState('');
  const [tipoContrato, setTipoContrato] = useState<TipoContratoComercial>('FUTURO');
  const [dataContrato, setDataContrato] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [status, setStatus] = useState<StatusContratoComercial>('ATIVO');
  const [compradorNome, setCompradorNome] = useState('');
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
      setCompradorNome(editingContrato.compradorNome ?? '');
      setObservacoes(editingContrato.observacoes ?? '');
    } else {
      setCultura(culturasDisponiveis[0] ?? '');
      setSafra('2026/2027');
      setQuantidadeSc('');
      setPrecoFixado('');
      setTipoContrato('FUTURO');
      setDataContrato(new Date().toISOString().split('T')[0]);
      setDataVencimento('');
      setStatus('ATIVO');
      setCompradorNome('');
      setObservacoes('');
    }
  }, [editingContrato, isOpen, culturasDisponiveis]);

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
      compradorNome: compradorNome.trim() || undefined,
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
          {culturasDisponiveis.map((c) => (
            <option key={c} value={c}>
              {c}
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
          <option value="FUTURO">FUTURO</option>
          <option value="VENDA_A_TERMO">VENDA A TERMO</option>
          <option value="HEDGE_CALL">HEDGE CALL</option>
          <option value="HEDGE_PUT">HEDGE PUT</option>
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

        <Input
          label="Comprador"
          type="text"
          value={compradorNome}
          onChange={(e) => setCompradorNome(e.target.value)}
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
            {editingContrato ? 'Salvar' : 'Cadastrar'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
};
