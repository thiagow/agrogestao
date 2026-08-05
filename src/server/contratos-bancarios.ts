'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireContext } from '@/lib/session';
import { contratoBancarioSchema } from '@/lib/validation';
import { TIPO_TAXA_TO_DB, TIPO_TAXA_FROM_DB, PERIODICIDADE_TO_DB, PERIODICIDADE_FROM_DB } from '@/lib/enum-maps';
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
  tipoContrato: ContratoBancario['tipoContrato'];
  saldoInicial: number;
  saldoAtual: number;
  taxaJuros: number;
  tipoTaxa: ContratoBancario['tipoTaxa'];
  taxaAdicional?: number;
  dataContratacao: string;
  dataVencimento: string;
  sistemaAmortizacao: ContratoBancario['sistemaAmortizacao'];
  periodicidade: ContratoBancario['periodicidade'];
  finalidade: ContratoBancario['finalidade'];
  moeda: ContratoBancario['moeda'];
  observacoes?: string;
}

export async function saveContratoBancario(input: SaveContratoInput): Promise<ContratoBancario> {
  const ctx = await requireContext();
  if (!ctx.propriedade) throw new Error('Nenhuma propriedade selecionada.');

  const parsed = contratoBancarioSchema.parse(input);

  const data = {
    banco: parsed.banco,
    tipoContrato: parsed.tipoContrato,
    saldoInicial: parsed.saldoInicial,
    saldoAtual: parsed.saldoAtual,
    taxaJuros: parsed.taxaJuros,
    tipoTaxa: TIPO_TAXA_TO_DB[parsed.tipoTaxa],
    taxaAdicional: parsed.tipoTaxa === 'CDI' ? parsed.taxaAdicional ?? 0 : null,
    dataContratacao: new Date(parsed.dataContratacao),
    dataVencimento: new Date(parsed.dataVencimento),
    sistemaAmortizacao: parsed.sistemaAmortizacao,
    periodicidade: PERIODICIDADE_TO_DB[parsed.periodicidade],
    finalidade: parsed.finalidade,
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
    dataContratacao: parsed.dataContratacao,
    dataVencimento: parsed.dataVencimento
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
  tipoContrato: string;
  saldoInicial: unknown;
  saldoAtual: unknown;
  taxaJuros: unknown;
  tipoTaxa: string;
  taxaAdicional: unknown;
  dataContratacao: Date;
  dataVencimento: Date;
  sistemaAmortizacao: string;
  periodicidade: string;
  finalidade: string;
  moeda: string;
  observacoes: string | null;
};

function toContratoDTO(row: ContratoRow): ContratoBancario {
  return {
    id: row.id,
    banco: row.banco,
    tipoContrato: row.tipoContrato as ContratoBancario['tipoContrato'],
    saldoInicial: Number(row.saldoInicial),
    saldoAtual: Number(row.saldoAtual),
    taxaJuros: Number(row.taxaJuros),
    tipoTaxa: TIPO_TAXA_FROM_DB[row.tipoTaxa as keyof typeof TIPO_TAXA_FROM_DB],
    taxaAdicional: row.taxaAdicional != null ? Number(row.taxaAdicional) : undefined,
    dataContratacao: row.dataContratacao.toISOString().slice(0, 10),
    dataVencimento: row.dataVencimento.toISOString().slice(0, 10),
    sistemaAmortizacao: row.sistemaAmortizacao as ContratoBancario['sistemaAmortizacao'],
    periodicidade: PERIODICIDADE_FROM_DB[row.periodicidade as keyof typeof PERIODICIDADE_FROM_DB],
    finalidade: row.finalidade as ContratoBancario['finalidade'],
    moeda: row.moeda as ContratoBancario['moeda'],
    observacoes: row.observacoes ?? undefined
  };
}
