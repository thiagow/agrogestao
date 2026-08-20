'use client';

import React, { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { BemDireito, Socio } from '../types';
import { Modal, Input, Select, Button } from './ui';

interface ImovelUrbanoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<BemDireito>) => void;
  editingBem?: BemDireito | null;
  socios?: Socio[];
}

// Grid/modal específico do ANEXO B (Imóveis Urbanos) — colunas exatas da spec.
// "Valor Atual (R$)" é BemDireito.valorMercadoEstimado direto (sem cálculo
// derivado, diferente do ANEXO A que deriva de área × valor/ha).
export const ImovelUrbanoModal: React.FC<ImovelUrbanoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingBem,
  socios = []
}) => {
  const [socioId, setSocioId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [matricula, setMatricula] = useState('');
  const [cidade, setCidade] = useState('');
  const [valorAtual, setValorAtual] = useState('');

  useEffect(() => {
    if (editingBem?.detalheImovelUrbano) {
      const d = editingBem.detalheImovelUrbano;
      setSocioId(editingBem.socioId ?? '');
      setDescricao(d.descricao);
      setMatricula(d.matricula ?? '');
      setCidade(d.cidade);
      setValorAtual(editingBem.valorMercadoEstimado?.toString() ?? '');
    } else {
      setSocioId('');
      setDescricao('');
      setMatricula('');
      setCidade('');
      setValorAtual('');
    }
  }, [editingBem, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim() || !cidade.trim()) return;

    onSave({
      id: editingBem?.id,
      socioId: socioId || undefined,
      grupoIrpf: 'Imóveis Urbanos - ANEXO B',
      codigoTipo: '11 — Imóvel Urbano',
      descricao: descricao.trim(),
      valorMercadoEstimado: valorAtual ? parseFloat(valorAtual) : undefined,
      liquidez: editingBem?.liquidez ?? 'Baixa',
      elegivelGarantia: editingBem?.elegivelGarantia ?? false,
      geraFluxoCaixa: editingBem?.geraFluxoCaixa ?? false,
      detalheImovelUrbano: {
        descricao: descricao.trim(),
        matricula: matricula.trim() || undefined,
        cidade: cidade.trim()
      }
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={<Building2 className="w-5 h-5" />}
      title={editingBem ? 'Editar Imóvel Urbano — ANEXO B' : 'Novo Imóvel Urbano — ANEXO B'}
      subtitle="Declaração de Bens e Direitos — imóveis urbanos do grupo"
      footer={
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="w-auto">
            Cancelar
          </Button>
          <Button type="submit" variant="primary" form="form-imovel-urbano" className="w-auto">
            Salvar
          </Button>
        </div>
      }
    >
      <form id="form-imovel-urbano" onSubmit={handleSubmit} className="space-y-4">
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

        <Input
          label="Descrição"
          required
          placeholder="Ex: Apartamento 402, Ed. Alfa"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input label="Matrícula" value={matricula} onChange={(e) => setMatricula(e.target.value)} />
          <Input
            label="Cidade"
            required
            placeholder="Goiânia/GO"
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
          />
        </div>

        <Input
          label="Valor Atual (R$)"
          type="number"
          min={0}
          step="0.01"
          value={valorAtual}
          onChange={(e) => setValorAtual(e.target.value)}
        />
      </form>
    </Modal>
  );
};
