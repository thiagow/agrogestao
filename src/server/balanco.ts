'use server';

// Única escrita própria da tela "Análise Financeira" (réplica confirmada do
// AgroFlow, docs/demandas/SPEC_TELA_ANALISE_FINANCEIRA.md seção 5/9): os
// "Dados Complementares" — campos que nenhum módulo de origem cobre. O
// Balanço/DRE/32 indicadores em si não têm server action própria — são
// montados no client a partir dos dados já carregados por page.tsx (Quadro
// Safra, Fornecedores, Bancos, Arrendamentos, Aquisição, Bens e Direitos),
// mesmo critério de src/server/fluxo-safra.ts / src/lib/balanco-calc.ts.

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireContext } from '@/lib/session';
import { dadosComplementaresFinanceiroSchema } from '@/lib/validation';
import type { DadosComplementaresFinanceiro } from '@/types';

/**
 * Todos os registros de Dados Complementares da propriedade (um por safra já
 * salva) — o seletor de safra da tela escolhe qual usar no client, com
 * `complementaresVazio(safra)` como fallback pra safra ainda sem registro
 * (mesmo critério de "carrega a lista inteira e filtra no client" já usado em
 * Fluxo de Safra/Cotações/Comercialização).
 */
export async function listDadosComplementares(): Promise<DadosComplementaresFinanceiro[]> {
  const ctx = await requireContext();
  if (!ctx.propriedade) return [];

  const rows = await db.dadosComplementaresFinanceiro.findMany({
    where: { propriedadeId: ctx.propriedade.id, ativo: true }
  });

  return rows.map(toDTO);
}

export async function saveDadosComplementares(input: DadosComplementaresFinanceiro): Promise<DadosComplementaresFinanceiro> {
  const ctx = await requireContext();
  if (!ctx.propriedade) throw new Error('Nenhuma propriedade selecionada.');

  const parsed = dadosComplementaresFinanceiroSchema.parse(input);
  const { safra, ...data } = parsed;

  const row = await db.dadosComplementaresFinanceiro.upsert({
    where: { propriedadeId_safra: { propriedadeId: ctx.propriedade.id, safra } },
    update: { ...data, updatedById: ctx.user.id },
    create: { ...data, safra, propriedadeId: ctx.propriedade.id, createdById: ctx.user.id }
  });

  revalidatePath('/analise_financeira');
  return toDTO(row);
}

type DadosComplementaresRow = {
  safra: string;
  caixaEquivalentes: unknown;
  estoqueGraos: unknown;
  estoqueInsumos: unknown;
  outrosCreditosCp: unknown;
  contasReceberLp: unknown;
  outrosCreditosLp: unknown;
  investimentos: unknown;
  maquinasEquipamentos: unknown;
  benfeitorias: unknown;
  depreciacaoAcumulada: unknown;
  obrigTrabalhistasCp: unknown;
  obrigFiscaisCp: unknown;
  outrasObrigCp: unknown;
  obrigFiscaisLp: unknown;
  outrasObrigLp: unknown;
  partesRelacionadas: unknown;
  capitalSocial: unknown;
  reservasLucrosAcumulados: unknown;
  deducoesReceitaPercent: unknown;
  despesasOperacionais: unknown;
  despesasAdministrativas: unknown;
  despesaComercialFallback: unknown;
  despesaComercialScHa: unknown;
  dividendos: unknown;
  depreciacaoPeriodo: unknown;
  aliquotaIrCsllPercent: unknown;
  capex: unknown;
  servicoDividaManual: unknown;
};

function toDTO(row: DadosComplementaresRow): DadosComplementaresFinanceiro {
  return {
    safra: row.safra,
    caixaEquivalentes: Number(row.caixaEquivalentes),
    estoqueGraos: Number(row.estoqueGraos),
    estoqueInsumos: Number(row.estoqueInsumos),
    outrosCreditosCp: Number(row.outrosCreditosCp),
    contasReceberLp: Number(row.contasReceberLp),
    outrosCreditosLp: Number(row.outrosCreditosLp),
    investimentos: Number(row.investimentos),
    maquinasEquipamentos: Number(row.maquinasEquipamentos),
    benfeitorias: Number(row.benfeitorias),
    depreciacaoAcumulada: Number(row.depreciacaoAcumulada),
    obrigTrabalhistasCp: Number(row.obrigTrabalhistasCp),
    obrigFiscaisCp: Number(row.obrigFiscaisCp),
    outrasObrigCp: Number(row.outrasObrigCp),
    obrigFiscaisLp: Number(row.obrigFiscaisLp),
    outrasObrigLp: Number(row.outrasObrigLp),
    partesRelacionadas: Number(row.partesRelacionadas),
    capitalSocial: Number(row.capitalSocial),
    reservasLucrosAcumulados: Number(row.reservasLucrosAcumulados),
    deducoesReceitaPercent: Number(row.deducoesReceitaPercent),
    despesasOperacionais: Number(row.despesasOperacionais),
    despesasAdministrativas: Number(row.despesasAdministrativas),
    despesaComercialFallback: row.despesaComercialFallback != null ? Number(row.despesaComercialFallback) : undefined,
    despesaComercialScHa: Number(row.despesaComercialScHa),
    dividendos: Number(row.dividendos),
    depreciacaoPeriodo: Number(row.depreciacaoPeriodo),
    aliquotaIrCsllPercent: Number(row.aliquotaIrCsllPercent),
    capex: Number(row.capex),
    servicoDividaManual: row.servicoDividaManual != null ? Number(row.servicoDividaManual) : undefined
  };
}
