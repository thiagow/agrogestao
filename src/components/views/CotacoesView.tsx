import React, { useState } from 'react';
import { initialQuotes } from '../../data/initialData';
import { TrendingUp, TrendingDown, RefreshCw, Calculator, DollarSign } from 'lucide-react';

export const CotacoesView: React.FC = () => {
  const [sacas, setSacas] = useState<number>(1000);
  const [selectedProduct, setSelectedProduct] = useState<number>(0);

  const currentProduct = initialQuotes[selectedProduct];
  const totalCalculated = sacas * currentProduct.precoAtual;

  return (
    <div className="space-y-6">
      {/* Ticker Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {initialQuotes.map((q, idx) => {
          const isUp = q.variacao >= 0;
          return (
            <button
              key={idx}
              onClick={() => setSelectedProduct(idx)}
              className={`p-4 rounded-2xl border text-left transition-all ${
                selectedProduct === idx
                  ? 'bg-[#0b2310] text-white border-[#8cc627] shadow-md ring-2 ring-[#a3e635]/40'
                  : 'bg-white text-slate-900 border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold mb-1 opacity-80">
                <span className="truncate">{q.produto}</span>
                <span className={isUp ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {isUp ? `+${q.variacao}%` : `${q.variacao}%`}
                </span>
              </div>
              <div className="text-xl font-black font-sans">
                {q.produto.includes('Dólar')
                  ? `R$ ${q.precoAtual.toFixed(4)}`
                  : `R$ ${q.precoAtual.toFixed(2)}`}
              </div>
              <p className="text-[10px] opacity-60 mt-1">{q.praca}</p>
            </button>
          );
        })}
      </div>

      {/* Simulator Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-emerald-700" />
          <h3 className="text-lg font-bold text-slate-900">Calculadora de Trava de Commodities</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Quantidade ({currentProduct.unidade}):
            </label>
            <input
              type="number"
              value={sacas}
              onChange={(e) => setSacas(Number(e.target.value) || 0)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Preço de Mercado ({currentProduct.praca}):
            </label>
            <div className="px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-black text-slate-800">
              R$ {currentProduct.precoAtual.toFixed(2)} / {currentProduct.unidade}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Valor Total Estimado em R$:
            </label>
            <div className="px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl font-black text-emerald-900 text-lg">
              R$ {totalCalculated.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
