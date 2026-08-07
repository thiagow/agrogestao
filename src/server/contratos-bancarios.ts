'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireContext } from '@/lib/session';
import { contratoBancarioSchema } from '@/lib/validation';
import {
  TIPO_TAXA_TO_DB,
  TIPO_TAXA_FROM_DB,
  TIPO_OPERACAO_TO_DB,
  TIPO_OPERACAO_FROM_DB,
  BASE_CALCULO_TO_DB,
  BASE_CALCULO_FROM_DB,
  TIPO_CAPITALIZACAO_TO_DB,
  TIPO_CAPITALIZACAO_FROM_DB,
  PERIODICIDADE_TO_DB,
  PERIODICIDADE_FROM_DB
} from '@/lib/enum-maps';
import { gerarCronograma } from '@/lib/amortizacao';
import type { ContratoBancario } from '@/types';

export async function listContratosBancarios(): Promise<ContratoBancario[]> {
  const ctx = await requireContext();
  if (!ctx.propriedade) return [];

  const rows = await db.contratoBancario.findMany({
    where: { propriedadeId: ctx.propriedade.id, ativo: true },
    orderBy: { createdAt: 'desc' }
  });

  return rows.map(toContratoDTO);
}

export async function listParcelas(contratoId: string) {
  const ctx = await requireContext();
  if (!ctx.propriedade) return [];

  // Confere que o contrato pertence à propriedade ativa antes de expor as parcelas.
  const contrato = await db.contratoBancario.findFirst({
    where: { id: contratoId, propriedadeId: ctx.propriedade.id }
  });
  if (!contrato) return [];

  const parcelas = await db.parcela.findMany({ where: { contratoId }, orderBy: { numero: 'asc' } });
  return parcelas.map((p) => ({
    id: p.id,
    numero: p.numero,
    dataPagamento: p.dataPagamento.toISOString().slice(0, 10),
    valorPrincipal: Number(p.valorPrincipal),
    valorJuros: Number(p.valorJuros),
    valorTotal: Number(p.valorTotal),
    saldoDevedor: Number(p.saldoDevedor),
    pago: p.pago
  }));
}

interface SaveContratoInput {
  id?: string;
  banco: string;
  nomeTomador?: string;
  numeroContrato?: string;
  tipoOperacao: ContratoBancario['tipoOperacao'];
  safraVinculadaId?: string;
  culturaVinculadaId?: string;
  saldoInicial: number;
  saldoAtual: number;
  taxaJuros: number;
  tipoTaxa: ContratoBancario['tipoTaxa'];
  taxaAdicional?: number;
  baseCalculo: ContratoBancario['baseCalculo'];
  capitalizacao: ContratoBancario['capitalizacao'];
  dataContratacao: string;
  inicioPagamento?: string;
  dataVencimento: string;
  sistemaAmortizacao: ContratoBancario['sistemaAmortizacao'];
  periodicidade: ContratoBancario['periodicidade'];
  possuiCarencia: boolean;
  tipoGarantia?: string;
  valorGarantia?: number;
  moeda: ContratoBancario['moeda'];
  observacoes?: string;
}

export async function saveContratoBancario(input: SaveContratoInput): Promise<ContratoBancario> {
  const ctx = await requireContext();
  if (!ctx.propriedade) throw new Error('Nenhuma propriedade selecionada.');

  const parsed = contratoBancarioSchema.parse(input);
  // "Início de Pagamento" é persistido sempre que preenchido — a checkbox "Possui
  // carência?" só decide se ele entra no cálculo do cronograma (temCarencia), não se
  // o campo é salvo. Desmarcar a caixa não deve apagar a data silenciosamente.
  const temCarencia = parsed.possuiCarencia && !!parsed.inicioPagamento;

  const data = {
    banco: parsed.banco,
    nomeTomador: parsed.nomeTomador || null,
    numeroContrato: parsed.numeroContrato || null,
    tipoOperacao: TIPO_OPERACAO_TO_DB[parsed.tipoOperacao],
    safraVinculadaId: parsed.safraVinculadaId || null,
    culturaVinculadaId: parsed.culturaVinculadaId || null,
    saldoInicial: parsed.saldoInicial,
    saldoAtual: parsed.saldoAtual,
    taxaJuros: parsed.taxaJuros,
    tipoTaxa: TIPO_TAXA_TO_DB[parsed.tipoTaxa],
    taxaAdicional: parsed.tipoTaxa !== 'Pré-fixado (% a.a.)' ? parsed.taxaAdicional ?? 0 : null,
    baseCalculo: BASE_CALCULO_TO_DB[parsed.baseCalculo],
    capitalizacao: TIPO_CAPITALIZACAO_TO_DB[parsed.capitalizacao],
    dataContratacao: new Date(parsed.dataContratacao),
    inicioPagamento: parsed.inicioPagamento ? new Date(parsed.inicioPagamento) : null,
    dataVencimento: new Date(parsed.dataVencimento),
    sistemaAmortizacao: parsed.sistemaAmortizacao,
    periodicidade: PERIODICIDADE_TO_DB[parsed.periodicidade],
    possuiCarencia: parsed.possuiCarencia,
    tipoGarantia: parsed.tipoGarantia || null,
    valorGarantia: parsed.valorGarantia ?? null,
    moeda: parsed.moeda,
    observacoes: parsed.observacoes || null
  };

  const row = input.id
    ? await db.contratoBancario.update({
        where: { id: input.id, propriedadeId: ctx.propriedade.id },
        data: { ...data, updatedById: ctx.user.id }
      })
    : await db.contratoBancario.create({
        data: { ...data, propriedadeId: ctx.propriedade.id, createdById: ctx.user.id }
      });

  // Cronograma sempre recriado do zero — não há UI de baixa de parcela ainda,
  // então não existe estado ("pago") a preservar entre edições do contrato.
  const cronograma = gerarCronograma({
    saldoInicial: parsed.saldoInicial,
    taxaJurosAnual: parsed.taxaJuros,
    sistemaAmortizacao: parsed.sistemaAmortizacao,
    periodicidade: parsed.periodicidade,
    baseCalculo: parsed.baseCalculo,
    capitalizacao: parsed.capitalizacao,
    dataContratacao: parsed.dataContratacao,
    dataVencimento: parsed.dataVencimento,
    possuiCarencia: temCarencia,
    inicioPagamento: temCarencia ? (parsed.inicioPagamento as string) : undefined
  });

  await db.parcela.deleteMany({ where: { contratoId: row.id } });
  await db.parcela.createMany({
    data: cronograma.map((p) => ({
      contratoId: row.id,
      numero: p.numero,
      dataPagamento: new Date(p.dataPagamento),
      valorPrincipal: p.valorPrincipal,
      valorJuros: p.valorJuros,
      valorTotal: p.valorTotal,
      saldoDevedor: p.saldoDevedor
    }))
  });

  revalidatePath('/bancos');
  revalidatePath('/resumo');
  revalidatePath('/fluxo_safra');
  return toContratoDTO(row);
}

