'use client';

import React, { useMemo, useState } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis
} from 'recharts';
import { AlertTriangle, ChevronDown, Plus } from 'lucide-react';
import type { Aquisicao, ContratoArrendamento, Cultura, CulturaSafraAno, ItemLancamentoManualMensal, Supplier } from '../../types';
import { formatCurrency } from '../../data/initialData';
import {
  calcularFluxoMensal,
  gerarLancamentosCusteioSafraProjecao,
  gerarLancamentosManuais,
  gerarLancamentosVinculados,
  horizonteMeses,
  type ContratoBancarioParcelaFluxo
} from '../../lib/fluxo-mensal-calc';
import {
  CALENDARIO_AGRICOLA_CENTRO_OESTE,
  categoriaCalendarioDaCultura,
  etapaCalendarioDaCategoria
} from '../../lib/calendario-agricola';
import { Card, KpiCard, Badge, Select, Button } from '../ui';
import { LancamentoMensalModal } from '../LancamentoMensalModal';
import type { FluxoDetalhado } from '../../server/contratos-bancarios';
import type { TipoOrigemLancamentoMensal } from '../../types';

interface FluxoMensalViewProps {
  culturaSafras: CulturaSafraAno[];
  suppliers: Supplier[];
  fluxoDetalhado?: FluxoDetalhado;
  arrendamentos: ContratoArrendamento[];
  aquisicoes: Aquisicao[];
  culturas: Cultura[];
  itensManuais: ItemLancamentoManualMensal[];
  onSaveItem: (data: Partial<ItemLancamentoManualMensal>) => void;
  onDeleteItem: (id: string) => void;
}

const BADGE_ORIGEM: Record<TipoOrigemLancamentoMensal, { tone: 'slate' | 'blue' | 'amber'; label: string }> = {
  CUSTEIO: { tone: 'slate', label: 'Custeio' },
  SAFRA: { tone: 'slate', label: 'Safra' },
  VINCULADO: { tone: 'blue', label: 'Vinculado' },
  PROJECAO: { tone: 'amber', label: 'Projeção' },
  MANUAL: { tone: 'blue', label: 'Manual' }
};

