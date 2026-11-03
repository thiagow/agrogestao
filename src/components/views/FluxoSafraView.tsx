'use client';

import React, { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Activity, DollarSign, Plus, Trash2, ChevronDown } from 'lucide-react';
import type {
  ContratoBancario,
  ContratoComercial,
  Cotacao,
  PrecoDefinidoSafra,
  CulturaSafraAno,
  ItemFluxoManual,
  PecuariaBovinaAno,
  ProducaoAnimalAno,
  Supplier
} from '../../types';
import { formatCurrency } from '../../data/initialData';
import { montarFluxoSafraDTO, calcularFluxoSafra, CATEGORIA_ITEM_FLUXO_LABEL } from '../../lib/fluxo-safra-calc';
import { safraAtualDaData, safrasDoAnoCivilBlend } from '../../lib/safra-periodo';
import { CHART_COLORS } from '../../lib/chart-theme';
import { commodityDaCultura } from '../../lib/cultura-commodity';
import { Card, KpiCard, Badge, Select, Button, Tooltip } from '../ui';
import { FluxoManualItemModal } from '../FluxoManualItemModal';
import type { CronogramaConsolidado } from '../../server/contratos-bancarios';
import type { LinhaFluxoConsolidadoArrendamento } from '../../server/arrendamentos';
import type { LinhaFluxoConsolidado } from '../../server/aquisicoes';

interface FluxoSafraViewProps {
  culturaSafras: CulturaSafraAno[];
  pecuariaBovina: PecuariaBovinaAno[];
  producaoAnimal: ProducaoAnimalAno[];
  suppliers: Supplier[];
  contratosBancarios: ContratoBancario[];
  cronograma?: CronogramaConsolidado;
  linhasArrendamento: LinhaFluxoConsolidadoArrendamento[];
  linhasAquisicao: LinhaFluxoConsolidado[];
  contratosComerciais: ContratoComercial[];
  precosDefinidos: PrecoDefinidoSafra[];
  /** Cotações de mercado do dia — fallback da Despesa Comercial quando não há PrecoDefinidoSafra para a safra ativa (10/09/2026). */
  cotacoesMercado: Cotacao[];
  itensManuais: ItemFluxoManual[];
  onSaveItem: (data: Partial<ItemFluxoManual>) => void;
  onDeleteItem: (id: string) => void;
}

const STATUS_KPI: Record<'Saudável' | 'Atenção' | 'Crítico', 'Excelente' | 'Atenção' | 'Crítico'> = {
  Saudável: 'Excelente',
  Atenção: 'Atenção',
  Crítico: 'Crítico'
};

const BADGE_ANALISE: Record<'Saudável' | 'Atenção' | 'Crítico', { tone: 'emerald' | 'amber' | 'rose'; label: string }> = {
  Saudável: { tone: 'emerald', label: '✓ Produtor com boa capacidade de pagamento. Bancabilidade sólida.' },
  Atenção: { tone: 'amber', label: 'Atenção à capacidade de pagamento da safra.' },
  Crítico: { tone: 'rose', label: 'Capacidade de pagamento crítica — requer estruturação de financiamento.' }
};