export async function deleteContratoBancario(id: string) {
  const ctx = await requireContext();
  if (!ctx.propriedade) throw new Error('Nenhuma propriedade selecionada.');

  await db.contratoBancario.updateMany({
    where: { id, propriedadeId: ctx.propriedade.id },
    data: { ativo: false, updatedById: ctx.user.id }
  });

  revalidatePath('/bancos');
  revalidatePath('/resumo');
  revalidatePath('/fluxo_safra');
}

type ContratoRow = {
  id: string;
  banco: string;
  nomeTomador: string | null;
  numeroContrato: string | null;
  tipoOperacao: string;
  safraVinculadaId: string | null;
  culturaVinculadaId: string | null;
  saldoInicial: unknown;
  saldoAtual: unknown;
  taxaJuros: unknown;
  tipoTaxa: string;
  taxaAdicional: unknown;
  baseCalculo: string;
  capitalizacao: string;
  dataContratacao: Date;
  inicioPagamento: Date | null;
  dataVencimento: Date;
  sistemaAmortizacao: string;
  periodicidade: string;
  possuiCarencia: boolean;
  tipoGarantia: string | null;
  valorGarantia: unknown;
  moeda: string;
  observacoes: string | null;
};

function toContratoDTO(row: ContratoRow): ContratoBancario {
  return {
    id: row.id,
    banco: row.banco,
    nomeTomador: row.nomeTomador ?? undefined,
    numeroContrato: row.numeroContrato ?? undefined,
    tipoOperacao: TIPO_OPERACAO_FROM_DB[row.tipoOperacao as keyof typeof TIPO_OPERACAO_FROM_DB],
    safraVinculadaId: row.safraVinculadaId ?? undefined,
    culturaVinculadaId: row.culturaVinculadaId ?? undefined,
    saldoInicial: Number(row.saldoInicial),
    saldoAtual: Number(row.saldoAtual),
    taxaJuros: Number(row.taxaJuros),
    tipoTaxa: TIPO_TAXA_FROM_DB[row.tipoTaxa as keyof typeof TIPO_TAXA_FROM_DB],
    taxaAdicional: row.taxaAdicional != null ? Number(row.taxaAdicional) : undefined,
    baseCalculo: BASE_CALCULO_FROM_DB[row.baseCalculo as keyof typeof BASE_CALCULO_FROM_DB],
    capitalizacao: TIPO_CAPITALIZACAO_FROM_DB[row.capitalizacao as keyof typeof TIPO_CAPITALIZACAO_FROM_DB],
    dataContratacao: row.dataContratacao.toISOString().slice(0, 10),
    inicioPagamento: row.inicioPagamento ? row.inicioPagamento.toISOString().slice(0, 10) : undefined,
    dataVencimento: row.dataVencimento.toISOString().slice(0, 10),
    sistemaAmortizacao: row.sistemaAmortizacao as ContratoBancario['sistemaAmortizacao'],
    periodicidade: PERIODICIDADE_FROM_DB[row.periodicidade as keyof typeof PERIODICIDADE_FROM_DB],
    possuiCarencia: row.possuiCarencia,
    tipoGarantia: row.tipoGarantia ?? undefined,
    valorGarantia: row.valorGarantia != null ? Number(row.valorGarantia) : undefined,
    moeda: row.moeda as ContratoBancario['moeda'],
    observacoes: row.observacoes ?? undefined
  };
}
