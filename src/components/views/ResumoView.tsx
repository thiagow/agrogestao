import React from 'react';
import { Supplier, BankAccount, CropSeason } from '../../types';
import { formatCurrency } from '../../data/initialData';
import { DollarSign, ShieldAlert, Sprout, Building2, TrendingDown, Clock, ArrowUpRight } from 'lucide-react';

interface ResumoViewProps {
  suppliers: Supplier[];
  banks: BankAccount[];
  crops: CropSeason[];
}

export const ResumoView: React.FC<ResumoViewProps> = ({ suppliers, banks, crops }) => {
  const totalDebt = suppliers.reduce((sum, s) => sum + s.dividaTotal, 0);
  const totalLiquidity = banks.reduce((sum, b) => sum + b.saldo, 0);
  const totalCreditLimit = banks.reduce((sum, b) => sum + b.limiteCredito, 0);
  const totalHectares = crops.reduce((sum, c) => sum + c.areaHectares, 0);

  // Group debt by category
  const categoryDebt: Record<string, number> = {};
  suppliers.forEach((s) => {
    categoryDebt[s.categoria] = (categoryDebt[s.categoria] || 0) + s.dividaTotal;
  });

  return (
    <div className="space-y-6">
      {/* Top Stat Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-2">
            <TrendingDown className="w-4 h-4 text-rose-600" />
            <span>Passivo com Fornecedores</span>
          </div>
          <div className="text-2xl font-black text-rose-800">
            {formatCurrency(totalDebt)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Classificado em CP/LP automático</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>Saldo Bancário Disponível</span>
          </div>
          <div className="text-2xl font-black text-emerald-700">
            {formatCurrency(totalLiquidity)}
          </div>
          <p className="text-[11px] text-emerald-600 mt-1 font-medium">Liquidez imediata disponível</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-2">
            <DollarSign className="w-4 h-4 text-blue-600" />
            <span>Limite de Crédito Aprovado</span>
          </div>
          <div className="text-2xl font-black text-blue-700">
            {formatCurrency(totalCreditLimit)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Bancos e tradings parceiras</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-2">
            <Sprout className="w-4 h-4 text-amber-600" />
            <span>Área Plantada (Safra 24/25)</span>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {totalHectares.toLocaleString('pt-BR')} ha
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Soja, Milho e Algodão</p>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Debt Breakdown by Category */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-4">
            Distribuição da Dívida por Categoria de Insumos
          </h3>
          <div className="space-y-4">
            {Object.entries(categoryDebt).map(([cat, amount]) => {
              const percentage = Math.round((amount / (totalDebt || 1)) * 100);
              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-800">
                    <span>{cat}</span>
                    <span>
                      {formatCurrency(amount)} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-[#8cc627] h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Maturities */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            Próximos Vencimentos
          </h3>
          <div className="space-y-3">
            {suppliers.slice(0, 4).map((s) => (
              <div
                key={s.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900">{s.nome}</p>
                  <p className="text-[11px] text-slate-500">{s.categoria}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-rose-700">
                    {formatCurrency(s.dividaTotal, s.moeda)}
                  </p>
                  <p className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md inline-block mt-0.5">
                    {s.vencimento}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