export const FluxoMensalView: React.FC<FluxoMensalViewProps> = ({
  culturaSafras,
  suppliers,
  fluxoDetalhado,
  arrendamentos,
  aquisicoes,
  culturas,
  itensManuais,
  onSaveItem,
  onDeleteItem
}) => {
  const safrasDisponiveis = useMemo(() => Array.from(new Set(culturaSafras.map((r) => r.anoSafra))).sort(), [culturaSafras]);
  const [safraSelecionada, setSafraSelecionada] = useState('');
  const safraAtiva = safraSelecionada || safrasDisponiveis[safrasDisponiveis.length - 1] || '';

  const [multiSafra, setMultiSafra] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mesesAbertos, setMesesAbertos] = useState<Set<string>>(() => new Set());

  const horizonte = useMemo(() => (safraAtiva ? horizonteMeses(safraAtiva) : []), [safraAtiva]);

  const contratosBancarios: ContratoBancarioParcelaFluxo[] = useMemo(
    () => (fluxoDetalhado?.contratos ?? []).map((c) => ({ banco: c.banco, anos: c.anos })),
    [fluxoDetalhado]
  );

  const lancamentos = useMemo(() => {
    if (!safraAtiva) return [];
    const custeioSafraProjecao = gerarLancamentosCusteioSafraProjecao({
      quadroSafra: culturaSafras,
      safraSelecionada: safraAtiva,
      multiSafra,
      horizonte
    });
    const vinculados = gerarLancamentosVinculados({
      suppliers,
      contratosBancarios,
      arrendamentos,
      aquisicoes,
      safraSelecionada: safraAtiva,
      multiSafra
    });
    const manuais = gerarLancamentosManuais(itensManuais.filter((i) => horizonte.some((h) => h.mes === i.mes && h.ano === i.ano)));
    return [...custeioSafraProjecao, ...vinculados, ...manuais];
  }, [safraAtiva, culturaSafras, multiSafra, horizonte, suppliers, contratosBancarios, arrendamentos, aquisicoes, itensManuais]);

  const calculado = useMemo(() => calcularFluxoMensal(lancamentos, horizonte), [lancamentos, horizonte]);

  const situacaoRisco = calculado.mesesSaldoAcumuladoNegativo > 0;

  const chartData = calculado.resumoPorMes.map((m) => ({
    mes: m.label,
    entradas: m.entradas,
    saidas: -m.saidas,
    saldoAcumulado: m.saldoAcumulado
  }));

  const categoriasPresentes = useMemo(() => {
    const categorias = new Set(culturaSafras.map((r) => categoriaCalendarioDaCultura(r.cultura)));
    if (categorias.size === 0) return CALENDARIO_AGRICOLA_CENTRO_OESTE;
    return CALENDARIO_AGRICOLA_CENTRO_OESTE.filter((e) => categorias.has(e.categoria));
  }, [culturaSafras]);

  const toggleMes = (chave: string) =>
    setMesesAbertos((prev) => {
      const next = new Set(prev);
      if (next.has(chave)) next.delete(chave);
      else next.add(chave);
      return next;
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
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
          <button
            type="button"
            onClick={() => setMultiSafra((v) => !v)}
            className={`h-[42px] rounded-xl border px-4 text-xs font-bold uppercase tracking-wide transition ${
              multiSafra
                ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
            title="Consolida lançamentos de todas as safras cadastradas que caiam dentro deste calendário de 18 meses"
          >
            Multi-Safra {multiSafra ? 'ON' : 'OFF'}
          </button>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          disabled={!safraAtiva}
          className="w-auto flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" /> Lançamento
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Entradas" value={formatCurrency(calculado.totalEntradas)} valueClassName="text-emerald-700" />
        <KpiCard title="Total Saídas" value={formatCurrency(calculado.totalSaidas)} valueClassName="text-rose-800" />
        <KpiCard
          title="Resultado Líquido"
          value={formatCurrency(calculado.resultadoLiquido)}
          valueClassName={calculado.resultadoLiquido >= 0 ? 'text-emerald-700' : 'text-rose-700'}
        />
        <KpiCard
          icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
          title="Situação"
          value={situacaoRisco ? 'Risco' : 'Saudável'}
          subtitle={`${calculado.mesesSaldoAcumuladoNegativo} meses com saldo acumulado negativo`}
          status={situacaoRisco ? 'Atenção' : 'Excelente'}
        />
      </div>

      <Card className="p-6">
        <h3 className="text-base font-bold text-slate-900 mb-1">Curva de Caixa</h3>
        <p className="text-xs text-slate-500 mb-4">Safra {safraAtiva || '—'} — {horizonte.length} meses</p>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} interval={0} angle={-45} textAnchor="end" height={50} />
            <YAxis
              tick={{ fontSize: 10, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`}
            />
            <RechartsTooltip formatter={(value, name) => [formatCurrency(Math.abs(Number(value))), name]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="entradas" name="Entradas" fill="#16a34a" radius={[4, 4, 0, 0]} />
            <Bar dataKey="saidas" name="Saídas" fill="#dc2626" radius={[0, 0, 4, 4]} />
            <Line type="monotone" dataKey="saldoAcumulado" name="Saldo Acum." stroke="#1d4ed8" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6">
        <h3 className="text-base font-bold text-slate-900 mb-4">Calendário Agrícola — Centro-Oeste</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-slate-600 font-bold">
                <th className="py-2 px-3">Cultura</th>
                {Array.from({ length: 12 }, (_, i) => (
                  <th key={i} className="py-2 px-2 text-center">
                    {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][i]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-xs text-slate-700">
              {categoriasPresentes.map((etapa) => (
                <tr key={etapa.categoria} className="border-t border-slate-100">
                  <td className="py-2 px-3 font-semibold text-slate-800 whitespace-nowrap">{etapa.label}</td>
                  {etapa.fasesPorMes.map((fase, idx) => (
                    <td key={idx} className="py-2 px-2 text-center">
                      <span
                        className={`inline-block w-3 h-3 rounded-full ${
                          fase === 'PLANTIO_CUSTEIO'
                            ? 'bg-amber-500'
                            : fase === 'COLHEITA_RECEITA'
                            ? 'bg-emerald-500'
                            : fase === 'CRESCIMENTO'
                            ? 'bg-sky-300'
                            : 'bg-slate-100'
                        }`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-4 mt-4 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-amber-500" /> Plantio/Custeio
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-sky-300" /> Crescimento
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-emerald-500" /> Colheita/Receita
          </span>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-base font-bold text-slate-900 mb-1">Lançamentos Mensais</h3>
        <p className="text-xs text-slate-500 mb-4">{calculado.totalLancamentos} registros nesta janela de {horizonte.length} meses</p>

        <div className="space-y-2">
          {calculado.resumoPorMes.map((m) => {
            const chave = `${m.ano}-${m.mes}`;
            const aberto = mesesAbertos.has(chave);
            return (
              <div key={chave} className="border border-slate-100 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleMes(chave)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 transition text-left"
                >
                  <span className="flex items-center gap-2 font-bold text-sm text-slate-800">
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${aberto ? 'rotate-180' : ''}`} />
                    {m.label}
                  </span>
                  <span className="flex items-center gap-4 text-xs">
                    <span className="text-emerald-700 font-semibold">+{formatCurrency(m.entradas)}</span>
                    <span className="text-rose-700 font-semibold">-{formatCurrency(m.saidas)}</span>
                    <span className={`font-bold ${m.saldoMes >= 0 ? 'text-slate-800' : 'text-rose-800'}`}>
                      {formatCurrency(m.saldoMes)}
                    </span>
                  </span>
                </button>
                {aberto && (
                  <div className="divide-y divide-slate-50">
                    {m.lancamentos.length === 0 && (
                      <p className="px-4 py-3 text-xs text-slate-400">Nenhum lançamento neste mês.</p>
                    )}
                    {m.lancamentos.map((l) => (
                      <div key={l.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                        <span className="flex items-center gap-2 min-w-0">
                          <Badge tone={BADGE_ORIGEM[l.origem].tone}>{BADGE_ORIGEM[l.origem].label}</Badge>
                          <span className="truncate text-slate-700">{l.descricao}</span>
                          {l.cultura && <span className="text-[10px] text-slate-400 uppercase whitespace-nowrap">{l.cultura}</span>}
                          {!l.contaComoCaixa && (
                            <span className="text-[10px] text-slate-400 italic whitespace-nowrap">não contabilizado no caixa</span>
                          )}
                        </span>
                        <span className="flex items-center gap-2 whitespace-nowrap">
                          <span className={`font-semibold ${l.tipo === 'ENTRADA' ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {l.tipo === 'ENTRADA' ? '+' : '-'}
                            {formatCurrency(l.valor)}
                          </span>
                          {l.origem === 'MANUAL' && (
                            <button
                              type="button"
                              onClick={() => onDeleteItem(l.id)}
                              className="text-slate-300 hover:text-rose-600 transition text-xs"
                              aria-label="Excluir lançamento"
                            >
                              ✕
                            </button>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <LancamentoMensalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveItem}
        culturas={culturas}
        horizonte={horizonte}
      />
    </div>
  );
};
