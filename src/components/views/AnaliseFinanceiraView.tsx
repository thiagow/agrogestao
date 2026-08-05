'use client';

import React, { useState } from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer
} from 'recharts';
import { Pencil } from 'lucide-react';
import { BalancoPatrimonial, IndicadorSaudeFinanceira } from '../../types';
import { formatCurrency } from '../../data/initialData';
import { calcularIndicadores } from '../../lib/indicadores';
import { Card, Tabs, KpiCard, Button } from '../ui';
import { BalancoPatrimonialDrawer } from '../BalancoPatrimonialDrawer';

interface AnaliseFinanceiraViewProps {
  balanco: BalancoPatrimonial | null;
  saudeFinanceira: IndicadorSaudeFinanceira[];
  onSaveBalanco: (data: BalancoPatrimonial) => void;
}

export const AnaliseFinanceiraView: React.FC<AnaliseFinanceiraViewProps> = ({
  balanco,
  saudeFinanceira,
  onSaveBalanco
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  if (!balanco) {
    return (
      <div className="space-y-6">
        <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/80">
          <p className="text-sm font-semibold">Nenhum balanço cadastrado</p>
          <p className="text-xs mt-1 mb-4">Cadastre o balanço patrimonial consolidado do grupo para ver os índices.</p>
          <Button variant="primary" onClick={() => setIsDrawerOpen(true)} className="w-auto px-4 py-2 text-xs mx-auto">
            Cadastrar Balanço
          </Button>
        </div>
        <BalancoPatrimonialDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onSave={onSaveBalanco}
          balancoAtual={null}
        />
      </div>
    );
  }

  const ativoTotal = balanco.ativoCirculante + balanco.ativoNaoCirculante;
  const passivoTotal = balanco.passivoCirculante + balanco.passivoNaoCirculante;
  const patrimonioLiquido = balanco.capitalReservas + balanco.resultadoSafra;
  const ccl = balanco.ativoCirculante - balanco.passivoCirculante;

  const { indicadores, indisponiveis } = calcularIndicadores(balanco);
  const liquidez = indicadores.filter((i) => i.grupo === 'Liquidez');
  const estruturaCapital = indicadores.filter((i) => i.grupo === 'Estrutura de Capital');

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          variant="secondary"
          onClick={() => setIsDrawerOpen(true)}
          className="w-auto flex items-center gap-1.5 px-3.5 py-2 text-xs"
        >
          <Pencil className="w-3.5 h-3.5" /> Editar Balanço
        </Button>
      </div>

      <Card className="p-5">
        <Tabs
          items={[
            { id: 'indices', label: 'Índices' },
            { id: 'balanco', label: 'Balanço' },
            { id: 'complementares', label: 'Dados Complementares' },
            { id: 'consolidado', label: 'Consolidado Grupo' }
          ]}
          defaultTabId="indices"
        >
          {(activeTabId) => {
            if (activeTabId !== 'indices') {
              return (
                <div className="py-16 text-center text-slate-400">
                  <p className="text-sm font-semibold">
                    {activeTabId === 'balanco' && 'Balanço'}
                    {activeTabId === 'complementares' && 'Dados Complementares'}
                    {activeTabId === 'consolidado' && 'Consolidado Grupo'}
                  </p>
                  <p className="text-xs mt-1">Em construção — aguardando especificação detalhada desta aba.</p>
                </div>
              );
            }

            return (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-3">
                      Saúde Financeira — Safra {balanco.safra}
                    </h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <RadarChart data={saudeFinanceira}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="dimensao" tick={{ fontSize: 11, fill: '#475569' }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                        <Radar dataKey="valor" stroke="#4a6700" fill="#a3e635" fillOpacity={0.45} />
                      </RadarChart>
                    </ResponsiveContainer>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Ilustrativo — combina dimensões que ainda não são todas computáveis do balanço atual (ver nota
                      abaixo).
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-3">
                      Balanço Resumido — Safra {balanco.safra}
                    </h3>
                    <div className="space-y-4 text-sm">
                      <div>
                        <p className="text-[11px] font-bold uppercase text-slate-500 mb-1.5">Ativo</p>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Circulante</span>
                            <span className="font-semibold text-slate-800">
                              {formatCurrency(balanco.ativoCirculante)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Não Circulante</span>
                            <span className="font-semibold text-slate-800">
                              {formatCurrency(balanco.ativoNaoCirculante)}
                            </span>
                          </div>
                          <div className="flex justify-between border-t border-slate-100 pt-1">
                            <span className="font-semibold text-slate-700">Total Ativo</span>
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
                              {formatCurrency(balanco.passivoCirculante)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Não Circulante</span>
                            <span className="font-semibold text-slate-800">
                              {formatCurrency(balanco.passivoNaoCirculante)}
                            </span>
                          </div>
                          <div className="flex justify-between border-t border-slate-100 pt-1">
                            <span className="font-semibold text-slate-700">Total Passivo</span>
                            <span className="font-extrabold text-slate-900">{formatCurrency(passivoTotal)}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] font-bold uppercase text-slate-500 mb-1.5">Patrimônio</p>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Capital + Reservas</span>
                            <span className="font-semibold text-slate-800">
                              {formatCurrency(balanco.capitalReservas)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Resultado Safra</span>
                            <span className="font-semibold text-slate-800">
                              {formatCurrency(balanco.resultadoSafra)}
                            </span>
                          </div>
                          <div className="flex justify-between border-t border-slate-100 pt-1">
                            <span className="font-semibold text-slate-700">PL Total</span>
                            <span className="font-extrabold text-emerald-700">
                              {formatCurrency(patrimonioLiquido)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between border-t border-slate-200 pt-2">
                        <span className="font-bold text-slate-700">Capital de Giro Líquido (CCL)</span>
                        <span className="font-extrabold text-blue-700">{formatCurrency(ccl)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Grupo 1 — Índices de Liquidez</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {liquidez.map((ind) => (
                      <KpiCard
                        key={ind.id}
                        title={ind.nome}
                        value={`${ind.valor.toFixed(2)}${ind.unidade}`}
                        status={ind.status}
                        formula={ind.formula}
                        referencia={ind.referencia}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3">
                    Grupo 2 — Estrutura de Capital e Endividamento
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {estruturaCapital.map((ind) => (
                      <KpiCard
                        key={ind.id}
                        title={ind.nome}
                        value={`${ind.valor.toFixed(2)}${ind.unidade}`}
                        status={ind.status}
                        formula={ind.formula}
                        referencia={ind.referencia}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3">
                    Grupo 3 — Rentabilidade e Lucratividade
                  </h3>
                  <div className="py-10 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200/80">
                    <p className="text-xs">
                      Não implementado — requer EBITDA/EBIT e receita, contas ainda não modeladas no balanço.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <p className="text-[11px] font-bold uppercase text-slate-500 mb-2">Indicadores indisponíveis</p>
                  <ul className="text-[11px] text-slate-400 space-y-0.5">
                    {indisponiveis.map((i) => (
                      <li key={i.nome}>
                        <span className="font-semibold text-slate-500">{i.nome}:</span> {i.motivo}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          }}
        </Tabs>
      </Card>

      <BalancoPatrimonialDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={onSaveBalanco}
        balancoAtual={balanco}
      />
    </div>
  );
};
