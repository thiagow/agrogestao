'use client';

import React from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Supplier, CulturaSafraAno, ContratoBancario, Aquisicao, ContratoArrendamento } from '../../types';
import { formatCurrency, calcularSafra } from '../../data/initialData';
import { dataReferenciaDaSafra } from '../../lib/safra-periodo';
import { Card } from '../ui';
import { TrendingDown, TrendingUp, Landmark, Scale } from 'lucide-react';

interface ResumoViewProps {
  suppliers: Supplier[];
  culturaSafras: CulturaSafraAno[];
  contratosBancarios: ContratoBancario[];
  aquisicoes: Aquisicao[];
  arrendamentos: ContratoArrendamento[];
}

const ANO_REFERENCIA = '2026/2027';
const COLUNAS_ANO = ['2025/2026', '2026/2027', '2027/2028'];

export const ResumoView: React.FC<ResumoViewProps> = ({
  suppliers,
  culturaSafras,
  contratosBancarios,
  aquisicoes,
  arrendamentos
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

  const endividamentoBancos = contratosBancarios.reduce((sum, c) => sum + c.saldoAtual, 0);
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
          <h2 className="text-lg font-bold text-slate-900">Quadro de Safra por Cultura</h2>
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
                    {faturamentoTotal > 0 ? ((linha.faturamento / faturamentoTotal) * 100).toFixed(1) : '0.0'}%
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
              <Bar dataKey="valor" radius={[8, 8, 0, 0]} fill="#4a6700" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};
