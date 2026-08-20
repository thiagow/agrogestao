'use client';

import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Plus, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { ContratoComercial, TipoContratoComercial, CulturaSafraAno, Cultura, Cotacao } from '../../types';
import { formatCurrency, formatDateBR } from '../../data/initialData';
import { Card, Tabs, Button, KpiCard, Badge, Select } from '../ui';
import { ContratoComercialDrawer } from '../ContratoComercialDrawer';
import { calcularPosicaoComercializacao, PosicaoCultura, PosicaoComprador } from '../../lib/comercializacao';

interface ComercializacaoViewProps {
  culturaSafras: CulturaSafraAno[];
  culturas: Cultura[];
  cotacoes: Cotacao[];
  contratos: ContratoComercial[];
  onSave: (data: Partial<ContratoComercial>) => void;
  onDelete: (id: string) => void;
}

const TIPO_CONTRATO_LABEL: Record<TipoContratoComercial, string> = {
  FUTURO: 'Futuro',
  VENDA_A_TERMO: 'Venda a Termo',
  HEDGE_CALL: 'Hedge Call',
  HEDGE_PUT: 'Hedge Put'
};

/** "—" em vez de "R$ 0" quando não há cotação/valor calculável — mesmo critério já usado em Arrendamentos (BUG #2 da spec). */
function CelulaValor({ valor }: { valor: number | null }) {
  if (valor == null) return <span className="text-slate-400">—</span>;
  return <>{formatCurrency(valor)}</>;
}

function badgeConcentracao(pct: number): { tone: 'emerald' | 'amber' | 'rose'; label: string } {
  if (pct > 50) return { tone: 'rose', label: 'Concentração crítica' };
  if (pct > 30) return { tone: 'amber', label: 'Atenção' };
  return { tone: 'emerald', label: 'Normal' };
}

const CORES_COMPRADOR = ['#4a6700', '#a3e635', '#65a30d', '#84cc16', '#166534', '#3f6212', '#bef264', '#0f766e'];

