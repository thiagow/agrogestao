'use client';

import React, { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Activity, DollarSign, Plus, Trash2, ChevronDown } from 'lucide-react';
import type {
  ContratoBancario,
  ContratoComercial,
  Cotacao,
  CulturaSafraAno,
  ItemFluxoManual,
  Supplier
} from '../../types';
import { formatCurrency } from '../../data/initialData';
import { montarFluxoSafraDTO, calcularFluxoSafra } from '../../lib/fluxo-safra-calc';
import { commodityDaCultura } from '../../lib/cultura-commodity';
import { Card, KpiCard, Badge, Select, Button, Tooltip } from '../ui';
import { FluxoManualItemModal } from '../FluxoManualItemModal';
import type { CronogramaConsolidado } from '../../server/contratos-bancarios';
import type { LinhaFluxoConsolidadoArrendamento } from '../../server/arrendamentos';
import type { LinhaFluxoConsolidado } from '../../server/aquisicoes';

interface FluxoSafraViewProps {
  culturaSafras: CulturaSafraAno[];
  suppliers: Supplier[];
  contratosBancarios: ContratoBancario[];
  cronograma?: CronogramaConsolidado;
  linhasArrendamento: LinhaFluxoConsolidadoArrendamento[];
  linhasAquisicao: LinhaFluxoConsolidado[];
  contratosComerciais: ContratoComercial[];
  cotacoesCommodities: Cotacao[];
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
  suppliers,
  contratosBancarios,
  cronograma,
  linhasArrendamento,
  linhasAquisicao,
  contratosComerciais,
  cotacoesCommodities,
  itensManuais,
  onSaveItem,
  onDeleteItem
}) => {
  const safrasDisponiveis = useMemo(() => Array.from(new Set(culturaSafras.map((r) => r.anoSafra))).sort(), [culturaSafras]);
  const [safraSelecionada, setSafraSelecionada] = useState('');
  const safraAtiva = safraSelecionada || safrasDisponiveis[safrasDisponiveis.length - 1] || '';

  const [entradasAbertas, setEntradasAbertas] = useState(true);
  const [saidasAbertas, setSaidasAbertas] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const precoSoja = useMemo(() => {
    const nomeCommodity = commodityDaCultura('Soja');
    const cotacao = nomeCommodity ? cotacoesCommodities.find((c) => c.commodity === nomeCommodity) : undefined;
    return cotacao?.precoDefinidoSafra ?? null;
  }, [cotacoesCommodities]);

  const dto = useMemo(
    () =>
      montarFluxoSafraDTO({
        safra: safraAtiva,
        quadroSafra: culturaSafras,
        suppliers,
        contratosBancarios,
        anosCronograma: cronograma?.anos ?? [],
        linhasArrendamento,
        linhasAquisicao,
        contratosComerciais,
        itensManuais,
        precoSoja
      }),
    [safraAtiva, culturaSafras, suppliers, contratosBancarios, cronograma, linhasArrendamento, linhasAquisicao, contratosComerciais, itensManuais, precoSoja]
  );

  const calculado = useMemo(() => calcularFluxoSafra(dto), [dto]);
  const badge = BADGE_ANALISE[calculado.statusCobertura];

  const chartData = [
    { nome: 'Receita', valor: dto.receitaProjetada, entrada: true },
    { nome: 'Custo Safra', valor: dto.custoProducao, entrada: false },
    { nome: 'Fornecedores', valor: dto.fornecedores, entrada: false },
    { nome: 'Amort. Bancos', valor: dto.amortizacaoBancos, entrada: false },
    { nome: 'Juros', valor: dto.jurosBancos, entrada: false },
    { nome: 'Arrendamentos', valor: dto.arrendamentos, entrada: false },
    { nome: 'Desp. Comercial', valor: dto.despesaComercial ?? 0, entrada: false },
    { nome: 'Aquisições', valor: dto.parcelasAquisicao, entrada: false }
  ];

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

      <Card className="p-6">
        <h3 className="text-base font-bold text-slate-900 mb-1">Demonstrativo de Fluxo de Safra</h3>
        <p className="text-xs text-slate-500 mb-4">Safra {safraAtiva || '—'}</p>

        <div className="space-y-5 max-w-2xl">
          <div>
            <button
              type="button"
              onClick={() => setEntradasAbertas((v) => !v)}
              className="flex w-full items-center justify-between text-left"
            >
              <span className="text-[11px] font-bold uppercase text-emerald-700">
                (+) Entradas ({formatCurrency(calculado.totalEntradas)})
              </span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${entradasAbertas ? 'rotate-180' : ''}`} />
            </button>
            {entradasAbertas && (
              <div className="mt-2 space-y-1.5">
                {calculado.entradas.map((linha) => (
                  <div key={linha.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      {linha.label}
                      <Tooltip text={linha.origem} />
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="font-bold text-emerald-700">{formatCurrency(linha.valor ?? 0)}</span>
                      {!['receita_projetada'].includes(linha.id) && (
                        <button
                          type="button"
                          onClick={() => onDeleteItem(linha.id)}
                          className="text-slate-300 hover:text-rose-600 transition"
                          aria-label="Excluir item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <button
              type="button"
              onClick={() => setSaidasAbertas((v) => !v)}
              className="flex w-full items-center justify-between text-left"
            >
              <span className="text-[11px] font-bold uppercase text-rose-700">
                (-) Saídas ({formatCurrency(calculado.totalSaidas)})
              </span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${saidasAbertas ? 'rotate-180' : ''}`} />
            </button>
            {saidasAbertas && (
              <div className="mt-2 space-y-1.5">
                {calculado.saidas.map((linha) => {
                  const fixa = [
                    'custo_producao',
                    'fornecedores',
                    'amortizacao_bancos',
                    'juros_bancos',
                    'arrendamentos',
                    'despesa_comercial',
                    'parcelas_aquisicao'
                  ].includes(linha.id);
                  return (
                    <div key={linha.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        {linha.label}
                        <Tooltip text={linha.origem} />
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="font-semibold text-rose-700">
                          {linha.valor === null ? (
                            <span className="text-slate-400 font-medium">indisponível</span>
                          ) : (
                            `(${formatCurrency(linha.valor)})`
                          )}
                        </span>
                        {!fixa && (
                          <button
                            type="button"
                            onClick={() => onDeleteItem(linha.id)}
                            className="text-slate-300 hover:text-rose-600 transition"
                            aria-label="Excluir item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-between border-t border-slate-200 pt-3">
            <span className="font-bold text-slate-800">Fluxo de Caixa Líquido</span>
            <span className={`font-extrabold ${calculado.fluxoLiquido >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatCurrency(calculado.fluxoLiquido)}
            </span>
          </div>
          <p className={`text-xs ${calculado.fluxoLiquido >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {calculado.fluxoLiquido >= 0
              ? '✓ Operação auto-sustentável nesta safra'
              : '⚠ Operação requer financiamento externo nesta safra'}
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Estrutura de Financiamento Necessária</h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5 text-slate-500">
                Renovação de Dívidas Bancárias (CP + LP)
                <Tooltip text="Soma do saldo devedor atual de todos os contratos bancários ativos. O sistema ainda não distingue curto de longo prazo por contrato — a soma cobre os dois." />
              </span>
              <span className="font-semibold text-slate-800">{formatCurrency(dto.saldoDevedorBancos)}</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5 text-slate-500">
                Fornecedores Previstos (próxima safra)
                <Tooltip text="Dívidas com fornecedores já cadastradas com a safra seguinte." />
              </span>
              <span className="font-semibold text-slate-800">{formatCurrency(dto.fornecedoresProximaSafra)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1.5">
              <span className="font-bold text-slate-800">Total de Recursos a Estruturar</span>
              <span className="font-extrabold text-slate-900">{formatCurrency(calculado.totalRecursosEstruturar)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Análise — Próxima Safra</h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Fluxo Disponível</span>
              <span className="font-semibold text-slate-800">{formatCurrency(calculado.fluxoLiquido)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Custo Projetado Safra</span>
              <span className="font-semibold text-slate-800">{formatCurrency(calculado.custoProximaSafra)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1.5">
              <span className="font-bold text-slate-800">Déficit/Superávit</span>
              <span
                className={`font-extrabold ${calculado.deficitSuperavitProximaSafra >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}
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
      </div>

      <Card className="p-6">
        <h3 className="text-base font-bold text-slate-900 mb-4">Composição do Fluxo</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="nome" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" height={50} />
            <YAxis
              tick={{ fontSize: 10, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
            <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.nome} fill={entry.entrada ? '#4a6700' : '#be123c'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <FluxoManualItemModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={onSaveItem} safra={safraAtiva} />
    </div>
  );
};
