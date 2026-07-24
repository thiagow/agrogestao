'use client';

import React, { useState } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Check, Save } from 'lucide-react';
import { Cotacao } from '../../types';
import { Card, Tabs, Button, Badge } from '../ui';

interface CotacoesViewProps {
  dolar: Cotacao;
  commodities: Cotacao[];
}

const CotacaoCard: React.FC<{ cotacao: Cotacao }> = ({ cotacao }) => {
  const [salvo, setSalvo] = useState(false);
  const isUp = cotacao.variacaoPercentual >= 0;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-1.5">
        <div>
          <p className="text-sm font-bold text-slate-900">{cotacao.commodity}</p>
          <p className="text-[10px] text-slate-400">
            {cotacao.bolsa} · {cotacao.ticker}
          </p>
        </div>
        <Badge tone={isUp ? 'emerald' : 'rose'}>
          <span className="inline-flex items-center gap-0.5">
            {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isUp ? '+' : ''}
            {cotacao.variacaoPercentual.toFixed(2)}%
          </span>
        </Badge>
      </div>

      <div className="text-xl font-black text-slate-900 font-sans">
        {cotacao.unidade} {cotacao.precoBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
      </div>
      {cotacao.precoUsd !== undefined && (
        <p className="text-[10px] text-slate-400">USD {cotacao.precoUsd.toFixed(2)}</p>
      )}

      {cotacao.maxima > 0 && (
        <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1.5">
          <span>Máx: {cotacao.maxima.toLocaleString('pt-BR')}</span>
          <span>Mín: {cotacao.minima.toLocaleString('pt-BR')}</span>
          {cotacao.volume > 0 && <span>Vol: {cotacao.volume.toLocaleString('pt-BR')}</span>}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[10px] text-slate-500">Preço definido para a safra</span>
        <button
          onClick={() => setSalvo(true)}
          className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md transition ${
            salvo
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {salvo ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
          {salvo ? 'Salvo' : 'Salvar'}
        </button>
      </div>
    </Card>
  );
};

export const CotacoesView: React.FC<CotacoesViewProps> = ({ dolar, commodities }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          Última atualização: <span className="font-semibold text-slate-700">{dolar.atualizadoEm}</span>
        </p>
        <div className="flex items-center gap-2">
          <Button variant="secondary" className="w-auto flex items-center gap-1.5 px-3 py-2 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Atualizar
          </Button>
          <Button variant="secondary" className="w-auto px-3 py-2 text-xs">
            Aplicar Mercado
          </Button>
          <Button variant="primary" className="w-auto px-3 py-2 text-xs">
            + Salvar Todas
          </Button>
        </div>
      </div>

      <Card className="p-5">
        <p className="text-xs font-bold uppercase text-slate-500 mb-3">Câmbio</p>
        <div className="max-w-sm">
          <CotacaoCard cotacao={dolar} />
        </div>
      </Card>

      <Card className="p-5">
        <Tabs items={[{ id: 'cotacoes', label: 'Cotações' }, { id: 'historico', label: 'Histórico por Safra' }]} defaultTabId="cotacoes">
          {(activeTabId) => {
            if (activeTabId !== 'cotacoes') {
              return (
                <div className="py-16 text-center text-slate-400">
                  <p className="text-sm font-semibold">Histórico por Safra</p>
                  <p className="text-xs mt-1">Em construção — aguardando especificação detalhada desta aba.</p>
                </div>
              );
            }

            return (
              <div>
                <p className="text-xs font-bold uppercase text-slate-500 mb-3">
                  Commodities Agrícolas — Safra 2026/2027
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {commodities.map((c) => (
                    <CotacaoCard key={c.id} cotacao={c} />
                  ))}
                </div>
              </div>
            );
          }}
        </Tabs>
      </Card>
    </div>
  );
};
