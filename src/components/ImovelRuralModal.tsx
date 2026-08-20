'use client';

import React, { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { BemDireito, Socio } from '../types';
import { Modal, Input, Select, Button } from './ui';
import { formatCurrency } from '../lib/format';

interface ImovelRuralModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<BemDireito>) => void;
  editingBem?: BemDireito | null;
  socios?: Socio[];
}

// Grid/modal específico do ANEXO A (Imóveis Rurais) — colunas exatas da spec, não o
// formulário genérico de Bens e Direitos. "Valor de Mercado Total (R$)" é calculado
// ao vivo (areaHa × valorMercadoHa) e salvo em BemDireito.valorMercadoEstimado, não
// numa coluna própria — é o que garante que o Painel Consolidado (src/lib/patrimonio.ts)
// some esses imóveis sem mudança de fórmula.
export const ImovelRuralModal: React.FC<ImovelRuralModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingBem,
  socios = []
}) => {
  const [socioId, setSocioId] = useState('');
  const [denominacaoImovel, setDenominacaoImovel] = useState('');
  const [municipioUf, setMunicipioUf] = useState('');
  const [matricula, setMatricula] = useState('');
  const [areaHa, setAreaHa] = useState('');
  const [areaPropriaPlantadaHa, setAreaPropriaPlantadaHa] = useState('');
  const [areaReservasPastagensOutrosHa, setAreaReservasPastagensOutrosHa] = useState('');
  const [valorMercadoHa, setValorMercadoHa] = useState('');
  const [situacaoCredor, setSituacaoCredor] = useState('');

  useEffect(() => {
    if (editingBem?.detalheImovelRural) {
      const d = editingBem.detalheImovelRural;
      setSocioId(editingBem.socioId ?? '');
      setDenominacaoImovel(d.denominacaoImovel);
      setMunicipioUf(d.municipioUf);
      setMatricula(d.matricula ?? '');
      setAreaHa(d.areaHa.toString());
      setAreaPropriaPlantadaHa(d.areaPropriaPlantadaHa?.toString() ?? '');
      setAreaReservasPastagensOutrosHa(d.areaReservasPastagensOutrosHa?.toString() ?? '');
      setValorMercadoHa(d.valorMercadoHa?.toString() ?? '');
      setSituacaoCredor(d.situacaoCredor ?? '');
    } else {
      setSocioId('');
      setDenominacaoImovel('');
      setMunicipioUf('');
      setMatricula('');
      setAreaHa('');
      setAreaPropriaPlantadaHa('');
      setAreaReservasPastagensOutrosHa('');
      setValorMercadoHa('');
      setSituacaoCredor('');
    }
  }, [editingBem, isOpen]);

  const areaHaNum = parseFloat(areaHa) || 0;
  const valorMercadoHaNum = parseFloat(valorMercadoHa) || 0;
  const valorMercadoTotal = areaHaNum * valorMercadoHaNum;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!denominacaoImovel.trim() || !municipioUf.trim() || areaHaNum <= 0) return;

    onSave({
      id: editingBem?.id,
      socioId: socioId || undefined,
      grupoIrpf: 'Imóveis Rurais - ANEXO A',
      codigoTipo: '18 — Imóvel Rural',
      descricao: denominacaoImovel.trim(),
      valorMercadoEstimado: valorMercadoTotal || undefined,
      liquidez: editingBem?.liquidez ?? 'Baixa',
      elegivelGarantia: editingBem?.elegivelGarantia ?? false,
      geraFluxoCaixa: editingBem?.geraFluxoCaixa ?? false,
      detalheImovelRural: {
        denominacaoImovel: denominacaoImovel.trim(),
        municipioUf: municipioUf.trim(),
        matricula: matricula.trim() || undefined,
        areaHa: areaHaNum,
        areaPropriaPlantadaHa: areaPropriaPlantadaHa ? parseFloat(areaPropriaPlantadaHa) : undefined,
        areaReservasPastagensOutrosHa: areaReservasPastagensOutrosHa
          ? parseFloat(areaReservasPastagensOutrosHa)
          : undefined,
        valorMercadoHa: valorMercadoHaNum || undefined,
        situacaoCredor: situacaoCredor.trim() || undefined
      }
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={<Building2 className="w-5 h-5" />}
      title={editingBem ? 'Editar Imóvel Rural — ANEXO A' : 'Novo Imóvel Rural — ANEXO A'}
      subtitle="Declaração de Bens e Direitos — imóveis rurais do grupo"
      footer={
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="w-auto">
            Cancelar
          </Button>
          <Button type="submit" variant="primary" form="form-imovel-rural" className="w-auto">
            Salvar
          </Button>
        </div>
      }
    >
      <form id="form-imovel-rural" onSubmit={handleSubmit} className="space-y-4">
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
          label="Denominação do Imóvel"
          required
          placeholder="Ex: Fazenda Santa Maria"
          value={denominacaoImovel}
          onChange={(e) => setDenominacaoImovel(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Município/UF"
            required
            placeholder="Sorriso/MT"
            value={municipioUf}
            onChange={(e) => setMunicipioUf(e.target.value)}
          />
          <Input label="Matrícula" value={matricula} onChange={(e) => setMatricula(e.target.value)} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Área (ha)"
            type="number"
            required
            min={0}
            step="0.01"
            value={areaHa}
            onChange={(e) => setAreaHa(e.target.value)}
          />
          <Input
            label="Área Própria Plantada (ha)"
            type="number"
            min={0}
            step="0.01"
            value={areaPropriaPlantadaHa}
            onChange={(e) => setAreaPropriaPlantadaHa(e.target.value)}
          />
          <Input
            label="Reservas/Pastagens/Outros (ha)"
            type="number"
            min={0}
            step="0.01"
            value={areaReservasPastagensOutrosHa}
            onChange={(e) => setAreaReservasPastagensOutrosHa(e.target.value)}
          />
        </div>

        <Input
          label="Valor de Mercado (R$/ha)"
          type="number"
          min={0}
          step="0.01"
          value={valorMercadoHa}
          onChange={(e) => setValorMercadoHa(e.target.value)}
        />

        {valorMercadoTotal > 0 && (
          <div className="rounded-xl bg-slate-50 border border-slate-200/80 px-4 py-3">
            <p className="text-[11px] text-slate-500">Valor de Mercado Total</p>
            <p className="text-lg font-extrabold text-emerald-700">{formatCurrency(valorMercadoTotal)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {formatCurrency(valorMercadoHaNum)}/ha × {areaHaNum.toLocaleString('pt-BR')} ha
            </p>
          </div>
        )}

        <Input
          label="Situação/Credor"
          placeholder="Ex: Livre e desembaraçado, ou alienado ao Banco X"
          value={situacaoCredor}
          onChange={(e) => setSituacaoCredor(e.target.value)}
        />
      </form>
    </Modal>
  );
};
