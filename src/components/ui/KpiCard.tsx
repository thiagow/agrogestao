import React from 'react';
import { Badge } from './Badge';

type KpiStatus = 'Excelente' | 'Bom' | 'Adequado' | 'Atenção' | 'Crítico' | 'Sem dados';

const statusTone: Record<KpiStatus, 'emerald' | 'lime' | 'blue' | 'orange' | 'rose' | 'slate'> = {
  Excelente: 'emerald',
  Bom: 'lime',
  Adequado: 'blue',
  Atenção: 'orange',
  Crítico: 'rose',
  'Sem dados': 'slate'
};

// Cores confirmadas pelo cliente: Excelente verde, Bom verde-claro, Adequado azul,
// Atenção laranja (sugestão aprovada em 06/11/2026), Crítico vermelho.
// "Sem dados" não tinge o card — é ausência de operação, não um julgamento.
const statusCard: Partial<Record<KpiStatus, string>> = {
  Excelente: 'bg-emerald-50/70 border-emerald-200',
  Bom: 'bg-lime-50/70 border-lime-200',
  Adequado: 'bg-blue-50/70 border-blue-200',
  Atenção: 'bg-orange-50/70 border-orange-200',
  Crítico: 'bg-rose-50/70 border-rose-200'
};

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  status?: KpiStatus;
  formula?: string;
  referencia?: string;
  valueClassName?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  status,
  formula,
  referencia,
  valueClassName = 'text-slate-900'
}) => {
  return (
    <div
      className={`p-5 rounded-2xl border shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between ${
        (status && statusCard[status]) || 'bg-white border-slate-200/90'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-slate-500 text-[11px] font-bold uppercase tracking-wide">
          {icon}
          <span>{title}</span>
        </div>
        {status && <Badge tone={statusTone[status]}>{status}</Badge>}
      </div>

      <div className={`text-[22px] leading-tight font-extrabold tracking-tight font-sans ${valueClassName}`}>
        {value}
      </div>

      {subtitle && <p className="text-[11px] text-slate-400 mt-1">{subtitle}</p>}

      {(formula || referencia) && (
        <div className="mt-2 pt-2 border-t border-slate-100 space-y-0.5">
          {formula && <p className="text-[10px] text-slate-400">{formula}</p>}
          {referencia && <p className="text-[10px] text-slate-400">Ref.: {referencia}</p>}
        </div>
      )}
    </div>
  );
};
