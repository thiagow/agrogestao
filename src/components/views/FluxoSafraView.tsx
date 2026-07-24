'use client';

import React from 'react';
import { FluxoSafraItem } from '../../types';
import { formatCurrency } from '../../data/initialData';
import { Card, KpiCard, Badge } from '../ui';

interface FluxoSafraViewProps {
  itens: FluxoSafraItem[];
  receitaProjetada: number;
  saldoDevedorBancos: number;
}

export const FluxoSafraView: React.FC<FluxoSafraViewProps> = ({ itens, receitaProjetada, saldoDevedorBancos }) => {
  const totalSaidas = itens.reduce((sum, item) => sum + item.valor, 0);
  const fluxoLiquido = receitaProjetada - totalSaidas;
  const custoProximaSafra = itens.find((i) => i.categoria === 'Custo de Produção')?.valor ?? 0;
  const indiceCobertura = totalSaidas > 0 ? receitaProjetada / totalSaidas : 0;
  const deficitSuperavit = fluxoLiquido - custoProximaSafra;

  const totalRecursosEstruturar = saldoDevedorBancos;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Receita Projetada" value={formatCurrency(receitaProjetada)} subtitle="Realizado: R$ 0" />
        <KpiCard
          title="Total de Saídas"
          value={formatCurrency(totalSaidas)}
          subtitle="Custos + Dívidas + Despesas"
          valueClassName="text-rose-800"
        />
        <KpiCard
          title="Fluxo Líquido"
          value={formatCurrency(fluxoLiquido)}
          subtitle={fluxoLiquido >= 0 ? 'Superávit' : 'Déficit'}
          valueClassName="text-emerald-700"
        />
        <KpiCard
          title="Índice de Cobertura"
          value={`${indiceCobertura.toFixed(2)}x`}
          status={indiceCobertura >= 1.2 ? 'Excelente' : indiceCobertura >= 1 ? 'Bom' : 'Atenção'}
          referencia="Saudável: ≥ 1,2x"
        />
      </div>

      <Card className="p-6">
        <h3 className="text-base font-bold text-slate-900 mb-4">Demonstrativo de Fluxo</h3>

        <div className="space-y-4 max-w-xl">
          <div>
            <p className="text-[11px] font-bold uppercase text-emerald-700 mb-1.5">Entradas</p>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Receita Projetada da Safra</span>
              <span className="font-bold text-emerald-700">{formatCurrency(receitaProjetada)}</span>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase text-rose-700 mb-1.5">
              Saídas ({formatCurrency(totalSaidas)})
            </p>
            <div className="space-y-1">
              {itens.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-slate-600">{item.descricao}</span>
                  <span className="font-semibold text-rose-700">({formatCurrency(item.valor)})</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between border-t border-slate-200 pt-3">
            <span className="font-bold text-slate-800">Fluxo de Caixa Líquido</span>
            <span className="font-extrabold text-emerald-700">{formatCurrency(fluxoLiquido)}</span>
          </div>
          {fluxoLiquido >= 0 && (
            <p className="text-xs text-emerald-700">✓ Operação auto-sustentável nesta safra</p>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Estrutura de Financiamento Necessária</h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Renovação de Dívidas Bancárias (CP + LP)</span>
              <span className="font-semibold text-slate-800">{formatCurrency(saldoDevedorBancos)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Fornecedores Previstos (próxima safra)</span>
              <span className="font-semibold text-slate-800">{formatCurrency(0)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1.5">
              <span className="font-bold text-slate-800">Total de Recursos a Estruturar</span>
              <span className="font-extrabold text-slate-900">{formatCurrency(totalRecursosEstruturar)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Análise — Próxima Safra</h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Fluxo Disponível</span>
              <span className="font-semibold text-slate-800">{formatCurrency(fluxoLiquido)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Custo Projetado Safra</span>
              <span className="font-semibold text-slate-800">{formatCurrency(custoProximaSafra)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1.5">
              <span className="font-bold text-slate-800">Déficit/Superávit</span>
              <span className={`font-extrabold ${deficitSuperavit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {formatCurrency(deficitSuperavit)}
              </span>
            </div>
          </div>
          <div className="mt-3">
            <Badge tone={indiceCobertura >= 1.2 ? 'emerald' : 'amber'}>
              {indiceCobertura >= 1.2
                ? 'Produtor com boa capacidade de pagamento. Bancabilidade sólida'
                : 'Atenção à capacidade de pagamento'}
            </Badge>
          </div>
        </Card>
      </div>
    </div>
  );
};
