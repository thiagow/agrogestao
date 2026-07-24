'use client';

import React, { useState } from 'react';
import { Building2 } from 'lucide-react';
import { EmpresaBalanco } from '../../types';
import { formatCurrency } from '../../data/initialData';
import { Card, Tabs, Select } from '../ui';

interface BalancoPjViewProps {
  empresas: EmpresaBalanco[];
}

export const BalancoPjView: React.FC<BalancoPjViewProps> = ({ empresas }) => {
  const [empresaId, setEmpresaId] = useState(empresas[0]?.id ?? '');
  const empresa = empresas.find((e) => e.id === empresaId) ?? empresas[0];

  if (!empresa) {
    return <p className="text-sm text-slate-500">Nenhuma empresa cadastrada.</p>;
  }

  const ativoTotal = empresa.ativoCirculante + empresa.ativoNaoCirculante;
  const passivoTotal = empresa.passivoCirculante + empresa.passivoNaoCirculante;
  const patrimonioLiquido = ativoTotal - passivoTotal;

  const lucroBruto = empresa.receitaBruta - empresa.custos;
  const lucroOperacional = lucroBruto - empresa.despesasOperacionais;
  const margemLiquida = empresa.receitaBruta > 0 ? (lucroOperacional / empresa.receitaBruta) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Select value={empresaId || empresa.id} onChange={(e) => setEmpresaId(e.target.value)} className="w-auto">
          {empresas.map((e) => (
            <option key={e.id} value={e.id}>
              {e.empresa}
            </option>
          ))}
        </Select>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-5">
          <Building2 className="w-5 h-5 text-emerald-700" />
          <div>
            <h2 className="text-base font-bold text-slate-900">{empresa.empresa}</h2>
            <p className="text-xs text-slate-500">Safra {empresa.safra}</p>
          </div>
        </div>

        <Tabs
          items={[
            { id: 'balanco', label: 'Balanço' },
            { id: 'dre', label: 'DRE' },
            { id: 'indices', label: 'Índices' },
            { id: 'comparativo', label: 'Comparativo Multi-período' }
          ]}
          defaultTabId="balanco"
        >
          {(activeTabId) => {
            if (activeTabId === 'balanco') {
              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                  <div>
                    <p className="text-[11px] font-bold uppercase text-slate-500 mb-1.5">Ativo</p>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Circulante</span>
                        <span className="font-semibold text-slate-800">
                          {formatCurrency(empresa.ativoCirculante)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Não Circulante</span>
                        <span className="font-semibold text-slate-800">
                          {formatCurrency(empresa.ativoNaoCirculante)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-slate-100 pt-1">
                        <span className="font-semibold text-slate-700">Total</span>
                        <span className="font-extrabold text-slate-900">{formatCurrency(ativoTotal)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-bold uppercase text-slate-500 mb-1.5">Passivo</p>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Circulante</span>
                        <span className="font-semibold text-slate-800">
                          {formatCurrency(empresa.passivoCirculante)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Não Circulante</span>
                        <span className="font-semibold text-slate-800">
                          {formatCurrency(empresa.passivoNaoCirculante)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-slate-100 pt-1">
                        <span className="font-semibold text-slate-700">Total</span>
                        <span className="font-extrabold text-slate-900">{formatCurrency(passivoTotal)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-bold uppercase text-slate-500 mb-1.5">Patrimônio Líquido</p>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Capital + Reservas</span>
                        <span className="font-semibold text-slate-800">
                          {formatCurrency(empresa.capitalReservas)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-slate-100 pt-1">
                        <span className="font-semibold text-slate-700">PL Total</span>
                        <span className="font-extrabold text-emerald-700">{formatCurrency(patrimonioLiquido)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            if (activeTabId === 'dre') {
              return (
                <div className="max-w-md space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Receita Bruta</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(empresa.receitaBruta)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">(-) Custos</span>
                    <span className="font-semibold text-rose-700">{formatCurrency(empresa.custos)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-1">
                    <span className="font-semibold text-slate-700">Lucro Bruto</span>
                    <span className="font-extrabold text-slate-900">{formatCurrency(lucroBruto)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">(-) Despesas Operacionais</span>
                    <span className="font-semibold text-rose-700">
                      {formatCurrency(empresa.despesasOperacionais)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1.5">
                    <span className="font-bold text-slate-800">Lucro Operacional</span>
                    <span className="font-extrabold text-emerald-700">{formatCurrency(lucroOperacional)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Margem Líquida</span>
                    <span className="font-semibold text-slate-800">{margemLiquida.toFixed(1)}%</span>
                  </div>
                </div>
              );
            }

            return (
              <div className="py-16 text-center text-slate-400">
                <p className="text-sm font-semibold">
                  {activeTabId === 'indices' ? 'Índices' : 'Comparativo Multi-período'}
                </p>
                <p className="text-xs mt-1">Em construção — aguardando especificação detalhada desta aba.</p>
              </div>
            );
          }}
        </Tabs>
      </Card>
    </div>
  );
};