export const FluxoSafraView: React.FC<FluxoSafraViewProps> = ({
  culturaSafras,
  pecuariaBovina,
  producaoAnimal,
  suppliers,
  contratosBancarios,
  cronograma,
  linhasArrendamento,
  linhasAquisicao,
  contratosComerciais,
  precosDefinidos,
  cotacoesMercado,
  itensManuais,
  onSaveItem,
  onDeleteItem
}) => {
  const safrasDisponiveis = useMemo(
    () =>
      Array.from(
        new Set([
          ...culturaSafras.map((r) => r.anoSafra),
          ...pecuariaBovina.map((r) => safrasDoAnoCivilBlend(r.anoCivil)).flat(),
          ...producaoAnimal.map((r) => safrasDoAnoCivilBlend(r.anoCivil)).flat()
        ])
      ).sort(),
    [culturaSafras, pecuariaBovina, producaoAnimal]
  );
  const [safraSelecionada, setSafraSelecionada] = useState('');
  const safraAtiva = safraSelecionada || safraAtualDaData(safrasDisponiveis);

  const [entradasAbertas, setEntradasAbertas] = useState(true);
  const [saidasAbertas, setSaidasAbertas] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Preço de soja para a Despesa Comercial (3 sc/ha): prioridade 1 é o preço
  // travado pelo cliente para esta safra (PrecoDefinidoSafra); na ausência
  // dele, cai para a cotação de mercado do dia (Cotacao.precoBrl) em vez de
  // ficar "indisponível" — troca automática de fonte, sem ação manual
  // (10/09/2026). Fallback isolado só para este cálculo: não altera
  // `resolverPrecoFallback` (server), usado por Arrendamentos/Comercialização,
  // que deliberadamente nunca usa cotação de mercado bruta.
  const { precoSoja, precoSojaFonte } = useMemo(() => {
    const nomeCommodity = commodityDaCultura('Soja');
    const definido = nomeCommodity
      ? precosDefinidos.find((p) => p.commodity === nomeCommodity && p.anoSafra === safraAtiva)
      : undefined;
    if (definido) return { precoSoja: definido.precoBrl, precoSojaFonte: 'DEFINIDO' as const };

    const mercado = nomeCommodity ? cotacoesMercado.find((c) => c.commodity === nomeCommodity) : undefined;
    if (mercado) return { precoSoja: mercado.precoBrl, precoSojaFonte: 'MERCADO' as const };

    return { precoSoja: null, precoSojaFonte: null };
  }, [precosDefinidos, cotacoesMercado, safraAtiva]);

  const dto = useMemo(
    () =>
      montarFluxoSafraDTO({
        safra: safraAtiva,
        quadroSafra: culturaSafras,
        pecuariaBovina,
        producaoAnimal,
        suppliers,
        contratosBancarios,
        parcelasBancos: cronograma?.parcelas ?? [],
        linhasArrendamento,
        linhasAquisicao,
        contratosComerciais,
        itensManuais,
        precoSoja,
        precoSojaFonte
      }),
    [
      safraAtiva,
      culturaSafras,
      pecuariaBovina,
      producaoAnimal,
      suppliers,
      contratosBancarios,
      cronograma,
      linhasArrendamento,
      linhasAquisicao,
      contratosComerciais,
      itensManuais,
      precoSoja,
      precoSojaFonte
    ]
  );

  const calculado = useMemo(() => calcularFluxoSafra(dto), [dto]);
  const badge = BADGE_ANALISE[calculado.statusCobertura];

  const chartData = [
    ...calculado.entradas.map((l) => ({ id: l.id, nome: l.label, valor: l.valor ?? 0, entrada: true })),
    ...calculado.saidas.map((l) => ({ id: l.id, nome: l.label, valor: l.valor ?? 0, entrada: false }))
  ].filter((d) => d.valor > 0);

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
          onClick={() => setIsModalOpen(true)}
          disabled={!safraAtiva}
          className="w-auto flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" /> Adicionar Item
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Receita Projetada"
          value={formatCurrency(calculado.totalEntradas)}
          subtitle={`Realizada: ${formatCurrency(dto.receitaRealizada)}`}
          icon={<ArrowUpRight className="w-4 h-4 text-emerald-600" />}
        />
        <KpiCard
          title="Total de Saídas"
          value={formatCurrency(calculado.totalSaidas)}
          subtitle="Custos + Dívidas + Despesas"
          icon={<ArrowDownRight className="w-4 h-4 text-rose-600" />}
          valueClassName="text-rose-800"
        />
        <KpiCard
          title="Fluxo Líquido"
          value={formatCurrency(calculado.fluxoLiquido)}
          subtitle={calculado.fluxoLiquido >= 0 ? 'Superávit' : 'Déficit'}
          icon={<Activity className="w-4 h-4 text-emerald-600" />}
          valueClassName={calculado.fluxoLiquido >= 0 ? 'text-emerald-700' : 'text-rose-700'}
        />
        <KpiCard
          title="Índice de Cobertura"
          value={`${calculado.indiceCobertura.toFixed(2)}x`}
          icon={<DollarSign className="w-4 h-4 text-slate-500" />}
          status={STATUS_KPI[calculado.statusCobertura]}
          referencia="Saudável ≥ 1,2x · Atenção ≥ 1,0x · Crítico < 1,0x"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          <Card className="p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">Demonstrativo de Fluxo de Safra</h3>
            <p className="text-xs text-slate-500 mb-4">Safra {safraAtiva || '—'}</p>

            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setEntradasAbertas((v) => !v)}
                  className="flex w-full items-center justify-between text-left bg-emerald-50 px-4 py-2.5"
                >
                  <span className="text-xs font-bold uppercase text-emerald-800">(+) Entradas</span>
                  <span className="flex items-center gap-2">
                    <span className="font-extrabold text-emerald-700 tabular-nums">{formatCurrency(calculado.totalEntradas)}</span>
                    <ChevronDown className={`h-4 w-4 text-emerald-600 transition-transform ${entradasAbertas ? 'rotate-180' : ''}`} />
                  </span>
                </button>
                {entradasAbertas && (
                  <div className="px-4 py-2 divide-y divide-emerald-100">
                    {calculado.entradas.map((linha) => (
                      <div key={linha.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                        <span className="flex items-center gap-1.5 text-slate-600">
                          {linha.label}
                          <Tooltip text={linha.origem} />
                        </span>
                        <span className="font-bold text-emerald-700 tabular-nums">{formatCurrency(linha.valor ?? 0)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-rose-200 bg-rose-50/40 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setSaidasAbertas((v) => !v)}
                  className="flex w-full items-center justify-between text-left bg-rose-50 px-4 py-2.5"
                >
                  <span className="text-xs font-bold uppercase text-rose-800">(-) Saídas</span>
                  <span className="flex items-center gap-2">
                    <span className="font-extrabold text-rose-700 tabular-nums">({formatCurrency(calculado.totalSaidas)})</span>
                    <ChevronDown className={`h-4 w-4 text-rose-600 transition-transform ${saidasAbertas ? 'rotate-180' : ''}`} />
                  </span>
                </button>
                {saidasAbertas && (
                  <div className="px-4 py-2 divide-y divide-rose-100">
                    {calculado.saidas.map((linha) => (
                      <div key={linha.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                        <span className="flex items-center gap-1.5 text-slate-600">
                          {linha.label}
                          <Tooltip text={linha.origem} />
                        </span>
                        <span className="font-semibold text-rose-700 tabular-nums">
                          {linha.valor === null ? (
                            <span className="text-slate-400 font-medium">indisponível</span>
                          ) : (
                            `(${formatCurrency(linha.valor)})`
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div
                className={`rounded-xl border-2 px-5 py-4 flex items-center justify-between gap-4 ${
                  calculado.fluxoLiquido >= 0 ? 'border-emerald-300 bg-emerald-50' : 'border-rose-300 bg-rose-50'
                }`}
              >
                <div>
                  <p className={`text-sm font-bold ${calculado.fluxoLiquido >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                    Fluxo de Caixa Líquido
                  </p>
                  <p className={`text-xs ${calculado.fluxoLiquido >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {calculado.fluxoLiquido >= 0
                      ? '✓ Operação auto-sustentável nesta safra'
                      : '⚠ Operação requer financiamento externo nesta safra'}
                  </p>
                </div>
                <span
                  className={`text-[22px] leading-tight font-extrabold tabular-nums ${
                    calculado.fluxoLiquido >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {formatCurrency(calculado.fluxoLiquido)}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-slate-500" /> Estrutura de Financiamento Necessária
            </h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="flex items-center gap-1.5 text-slate-500">
                  Renovação de Dívidas Bancárias (CP + LP)
                  <Tooltip text="Soma do saldo devedor atual de todos os contratos bancários ativos. O sistema ainda não distingue curto de longo prazo por contrato — a soma cobre os dois." />
                </span>
                <span className="font-semibold text-slate-800 tabular-nums">{formatCurrency(dto.saldoDevedorBancos)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="flex items-center gap-1.5 text-slate-500">
                  Fornecedores Previstos (próxima safra)
                  <Tooltip text="Dívidas com fornecedores já cadastradas com a safra seguinte." />
                </span>
                <span className="font-semibold text-slate-800 tabular-nums">{formatCurrency(dto.fornecedoresProximaSafra)}</span>
              </div>
              <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 mt-2">
                <span className="font-bold text-slate-800">Total de Recursos a Estruturar</span>
                <span className="font-extrabold text-slate-900 tabular-nums">{formatCurrency(calculado.totalRecursosEstruturar)}</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6 min-w-0">
          <Card className="p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Composição do Fluxo</h3>
            <ResponsiveContainer width="100%" height={Math.max(220, chartData.length * 34)}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: CHART_COLORS.eixo }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`}
                />
                <YAxis
                  type="category"
                  dataKey="nome"
                  width={130}
                  tick={{ fontSize: 10, fill: CHART_COLORS.eixo }}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="valor" radius={[0, 6, 6, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={entry.id} fill={entry.entrada ? CHART_COLORS.positivo : CHART_COLORS.negativo} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-2 flex gap-4 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-600" />Entradas</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-rose-600" />Saídas</span>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Análise — Próxima Safra</h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Fluxo Disponível</span>
                <span className="font-semibold text-emerald-700 tabular-nums">{formatCurrency(calculado.fluxoLiquido)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Custo Projetado Safra</span>
                <span className="font-semibold text-rose-700 tabular-nums">{formatCurrency(calculado.custoProximaSafra)}</span>
              </div>
              <div className="flex justify-between pt-1.5">
                <span className="font-bold text-slate-800">Déficit/Superávit</span>
                <span
                  className={`font-extrabold tabular-nums ${calculado.deficitSuperavitProximaSafra >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}
                >
                  {formatCurrency(calculado.deficitSuperavitProximaSafra)}
                </span>
              </div>
            </div>
            <div className="mt-3">
              <Badge tone={badge.tone}>{badge.label}</Badge>
              <p className="mt-1.5 text-[11px] text-slate-400">
                Critério: Índice de Cobertura da safra atual ({calculado.indiceCobertura.toFixed(2)}x) — não o déficit isolado da
                próxima safra.
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Itens Adicionais Cadastrados</h3>
            {dto.itensManuais.length === 0 ? (
              <p className="text-xs text-slate-400">
                Nenhum item adicional nesta safra. Use o botão Adicionar Item para incluir dividendos, estoques, retiradas ou manutenções.
              </p>
            ) : (
              <ul className="space-y-2">
                {dto.itensManuais.map((item) => {
                  const entrada = item.tipo === 'ENTRADA';
                  return (
                    <li
                      key={item.id}
                      className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${
                        entrada ? 'border-emerald-200 bg-emerald-50/50' : 'border-rose-200 bg-rose-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {entrada ? (
                          <ArrowUpRight className="h-4 w-4 shrink-0 text-emerald-600" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 shrink-0 text-rose-600" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-700">
                            {item.descricao || CATEGORIA_ITEM_FLUXO_LABEL[item.categoria]}
                          </p>
                          <p className={`text-sm font-extrabold tabular-nums ${entrada ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {formatCurrency(item.valor)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDeleteItem(item.id)}
                        className="text-slate-300 hover:text-rose-600 transition"
                        aria-label="Excluir item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <FluxoManualItemModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={onSaveItem} safra={safraAtiva} />
    </div>
  );
};
