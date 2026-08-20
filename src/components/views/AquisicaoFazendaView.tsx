'use client';

import React, { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Plus, Edit2, Trash2, MapPin, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { Aquisicao } from '../../types';
import { formatCurrency, formatDateBR } from '../../data/initialData';
import { Card, Tabs, Button, Badge, KpiCard } from '../ui';
import { AquisicaoDrawer } from '../AquisicaoDrawer';
import type { LinhaFluxoConsolidado, ImpactoSafra } from '../../server/aquisicoes';

interface AquisicaoFazendaViewProps {
  aquisicoes: Aquisicao[];
  fluxoConsolidado: LinhaFluxoConsolidado[];
  impactoPorSafra: ImpactoSafra[];
  onSave: (data: Partial<Aquisicao>) => void;
  onDelete: (id: string) => void;
}

const CORES_PIZZA = ['#4a6700', '#a3e635', '#65a30d', '#84cc16', '#166534', '#3f6212', '#bef264'];

const CardContrato: React.FC<{ a: Aquisicao; onEdit: () => void; onDelete: () => void }> = ({
  a,
  onEdit,
  onDelete
}) => {
  const [aberto, setAberto] = useState(false);
  const safraInicial = a.parcelas[0]?.safra;
  const safraFinal = a.parcelas[a.parcelas.length - 1]?.safra;

  return (
    <div className="rounded-xl border border-slate-200/80 overflow-hidden">
      <div className="p-4 bg-slate-50">
        <div className="flex items-start justify-between gap-3">
          <button
            onClick={() => setAberto((v) => !v)}
            className="flex items-start gap-2 text-left flex-1 min-w-0"
          >
            {aberto ? (
              <ChevronDown className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
            )}
            <div className="min-w-0">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-500 shrink-0" /> {a.nomeFazenda}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {a.municipio} - {a.estado}
              </p>
            </div>
          </button>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="text-right mr-2">
              <p className="text-[11px] text-slate-500">Valor Total Fluxo</p>
              <p className="font-extrabold text-slate-900">{formatCurrency(a.valorTotalFluxo)}</p>
              {a.totalSacas > 0 && (
                <p className="text-[11px] text-slate-500">{Math.round(a.totalSacas).toLocaleString('pt-BR')} sc total</p>
              )}
            </div>
            <button
              onClick={onEdit}
              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {a.tipoPagamento === 'SACAS' && (
            <Badge tone="slate">
              {a.culturaNome ? `${a.culturaNome.toUpperCase()} · ` : ''}
              {a.sacasHa?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/ha
            </Badge>
          )}
          {safraInicial && safraFinal && (
            <Badge tone="slate">
              {safraInicial} → {safraFinal}
            </Badge>
          )}
          <Badge tone="slate">{a.areaTotalHa.toLocaleString('pt-BR')} ha</Badge>
          <Badge tone="emerald">{a.periodicidade.toUpperCase()}</Badge>
        </div>
      </div>

      {aberto && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-600 font-bold bg-white">
                <th className="py-2.5 px-4">Safra</th>
                <th className="py-2.5 px-4">Tipo</th>
                <th className="py-2.5 px-4 text-right">Sacas</th>
                <th className="py-2.5 px-4 text-right">Preço/sc</th>
                <th className="py-2.5 px-4 text-right">Valor Total</th>
                <th className="py-2.5 px-4 text-right">Data Pagamento</th>
              </tr>
            </thead>
            <tbody>
              {a.parcelas.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 text-sm">
                  <td className="py-2.5 px-4 font-semibold text-slate-800">{p.safra}</td>
                  <td className="py-2.5 px-4">
                    <Badge tone={p.tipo === 'ENTRADA' ? 'emerald' : 'slate'}>
                      {p.tipo === 'ENTRADA' ? 'Entrada' : 'Parcela'}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    {p.sacas > 0 ? `${Math.round(p.sacas).toLocaleString('pt-BR')} sc` : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    {p.precoSc ? (
                      <span className={p.usaPrecoReferencia ? 'text-amber-600 font-semibold' : ''}>
                        {formatCurrency(p.precoSc)}
                        {p.usaPrecoReferencia && ' ✓ref.'}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-slate-900">{formatCurrency(p.valorTotal)}</td>
                  <td className="py-2.5 px-4 text-right text-slate-600">{formatDateBR(p.dataPagamento)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const TabFluxoPorSafra: React.FC<{ linhas: LinhaFluxoConsolidado[] }> = ({ linhas }) => {
  if (linhas.length === 0) {
    return <p className="text-sm text-slate-400 py-10 text-center">Nenhuma parcela cadastrada ainda.</p>;
  }

  return (
    <div>
      <h3 className="text-sm font-bold text-slate-900 mb-4">Fluxo Consolidado por Safra</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-600 font-bold">
              <th className="py-2.5 px-4">Safra</th>
              <th className="py-2.5 px-4">Fazenda</th>
              <th className="py-2.5 px-4">Tipo</th>
              <th className="py-2.5 px-4">Cultura</th>
              <th className="py-2.5 px-4 text-right">Sacas</th>
              <th className="py-2.5 px-4 text-right">Preço/sc</th>
              <th className="py-2.5 px-4 text-right">Valor Total</th>
              <th className="py-2.5 px-4 text-right">Data Pagamento</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l, i) => (
              <tr key={i} className="border-b border-slate-100 text-sm">
                <td className="py-2.5 px-4 font-semibold text-slate-800">{l.safra}</td>
                <td className="py-2.5 px-4 text-slate-700">{l.fazenda}</td>
                <td className="py-2.5 px-4">
                  <Badge tone={l.tipo === 'ENTRADA' ? 'emerald' : 'slate'}>
                    {l.tipo === 'ENTRADA' ? 'Entrada' : 'Parcela'}
                  </Badge>
                </td>
                <td className="py-2.5 px-4 text-slate-600">{l.cultura}</td>
                <td className="py-2.5 px-4 text-right">
                  {l.sacas > 0 ? `${Math.round(l.sacas).toLocaleString('pt-BR')} sc` : '—'}
                </td>
                <td className="py-2.5 px-4 text-right">{l.precoSc ? formatCurrency(l.precoSc) : '—'}</td>
                <td className="py-2.5 px-4 text-right font-bold text-slate-900">{formatCurrency(l.valorTotal)}</td>
                <td className="py-2.5 px-4 text-right text-slate-600">{formatDateBR(l.dataPagamento)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TabAnaliseImpacto: React.FC<{ dados: ImpactoSafra[] }> = ({ dados }) => {
  if (dados.length === 0) {
    return <p className="text-sm text-slate-400 py-10 text-center">Nenhuma parcela cadastrada ainda.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {dados.map((d) => {
        const alerta = d.percentualImpacto !== null && d.percentualImpacto > 30;
        return (
          <div
            key={d.safra}
            className={`p-4 rounded-xl border ${alerta ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200/80'}`}
          >
            <p className="text-[11px] text-slate-500">Safra</p>
            <p className="font-bold text-slate-900 mb-2">{d.safra}</p>

            <p className={`text-3xl font-extrabold ${alerta ? 'text-rose-600' : 'text-slate-900'}`}>
              {d.percentualImpacto !== null ? `${d.percentualImpacto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%` : 'N/D'}
            </p>
            <p className="text-[11px] text-slate-500 mb-3">
              {d.percentualImpacto !== null ? 'da prod. soja' : 'sem produção de soja cadastrada'}
            </p>

            <dl className="text-xs space-y-1">
              <div className="flex justify-between">
                <dt className="text-slate-500">Sacas Aquisição</dt>
                <dd className="font-semibold text-slate-800">{Math.round(d.sacasAquisicao).toLocaleString('pt-BR')} sc</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Produção Soja</dt>
                <dd className="font-semibold text-slate-800">{Math.round(d.producaoSoja).toLocaleString('pt-BR')} sc</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Valor Total</dt>
                <dd className="font-semibold text-slate-800">{formatCurrency(d.valorTotal)}</dd>
              </div>
            </dl>

            {alerta && (
              <div className="flex items-center gap-1.5 mt-3 text-[11px] font-bold text-rose-700">
                <AlertTriangle className="w-3.5 h-3.5" /> Compromisso elevado (&gt;30%)
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const TabGraficos: React.FC<{ dados: ImpactoSafra[]; aquisicoes: Aquisicao[] }> = ({ dados, aquisicoes }) => {
  const chartBarras = dados.map((d) => ({
    safra: d.safra,
    'Sacas Aquisição': Math.round(d.sacasAquisicao),
    'Produção Soja': Math.round(d.producaoSoja)
  }));

  const chartPizza = aquisicoes
    .filter((a) => a.valorTotalFluxo > 0)
    .map((a) => ({ nome: a.nomeFazenda, valor: a.valorTotalFluxo }));

  return (
    <div className="space-y-10">
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-4">Sacas de Aquisição vs. Produção por Safra</h3>
        {chartBarras.length === 0 ? (
          <p className="text-sm text-slate-400 py-10 text-center">Sem dados suficientes.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartBarras}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="safra" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => Number(value).toLocaleString('pt-BR')} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Sacas Aquisição" fill="#e11d48" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Produção Soja" fill="#4a6700" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-4">Distribuição por Fazenda (Valor Total)</h3>
        {chartPizza.length === 0 ? (
          <p className="text-sm text-slate-400 py-10 text-center">Sem dados suficientes.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={chartPizza} dataKey="valor" nameKey="nome" cx="50%" cy="50%" outerRadius={100} label>
                {chartPizza.map((_, i) => (
                  <Cell key={i} fill={CORES_PIZZA[i % CORES_PIZZA.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export const AquisicaoFazendaView: React.FC<AquisicaoFazendaViewProps> = ({
  aquisicoes,
  fluxoConsolidado,
  impactoPorSafra,
  onSave,
  onDelete
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Aquisicao | null>(null);

  const areaTotal = aquisicoes.reduce((sum, a) => sum + a.areaTotalHa, 0);

  // "Safra atual" = safra de maior valor entre as parcelas cadastradas — mesma
  // convenção usada em listLancamentosMensais() (Fluxo de Caixa Mensal): a
  // safra mais recente que existe dado real, não uma data "hoje" arbitrária.
  const todasSafras = Array.from(new Set(aquisicoes.flatMap((a) => a.parcelas.map((p) => p.safra)))).sort();
  const safraAtual = todasSafras[todasSafras.length - 1];
  const parcelasSafraAtual = aquisicoes.flatMap((a) => a.parcelas.filter((p) => p.safra === safraAtual));
  const sacasSafraAtual = parcelasSafraAtual.reduce((sum, p) => sum + p.sacas, 0);
  const valorSafraAtual = parcelasSafraAtual.reduce((sum, p) => sum + p.valorTotal, 0);

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
        <KpiCard title="Sacas/Safra Atual" value={`${Math.round(sacasSafraAtual).toLocaleString('pt-BR')} sc`} />
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
            if (activeTabId === 'fluxo') return <TabFluxoPorSafra linhas={fluxoConsolidado} />;
            if (activeTabId === 'impacto') return <TabAnaliseImpacto dados={impactoPorSafra} />;
            if (activeTabId === 'graficos') return <TabGraficos dados={impactoPorSafra} aquisicoes={aquisicoes} />;

            if (aquisicoes.length === 0) {
              return <p className="text-sm text-slate-400 py-10 text-center">Nenhuma aquisição cadastrada ainda.</p>;
            }

            return (
              <div className="space-y-3">
                {aquisicoes.map((a) => (
                  <CardContrato
                    key={a.id}
                    a={a}
                    onEdit={() => handleOpenEdit(a)}
                    onDelete={() => onDelete(a.id)}
                  />
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
