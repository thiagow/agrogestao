import React from 'react';
import { Badge } from './Badge';

type KpiStatus = 'Excelente' | 'Bom' | 'Atenção' | 'Crítico';

const statusTone: Record<KpiStatus, 'emerald' | 'blue' | 'amber' | 'rose'> = {
  Excelente: 'emerald',
  Bom: 'blue',
  Atenção: 'amber',
  Crítico: 'rose'
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
    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
          {icon}
          <span>{title}</span>
        </div>
        {status && <Badge tone={statusTone[status]}>{status}</Badge>}
      </div>

      <div className={`text-2xl lg:text-3xl font-extrabold tracking-tight font-sans ${valueClassName}`}>
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
