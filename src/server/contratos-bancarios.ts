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
import { carregarIndicesVigentes, regerarCronograma } from './cronograma-engine';
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

export interface AnoCronograma {
  ano: number;
  juros: number;
  amortizacao: number;
  total: number;
  /** Total do ano quebrado por Tipo de Operação, ordenado do maior para o menor. */
  porTipo: { tipoOperacao: string; total: number }[];
}

export interface CronogramaConsolidado {
  anos: AnoCronograma[];
  totalJuros: number;
  totalAmortizacao: number;
  totalGeral: number;
  /** Menor ano com parcela projetada. 0 quando não há nenhuma. */
  anoInicial: number;
  /** Maior ano de vencimento entre os contratos ativos — pode ser além da última parcela. */
  anoFinal: number;
  /** Contratos indexados cujo índice ainda não foi buscado (projeção só com o spread). */
  contratosSemIndice: number;
}

/**
 * Projeção consolidada de pagamentos por ano, somando todos os contratos ativos
 * da propriedade — a tabela principal da aba "Cronograma".
 *
 * Uma query só: as parcelas já estão persistidas com os juros corretos (o
 * indexador entra na geração, não na leitura), então aqui é pura agregação.
 */
export async function listCronogramaConsolidado(): Promise<CronogramaConsolidado> {
  const ctx = await requireContext();
  if (!ctx.propriedade) return vazio();

  const [parcelas, contratos] = await Promise.all([
    db.parcela.findMany({
      where: { contrato: { propriedadeId: ctx.propriedade.id, ativo: true } },
      select: {
        dataPagamento: true,
        valorPrincipal: true,
        valorJuros: true,
        valorTotal: true,
        contrato: { select: { tipoOperacao: true } }
      }
    }),
    db.contratoBancario.findMany({
      where: { propriedadeId: ctx.propriedade.id, ativo: true },
      select: { dataVencimento: true, tipoTaxa: true, indiceReferencia: true }
    })
  ]);

  const porAno = new Map<number, { juros: number; amortizacao: number; tipos: Map<string, number> }>();

  for (const p of parcelas) {
    // getUTCFullYear: as datas são gravadas à meia-noite UTC (ver amortizacao.ts),
    // e ler em horário local jogaria uma parcela de 1º de janeiro para o ano anterior.
    const ano = p.dataPagamento.getUTCFullYear();
    const acc = porAno.get(ano) ?? { juros: 0, amortizacao: 0, tipos: new Map<string, number>() };

    acc.juros += Number(p.valorJuros);
    acc.amortizacao += Number(p.valorPrincipal);

    const tipo = TIPO_OPERACAO_FROM_DB[p.contrato.tipoOperacao as keyof typeof TIPO_OPERACAO_FROM_DB];
    acc.tipos.set(tipo, (acc.tipos.get(tipo) ?? 0) + Number(p.valorTotal));

    porAno.set(ano, acc);
  }

  const anos: AnoCronograma[] = Array.from(porAno.entries())
    .map(([ano, acc]) => ({
      ano,
      juros: acc.juros,
      amortizacao: acc.amortizacao,
      total: acc.juros + acc.amortizacao,
      porTipo: Array.from(acc.tipos.entries())
        .map(([tipoOperacao, total]) => ({ tipoOperacao, total }))
        .sort((a, b) => b.total - a.total)
    }))
    .sort((a, b) => a.ano - b.ano);

  if (anos.length === 0) return vazio();

  const anoUltimoVencimento = Math.max(...contratos.map((c) => c.dataVencimento.getUTCFullYear()));
  const contratosSemIndice = contratos.filter(
    (c) => c.tipoTaxa !== 'PRE_FIXADO' && c.indiceReferencia == null
  ).length;

  return {
    anos,
    totalJuros: anos.reduce((s, a) => s + a.juros, 0),
    totalAmortizacao: anos.reduce((s, a) => s + a.amortizacao, 0),
    totalGeral: anos.reduce((s, a) => s + a.total, 0),
    anoInicial: anos[0].ano,
    // O título do cronograma vai até o último vencimento contratado, mesmo que
    // não haja parcela projetada lá no fim (é assim no AgroFlow original).
    anoFinal: Math.max(anos[anos.length - 1].ano, anoUltimoVencimento),
    contratosSemIndice
  };
}

function vazio(): CronogramaConsolidado {
  return {
    anos: [],
    totalJuros: 0,
    totalAmortizacao: 0,
    totalGeral: 0,
    anoInicial: 0,
    anoFinal: 0,
    contratosSemIndice: 0
  };
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

  // Cronograma sempre recriado do zero, já com a taxa efetiva do indexador
  // vigente (CDI/IPCA/dólar) — ver src/server/cronograma-engine.ts.
  const indices = await carregarIndicesVigentes();
  await regerarCronograma(row, indices);

  revalidatePath('/bancos');
  revalidatePath('/resumo');
  revalidatePath('/fluxo_safra');

  // Releitura para devolver ao client a memória de cálculo que o engine acabou
  // de gravar (taxa efetiva, índice aplicado e sua data).
  const atualizado = await db.contratoBancario.findUniqueOrThrow({ where: { id: row.id } });
  return toContratoDTO(atualizado);
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
  taxaEfetivaAplicada: unknown;
  indiceReferencia: unknown;
  indiceAtualizadoEm: Date | null;
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
    observacoes: row.observacoes ?? undefined,
    taxaEfetivaAplicada: row.taxaEfetivaAplicada != null ? Number(row.taxaEfetivaAplicada) : undefined,
    indiceReferencia: row.indiceReferencia != null ? Number(row.indiceReferencia) : undefined,
    indiceAtualizadoEm: row.indiceAtualizadoEm
      ? row.indiceAtualizadoEm.toISOString().slice(0, 10)
      : undefined
  };
}
