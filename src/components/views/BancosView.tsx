import React from 'react';
import { BankAccount } from '../../types';
import { formatCurrency } from '../../data/initialData';
import { Building2, CreditCard, Percent, DollarSign, Plus } from 'lucide-react';

interface BancosViewProps {
  banks: BankAccount[];
}

export const BancosView: React.FC<BancosViewProps> = ({ banks }) => {
  const totalSaldo = banks.reduce((sum, b) => sum + b.saldo, 0);
  const totalLimite = banks.reduce((sum, b) => sum + b.limiteCredito, 0);

  return (
    <div className="space-y-6">
      {/* Top summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 mb-1">Saldo Total em Conta</p>
          <p className="text-2xl font-black text-emerald-700">{formatCurrency(totalSaldo)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Soma de 4 instituições financeiras</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 mb-1">Linhas de Crédito Aprovadas</p>
          <p className="text-2xl font-black text-blue-700">{formatCurrency(totalLimite)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Pré-custeio e CPR financeira</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 mb-1">Taxa Média de Custeio</p>
          <p className="text-2xl font-black text-slate-900">CDI + 1.7% a.a.</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Indexadores pós e pré-fixados</p>
        </div>
      </div>

      {/* Accounts List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Contas Bancárias e Relacionamento</h3>
            <p className="text-xs text-slate-500">Acompanhamento de liquidez diária por instituição</p>
          </div>
          <button className="flex items-center gap-2 px-3.5 py-2 bg-[#a3e635] hover:bg-[#8cc627] text-[#0b2310] font-bold text-xs rounded-xl shadow-xs transition">
            <Plus className="w-4 h-4" />
            Nova Conta
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3 px-4">Instituição Bancária</th>
                <th className="py-3 px-4">Agência / Conta</th>
                <th className="py-3 px-4">Saldo em Conta</th>
                <th className="py-3 px-4">Limite Aprovado</th>
                <th className="py-3 px-4">Taxa de Custeio</th>
                <th className="py-3 px-4">Moeda</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {banks.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{b.banco}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">
                    Ag. {b.agencia} | CC {b.conta}
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-emerald-700">
                    {formatCurrency(b.saldo, b.moeda)}
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-blue-700">
                    {formatCurrency(b.limiteCredito, b.moeda)}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-800">{b.taxaJuros}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-600">{b.moeda}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
