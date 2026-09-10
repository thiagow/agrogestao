'use client';

import React, { useEffect, useState } from 'react';
import type { DadosComplementaresFinanceiro } from '../types';
import { Input, Button } from './ui';

interface DadosComplementaresFormProps {
  safra: string;
  complementares: DadosComplementaresFinanceiro;
  onSave: (data: DadosComplementaresFinanceiro) => void;
}

type CamposNumericos = Exclude<keyof DadosComplementaresFinanceiro, 'safra'>;

const CAMPOS_INICIAIS: Record<CamposNumericos, string> = {
  caixaEquivalentes: '0',
  estoqueGraos: '0',
  estoqueInsumos: '0',
  outrosCreditosCp: '0',
  contasReceberLp: '0',
  outrosCreditosLp: '0',
  investimentos: '0',
  maquinasEquipamentos: '0',
  benfeitorias: '0',
  depreciacaoAcumulada: '0',
  obrigTrabalhistasCp: '0',
  obrigFiscaisCp: '0',
  outrasObrigCp: '0',
  obrigFiscaisLp: '0',
  outrasObrigLp: '0',
  partesRelacionadas: '0',
  capitalSocial: '0',
  reservasLucrosAcumulados: '0',
  deducoesReceitaPercent: '0',
  despesasOperacionais: '0',
  despesasAdministrativas: '0',
  despesaComercialFallback: '',
  despesaComercialScHa: '3',
  dividendos: '0',
  depreciacaoPeriodo: '0',
  aliquotaIrCsllPercent: '0',
  capex: '0',
  servicoDividaManual: ''
};

/**
 * Aba "Dados Complementares" — spec seção 5.1. Texto de ajuda já corrigido em
 * relação ao original (ponto de atenção #3 da spec: "Aquisição Fazenda"
 * faltava na lista de módulos automáticos).
 */