export const ComercializacaoView: React.FC<ComercializacaoViewProps> = ({
  culturaSafras,
  culturas,
  cotacoes,
  contratos,
  onSave,
  onDelete
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ContratoComercial | null>(null);
  const [filtroSafraContratos, setFiltroSafraContratos] = useState<string>('TODAS');

  const safrasDisponiveis = useMemo(
    () => Array.from(new Set(culturaSafras.map((r) => r.anoSafra))).sort(),
    [culturaSafras]
  );
  const [safraSelecionada, setSafraSelecionada] = useState<string>('');
  const safraAtiva = safraSelecionada || safrasDisponiveis[safrasDisponiveis.length - 1] || '';

  const { porCultura, porComprador } = useMemo(
    () => calcularPosicaoComercializacao({ quadroSafra: culturaSafras, contratos, cotacoes, safra: safraAtiva }),
    [culturaSafras, contratos, cotacoes, safraAtiva]
  );

  const producaoTotal = porCultura.reduce((sum, p) => sum + p.producaoTotal, 0);
  const qtdFixada = porCultura.reduce((sum, p) => sum + p.quantidadeFixada, 0);
  const qtdAFixar = porCultura.reduce((sum, p) => sum + p.quantidadeAFixar, 0);
  const receitaFixada = porCultura.reduce((sum, p) => sum + p.receitaFixada, 0);
  const culturasComCotacao = porCultura.filter((p) => p.valorAMercado != null);
  const receitaAMercado = culturasComCotacao.reduce((sum, p) => sum + (p.valorAMercado ?? 0), 0);
  const algumaCulturaSemCotacao = porCultura.some((p) => p.quantidadeAFixar > 0 && p.valorAMercado == null);
  const precoMedioFixado = qtdFixada > 0 ? receitaFixada / qtdFixada : 0;
  const percentFixado = producaoTotal > 0 ? (qtdFixada / producaoTotal) * 100 : 0;

  const contratosFiltrados =
    filtroSafraContratos === 'TODAS' ? contratos : contratos.filter((c) => c.safra === filtroSafraContratos);

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="w-full sm:w-56">
          <Select label="Safra" value={safraAtiva} onChange={(e) => setSafraSelecionada(e.target.value)}>
            {safrasDisponiveis.length === 0 && <option value="">Nenhuma safra cadastrada</option>}
            {safrasDisponiveis.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
        <Button
          variant="primary"
          onClick={handleOpenNew}
          className="w-auto flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" /> Novo Contrato
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard title="Produção Total" value={`${producaoTotal.toLocaleString('pt-BR')} sc`} subtitle={`Safra ${safraAtiva || '—'}`} />
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
          subtitle={
            algumaCulturaSemCotacao
              ? `+ ${formatCurrency(receitaAMercado)} a mercado (parcial — falta cotação de alguma cultura)`
              : `+ ${formatCurrency(receitaAMercado)} a mercado`
          }
          status={algumaCulturaSemCotacao ? 'Atenção' : undefined}
        />
      </div>

      <Card className="p-5">
        <p className="text-xs font-semibold text-slate-600 mb-2">Progresso de Comercialização — Safra {safraAtiva || '—'}</p>
        <div className="w-full h-3 rounded-full bg-amber-100 overflow-hidden flex">
          <div className="h-full bg-[#4a6700]" style={{ width: `${percentFixado}%` }} />
        </div>
        <div className="flex justify-between text-[11px] text-slate-500 mt-1.5">
          <span>
            {Math.round(qtdFixada).toLocaleString('pt-BR')} sc fixadas — {formatCurrency(receitaFixada)}
          </span>
          <span>
            {Math.round(qtdAFixar).toLocaleString('pt-BR')} sc a fixar — {formatCurrency(receitaAMercado)} a mercado
          </span>
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
            if (activeTabId === 'posicao') return <TabPosicaoPorCultura dados={porCultura} />;
            if (activeTabId === 'contratos') {
              return (
                <TabContratos
                  contratos={contratosFiltrados}
                  safrasDisponiveis={safrasDisponiveis}
                  filtroSafra={filtroSafraContratos}
                  onFiltroSafraChange={setFiltroSafraContratos}
                  onNovo={handleOpenNew}
                  onEdit={handleOpenEdit}
                  onDelete={onDelete}
                />
              );
            }
            if (activeTabId === 'comprador') return <TabPorComprador dados={porComprador} />;
            return (
              <TabGraficos
                porCultura={porCultura}
                producaoTotal={producaoTotal}
                qtdFixada={qtdFixada}
                percentFixado={percentFixado}
                precoMedioFixado={precoMedioFixado}
              />
            );
          }}
        </Tabs>
      </Card>

      <ContratoComercialDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={onSave}
        editingContrato={editing}
        culturas={culturas}
      />
    </div>
  );
};

