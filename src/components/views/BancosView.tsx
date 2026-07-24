'use client';

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Landmark } from 'lucide-react';
import { ContratoBancario } from '../../types';
import { formatCurrency, formatDateBR, isCurtoPrazo } from '../../data/initialData';
import { Card, Tabs, Button, Badge, KpiCard } from '../ui';
import { ContratoBancarioDrawer } from '../ContratoBancarioDrawer';

interface BancosViewProps {
  contratos: ContratoBancario[];
  onSave: (data: Partial<ContratoBancario>) => void;
  onDelete: (id: string) => void;
}

export const BancosView: React.FC<BancosViewProps> = ({ contratos, onSave, onDelete }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ContratoBancario | null>(null);

  const saldoTotal = contratos.reduce((sum, c) => sum + c.saldoAtual, 0);
  const curtoPrazo = contratos
    .filter((c) => isCurtoPrazo(c.dataVencimento))
    .reduce((sum, c) => sum + c.saldoAtual, 0);
  const longoPrazo = saldoTotal - curtoPrazo;

  const custoMedioPonderado = saldoTotal > 0
    ? contratos.reduce((sum, c) => sum + c.saldoAtual * c.taxaJuros, 0) / saldoTotal
    : 0;

  const gruposPorTaxa = new Map<string, { saldo: number; somaPonderada: number }>();
  contratos.forEach((c) => {
    const grupo = gruposPorTaxa.get(c.tipoTaxa) ?? { saldo: 0, somaPonderada: 0 };
    grupo.saldo += c.saldoAtual;
    grupo.somaPonderada += c.saldoAtual * c.taxaJuros;
    gruposPorTaxa.set(c.tipoTaxa, grupo);
  });

  const handleOpenNew = () => {
    setEditing(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (contrato: ContratoBancario) => {
    setEditing(contrato);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={handleOpenNew}
          className="w-auto flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" /> Novo Contrato
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<Landmark className="w-4 h-4 text-rose-700" />}
          title="Saldo Devedor Total"
          value={formatCurrency(saldoTotal)}
          subtitle={`${contratos.length} contratos`}
          valueClassName="text-rose-800"
        />
        <KpiCard
          title="Curto Prazo (CP) ≤ 12 meses"
          value={formatCurrency(curtoPrazo)}
          subtitle={saldoTotal > 0 ? `${((curtoPrazo / saldoTotal) * 100).toFixed(1)}% do total` : '—'}
          valueClassName="text-amber-700"
        />
        <KpiCard
          title="Longo Prazo (LP) > 12 meses"
          value={formatCurrency(longoPrazo)}
          subtitle={saldoTotal > 0 ? `${((longoPrazo / saldoTotal) * 100).toFixed(1)}% do total` : '—'}
          valueClassName="text-blue-700"
        />
        <KpiCard
          title="Custo Médio Ponderado"
          value={`${custoMedioPonderado.toFixed(2)}% a.a.`}
          subtitle={Array.from(gruposPorTaxa.entries())
            .map(([tipo, g]) => `${tipo}: ${(g.somaPonderada / g.saldo).toFixed(2)}% — ${formatCurrency(g.saldo)}`)
            .join(' | ')}
        />
      </div>

      <Card className="p-5">
        <Tabs
          items={[
            { id: 'contratos', label: 'Contratos', badge: contratos.length },
            { id: 'credor', label: 'Por Credor' },
            { id: 'cronograma', label: 'Cronograma' },
            { id: 'fluxo', label: 'Fluxo Detalhado' }
          ]}
          defaultTabId="contratos"
        >
          {(activeTabId) => {
            if (activeTabId !== 'contratos') {
              return (
                <div className="py-16 text-center text-slate-400">
                  <p className="text-sm font-semibold">
                    {activeTabId === 'credor' && 'Por Credor'}
                    {activeTabId === 'cronograma' && 'Cronograma'}
                    {activeTabId === 'fluxo' && 'Fluxo Detalhado'}
                  </p>
                  <p className="text-xs mt-1">Em construção — aguardando especificação detalhada desta aba.</p>
                </div>
              );
            }

            return (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-600 font-bold">
                      <th className="py-3 px-4">Banco/Credor</th>
                      <th className="py-3 px-4">Tipo</th>
                      <th className="py-3 px-4">Saldo</th>
                      <th className="py-3 px-4">Taxa</th>
                      <th className="py-3 px-4">Tipo de Taxa</th>
                      <th className="py-3 px-4">Vencimento</th>
                      <th className="py-3 px-4">Sistema Amortização</th>
                      <th className="py-3 px-4">Período</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {contratos.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{c.banco}</td>
                        <td className="py-3 px-4">
                          <Badge tone="slate">{c.tipoContrato}</Badge>
                        </td>
                        <td className="py-3 px-4 font-extrabold text-slate-900">{formatCurrency(c.saldoAtual)}</td>
                        <td className="py-3 px-4 font-medium text-slate-700">{c.taxaJuros.toFixed(2)}% a.a.</td>
                        <td className="py-3 px-4">
                          <Badge tone="blue">{c.tipoTaxa}</Badge>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-600 whitespace-nowrap">
                          {formatDateBR(c.dataVencimento)}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{c.sistemaAmortizacao}</td>
                        <td className="py-3 px-4 text-slate-600">{c.periodicidade}</td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(c)}
                              title="Editar contrato"
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDelete(c.id)}
                              title="Deletar contrato"
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }}
        </Tabs>
      </Card>

      <ContratoBancarioDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={onSave}
        editingContrato={editing}
      />
    </div>
  );
};