export const DadosComplementaresForm: React.FC<DadosComplementaresFormProps> = ({ safra, complementares, onSave }) => {
  const [valores, setValores] = useState<Record<CamposNumericos, string>>(CAMPOS_INICIAIS);

  useEffect(() => {
    const proximo: Record<CamposNumericos, string> = { ...CAMPOS_INICIAIS };
    (Object.keys(CAMPOS_INICIAIS) as CamposNumericos[]).forEach((campo) => {
      const valor = complementares[campo];
      proximo[campo] = valor === undefined || valor === null ? CAMPOS_INICIAIS[campo] : String(valor);
    });
    setValores(proximo);
  }, [complementares, safra]);

  const campo = (nome: CamposNumericos) => ({
    value: valores[nome],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setValores((prev) => ({ ...prev, [nome]: e.target.value }))
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      safra,
      caixaEquivalentes: parseFloat(valores.caixaEquivalentes) || 0,
      estoqueGraos: parseFloat(valores.estoqueGraos) || 0,
      estoqueInsumos: parseFloat(valores.estoqueInsumos) || 0,
      outrosCreditosCp: parseFloat(valores.outrosCreditosCp) || 0,
      contasReceberLp: parseFloat(valores.contasReceberLp) || 0,
      outrosCreditosLp: parseFloat(valores.outrosCreditosLp) || 0,
      investimentos: parseFloat(valores.investimentos) || 0,
      maquinasEquipamentos: parseFloat(valores.maquinasEquipamentos) || 0,
      benfeitorias: parseFloat(valores.benfeitorias) || 0,
      depreciacaoAcumulada: parseFloat(valores.depreciacaoAcumulada) || 0,
      obrigTrabalhistasCp: parseFloat(valores.obrigTrabalhistasCp) || 0,
      obrigFiscaisCp: parseFloat(valores.obrigFiscaisCp) || 0,
      outrasObrigCp: parseFloat(valores.outrasObrigCp) || 0,
      obrigFiscaisLp: parseFloat(valores.obrigFiscaisLp) || 0,
      outrasObrigLp: parseFloat(valores.outrasObrigLp) || 0,
      partesRelacionadas: parseFloat(valores.partesRelacionadas) || 0,
      capitalSocial: parseFloat(valores.capitalSocial) || 0,
      reservasLucrosAcumulados: parseFloat(valores.reservasLucrosAcumulados) || 0,
      deducoesReceitaPercent: parseFloat(valores.deducoesReceitaPercent) || 0,
      despesasOperacionais: parseFloat(valores.despesasOperacionais) || 0,
      despesasAdministrativas: parseFloat(valores.despesasAdministrativas) || 0,
      despesaComercialFallback: valores.despesaComercialFallback ? parseFloat(valores.despesaComercialFallback) : undefined,
      despesaComercialScHa: parseFloat(valores.despesaComercialScHa) || 3,
      dividendos: parseFloat(valores.dividendos) || 0,
      depreciacaoPeriodo: parseFloat(valores.depreciacaoPeriodo) || 0,
      aliquotaIrCsllPercent: parseFloat(valores.aliquotaIrCsllPercent) || 0,
      capex: parseFloat(valores.capex) || 0,
      servicoDividaManual: valores.servicoDividaManual ? parseFloat(valores.servicoDividaManual) : undefined
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-900">
        <strong>Bancos, Fornecedores, Arrendamentos, Aquisição de Fazenda e Quadro de Produção</strong> são preenchidos
        automaticamente. Informe abaixo os dados complementares para a safra {safra}.
      </div>

      <section>
        <p className="text-[11px] font-bold uppercase text-slate-500 mb-3">Ativo Circulante</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Input label="Caixa e Equivalentes (R$)" type="number" prefix="R$" {...campo('caixaEquivalentes')} />
          <Input label="Estoque de Grãos (R$)" type="number" prefix="R$" {...campo('estoqueGraos')} />
          <Input label="Estoque de Insumos (R$)" type="number" prefix="R$" {...campo('estoqueInsumos')} />
          <Input label="Outros Créditos CP (R$)" type="number" prefix="R$" {...campo('outrosCreditosCp')} />
        </div>
      </section>

      <section>
        <p className="text-[11px] font-bold uppercase text-slate-500 mb-3">Ativo Não Circulante</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Input label="Contas a Receber LP (R$)" type="number" prefix="R$" {...campo('contasReceberLp')} />
          <Input label="Outros Créditos LP (R$)" type="number" prefix="R$" {...campo('outrosCreditosLp')} />
          <Input label="Participações/Investimentos (R$)" type="number" prefix="R$" {...campo('investimentos')} />
          <Input label="Máquinas e Equipamentos (R$)" type="number" prefix="R$" {...campo('maquinasEquipamentos')} />
          <Input label="Benfeitorias e Construções (R$)" type="number" prefix="R$" {...campo('benfeitorias')} />
          <Input label="Depreciação Acumulada (R$)" type="number" prefix="R$" {...campo('depreciacaoAcumulada')} />
        </div>
      </section>

      <section>
        <p className="text-[11px] font-bold uppercase text-slate-500 mb-3">Passivo Complementar</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Input label="Obrigações Trabalhistas CP (R$)" type="number" prefix="R$" {...campo('obrigTrabalhistasCp')} />
          <Input label="Obrigações Fiscais CP (R$)" type="number" prefix="R$" {...campo('obrigFiscaisCp')} />
          <Input label="Outras Obrigações CP (R$)" type="number" prefix="R$" {...campo('outrasObrigCp')} />
          <Input label="Obrigações Fiscais LP (R$)" type="number" prefix="R$" {...campo('obrigFiscaisLp')} />
          <Input label="Outras Obrigações LP (R$)" type="number" prefix="R$" {...campo('outrasObrigLp')} />
          <Input label="Partes Relacionadas (R$)" type="number" prefix="R$" {...campo('partesRelacionadas')} />
        </div>
      </section>

      <section>
        <p className="text-[11px] font-bold uppercase text-slate-500 mb-3">Patrimônio Líquido</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Input label="Capital Social (R$)" type="number" prefix="R$" {...campo('capitalSocial')} />
          <Input label="Reservas e Lucros Acumulados (R$)" type="number" prefix="R$" {...campo('reservasLucrosAcumulados')} />
        </div>
      </section>

      <section>
        <p className="text-[11px] font-bold uppercase text-slate-500 mb-3">DRE Complementar</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Input label="Deduções da Receita (%)" type="number" step="0.01" {...campo('deducoesReceitaPercent')} />
          <Input label="Despesas Operacionais (R$)" type="number" prefix="R$" {...campo('despesasOperacionais')} />
          <Input label="Despesas Administrativas (R$)" type="number" prefix="R$" {...campo('despesasAdministrativas')} />
          <Input
            label="Despesas Comerciais (R$) — Fallback"
            type="number"
            prefix="R$"
            hint="Usado apenas se não houver preço de soja cadastrado em Cotações"
            {...campo('despesaComercialFallback')}
          />
          <Input
            label="Desp. Comerciais (sc/ha)"
            type="number"
            step="0.1"
            hint="Padrão: 3 sc/ha"
            {...campo('despesaComercialScHa')}
          />
          <Input label="Dividendos (R$)" type="number" prefix="R$" {...campo('dividendos')} />
          <Input label="Depreciação do Período (R$)" type="number" prefix="R$" {...campo('depreciacaoPeriodo')} />
          <Input label="Alíquota IR/CSLL (%)" type="number" step="0.01" {...campo('aliquotaIrCsllPercent')} />
        </div>
      </section>

      <section>
        <p className="text-[11px] font-bold uppercase text-slate-500 mb-3">Fluxo de Caixa</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Input label="CAPEX (R$)" type="number" prefix="R$" {...campo('capex')} />
          <Input
            label="Serviço da Dívida Total (R$)"
            type="number"
            prefix="R$"
            hint="Padrão: juros + amortização do cronograma bancário do ano"
            {...campo('servicoDividaManual')}
          />
        </div>
      </section>

      <div className="pt-4 border-t border-slate-200 flex justify-end">
        <Button type="submit" variant="primary" className="w-auto px-6 py-2.5 text-sm">
          Salvar Dados Complementares
        </Button>
      </div>
    </form>
  );
};
