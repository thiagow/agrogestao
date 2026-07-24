'use client';

import React from 'react';
import { Area, AreaChart, CartesianGrid, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { LancamentoMensal, CalendarioAgricolaEtapa } from '../../types';
import { formatCurrency, mesLabel } from '../../data/initialData';
import { Card, KpiCard } from '../ui';
import { AlertTriangle } from 'lucide-react';

interface FluxoMensalViewProps {
  lancamentos: LancamentoMensal[];
  calendario: CalendarioAgricolaEtapa[];
}

export const FluxoMensalView: React.FC<FluxoMensalViewProps> = ({ lancamentos, calendario }) => {
  const totalEntradas = lancamentos.filter((l) => l.tipo === 'ENTRADA').reduce((sum, l) => sum + l.valor, 0);
  const totalSaidas = lancamentos.filter((l) => l.tipo === 'SAIDA').reduce((sum, l) => sum + l.valor, 0);
  const resultadoLiquido = totalEntradas - totalSaidas;

  let saldoAcumulado = 0;
  const dadosGrafico = Array.from({ length: 12 }, (_, i) => {
    const mes = i + 1;
    const entradas = lancamentos.filter((l) => l.mes === mes && l.tipo === 'ENTRADA').reduce((s, l) => s + l.valor, 0);
    const saidas = lancamentos.filter((l) => l.mes === mes && l.tipo === 'SAIDA').reduce((s, l) => s + l.valor, 0);
    saldoAcumulado += entradas - saidas;
    return { mes: mesLabel(mes), entradas, saidas, saldo: saldoAcumulado };
  });

  const mesesNegativos = dadosGrafico.filter((d) => d.entradas - d.saidas < 0).length;

  const culturas = calendario.map((c) => c.cultura);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Entradas" value={formatCurrency(totalEntradas)} valueClassName="text-emerald-700" />
        <KpiCard title="Total Saídas" value={formatCurrency(totalSaidas)} valueClassName="text-rose-800" />
        <KpiCard title="Resultado Líquido" value={formatCurrency(resultadoLiquido)} />
        <KpiCard
          icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
          title="Situação"
          value={mesesNegativos > 0 ? 'Risco' : 'Saudável'}
          subtitle={`${mesesNegativos} meses negativos`}
          status={mesesNegativos > 0 ? 'Atenção' : 'Excelente'}
        />
      </div>

      <Card className="p-6">
        <h3 className="text-base font-bold text-slate-900 mb-4">Curva de Caixa — Safra 2026/2027</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={dadosGrafico}>
            <defs>
              <linearGradient id="saldoGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4a6700" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4a6700" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 10, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`}
            />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="entradas" name="Entradas" stroke="#16a34a" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="saidas" name="Saídas" stroke="#dc2626" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="saldo" name="Saldo Acumulado" stroke="#4a6700" fill="url(#saldoGradient)" strokeWidth={2} />
          </AreaChart>
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
                    {mesLabel(i + 1)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-xs text-slate-700">
              {culturas.map((cultura) => {
                const etapa = calendario.find((c) => c.cultura === cultura)!;
                return (
                  <tr key={cultura} className="border-t border-slate-100">
                    <td className="py-2 px-3 font-semibold text-slate-800 whitespace-nowrap">{cultura}</td>
                    {Array.from({ length: 12 }, (_, i) => {
                      const mes = i + 1;
                      const isPlantioColheita = etapa.mesesPlantioColheita.includes(mes);
                      const isDesenvolvimento = etapa.mesesDesenvolvimento.includes(mes);
                      return (
                        <td key={mes} className="py-2 px-2 text-center">
                          <span
                            className={`inline-block w-3 h-3 rounded-full ${
                              isPlantioColheita
                                ? 'bg-amber-500'
                                : isDesenvolvimento
                                ? 'bg-emerald-500'
                                : 'bg-slate-100'
                            }`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-4 mt-4 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-amber-500" /> Plantio/Colheita
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-emerald-500" /> Desenvolvimento
          </span>
        </div>
      </Card>

      <Card className="p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-900">Lançamentos Mensais</p>
          <p className="text-xs text-slate-500">{lancamentos.length} registros nesta safra</p>
        </div>
      </Card>
    </div>
  );
};
