'use client';

import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  Supplier,
  CulturaSafraAno,
  ContratoBancario,
  Aquisicao,
  ContratoArrendamento,
  PecuariaBovinaAno,
  ProducaoAnimalAno,
  ItemLancamentoManualMensal
} from '../../types';
import { formatCurrency, calcularSafra } from '../../data/initialData';
import { dataReferenciaDaSafra, safraAtualDaData, safraDoAnoCivil } from '../../lib/safra-periodo';
import { calcularKpisBancos } from '../../lib/bancos-kpis';
import { perfilDividaCpLp, rankingParticipacao, type LinhaParticipacao } from '../../lib/resumo-calc';
import { CHART_COLORS } from '../../lib/chart-theme';
import {
  calcularFluxoMensal,
  gerarLancamentosCusteioSafraProjecao,
  gerarLancamentosManuais,
  gerarLancamentosVinculados,
  horizonteMeses,
  safrasDaJanela,
  type ContratoBancarioParcelaFluxo
} from '../../lib/fluxo-mensal-calc';
import type { FluxoDetalhado } from '../../server/contratos-bancarios';
import { Card } from '../ui';
import { FluxoCaixaMensalChart, type PontoFluxoMensal } from '../FluxoCaixaMensalChart';
import { TrendingDown, TrendingUp, Landmark, Scale, Users, Activity, BarChart3 } from 'lucide-react';

interface ResumoViewProps {
  suppliers: Supplier[];
  culturaSafras: CulturaSafraAno[];
  contratosBancarios: ContratoBancario[];
  /** Parcelas (BRL) de cada contrato — base do Endividamento Bancário em R$. */
  fluxoDetalhado?: FluxoDetalhado;
  usdBrl?: number | null;
  aquisicoes: Aquisicao[];
  arrendamentos: ContratoArrendamento[];
  pecuariaBovina: PecuariaBovinaAno[];
  producaoAnimal: ProducaoAnimalAno[];
  itensLancamentoManual: ItemLancamentoManualMensal[];
}

