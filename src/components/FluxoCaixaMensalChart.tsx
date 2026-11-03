'use client';

import React from 'react';
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
import { formatCurrency } from '../data/initialData';
import { CHART_COLORS } from '../lib/chart-theme';

export interface PontoFluxoMensal {
  mes: string;
  entradas: number;
  /** Já negativo (barra abaixo do eixo). */
  saidas: number;
  saldoAcumulado: number;
}

interface FluxoCaixaMensalChartProps {
  data: PontoFluxoMensal[];
  height?: number;
}

/** Entradas (verde) e saídas (vermelho) por mês + linha de saldo acumulado (azul). Compartilhado por Fluxo Mensal e Resumo. */
export const FluxoCaixaMensalChart: React.FC<FluxoCaixaMensalChartProps> = ({ data, height = 300 }) => (
  <ResponsiveContainer width="100%" height={height}>
    <ComposedChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
      <XAxis
        dataKey="mes"
        tick={{ fontSize: 10, fill: CHART_COLORS.eixo }}
        axisLine={false}
        tickLine={false}
        interval={0}
        angle={-45}
        textAnchor="end"
        height={50}
      />
      <YAxis
        tick={{ fontSize: 10, fill: CHART_COLORS.eixo }}
        axisLine={false}
        tickLine={false}
        tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`}
      />
      <RechartsTooltip formatter={(value, name) => [formatCurrency(Math.abs(Number(value))), name]} />
      <Legend wrapperStyle={{ fontSize: 11 }} />
      <Bar dataKey="entradas" name="Entradas" fill={CHART_COLORS.positivo} radius={[4, 4, 0, 0]} />
      <Bar dataKey="saidas" name="Saídas" fill={CHART_COLORS.negativo} radius={[0, 0, 4, 4]} />
      <Line type="monotone" dataKey="saldoAcumulado" name="Saldo Acum." stroke={CHART_COLORS.saldo} strokeWidth={2} dot={false} />
    </ComposedChart>
  </ResponsiveContainer>
);
