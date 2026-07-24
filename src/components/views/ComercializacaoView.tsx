'use client';

import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { ContratoComercial, PosicaoComercializacao } from '../../types';
import { formatCurrency, formatDateBR } from '../../data/initialData';
import { Card, Tabs, Button, KpiCard, Badge } from '../ui';
import { ContratoComercialDrawer } from '../ContratoComercialDrawer';

interface ComercializacaoViewProps {
  posicoes: PosicaoComercializacao[];
  contratos: ContratoComercial[];
  onSave: (data: Partial<ContratoComercial>) => void;
  onDelete: (id: string) => void;
}

export const ComercializacaoView: React.FC<ComercializacaoViewProps> = ({
  posicoes,
  contratos,
  onSave,
  onDelete
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ContratoComercial | null>(null);

  const fixadoPorCultura = new Map<string, number>();
  contratos
    .filter((c) => c.status === 'ATIVO')
    .forEach((c) => {
      fixadoPorCultura.set(c.cultura, (fixadoPorCultura.get(c.cultura) ?? 0) + c.quantidadeSc);
    });

  const producaoTotal = posicoes.reduce((sum, p) => sum + p.producaoTotalSc, 0);
  const qtdFixada = Array.from(fixadoPorCultura.values()).reduce((sum, v) => sum + v, 0);
  const qtdAFixar = producaoTotal - qtdFixada;
  const receitaFixada = contratos
    .filter((c) => c.status === 'ATIVO')
    .reduce((sum, c) => sum + c.quantidadeSc * c.precoFixado, 0);
  const receitaAMercado = posicoes.reduce((sum, p) => {
    const fixado = fixadoPorCultura.get(p.cultura) ?? 0;
    return sum + Math.max(p.producaoTotalSc - fixado, 0) * p.cotacaoAtual;
  }, 0);
  const precoMedioFixado =
    qtdFixada > 0
      ? contratos.filter((c) => c.status === 'ATIVO').reduce((sum, c) => sum + c.quantidadeSc * c.precoFixado, 0) /
        qtdFixada
      : 0;
  const percentFixado = producaoTotal > 0 ? (qtdFixada / producaoTotal) * 100 : 0;

  const handleOpenNew = () => {
    setEditing(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (c: ContratoComercial) => {
    setEditing(c);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard title="Produção Total" value={`${producaoTotal.toLocaleString('pt-BR')} sc`} subtitle="Safra 2026/2027" />
        <KpiCard
          title="Qtd Fixada"
          value={`${Math.round(qtdFixada).toLocaleString('pt-BR')} sc`}
          subtitle={`${percentFixado.toFixed(1)}%`}
        />
        <KpiCard
          title="Qtd a Fixar"
          value={`${Math.round(qtdAFixar).toLocaleString('pt-BR')} sc`}
          subtitle={`${(100 - percentFixado).toFixed(1)}% disponível`}
        />
        <KpiCard title="Preço Médio Fixado" value={precoMedioFixado > 0 ? formatCurrency(precoMedioFixado) : '—'} />
        <KpiCard
          title="Receita Fixada"
          value={formatCurrency(receitaFixada)}
          subtitle={`+ ${formatCurrency(receitaAMercado)} a mercado`}
        />
      </div>

      <Card className="p-5">
        <p className="text-xs font-semibold text-slate-600 mb-2">
          Progresso de Comercialização — Safra 2026/2027
        </p>
        <div className="w-full h-3 rounded-full bg-amber-100 overflow-hidden flex">
          <div className="h-full bg-[#4a6700]" style={{ width: `${percentFixado}%` }} />
        </div>
        <div className="flex justify-between text-[11px] text-slate-500 mt-1.5">
          <span>Fixado: {percentFixado.toFixed(1)}%</span>
          <span>A Fixar: {(100 - percentFixado).toFixed(1)}%</span>
        </div>
      </Card>

      <Card className="p-5">
        <Tabs
          items={[
            { id: 'posicao', label: 'Posição por Cultura' },
            { id: 'contratos', label: 'Contratos Cadastrados', badge: contratos.length },
            { id: 'comprador', label: 'Por Comprador' },
            { id: 'graficos', label: 'Gráficos' }
          ]}
          defaultTabId="posicao"
        >
          {(activeTabId) => {
            if (activeTabId === 'posicao') {
              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-600 font-bold">
                        <th className="py-3 px-4">Cultura</th>
                        <th className="py-3 px-4 text-right">Produção Total</th>
                        <th className="py-3 px-4 text-right">Fixado</th>
                        <th className="py-3 px-4 text-right">A Fixar</th>
                        <th className="py-3 px-4 text-right">Receita Fixada</th>
                        <th className="py-3 px-4 text-right">Valor a Mercado</th>
                        <th className="py-3 px-4 text-right">Cotação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {posicoes.map((p) => {
                        const fixado = fixadoPorCultura.get(p.cultura) ?? 0;
                        const aFixar = Math.max(p.producaoTotalSc - fixado, 0);
                        const receitaFix = contratos
                          .filter((c) => c.status === 'ATIVO' && c.cultura === p.cultura)
                          .reduce((sum, c) => sum + c.quantidadeSc * c.precoFixado, 0);
                        return (
                          <tr key={p.cultura} className="hover:bg-slate-50/60">
                            <td className="py-3 px-4 font-bold text-slate-900">{p.cultura}</td>
                            <td className="py-3 px-4 text-right font-medium text-slate-600">
                              {p.producaoTotalSc.toLocaleString('pt-BR')} sc
                            </td>
                            <td className="py-3 px-4 text-right text-slate-600">
                              {fixado.toLocaleString('pt-BR')} ({p.producaoTotalSc > 0 ? ((fixado / p.producaoTotalSc) * 100).toFixed(0) : 0}%)
                            </td>
                            <td className="py-3 px-4 text-right text-slate-600">
                              {aFixar.toLocaleString('pt-BR')} ({p.producaoTotalSc > 0 ? ((aFixar / p.producaoTotalSc) * 100).toFixed(0) : 0}%)
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-slate-800">
                              {formatCurrency(receitaFix)}
                            </td>
                            <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                              {formatCurrency(aFixar * p.cotacaoAtual)}
                            </td>
                            <td className="py-3 px-4 text-right text-slate-600">
                              {formatCurrency(p.cotacaoAtual)}/sc
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            }

            if (activeTabId === 'contratos') {
              return (
                <div>
                  <div className="flex justify-end mb-4">
                    <Button
                      variant="primary"
                      onClick={handleOpenNew}
                      className="w-auto flex items-center gap-1.5 px-3.5 py-2 text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Novo Contrato
                    </Button>
                  </div>
                  {contratos.length === 0 ? (
                    <div className="py-16 text-center text-slate-400">
                      <p className="text-sm font-semibold">Nenhum contrato cadastrado</p>
                      <p className="text-xs mt-1">Toda a produção ainda está em aberto a mercado.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-600 font-bold">
                            <th className="py-3 px-4">Cultura</th>
                            <th className="py-3 px-4">Tipo</th>
                            <th className="py-3 px-4 text-right">Quantidade</th>
                            <th className="py-3 px-4 text-right">Preço Fixado</th>
                            <th className="py-3 px-4">Vencimento</th>
                            <th className="py-3 px-4 text-center">Status</th>
                            <th className="py-3 px-4 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                          {contratos.map((c) => (
                            <tr key={c.id} className="hover:bg-slate-50/60">
                              <td className="py-3 px-4 font-bold text-slate-900">{c.cultura}</td>
                              <td className="py-3 px-4">
                                <Badge tone="blue">{c.tipoContrato.replace(/_/g, ' ')}</Badge>
                              </td>
                              <td className="py-3 px-4 text-right">{c.quantidadeSc.toLocaleString('pt-BR')} sc</td>
                              <td className="py-3 px-4 text-right font-semibold">{formatCurrency(c.precoFixado)}</td>
                              <td className="py-3 px-4">{formatDateBR(c.dataVencimento)}</td>
                              <td className="py-3 px-4 text-center">
                                <Badge tone={c.status === 'ATIVO' ? 'emerald' : c.status === 'LIQUIDADO' ? 'blue' : 'rose'}>
                                  {c.status}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleOpenEdit(c)}
                                    className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => onDelete(c.id)}
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
                  )}
                </div>
              );
            }

            return (
              <div className="py-16 text-center text-slate-400">
                <p className="text-sm font-semibold">{activeTabId === 'comprador' ? 'Por Comprador' : 'Gráficos'}</p>
                <p className="text-xs mt-1">Em construção — aguardando especificação detalhada desta aba.</p>
              </div>
            );
          }}
        </Tabs>
      </Card>

      <ContratoComercialDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={onSave}
        editingContrato={editing}
        culturasDisponiveis={posicoes.map((p) => p.cultura)}
      />
    </div>
  );
};
