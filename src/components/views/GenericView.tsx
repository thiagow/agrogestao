import React from 'react';
import { ActiveTab } from '../../types';
import { formatCurrency } from '../../data/initialData';
import { FileText, TrendingUp, ShieldCheck, MapPin, Scale, BarChart2, Calendar, Presentation } from 'lucide-react';

interface GenericViewProps {
  activeTab: ActiveTab;
}

export const GenericView: React.FC<GenericViewProps> = ({ activeTab }) => {
  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 mb-1">Status do Módulo</p>
          <p className="text-2xl font-black text-emerald-700">100% Sincronizado</p>
          <p className="text-[11px] text-slate-400 mt-1">Dados atualizados com a contabilidade</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 mb-1">Volume Projetado</p>
          <p className="text-2xl font-black text-slate-900">R$ 128.400.000</p>
          <p className="text-[11px] text-slate-400 mt-1">Consolidado do grupo agro</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 mb-1">Auditoria & Compliance</p>
          <p className="text-2xl font-black text-blue-700">Aprovado Big Four</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Sem ressalvas no balanço</p>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-[#a3e635]/20 text-[#0b2310] rounded-xl font-bold">
            <ShieldCheck className="w-6 h-6 text-emerald-800" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Módulo de Controle — {activeTab.replace('_', ' ').toUpperCase()}
            </h3>
            <p className="text-xs text-slate-500">
              Relatórios, projeções e registros auditáveis para o agronegócio
            </p>
          </div>
        </div>

        {/* Mock detailed Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3 px-4">Registro / Contrato</th>
                <th className="py-3 px-4">Responsável</th>
                <th className="py-3 px-4">Valor Consolidado</th>
                <th className="py-3 px-4">Vencimento</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              <tr className="hover:bg-slate-50/60">
                <td className="py-3.5 px-4 font-bold text-slate-900">
                  Contrato de Arrendamento - Gleba Norte (Sorriso/MT)
                </td>
                <td className="py-3.5 px-4 font-medium text-slate-600">Thiago Silva</td>
                <td className="py-3.5 px-4 font-black text-slate-900">R$ 4.200.000</td>
                <td className="py-3.5 px-4 font-medium text-slate-600">15/11/2026</td>
                <td className="py-3.5 px-4 text-center">
                  <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-900">
                    EM DIA
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/60">
                <td className="py-3.5 px-4 font-bold text-slate-900">
                  Operação de Hedge & Futuros Soja CBOT
                </td>
                <td className="py-3.5 px-4 font-medium text-slate-600">Mesa de Derivativos</td>
                <td className="py-3.5 px-4 font-black text-slate-900">R$ 18.500.000</td>
                <td className="py-3.5 px-4 font-medium text-slate-600">30/05/2027</td>
                <td className="py-3.5 px-4 text-center">
                  <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-amber-100 text-amber-900">
                    TRAVADO
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/60">
                <td className="py-3.5 px-4 font-bold text-slate-900">
                  Aquisição de Área Adjacente Fazenda Boa Esperança
                </td>
                <td className="py-3.5 px-4 font-medium text-slate-600">Diretoria Agrícola</td>
                <td className="py-3.5 px-4 font-black text-slate-900">R$ 32.000.000</td>
                <td className="py-3.5 px-4 font-medium text-slate-600">20/08/2028</td>
                <td className="py-3.5 px-4 text-center">
                  <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-blue-100 text-blue-900">
                    REGISTRADO
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
