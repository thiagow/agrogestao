import React from 'react';
import { TrendingDown, Clock, Calendar, Users } from 'lucide-react';
import { Supplier } from '../types';
import { formatCurrency, isCurtoPrazo } from '../data/initialData';

interface MetricCardsProps {
  suppliers: Supplier[];
}

export const MetricCards: React.FC<MetricCardsProps> = ({ suppliers }) => {
  // Calculate metric values dynamically from suppliers list
  const totalDebt = suppliers.reduce((sum, s) => sum + s.dividaTotal, 0);

  const curtoPrazoTotal = suppliers
    .filter((s) => isCurtoPrazo(s.vencimento))
    .reduce((sum, s) => sum + s.dividaTotal, 0);

  const longoPrazoTotal = suppliers
    .filter((s) => !isCurtoPrazo(s.vencimento))
    .reduce((sum, s) => sum + s.dividaTotal, 0);

  const pendingCount = suppliers.filter(
    (s) => s.status === 'PENDENTE' || s.status === 'VENCIDO'
  ).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Card 1: Dívida Total */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-3">
          <TrendingDown className="w-4 h-4 text-rose-700" />
          <span className="text-xs font-semibold text-slate-600">Dívida Total</span>
        </div>
        <div>
          <div className="text-2xl lg:text-3xl font-extrabold text-[#991b1b] tracking-tight font-sans">
            {formatCurrency(totalDebt)}
          </div>
        </div>
      </div>

      {/* Card 2: Curto Prazo (CP) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-semibold text-slate-600">Curto Prazo (CP)</span>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            ≤360 dias
          </span>
        </div>
        <div>
          <div className="text-2xl lg:text-3xl font-extrabold text-amber-700 tracking-tight font-sans">
            {formatCurrency(curtoPrazoTotal)}
          </div>
        </div>
      </div>

      {/* Card 3: Longo Prazo (LP) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-slate-600">Longo Prazo (LP)</span>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
            &gt;360 dias
          </span>
        </div>
        <div>
          <div className="text-2xl lg:text-3xl font-extrabold text-blue-700 tracking-tight font-sans">
            {formatCurrency(longoPrazoTotal)}
          </div>
        </div>
      </div>

      {/* Card 4: Pendentes / Vencidos */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-slate-600" />
          <span className="text-xs font-semibold text-slate-600">Pendentes/Vencidos</span>
        </div>
        <div>
          <div className="text-2xl lg:text-3xl font-extrabold text-slate-800 tracking-tight font-sans">
            {pendingCount}
          </div>
        </div>
      </div>
    </div>
  );
};
