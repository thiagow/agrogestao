'use client';

import React, { useState } from 'react';
import {
  Area,
  AreaChart,
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
import { ContratoArrendamento, ParcelaArrendamento } from '../../types';
import { formatCurrency } from '../../data/initialData';
import { Card, Tabs, Button, Badge, KpiCard } from '../ui';
import { ArrendamentoDrawer } from '../ArrendamentoDrawer';
import type { LinhaFluxoConsolidadoArrendamento, ImpactoSafraArrendamento } from '../../server/arrendamentos';

interface ArrendamentosViewProps {
  arrendamentos: ContratoArrendamento[];
  fluxoConsolidado: LinhaFluxoConsolidadoArrendamento[];
  impactoPorSafra: ImpactoSafraArrendamento[];
  onSave: (data: Partial<ContratoArrendamento>) => void;
  onDelete: (id: string) => void;
}

const CORES_PIZZA = ['#4a6700', '#a3e635', '#65a30d', '#84cc16', '#166534', '#3f6212', '#bef264'];
const COR_SEM_PRECO = '#94a3b8'; // slate-400 — fatia "Sem preço definido" (corrige o BUG #3 da spec)

/** Célula de preço/valor padronizada — "—" quando não há origem de preço, nunca "R$ 0,00" (corrige o BUG #2 da spec). */
function CelulaPreco({ precoSc, origemPreco }: { precoSc?: number; origemPreco?: ParcelaArrendamento['origemPreco'] }) {
  if (!origemPreco || precoSc == null) return <span className="text-slate-400">—</span>;
  return (
    <span className={origemPreco === 'CONTRATO' ? 'text-amber-600 font-semibold' : 'text-blue-600 font-semibold'}>
      {formatCurrency(precoSc)} {origemPreco === 'CONTRATO' ? '✓ref.' : '· cotação'}
    </span>
  );
}

function CelulaValor({ valorTotal }: { valorTotal?: number }) {
  if (valorTotal == null) return <span className="text-slate-400">—</span>;
  return <span className="font-bold text-slate-900">{formatCurrency(valorTotal)}</span>;
}

const CardContrato: React.FC<{ a: ContratoArrendamento; onEdit: () => void; onDelete: () => void }> = ({
  a,
  onEdit,
  onDelete
}) => {
  const [aberto, setAberto] = useState(false);
  const safraInicial = a.parcelas[0]?.safra;
  const safraFinal = a.parcelas[a.parcelas.length - 1]?.safra;
  const semPrecoDefinido = a.parcelas.some((p) => !p.origemPreco);
  // Nenhuma parcela com preço definido: valorTotalFluxo é 0 por soma de
  // ausências, não um custo real zerado — mostrar "—" em vez de "R$ 0,00"
  // (mesmo critério de CelulaValor, corrige o BUG #2 também aqui no cabeçalho
  // do card, não só nas tabelas de fluxo).
  const nenhumaParcelaComPreco = a.parcelas.length > 0 && a.parcelas.every((p) => !p.origemPreco);

  return (
    <div className="rounded-xl border border-slate-200/80 overflow-hidden">
      <div className="p-4 bg-slate-50">
        <div className="flex items-start justify-between gap-3">
          <button onClick={() => setAberto((v) => !v)} className="flex items-start gap-2 text-left flex-1 min-w-0">
            {aberto ? (
              <ChevronDown className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-500 shrink-0" /> {a.nomeFazenda}
                </p>
                <Badge tone={a.status === 'ATIVO' ? 'emerald' : 'slate'}>{a.status}</Badge>
              </div>
              {a.municipio && <p className="text-xs text-slate-500 mt-0.5">{a.municipio}</p>}
            </div>
          </button>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="text-right mr-2">
              <p className="text-[11px] text-slate-500">Custo Anual Total</p>
              <p className="font-extrabold text-slate-900">
                {nenhumaParcelaComPreco ? <span className="text-slate-400">—</span> : formatCurrency(a.valorTotalFluxo)}
              </p>
              {a.totalSacas > 0 && (
                <p className="text-[11px] text-slate-500">{Math.round(a.totalSacas).toLocaleString('pt-BR')} sc total</p>
              )}
            </div>
            <button onClick={onEdit} className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={onDelete} className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition">
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
          <Badge tone="slate">{a.areaArrendadaHa.toLocaleString('pt-BR')} ha</Badge>
          <Badge tone="emerald">{a.periodicidade.toUpperCase()}</Badge>
          {semPrecoDefinido && (
            <Badge tone="amber">
              <AlertTriangle className="w-3 h-3 inline mr-1" /> Preço não definido
            </Badge>
          )}
        </div>
      </div>

      {aberto && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-600 font-bold bg-white">
                <th className="py-2.5 px-4">Safra</th>
                <th className="py-2.5 px-4 text-right">Sacas Brutas</th>
                <th className="py-2.5 px-4 text-right">(-) Antecipado</th>
                <th className="py-2.5 px-4 text-right">Sacas Líquidas</th>
                <th className="py-2.5 px-4 text-right">Preço/sc</th>
                <th className="py-2.5 px-4 text-right">Valor Total</th>
              </tr>
            </thead>
            <tbody>
              {a.parcelas.map((p) => (
                <tr key={p.safra} className="border-b border-slate-100 text-sm">
                  <td className="py-2.5 px-4 font-semibold text-slate-800">{p.safra}</td>
                  <td className="py-2.5 px-4 text-right">
                    {p.sacasBrutas > 0 ? `${Math.round(p.sacasBrutas).toLocaleString('pt-BR')} sc` : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-right text-rose-600">
                    {p.sacasAntecipadas > 0 ? `-${Math.round(p.sacasAntecipadas).toLocaleString('pt-BR')} sc` : ''}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    {p.sacasLiquidas > 0 ? `${Math.round(p.sacasLiquidas).toLocaleString('pt-BR')} sc` : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <CelulaPreco precoSc={p.precoSc} origemPreco={p.origemPreco} />
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <CelulaValor valorTotal={p.valorTotal} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const TabFluxoPorSafra: React.FC<{ linhas: LinhaFluxoConsolidadoArrendamento[] }> = ({ linhas }) => {
  if (linhas.length === 0) {
    return <p className="text-sm text-slate-400 py-10 text-center">Nenhuma parcela cadastrada ainda.</p>;
  }

  const totalSacas = linhas.reduce((s, l) => s + l.sacasLiquidas, 0);
  const totalValor = linhas.reduce((s, l) => s + (l.valorTotal ?? 0), 0);
  const linhasSemPreco = linhas.filter((l) => l.valorTotal == null).length;

  return (
    <div>
      <h3 className="text-sm font-bold text-slate-900 mb-4">Fluxo Consolidado de Arrendamento</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-600 font-bold">
              <th className="py-2.5 px-4">Safra</th>
              <th className="py-2.5 px-4">Fazenda</th>
              <th className="py-2.5 px-4">Cultura</th>
              <th className="py-2.5 px-4 text-right">Sacas Brutas</th>
              <th className="py-2.5 px-4 text-right">(-) Antecipado</th>
              <th className="py-2.5 px-4 text-right">Sacas Líquidas</th>
              <th className="py-2.5 px-4 text-right">Preço/sc</th>
              <th className="py-2.5 px-4 text-right">Valor Total</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l, i) => (
              <tr key={i} className="border-b border-slate-100 text-sm">
                <td className="py-2.5 px-4 font-semibold text-slate-800">{l.safra}</td>
                <td className="py-2.5 px-4 text-slate-700">{l.fazenda}</td>
                <td className="py-2.5 px-4 text-slate-600">{l.cultura}</td>
                <td className="py-2.5 px-4 text-right">
                  {l.sacasBrutas > 0 ? `${Math.round(l.sacasBrutas).toLocaleString('pt-BR')} sc` : '—'}
                </td>
                <td className="py-2.5 px-4 text-right text-rose-600">
                  {l.sacasAntecipadas > 0 ? `-${Math.round(l.sacasAntecipadas).toLocaleString('pt-BR')} sc` : ''}
                </td>
                <td className="py-2.5 px-4 text-right">
                  {l.sacasLiquidas > 0 ? `${Math.round(l.sacasLiquidas).toLocaleString('pt-BR')} sc` : '—'}
                </td>
                <td className="py-2.5 px-4 text-right">
                  <CelulaPreco precoSc={l.precoSc ?? undefined} origemPreco={l.origemPreco ?? undefined} />
                </td>
                <td className="py-2.5 px-4 text-right">
                  <CelulaValor valorTotal={l.valorTotal ?? undefined} />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="text-sm font-bold text-slate-900 bg-slate-50">
              <td className="py-2.5 px-4" colSpan={5}>
                TOTAL
              </td>
              <td className="py-2.5 px-4 text-right">{Math.round(totalSacas).toLocaleString('pt-BR')} sc</td>
              <td className="py-2.5 px-4" />
              <td className="py-2.5 px-4 text-right">{formatCurrency(totalValor)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      {linhasSemPreco > 0 && (
        <p className="text-[11px] text-amber-700 flex items-center gap-1.5 mt-2">
          <AlertTriangle className="w-3.5 h-3.5" /> {linhasSemPreco}{' '}
          {linhasSemPreco === 1 ? 'linha está' : 'linhas estão'} sem preço definido — o total financeiro acima é parcial (não
          inclui essas linhas; as sacas continuam somadas).
        </p>
      )}
    </div>
  );
};

function corFaixaImpacto(pct: number | null): string {
  if (pct === null) return 'text-slate-500';
  if (pct > 30) return 'text-rose-600';
  if (pct > 15) return 'text-amber-600';
  return 'text-emerald-600';
}

const TabAnaliseImpacto: React.FC<{ dados: ImpactoSafraArrendamento[] }> = ({ dados }) => {
  if (dados.length === 0) {
    return <p className="text-sm text-slate-400 py-10 text-center">Nenhuma parcela cadastrada ainda.</p>;
  }

  return (
    <div>
      <h3 className="text-sm font-bold text-slate-900 mb-4">Impacto do Arrendamento sobre a Produção</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-600 font-bold">
              <th className="py-2.5 px-4">Safra</th>
              <th className="py-2.5 px-4 text-right">Sacas Arrendamento</th>
              <th className="py-2.5 px-4 text-right">Produção Soja</th>
              <th className="py-2.5 px-4 text-right">% Comprometido</th>
              <th className="py-2.5 px-4 text-right">Valor Total (R$)</th>
            </tr>
          </thead>
          <tbody>
            {dados.map((d) => (
              <tr key={d.safra} className="border-b border-slate-100 text-sm">
                <td className="py-2.5 px-4 font-semibold text-slate-800">{d.safra}</td>
                <td className="py-2.5 px-4 text-right">{Math.round(d.sacasArrendamento).toLocaleString('pt-BR')} sc</td>
                <td className="py-2.5 px-4 text-right">
                  {d.producaoSoja > 0 ? `${Math.round(d.producaoSoja).toLocaleString('pt-BR')} sc` : '—'}
                </td>
                <td className={`py-2.5 px-4 text-right font-bold ${corFaixaImpacto(d.percentualImpacto)}`}>
                  {d.percentualImpacto !== null
                    ? `${d.percentualImpacto.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
                    : 'N/D'}
                </td>
                <td className="py-2.5 px-4 text-right font-bold text-slate-900">{formatCurrency(d.valorTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-4 mt-3 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> ≤15% normal
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> 15–30% atenção
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> &gt;30% crítico
        </span>
      </div>
    </div>
  );
};

const TabGraficos: React.FC<{ dados: ImpactoSafraArrendamento[]; arrendamentos: ContratoArrendamento[] }> = ({
  dados,
  arrendamentos
}) => {
  const chartBarras = dados.map((d) => ({
    safra: d.safra,
    Arrendamento: Math.round(d.sacasArrendamento),
    'Produção Soja': Math.round(d.producaoSoja)
  }));

  // Inclui TODAS as fazendas ativas, mesmo as com custo nulo/indefinido —
  // fatia cinza rotulada em vez de desaparecer (corrige o BUG #3 da spec).
  const ativos = arrendamentos.filter((a) => a.status === 'ATIVO');
  const chartPizza = ativos.map((a) => ({
    nome: a.nomeFazenda,
    valor: a.valorTotalFluxo > 0 ? a.valorTotalFluxo : 0.0001,
    semPreco: a.valorTotalFluxo <= 0
  }));

  const chartArea = dados.map((d) => ({
    safra: d.safra,
    '% Comprometido': d.percentualImpacto !== null ? Number(d.percentualImpacto.toFixed(1)) : 0
  }));

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-4">Sacas de Arrendamento vs. Produção por Safra</h3>
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
                <Bar dataKey="Produção Soja" fill="#4a6700" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Arrendamento" fill="#e11d48" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-4">Custo por Fazenda (R$)</h3>
          {chartPizza.length === 0 ? (
            <p className="text-sm text-slate-400 py-10 text-center">Sem dados suficientes.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={chartPizza} dataKey="valor" nameKey="nome" cx="50%" cy="50%" outerRadius={100} label>
                  {chartPizza.map((entry, i) => (
                    <Cell key={i} fill={entry.semPreco ? COR_SEM_PRECO : CORES_PIZZA[i % CORES_PIZZA.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, _name, item) =>
                    item?.payload?.semPreco ? 'Sem preço definido' : formatCurrency(Number(value))
                  }
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-4">% da Produção Comprometida com Arrendamento por Safra</h3>
        {chartArea.length === 0 ? (
          <p className="text-sm text-slate-400 py-10 text-center">Sem dados suficientes.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartArea}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="safra" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Area type="monotone" dataKey="% Comprometido" stroke="#e11d48" fill="#e11d48" fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export const ArrendamentosView: React.FC<ArrendamentosViewProps> = ({
  arrendamentos,
  fluxoConsolidado,
  impactoPorSafra,
  onSave,
  onDelete
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ContratoArrendamento | null>(null);

  const ativos = arrendamentos.filter((a) => a.status === 'ATIVO');
  const areaTotal = ativos.reduce((sum, a) => sum + a.areaArrendadaHa, 0);

  // "Safra atual" = safra de maior valor entre as parcelas cadastradas — mesma
  // convenção usada em Aquisição de Fazendas (AquisicaoFazendaView.tsx) e em
  // listLancamentosMensais(): a safra mais recente que existe dado real.
  const todasSafras = Array.from(new Set(ativos.flatMap((a) => a.parcelas.map((p) => p.safra)))).sort();
  const safraAtual = todasSafras[todasSafras.length - 1];
  const parcelasSafraAtual = ativos.flatMap((a) => a.parcelas.filter((p) => p.safra === safraAtual));
  const sacasSafraAtual = parcelasSafraAtual.reduce((sum, p) => sum + p.sacasLiquidas, 0);
  const valorSafraAtual = parcelasSafraAtual.reduce((sum, p) => sum + (p.valorTotal ?? 0), 0);
  const custoParcial = parcelasSafraAtual.some((p) => p.valorTotal == null);

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
        <KpiCard title="Sacas/ano (Safra Atual)" value={`${Math.round(sacasSafraAtual).toLocaleString('pt-BR')} sc`} />
        <KpiCard
          title="Custo Anual (Safra Atual)"
          value={formatCurrency(valorSafraAtual)}
          valueClassName="text-rose-800"
          status={custoParcial ? 'Atenção' : undefined}
          subtitle={custoParcial ? 'Parcial — falta preço em algum contrato' : undefined}
        />
        <KpiCard title="Contratos Ativos" value={ativos.length.toString()} />
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
            if (activeTabId === 'fluxo') return <TabFluxoPorSafra linhas={fluxoConsolidado} />;
            if (activeTabId === 'impacto') return <TabAnaliseImpacto dados={impactoPorSafra} />;
            if (activeTabId === 'graficos') return <TabGraficos dados={impactoPorSafra} arrendamentos={arrendamentos} />;

            if (arrendamentos.length === 0) {
              return <p className="text-sm text-slate-400 py-10 text-center">Nenhum contrato de arrendamento cadastrado ainda.</p>;
            }

            return (
              <div className="space-y-3">
                {arrendamentos.map((a) => (
                  <CardContrato key={a.id} a={a} onEdit={() => handleOpenEdit(a)} onDelete={() => onDelete(a.id)} />
                ))}
              </div>
            );
          }}
        </Tabs>
      </Card>

      <ArrendamentoDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} onSave={onSave} editingArrendamento={editing} />
    </div>
  );
};