const TabPosicaoPorCultura: React.FC<{ dados: PosicaoCultura[] }> = ({ dados }) => {
  if (dados.length === 0) {
    return <p className="text-sm text-slate-400 py-10 text-center">Nenhuma cultura cadastrada no Quadro de Safra para esta safra.</p>;
  }

  const totalProducao = dados.reduce((s, d) => s + d.producaoTotal, 0);
  const totalFixado = dados.reduce((s, d) => s + d.quantidadeFixada, 0);
  const totalAFixar = dados.reduce((s, d) => s + d.quantidadeAFixar, 0);
  const totalReceita = dados.reduce((s, d) => s + d.receitaFixada, 0);
  const totalMercado = dados.reduce((s, d) => s + (d.valorAMercado ?? 0), 0);

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
          {dados.map((p) => (
            <tr key={p.cultura} className="hover:bg-slate-50/60">
              <td className="py-3 px-4 font-bold text-slate-900">{p.cultura}</td>
              <td className="py-3 px-4 text-right font-medium text-slate-600">{p.producaoTotal.toLocaleString('pt-BR')} sc</td>
              <td className="py-3 px-4 text-right text-slate-600">
                {Math.round(p.quantidadeFixada).toLocaleString('pt-BR')} (
                {p.producaoTotal > 0 ? ((p.quantidadeFixada / p.producaoTotal) * 100).toFixed(0) : 0}%)
              </td>
              <td className="py-3 px-4 text-right text-slate-600">
                {Math.round(p.quantidadeAFixar).toLocaleString('pt-BR')} (
                {p.producaoTotal > 0 ? ((p.quantidadeAFixar / p.producaoTotal) * 100).toFixed(0) : 0}%)
              </td>
              <td className="py-3 px-4 text-right font-semibold text-slate-800">{formatCurrency(p.receitaFixada)}</td>
              <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                <CelulaValor valor={p.valorAMercado} />
              </td>
              <td className="py-3 px-4 text-right text-slate-600">
                {p.cotacao != null ? `${formatCurrency(p.cotacao)}/sc` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold text-xs text-slate-900">
            <td className="py-3 px-4">TOTAL</td>
            <td className="py-3 px-4 text-right">{totalProducao.toLocaleString('pt-BR')} sc</td>
            <td className="py-3 px-4 text-right">{Math.round(totalFixado).toLocaleString('pt-BR')} sc</td>
            <td className="py-3 px-4 text-right">{Math.round(totalAFixar).toLocaleString('pt-BR')} sc</td>
            <td className="py-3 px-4 text-right">{formatCurrency(totalReceita)}</td>
            <td className="py-3 px-4 text-right">{formatCurrency(totalMercado)}</td>
            <td className="py-3 px-4" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

const TabContratos: React.FC<{
  contratos: ContratoComercial[];
  safrasDisponiveis: string[];
  filtroSafra: string;
  onFiltroSafraChange: (safra: string) => void;
  onNovo: () => void;
  onEdit: (c: ContratoComercial) => void;
  onDelete: (id: string) => void;
}> = ({ contratos, safrasDisponiveis, filtroSafra, onFiltroSafraChange, onNovo, onEdit, onDelete }) => (
  <div>
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div className="w-48">
        <Select value={filtroSafra} onChange={(e) => onFiltroSafraChange(e.target.value)}>
          <option value="TODAS">Todas as safras</option>
          {safrasDisponiveis.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>
      <Button variant="primary" onClick={onNovo} className="w-auto flex items-center gap-1.5 px-3.5 py-2 text-xs">
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
              <th className="py-3 px-4">Safra</th>
              <th className="py-3 px-4">Comprador</th>
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
                <td className="py-3 px-4 text-slate-600">{c.safra}</td>
                <td className="py-3 px-4 text-slate-600">{c.compradorNome || '—'}</td>
                <td className="py-3 px-4">
                  <Badge tone="blue">{TIPO_CONTRATO_LABEL[c.tipoContrato]}</Badge>
                </td>
                <td className="py-3 px-4 text-right">{c.quantidadeSc.toLocaleString('pt-BR')} sc</td>
                <td className="py-3 px-4 text-right font-semibold">{formatCurrency(c.precoFixado)}</td>
                <td className="py-3 px-4">{formatDateBR(c.dataVencimento)}</td>
                <td className="py-3 px-4 text-center">
                  <Badge tone={c.status === 'ATIVO' ? 'emerald' : c.status === 'LIQUIDADO' ? 'blue' : 'rose'}>{c.status}</Badge>
                </td>
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(c)}
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

const TabPorComprador: React.FC<{ dados: PosicaoComprador[] }> = ({ dados }) => {
  if (dados.length === 0) {
    return <p className="text-sm text-slate-400 py-10 text-center">Sem contratos para esta safra.</p>;
  }

  const chartData = dados.map((d) => ({ nome: d.comprador, Volume: Math.round(d.quantidadeSc), Valor: Math.round(d.receitaFixada) }));

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-4">Concentração por Comprador</h3>
        <div className="space-y-2">
          {dados.map((d) => {
            const badge = badgeConcentracao(d.percentualConcentracao);
            return (
              <div key={d.comprador} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 bg-slate-50">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">{d.comprador}</p>
                  <p className="text-[11px] text-slate-500">
                    {Math.round(d.quantidadeSc).toLocaleString('pt-BR')} sc · {formatCurrency(d.receitaFixada)}
                  </p>
                </div>
                <div className="w-32 h-2 rounded-full bg-slate-200 overflow-hidden shrink-0">
                  <div
                    className={badge.tone === 'rose' ? 'h-full bg-rose-500' : badge.tone === 'amber' ? 'h-full bg-amber-500' : 'h-full bg-emerald-500'}
                    style={{ width: `${d.percentualConcentracao}%` }}
                  />
                </div>
                <p className="text-sm font-bold text-slate-800 w-14 text-right shrink-0">{d.percentualConcentracao.toFixed(1)}%</p>
                <Badge tone={badge.tone}>
                  {badge.tone === 'rose' && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                  {badge.label}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-4">Volume por Comprador (sc)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="nome" tick={{ fontSize: 11 }} width={100} />
              <Tooltip formatter={(value) => Number(value).toLocaleString('pt-BR')} />
              <Bar dataKey="Volume" radius={[0, 4, 4, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={CORES_COMPRADOR[i % CORES_COMPRADOR.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-4">Valor por Comprador (R$)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="nome" tick={{ fontSize: 11 }} width={100} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="Valor" fill="#4a6700" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const TabGraficos: React.FC<{
  porCultura: PosicaoCultura[];
  producaoTotal: number;
  qtdFixada: number;
  percentFixado: number;
  precoMedioFixado: number;
}> = ({ porCultura, producaoTotal, qtdFixada, percentFixado, precoMedioFixado }) => {
  // Mostra TODAS as culturas da safra, sem cortar em top-N — resolve o "BUG
  // candidato #3" da spec (gráficos com só 5 das 8 culturas, sem confirmação
  // se era corte intencional) da forma mais simples: nunca corta.
  const chartVolume = porCultura.map((p) => ({
    cultura: p.cultura,
    Fixado: Math.round(p.quantidadeFixada),
    'A Fixar': Math.round(p.quantidadeAFixar)
  }));
  const chartValor = porCultura.map((p) => ({
    cultura: p.cultura,
    'Valor Fixado': Math.round(p.receitaFixada),
    'Valor Mercado': p.valorAMercado != null ? Math.round(p.valorAMercado) : 0
  }));

  if (porCultura.length === 0) {
    return <p className="text-sm text-slate-400 py-10 text-center">Sem dados suficientes.</p>;
  }

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-4">Volume por Cultura (sacas)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartVolume}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="cultura" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => Number(value).toLocaleString('pt-BR')} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Fixado" fill="#4a6700" radius={[4, 4, 0, 0]} />
              <Bar dataKey="A Fixar" fill="#e11d48" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-4">Valor por Cultura (R$)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartValor}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="cultura" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Valor Fixado" fill="#4a6700" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Valor Mercado" fill="#a3e635" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
        <div>
          <p className="text-[11px] text-slate-500">Produção Total</p>
          <p className="font-bold text-slate-900">{producaoTotal.toLocaleString('pt-BR')} sc</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500">Fixado</p>
          <p className="font-bold text-slate-900">{percentFixado.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500">A Fixar</p>
          <p className="font-bold text-slate-900">{(100 - percentFixado).toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500">Preço Médio Fixado</p>
          <p className="font-bold text-slate-900">{precoMedioFixado > 0 ? formatCurrency(precoMedioFixado) : '—'}</p>
        </div>
      </div>
    </div>
  );
};
