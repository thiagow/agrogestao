'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, TrendingUp, TrendingDown, Check, Save } from 'lucide-react';
import { Cotacao } from '../../types';
import { Card, Tabs, Button, Badge } from '../ui';
import { refreshCotacoes, salvarPrecoDefinidoSafra } from '../../server/cotacoes';

interface CotacaoCardProps {
  cotacao: Cotacao;
  onSalvarPreco: (commodity: string, preco: number) => void;
}

const CotacaoCard: React.FC<CotacaoCardProps> = ({ cotacao, onSalvarPreco }) => {
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
        <p className="text-[10px] text-slate-400">Contrato: USD {cotacao.precoUsd.toFixed(2)}</p>
      )}

      {cotacao.maxima > 0 && (
        <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1.5">
          <span>Máx: {cotacao.maxima.toLocaleString('pt-BR')}</span>
          <span>Mín: {cotacao.minima.toLocaleString('pt-BR')}</span>
          {cotacao.volume > 0 && <span>Vol: {cotacao.volume.toLocaleString('pt-BR')}</span>}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[10px] text-slate-500">
          {cotacao.precoDefinidoSafra != null
            ? `Travado: R$ ${cotacao.precoDefinidoSafra.toLocaleString('pt-BR')}`
            : 'Preço definido para a safra'}
        </span>
        <button
          onClick={() => {
            onSalvarPreco(cotacao.commodity, cotacao.precoBrl);
            setSalvo(true);
            setTimeout(() => setSalvo(false), 2000);
          }}
          className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md transition ${
            salvo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {salvo ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
          {salvo ? 'Salvo' : 'Salvar'}
        </button>
      </div>
    </Card>
  );
};

interface CotacoesViewProps {
  dolar: Cotacao | null;
  commodities: Cotacao[];
}

export const CotacoesView: React.FC<CotacoesViewProps> = ({ dolar, commodities }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const handleAtualizar = () => {
    setErro(null);
    startTransition(async () => {
      const result = await refreshCotacoes();
      if (result.falhas.length > 0) {
        setErro(`Não foi possível atualizar: ${result.falhas.join(', ')}.`);
      }
      router.refresh();
    });
  };

  const handleSalvarPreco = (commodity: string, preco: number) => {
    startTransition(async () => {
      await salvarPrecoDefinidoSafra(commodity, preco);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          Última atualização:{' '}
          <span className="font-semibold text-slate-700">{dolar?.atualizadoEm ?? 'nunca atualizado'}</span>
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={handleAtualizar}
            disabled={isPending}
            className="w-auto flex items-center gap-1.5 px-3 py-2 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} />
            {isPending ? 'Atualizando…' : 'Atualizar'}
          </Button>
        </div>
      </div>

      {erro && (
        <div className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
          {erro}
        </div>
      )}

      <Card className="p-5">
        <p className="text-xs font-bold uppercase text-slate-500 mb-3">Câmbio</p>
        <div className="max-w-sm">
          {dolar ? (
            <CotacaoCard cotacao={dolar} onSalvarPreco={handleSalvarPreco} />
          ) : (
            <p className="text-xs text-slate-400">Clique em &quot;Atualizar&quot; para buscar a cotação do dólar.</p>
          )}
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

            if (commodities.length === 0) {
              return (
                <p className="text-xs text-slate-400 py-8 text-center">
                  Clique em &quot;Atualizar&quot; para buscar as cotações de commodities.
                </p>
              );
            }

            return (
              <div>
                <p className="text-xs font-bold uppercase text-slate-500 mb-3">Commodities Agrícolas</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {commodities.map((c) => (
                    <CotacaoCard key={c.id} cotacao={c} onSalvarPreco={handleSalvarPreco} />
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
