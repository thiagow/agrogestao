import React from 'react';
import { CropSeason } from '../../types';
import { formatCurrency } from '../../data/initialData';
import { Sprout, MapPin, Scale, Plus } from 'lucide-react';

interface QuadroSafraViewProps {
  crops: CropSeason[];
}

export const QuadroSafraView: React.FC<QuadroSafraViewProps> = ({ crops }) => {
  const totalArea = crops.reduce((sum, c) => sum + c.areaHectares, 0);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 mb-1">Área Total Plantada</p>
          <p className="text-2xl font-black text-slate-900">{totalArea.toLocaleString('pt-BR')} ha</p>
          <p className="text-[11px] text-slate-400 mt-1">Distribuída em 3 fazendas ativas</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 mb-1">Produção Soja Estimada</p>
          <p className="text-2xl font-black text-emerald-700">306.000 sacas</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Média de 68 sc/ha</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 mb-1">Investimento Total na Safra</p>
          <p className="text-2xl font-black text-rose-800">R$ 65.700.000</p>
          <p className="text-[11px] text-slate-400 mt-1">Sementes, Fertilizantes e Mão de obra</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Quadro de Acompanhamento de Safra</h3>
            <p className="text-xs text-slate-500">Mapeamento de área, cultivar e custo por hectare</p>
          </div>
          <button className="flex items-center gap-2 px-3.5 py-2 bg-[#a3e635] hover:bg-[#8cc627] text-[#0b2310] font-bold text-xs rounded-xl shadow-xs transition">
            <Plus className="w-4 h-4" />
            Nova Cultura
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3 px-4">Fazenda</th>
                <th className="py-3 px-4">Cultura / Cultivar</th>
                <th className="py-3 px-4">Safra</th>
                <th className="py-3 px-4">Área (ha)</th>
                <th className="py-3 px-4">Meta (sc/ha)</th>
                <th className="py-3 px-4">Custo Total</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {crops.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>{c.fazenda}</span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-emerald-800">{c.cultura}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-600">{c.safra}</td>
                  <td className="py-3.5 px-4 font-extrabold text-slate-900">
                    {c.areaHectares.toLocaleString('pt-BR')} ha
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    {c.produtividadeEsperada} sc/ha
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-slate-900">
                    {formatCurrency(c.custoTotal)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2.5 py-1 rounded-full font-bold text-[10px] uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