/** Lista de participação (banco/fornecedor): nome, valor, % e barra proporcional. */
const ListaParticipacao: React.FC<{ linhas: LinhaParticipacao[]; total: number; cor: string; vazio: string }> = ({
  linhas,
  total,
  cor,
  vazio
}) =>
  linhas.length === 0 ? (
    <p className="text-xs text-slate-400">{vazio}</p>
  ) : (
    <>
      <ol className="space-y-3">
        {linhas.map((l, i) => (
          <li key={l.nome}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-slate-700 truncate">
                <span className="text-slate-400 mr-1.5">{i + 1}.</span>
                {l.nome}
              </span>
              <span className="flex items-baseline gap-3 shrink-0">
                <span className="font-mono text-xs text-slate-500 tabular-nums">{formatCurrency(l.valor)}</span>
                <span className="font-bold text-slate-900 tabular-nums w-14 text-right">{l.percentual.toFixed(1)}%</span>
              </span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-slate-100">
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, l.percentual)}%`, backgroundColor: cor }} />
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between text-sm">
        <span className="font-bold text-slate-800">Total</span>
        <span className="font-extrabold tabular-nums" style={{ color: cor }}>
          {formatCurrency(total)}
        </span>
      </div>
    </>
  );

const ANO_REFERENCIA = '2026/2027';
const COLUNAS_ANO = ['2025/2026', '2026/2027', '2027/2028'];

export const ResumoView: React.FC<ResumoViewProps> = ({
  suppliers,
  culturaSafras,
  contratosBancarios,
  fluxoDetalhado,
  usdBrl = null,
  aquisicoes,
  arrendamentos,
  pecuariaBovina,
  producaoAnimal,
  itensLancamentoManual
}) => {
  const culturas = Array.from(new Set(culturaSafras.map((s) => s.cultura)));

  const linhas = culturas.map((cultura) => {
    const registros = culturaSafras.filter((s) => s.cultura === cultura);
    const porAno = new Map(registros.map((r) => [r.anoSafra, r]));
    const referencia = porAno.get(ANO_REFERENCIA);
    const anterior = porAno.get(COLUNAS_ANO[0]);

    const calc = referencia ? calcularSafra(referencia) : null;
    const varArea =
      referencia && anterior && anterior.hectares > 0
        ? ((referencia.hectares - anterior.hectares) / anterior.hectares) * 100
        : 0;

    return {
      cultura,
      porAno,
      referencia,
      faturamento: calc?.receitaBruta ?? 0,
      varArea,
      producaoFixada: calc ? Math.round((calc.totalProducao * (referencia?.producaoFixadaPercent ?? 0)) / 100) : 0
    };
  });

  const faturamentoTotal = linhas.reduce((sum, l) => sum + l.faturamento, 0);

  const totalHectares = linhas.reduce((sum, l) => sum + (l.referencia?.hectares ?? 0), 0);
  const totalHaPropria = linhas.reduce((sum, l) => sum + (l.referencia?.haPropria ?? 0), 0);
  const totalHaArrendada = linhas.reduce((sum, l) => sum + (l.referencia?.haArrendada ?? 0), 0);

  const receitaBrutaTotal = linhas.reduce((sum, l) => {
    const calc = l.referencia ? calcularSafra(l.referencia) : null;
    return sum + (calc?.receitaBruta ?? 0);
  }, 0);
  const despesaTotal = linhas.reduce((sum, l) => {
    const calc = l.referencia ? calcularSafra(l.referencia) : null;
    return sum + (calc?.despesa ?? 0);
  }, 0);
  const receitaLiquidaTotal = receitaBrutaTotal - despesaTotal;

  // Em R$ (US$ convertido): amortização das parcelas já em BRL, mesma fonte de
  // Bancos (src/lib/bancos-kpis.ts) — somar `saldoAtual` cru misturava dólar com real.
  const kpisBancos = calcularKpisBancos(
    contratosBancarios,
    new Map(
      (fluxoDetalhado?.contratos ?? []).map((f) => [
        f.contratoId,
        f.anos.flatMap((a) => a.parcelas.map((p) => ({ data: p.data, amortizacao: p.amortizacao })))
      ])
    ),
    new Map(),
    usdBrl
  );
  const endividamentoBancos = kpisBancos.saldoTotal;

  // Ranking de credores (mesmos saldos em R$ de Bancos/Fornecedores, só reagrupados por nome).
  const rankingBancos = rankingParticipacao(
    contratosBancarios.map((c) => ({ nome: c.banco, valor: kpisBancos.porContrato.get(c.id)?.saldoBrl ?? 0 }))
  );
  const rankingFornecedores = rankingParticipacao(suppliers.map((s) => ({ nome: s.nome, valor: s.dividaTotal })));
  const perfilDivida = perfilDividaCpLp(kpisBancos.curtoPrazo, kpisBancos.longoPrazo);

  // Fluxo de Caixa Mensal: mesmo pipeline do Fluxo Mensal, safra vigente pela data, só lavoura
  // (Multi-Safra OFF — o padrão da tela de origem).
  const safrasDisponiveis = useMemo(
    () =>
      Array.from(
        new Set([
          ...culturaSafras.map((r) => r.anoSafra),
          ...pecuariaBovina.map((r) => safraDoAnoCivil(r.anoCivil)),
          ...producaoAnimal.map((r) => safraDoAnoCivil(r.anoCivil))
        ])
      ).sort(),
    [culturaSafras, pecuariaBovina, producaoAnimal]
  );
  const safraFluxo = safraAtualDaData(safrasDisponiveis);
  const fluxoMensal = useMemo(() => {
    if (!safraFluxo) return { chart: [] as PontoFluxoMensal[], entradas: 0, saidas: 0, saldo: 0, safras: [] as string[] };
    const janela = safrasDaJanela(safraFluxo, safrasDisponiveis);
    const horizonte = janela.length > 0 ? horizonteMeses(janela[0]) : [];
    const contratos: ContratoBancarioParcelaFluxo[] = (fluxoDetalhado?.contratos ?? []).map((c) => ({
      banco: c.banco,
      anos: c.anos
    }));
    const lancamentos = [
      ...gerarLancamentosCusteioSafraProjecao({
        quadroSafra: culturaSafras,
        pecuariaBovina,
        producaoAnimal,
        safrasDaJanela: janela,
        multiSafra: false,
        horizonte
      }),
      ...gerarLancamentosVinculados({
        suppliers,
        contratosBancarios: contratos,
        arrendamentos,
        aquisicoes,
        safrasDaJanela: janela
      }),
      ...gerarLancamentosManuais(itensLancamentoManual.filter((i) => horizonte.some((h) => h.mes === i.mes && h.ano === i.ano)))
    ];
    const calc = calcularFluxoMensal(lancamentos, horizonte);
    return {
      chart: calc.resumoPorMes.map((m) => ({
        mes: m.label,
        entradas: m.entradas,
        saidas: -m.saidas,
        saldoAcumulado: m.saldoAcumulado
      })),
      entradas: calc.totalEntradas,
      saidas: calc.totalSaidas,
      saldo: calc.resultadoLiquido,
      safras: janela
    };
  }, [
    safraFluxo,
    safrasDisponiveis,
    culturaSafras,
    pecuariaBovina,
    producaoAnimal,
    suppliers,
    arrendamentos,
    aquisicoes,
    fluxoDetalhado,
    itensLancamentoManual
  ]);
  const endividamentoFornecedores = suppliers.reduce((sum, s) => sum + s.dividaTotal, 0);
  // Soma o valor das parcelas de Aquisição Fazenda ainda não vencidas — mesmo
  // critério de "saldo devedor" usado em Bancos, corrige o BUG #4 da spec
  // (o card divergia porque usava uma constante desconectada do dado real).
  const hoje = new Date().toISOString().slice(0, 10);
  const endividamentoAquisicaoFazenda = aquisicoes.reduce(
    (sum, a) => sum + a.parcelas.filter((p) => p.dataPagamento >= hoje).reduce((s, p) => s + p.valorTotal, 0),
    0
  );
  // Mesmo critério de endividamentoAquisicaoFazenda: soma só as parcelas
  // futuras não vencidas, e só as que têm preço definido (parcelas com
  // valorTotal ausente — sem preço de referência nem cotação de fallback —
  // não entram, mesmo critério do TOTAL "parcial" da aba Fluxo por Safra de
  // Arrendamentos). Religado ao dado real em 20/08/2026 — antes usava uma
  // constante fixa (ENDIVIDAMENTO_ARRENDAMENTOS = 6.800.000), a mesma dívida
  // técnica que Aquisição Fazenda já tinha resolvido em 20/08/2026 (BUG #4).
  const endividamentoArrendamentos = arrendamentos.reduce(
    (sum, a) =>
      sum +
      a.parcelas
        .filter((p) => p.valorTotal != null && dataReferenciaDaSafra(p.safra) >= hoje)
        .reduce((s, p) => s + (p.valorTotal ?? 0), 0),
    0
  );
  // "Custo Arrendamento/ha" no rodapé do Quadro de Safra por Cultura — usa a
  // própria área/valor do módulo Arrendamentos (não a "Área Arrendada" do
  // Quadro de Safra, que é uma fonte de dado propositalmente distinta, ver
  // CLAUDE.md/ponto de atenção #7 da spec de Arrendamento) para não misturar
  // numerador e denominador de fontes diferentes. Religado ao dado real em
  // 20/08/2026 — antes usava uma constante fixa (CUSTO_ARRENDAMENTO_HA = 1.500).
  const arrendamentosAtivos = arrendamentos.filter((a) => a.status === 'ATIVO');
  const areaArrendamentoAtiva = arrendamentosAtivos.reduce((sum, a) => sum + a.areaArrendadaHa, 0);
  const valorArrendamentoAnoReferencia = arrendamentosAtivos.reduce(
    (sum, a) => sum + a.parcelas.filter((p) => p.safra === ANO_REFERENCIA).reduce((s, p) => s + (p.valorTotal ?? 0), 0),
    0
  );
  const custoArrendamentoHaAtual = areaArrendamentoAtiva > 0 ? valorArrendamentoAnoReferencia / areaArrendamentoAtiva : 0;

  const endividamentoTotal =
    endividamentoAquisicaoFazenda + endividamentoArrendamentos + endividamentoBancos + endividamentoFornecedores;

  const chartData = [
    { nome: 'Receita Líquida', valor: receitaLiquidaTotal },
    { nome: 'Endividamento', valor: endividamentoTotal }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">Grupo Pereira</h1>
        <p className="text-xs md:text-sm text-slate-500 mt-1">Goiânia - GO</p>
      </div>

      <Card>
        <div className="p-5 border-b border-slate-200/80">
          <h2 className="text-lg font-bold text-slate-900">Quadro de Produção por Cultura</h2>
          <p className="text-xs text-slate-500 mt-0.5">Área, faturamento e produção fixada por cultura</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-600 font-bold">
                <th className="py-3 px-4">Cultura</th>
                {COLUNAS_ANO.map((ano) => (
                  <th key={ano} className="py-3 px-4 text-right whitespace-nowrap">
                    {ano}
                  </th>
                ))}
                <th className="py-3 px-4 text-right">Var. Área %</th>
                <th className="py-3 px-4 text-right">Faturamento</th>
                <th className="py-3 px-4 text-right">% Receita</th>
                <th className="py-3 px-4 text-right">Prod. Fixada</th>
                <th className="py-3 px-4 text-right">% Fixado</th>
                <th className="py-3 px-4 text-right">Preço Médio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {linhas.map((linha) => (
                <tr key={linha.cultura} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{linha.cultura}</td>
                  {COLUNAS_ANO.map((ano) => (
                    <td key={ano} className="py-3 px-4 text-right font-medium text-slate-600">
                      {linha.porAno.get(ano)?.hectares.toLocaleString('pt-BR') ?? '—'} ha
                    </td>
                  ))}
                  <td
                    className={`py-3 px-4 text-right font-semibold ${
                      linha.varArea >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {linha.varArea >= 0 ? '+' : ''}
                    {linha.varArea.toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                    {formatCurrency(linha.faturamento)}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600">
                    {(() => {
                      const pct = faturamentoTotal > 0 ? (linha.faturamento / faturamentoTotal) * 100 : 0;
                      return (
                        <div className="ml-auto w-24">
                          <span className="font-semibold tabular-nums">{pct.toFixed(1)}%</span>
                          <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${Math.min(100, pct)}%`, backgroundColor: CHART_COLORS.marca }}
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600">
                    {linha.producaoFixada.toLocaleString('pt-BR')} {linha.referencia?.unidadeProducao}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600">
                    {linha.referencia?.producaoFixadaPercent ?? 0}%
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-800">
                    {formatCurrency(linha.referencia?.precoMedio ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold text-xs text-slate-800">
                <td className="py-3 px-4 uppercase tracking-wider font-extrabold text-slate-900">Total</td>
                <td colSpan={2} className="py-3 px-4 text-right font-extrabold text-slate-900">
                  {totalHectares.toLocaleString('pt-BR')} ha
                </td>
                <td className="py-3 px-4 text-right text-slate-600 font-semibold">
                  Própria: {totalHaPropria.toLocaleString('pt-BR')} ha (
                  {totalHectares > 0 ? ((totalHaPropria / totalHectares) * 100).toFixed(1) : '0.0'}%)
                </td>
                <td colSpan={2} className="py-3 px-4 text-right text-slate-600 font-semibold">
                  Arrendada: {totalHaArrendada.toLocaleString('pt-BR')} ha (
                  {totalHectares > 0 ? ((totalHaArrendada / totalHectares) * 100).toFixed(1) : '0.0'}%)
                </td>
                <td colSpan={3} className="py-3 px-4 text-right text-slate-600 font-semibold">
                  Custo Arrendamento/ha: {formatCurrency(custoArrendamentoHaAtual)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Receita
          </h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Receita Bruta</dt>
              <dd className="font-bold text-slate-900">{formatCurrency(receitaBrutaTotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Despesas/Custos</dt>
              <dd className="font-bold text-rose-700">{formatCurrency(despesaTotal)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-3">
              <dt className="text-slate-500">Receita Líquida</dt>
              <dd className="font-extrabold text-emerald-700">{formatCurrency(receitaLiquidaTotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Área Total</dt>
              <dd className="font-bold text-slate-900">{totalHectares.toLocaleString('pt-BR')} ha</dd>
            </div>
          </dl>
        </Card>

        <Card className="p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-rose-600" />
            Endividamento
          </h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500 flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5" /> Aquisição Fazenda
              </dt>
              <dd className="font-bold text-slate-900">{formatCurrency(endividamentoAquisicaoFazenda)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" /> Arrendamentos
              </dt>
              <dd className="font-bold text-slate-900">{formatCurrency(endividamentoArrendamentos)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Bancos</dt>
              <dd className="font-bold text-slate-900">{formatCurrency(endividamentoBancos)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-3">
              <dt className="text-slate-500">Fornecedores</dt>
              <dd className="font-extrabold text-rose-700">{formatCurrency(endividamentoFornecedores)}</dd>
            </div>
          </dl>
        </Card>

        <Card className="p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4">Receita vs Endividamento</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="nome" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`}
              />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
                <Cell fill={CHART_COLORS.positivo} />
                <Cell fill={CHART_COLORS.negativo} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 flex gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-600" />Receita</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-rose-600" />Endividamento</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Landmark className="w-4 h-4 text-slate-500" />
            Principais Bancos
          </h3>
          <ListaParticipacao
            linhas={rankingBancos.linhas}
            total={rankingBancos.total}
            cor={CHART_COLORS.negativo}
            vazio="Nenhum contrato bancário com saldo."
          />
        </Card>

        <Card className="p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            Principais Fornecedores
          </h3>
          <ListaParticipacao
            linhas={rankingFornecedores.linhas}
            total={rankingFornecedores.total}
            cor={CHART_COLORS.curtoPrazo}
            vazio="Nenhum fornecedor com dívida."
          />
        </Card>

        <Card className="p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-500" />
            Perfil da Dívida Bancária
          </h3>
          {perfilDivida.total === 0 ? (
            <p className="text-xs text-slate-400">Nenhum contrato bancário com saldo.</p>
          ) : (
            <div className="space-y-4">
              {[
                { sigla: 'CP', nome: 'Curto Prazo', detalhe: '≤ 12 meses', valor: perfilDivida.cp, pct: perfilDivida.cpPercentual, cor: CHART_COLORS.curtoPrazo },
                { sigla: 'LP', nome: 'Longo Prazo', detalhe: '> 12 meses', valor: perfilDivida.lp, pct: perfilDivida.lpPercentual, cor: CHART_COLORS.longoPrazo }
              ].map((p) => (
                <div key={p.sigla}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-extrabold text-white"
                        style={{ backgroundColor: p.cor }}
                      >
                        {p.sigla}
                      </span>
                      <span className="font-semibold text-slate-800">{p.nome}</span>
                      <span className="text-[11px] text-slate-400">({p.detalhe})</span>
                    </span>
                    <span className="font-extrabold tabular-nums" style={{ color: p.cor }}>
                      {p.pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-slate-100">
                    <div className="h-full rounded-full" style={{ width: `${p.pct}%`, backgroundColor: p.cor }} />
                  </div>
                  <p className="mt-1 text-right text-xs text-slate-500 tabular-nums">{formatCurrency(p.valor)}</p>
                </div>
              ))}
              <div className="pt-3 border-t border-slate-200 flex justify-between text-sm">
                <span className="font-bold text-slate-800">Total</span>
                <span className="font-extrabold text-rose-700 tabular-nums">{formatCurrency(perfilDivida.total)}</span>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-500" />
              Fluxo de Caixa Mensal{fluxoMensal.safras.length > 0 ? ` — Safras ${fluxoMensal.safras.join(' e ')}` : ''}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Inclui custeio e safra da lavoura, bancos, arrendamentos, fornecedores e aquisições.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs font-bold tabular-nums">
            <span className="text-emerald-700">Entradas: {formatCurrency(fluxoMensal.entradas)}</span>
            <span className="text-rose-700">Saídas: {formatCurrency(fluxoMensal.saidas)}</span>
            <span className={fluxoMensal.saldo >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
              Saldo: {formatCurrency(fluxoMensal.saldo)}
            </span>
          </div>
        </div>
        {fluxoMensal.chart.length === 0 ? (
          <p className="text-xs text-slate-400">Cadastre uma safra no Quadro de Safra para ver o fluxo de caixa mensal.</p>
        ) : (
          <FluxoCaixaMensalChart data={fluxoMensal.chart} height={300} />
        )}
      </Card>
    </div>
  );
};
