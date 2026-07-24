'use client';

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, ChevronRight } from 'lucide-react';
import { ContratoArrendamento } from '../../types';
import { formatCurrency } from '../../data/initialData';
import { Card, Tabs, Button, KpiCard, Badge } from '../ui';
import { ArrendamentoDrawer } from '../ArrendamentoDrawer';

interface ArrendamentosViewProps {
  arrendamentos: ContratoArrendamento[];
  onSave: (data: Partial<ContratoArrendamento>) => void;
  onDelete: (id: string) => void;
}

export const ArrendamentosView: React.FC<ArrendamentosViewProps> = ({ arrendamentos, onSave, onDelete }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ContratoArrendamento | null>(null);

  const areaTotal = arrendamentos.reduce((sum, a) => sum + a.areaHectares, 0);
  const sacasTotal = arrendamentos.reduce((sum, a) => sum + a.areaHectares * (a.sacasPorHectare ?? 0), 0);
  const custoAnualTotal = arrendamentos.reduce((sum, a) => sum + a.areaHectares * a.custoAnualHectare, 0);
  const ativos = arrendamentos.filter((a) => a.status === 'ATIVO').length;

  const handleOpenNew = () => {
    setEditing(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (a: ContratoArrendamento) => {
    setEditing(a);
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
        <KpiCard title="Área Arrendada Total" value={`${areaTotal.toLocaleString('pt-BR')} ha`} />
        <KpiCard title="Sacas (Safra Atual)" value={`${Math.round(sacasTotal).toLocaleString('pt-BR')} sc`} />
        <KpiCard title="Custo Anual (Safra Atual)" value={formatCurrency(custoAnualTotal)} valueClassName="text-rose-800" />
        <KpiCard title="Contratos Ativos" value={ativos.toString()} />
      </div>

      <Card className="p-5">
        <Tabs
          items={[
            { id: 'contratos', label: 'Contratos', badge: arrendamentos.length },
            { id: 'fluxo', label: 'Fluxo por Safra' },
            { id: 'impacto', label: 'Análise de Impacto' },
            { id: 'graficos', label: 'Gráficos' }
          ]}
          defaultTabId="contratos"
        >
          {(activeTabId) => {
            if (activeTabId !== 'contratos') {
              return (
                <div className="py-16 text-center text-slate-400">
                  <p className="text-sm font-semibold">
                    {activeTabId === 'fluxo' && 'Fluxo por Safra'}
                    {activeTabId === 'impacto' && 'Análise de Impacto'}
                    {activeTabId === 'graficos' && 'Gráficos'}
                  </p>
                  <p className="text-xs mt-1">Em construção — aguardando especificação detalhada desta aba.</p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {arrendamentos.map((a) => (
                  <div key={a.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900">{a.nomePropriedade}</p>
                          <Badge tone={a.status === 'ATIVO' ? 'emerald' : 'slate'}>{a.status}</Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{a.localizacao}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(a)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(a.id)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-3 text-xs">
                      <div>
                        <p className="text-slate-400">Cultura</p>
                        <p className="font-semibold text-slate-800">{a.culturaPrincipal}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Periodicidade</p>
                        <p className="font-semibold text-slate-800">{a.periodicidade}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Área</p>
                        <p className="font-semibold text-slate-800">{a.areaHectares.toLocaleString('pt-BR')} ha</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Custo Anual</p>
                        <p className="font-bold text-slate-900">{formatCurrency(a.areaHectares * a.custoAnualHectare)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 flex items-center gap-0.5">
                          Safras <ChevronRight className="w-3 h-3" />
                        </p>
                        <p className="font-semibold text-slate-800">
                          {a.safraInicio} — {a.safraFim}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          }}
        </Tabs>
      </Card>

      <ArrendamentoDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={onSave}
        editingArrendamento={editing}
      />
    </div>
  );
};
