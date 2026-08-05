'use client';

import React, { useState, useEffect } from 'react';
import { Capex } from '../types';
import { Card, Input, Select, Textarea, Button } from './ui';

interface CapexFormProps {
  onSave: (data: Partial<Capex>) => void;
  onCancel: () => void;
  editingCapex?: Capex | null;
  anoPadrao: number;
}

// Listas provisórias — o print mostra só "Máquina / Equipamento" (form) e "Reforma /
// Modernização" (linha da tabela) confirmados; usuário vai passar a lista completa
// depois (trocar aqui não precisa de migration, ver comentário em prisma/schema.prisma).
const TIPOS_CAPEX = ['Máquina / Equipamento', 'Reforma / Modernização', 'Benfeitoria', 'Infraestrutura', 'Tecnologia', 'Outros'];
const STATUS_CAPEX = ['Planejado', 'Em Andamento', 'Concluído', 'Cancelado'];

function anosDisponiveis(anoPadrao: number): number[] {
  const anoAtual = new Date().getFullYear();
  const base = Math.min(anoPadrao, anoAtual - 2);
  const anos = new Set<number>();
  for (let a = base; a <= anoAtual + 5; a++) anos.add(a);
  anos.add(anoPadrao);
  return Array.from(anos).sort((a, b) => a - b);
}

// Único cadastro do Cadastro Mestre que abre inline na própria aba, em vez de Drawer —
// pedido explícito do usuário, replicando o fluxo real do AgroFlow.
export const CapexForm: React.FC<CapexFormProps> = ({ onSave, onCancel, editingCapex, anoPadrao }) => {
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState(TIPOS_CAPEX[0]);
  const [ano, setAno] = useState(anoPadrao);
  const [valorPlanejado, setValorPlanejado] = useState('');
  const [valorExecutado, setValorExecutado] = useState('');
  const [percentualFinanciamento, setPercentualFinanciamento] = useState('0');
  const [status, setStatus] = useState(STATUS_CAPEX[0]);
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (editingCapex) {
      setDescricao(editingCapex.descricao);
      setTipo(editingCapex.tipo);
      setAno(editingCapex.ano);
      setValorPlanejado(editingCapex.valorPlanejado.toString());
      setValorExecutado(editingCapex.valorExecutado.toString());
      setPercentualFinanciamento(editingCapex.percentualFinanciamento?.toString() ?? '0');
      setStatus(editingCapex.status);
      setObservacoes(editingCapex.observacoes ?? '');
    } else {
      setDescricao('');
      setTipo(TIPOS_CAPEX[0]);
      setAno(anoPadrao);
      setValorPlanejado('');
      setValorExecutado('');
      setPercentualFinanciamento('0');
      setStatus(STATUS_CAPEX[0]);
      setObservacoes('');
    }
  }, [editingCapex, anoPadrao]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) return;

    onSave({
      id: editingCapex?.id,
      descricao: descricao.trim(),
      tipo,
      ano,
      valorPlanejado: parseFloat(valorPlanejado) || 0,
      valorExecutado: parseFloat(valorExecutado) || 0,
      percentualFinanciamento: parseFloat(percentualFinanciamento) || 0,
      status,
      observacoes: observacoes.trim() || undefined
    });
  };

  return (
    <Card className="p-5 mb-4">
      <h4 className="text-sm font-bold text-slate-900 mb-4">
        {editingCapex ? 'Editar Item de CAPEX' : 'Novo Item de CAPEX'}
      </h4>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Descrição"
          type="text"
          required
          placeholder="Ex: Colheitadeira John Deere S780..."
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {TIPOS_CAPEX.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Select label="Ano" value={ano} onChange={(e) => setAno(Number(e.target.value))}>
            {anosDisponiveis(anoPadrao).map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Valor Planejado (R$)"
            type="number"
            required
            min={0}
            step="0.01"
            value={valorPlanejado}
            onChange={(e) => setValorPlanejado(e.target.value)}
          />
          <Input
            label="Valor Executado (R$)"
            type="number"
            min={0}
            step="0.01"
            value={valorExecutado}
            onChange={(e) => setValorExecutado(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="% Financiamento"
            type="number"
            min={0}
            max={100}
            step="1"
            value={percentualFinanciamento}
            onChange={(e) => setPercentualFinanciamento(e.target.value)}
          />
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_CAPEX.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>

        <Textarea
          label="Observações"
          rows={2}
          placeholder="Detalhes adicionais..."
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
        />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onCancel} className="w-auto px-5">
            Cancelar
          </Button>
          <Button type="submit" variant="primary" className="w-auto px-5">
            Salvar
          </Button>
        </div>
      </form>
    </Card>
  );
};
