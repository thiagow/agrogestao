'use client';

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, MapPin } from 'lucide-react';
import { Aquisicao } from '../../types';
import { formatCurrency, formatDateBR } from '../../data/initialData';
import { Card, Tabs, Button, KpiCard } from '../ui';
import { AquisicaoDrawer } from '../AquisicaoDrawer';

interface AquisicaoFazendaViewProps {
  aquisicoes: Aquisicao[];
  onSave: (data: Partial<Aquisicao>) => void;
  onDelete: (id: string) => void;
}

function contarSafras(inicio: string, fim: string): number {
  const [anoInicio] = inicio.split('/').map(Number);
  const [anoFim] = fim.split('/').map(Number);
  return Math.max((anoFim || 0) - (anoInicio || 0) + 1, 1);
}

export const AquisicaoFazendaView: React.FC<AquisicaoFazendaViewProps> = ({
  aquisicoes,
  onSave,
  onDelete
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Aquisicao | null>(null);

  const areaTotal = aquisicoes.reduce((sum, a) => sum + a.areaHectares, 0);
  const sacasTotal = aquisicoes.reduce((sum, a) => sum + a.totalSacas, 0);
  const valorSafraAtual = aquisicoes.reduce(
    (sum, a) => sum + a.valorTotalFluxo / contarSafras(a.safraInicio, a.safraFim),
    0
  );

  const handleOpenNew = () => {
    setEditing(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (a: Aquisicao) => {
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
          <Plus className="w-4 h-4 stroke-[2.5]" /> Nova Aquisição
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Aquisições" value={aquisicoes.length.toString()} />
        <KpiCard title="Área Total Adquirida" value={`${areaTotal.toLocaleString('pt-BR')} ha`} />
        <KpiCard title="Sacas/Safra Atual" value={`${Math.round(sacasTotal).toLocaleString('pt-BR')} sc`} />
        <KpiCard title="Valor Safra Atual" value={formatCurrency(valorSafraAtual)} />
      </div>

      <Card className="p-5">
        <Tabs
          items={[
            { id: 'contratos', label: 'Contratos', badge: aquisicoes.length },
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
                {aquisicoes.map((a) => (
                  <div key={a.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-900 flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-slate-500" /> {a.nomeFazenda}
                        </p>
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
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs">
                      <div>
                        <p className="text-slate-400">Cultura</p>
                        <p className="font-semibold text-slate-800">{a.culturaPrincipal ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Área</p>
                        <p className="font-semibold text-slate-800">{a.areaHectares.toLocaleString('pt-BR')} ha</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Safras</p>
                        <p className="font-semibold text-slate-800">
                          {a.safraInicio} — {a.safraFim}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">Data de Aquisição</p>
                        <p className="font-semibold text-slate-800">{formatDateBR(a.dataAquisicao)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Valor Total</p>
                        <p className="font-bold text-slate-900">{formatCurrency(a.valorTotal)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Valor Total do Fluxo</p>
                        <p className="font-bold text-slate-900">{formatCurrency(a.valorTotalFluxo)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Total de Sacas</p>
                        <p className="font-bold text-slate-900">{a.totalSacas.toLocaleString('pt-BR')} sc</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          }}
        </Tabs>
      </Card>

      <AquisicaoDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={onSave}
        editingAquisicao={editing}
      />
    </div>
  );
};
