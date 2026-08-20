'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireContext } from '@/lib/session';
import { aquisicaoSchema } from '@/lib/validation';
import { gerarParcelasAquisicao } from '@/lib/aquisicao-engine';
import { calcularSafra } from '@/lib/agro';
import type { Aquisicao, ParcelaAquisicao } from '@/types';

export async function listAquisicoes(): Promise<Aquisicao[]> {
  const ctx = await requireContext();
  if (!ctx.propriedade) return [];

  const rows = await db.aquisicao.findMany({
    where: { propriedadeId: ctx.propriedade.id, ativo: true },
    include: { parcelas: { orderBy: { ordem: 'asc' } }, culturaReferencia: true },
    orderBy: { createdAt: 'desc' }
  });

  return rows.map(toDTO);
}

interface SaveAquisicaoInput {
  id?: string;
  nomeFazenda: string;
  vendedor?: string;
  denominacaoImovel?: string;
  comarca?: string;
  numeroMatricula?: string;
  estado: string;
  municipio: string;
  areaTotalHa: number;
  areaAgricolaHa: number;
  dataAquisicao: string;
  dataInicioPagamento: string;
  dataVencimento: string;
  prazoFinanciamentoMeses?: number;
  tipoPagamento: 'SACAS' | 'REAIS';
  periodicidade: string;
  culturaReferenciaId?: string;
  sacasHa?: number;
  precoReferencia?: number;
  precoHa?: number;
  valorTotalManual?: number;
  valorFinanciado?: number;
  taxaJurosAA?: number;
  valorEntrada?: number;
  safraEntrada?: string;
}

export async function saveAquisicao(input: SaveAquisicaoInput): Promise<Aquisicao> {
  const ctx = await requireContext();
  if (!ctx.propriedade) throw new Error('Nenhuma propriedade selecionada.');

  const parsed = aquisicaoSchema.parse(input);

  const parcelasGeradas = gerarParcelasAquisicao({
    tipoPagamento: parsed.tipoPagamento,
    areaTotalHa: parsed.areaTotalHa,
    dataInicioPagamento: parsed.dataInicioPagamento,
    dataVencimento: parsed.dataVencimento,
    sacasHa: parsed.sacasHa,
    precoReferencia: parsed.precoReferencia,
    valorFinanciado: parsed.valorFinanciado,
    taxaJurosAA: parsed.taxaJurosAA,
    valorEntrada: parsed.valorEntrada,
    safraEntrada: parsed.safraEntrada || undefined
  });

  const valorTotalFluxo = parcelasGeradas.reduce((sum, p) => sum + p.valorTotal, 0);
  const totalSacas = parcelasGeradas.reduce((sum, p) => sum + p.sacas, 0);

  const data = {
    nomeFazenda: parsed.nomeFazenda,
    vendedor: parsed.vendedor || null,
    denominacaoImovel: parsed.denominacaoImovel || null,
    comarca: parsed.comarca || null,
    numeroMatricula: parsed.numeroMatricula || null,
    estado: parsed.estado.toUpperCase(),
    municipio: parsed.municipio,
    areaTotalHa: parsed.areaTotalHa,
    areaAgricolaHa: parsed.areaAgricolaHa,
    dataAquisicao: new Date(parsed.dataAquisicao),
    dataInicioPagamento: new Date(parsed.dataInicioPagamento),
    dataVencimento: new Date(parsed.dataVencimento),
    prazoFinanciamentoMeses: parsed.prazoFinanciamentoMeses ?? null,
    tipoPagamento: parsed.tipoPagamento,
    periodicidade: parsed.periodicidade,
    culturaReferenciaId: parsed.culturaReferenciaId || null,
    sacasHa: parsed.sacasHa ?? null,
    precoReferencia: parsed.precoReferencia ?? null,
    precoHa: parsed.precoHa ?? null,
    valorTotalManual: parsed.valorTotalManual ?? null,
    valorFinanciado: parsed.valorFinanciado ?? null,
    taxaJurosAA: parsed.taxaJurosAA ?? null,
    valorEntrada: parsed.valorEntrada ?? null,
    safraEntrada: parsed.safraEntrada || null,
    valorTotalFluxo,
    totalSacas
  };

  const aquisicaoId = await db.$transaction(async (tx) => {
    const row = input.id
      ? await tx.aquisicao.update({
          where: { id: input.id, propriedadeId: ctx.propriedade!.id },
          data: { ...data, updatedById: ctx.user.id }
        })
      : await tx.aquisicao.create({
          data: { ...data, propriedadeId: ctx.propriedade!.id, createdById: ctx.user.id }
        });

    await tx.parcelaAquisicao.deleteMany({ where: { aquisicaoId: row.id } });
    if (parcelasGeradas.length > 0) {
      await tx.parcelaAquisicao.createMany({
        data: parcelasGeradas.map((p) => ({
          aquisicaoId: row.id,
          safra: p.safra,
          tipo: p.tipo,
          sacas: p.sacas,
          precoSc: p.precoSc,
          usaPrecoReferencia: p.usaPrecoReferencia,
          valorTotal: p.valorTotal,
          dataPagamento: new Date(p.dataPagamento),
          ordem: p.ordem
        }))
      });
    }

    return row.id;
  });

  revalidatePath('/aquisicao_fazenda');
  revalidatePath('/resumo');
  revalidatePath('/fluxo_caixa');

  const saved = await db.aquisicao.findUniqueOrThrow({
    where: { id: aquisicaoId },
    include: { parcelas: { orderBy: { ordem: 'asc' } }, culturaReferencia: true }
  });
  return toDTO(saved);
}

export async function deleteAquisicao(id: string) {
  const ctx = await requireContext();
  if (!ctx.propriedade) throw new Error('Nenhuma propriedade selecionada.');

  await db.aquisicao.updateMany({
    where: { id, propriedadeId: ctx.propriedade.id },
    data: { ativo: false, updatedById: ctx.user.id }
  });

  revalidatePath('/aquisicao_fazenda');
  revalidatePath('/resumo');
  revalidatePath('/fluxo_caixa');
}

/** Linha consolidada da aba "Fluxo por Safra" — junta as parcelas de todas as aquisições ativas. */
export interface LinhaFluxoConsolidado {
  safra: string;
  fazenda: string;
  tipo: ParcelaAquisicao['tipo'];
  cultura: string;
  sacas: number;
  precoSc: number | null;
  valorTotal: number;
  dataPagamento: string;
}

export async function listFluxoConsolidadoAquisicoes(): Promise<LinhaFluxoConsolidado[]> {
  const aquisicoes = await listAquisicoesComCultura();

  const linhas: LinhaFluxoConsolidado[] = [];
  for (const a of aquisicoes) {
    for (const p of a.parcelas) {
      linhas.push({
        safra: p.safra,
        fazenda: a.nomeFazenda,
        tipo: p.tipo,
        cultura: a.culturaNome ?? '—',
        sacas: p.sacas,
        precoSc: p.precoSc ?? null,
        valorTotal: p.valorTotal,
        dataPagamento: p.dataPagamento
      });
    }
  }

  linhas.sort((x, y) => x.dataPagamento.localeCompare(y.dataPagamento));
  return linhas;
}

/** Um card da aba "Análise de Impacto" — cruza sacas comprometidas com a produção de Soja do Quadro de Safra. */
export interface ImpactoSafra {
  safra: string;
  sacasAquisicao: number;
  producaoSoja: number;
  valorTotal: number;
  /** null quando não há registro de Soja cadastrado no Quadro de Safra para essa safra — nunca 0,00% enganoso. */
  percentualImpacto: number | null;
}

export async function listImpactoPorSafra(): Promise<ImpactoSafra[]> {
  const ctx = await requireContext();
  if (!ctx.propriedade) return [];

  const aquisicoes = await db.aquisicao.findMany({
    where: { propriedadeId: ctx.propriedade.id, ativo: true },
    include: { parcelas: true }
  });
  if (aquisicoes.length === 0) return [];

  const quadroSoja = await db.quadroSafra.findMany({
    where: { propriedadeId: ctx.propriedade.id, ativo: true, cultura: { equals: 'Soja', mode: 'insensitive' } }
  });
  const producaoPorSafra = new Map<string, number>();
  for (const r of quadroSoja) {
    const { totalProducao } = calcularSafra({
      hectares: r.hectares,
      rendimento: Number(r.rendimento),
      precoMedio: Number(r.precoMedio),
      custoProducao: Number(r.custoProducao)
    });
    producaoPorSafra.set(r.anoSafra, (producaoPorSafra.get(r.anoSafra) ?? 0) + totalProducao);
  }

  const porSafra = new Map<string, { sacas: number; valor: number }>();
  for (const a of aquisicoes) {
    for (const p of a.parcelas) {
      const atual = porSafra.get(p.safra) ?? { sacas: 0, valor: 0 };
      atual.sacas += Number(p.sacas);
      atual.valor += Number(p.valorTotal);
      porSafra.set(p.safra, atual);
    }
  }

  return Array.from(porSafra.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([safra, { sacas, valor }]) => {
      const producaoSoja = producaoPorSafra.get(safra) ?? 0;
      return {
        safra,
        sacasAquisicao: sacas,
        producaoSoja,
        valorTotal: valor,
        percentualImpacto: producaoSoja > 0 ? (sacas / producaoSoja) * 100 : null
      };
    });
}

// ---- internos ----

async function listAquisicoesComCultura() {
  const ctx = await requireContext();
  if (!ctx.propriedade) return [];

  const rows = await db.aquisicao.findMany({
    where: { propriedadeId: ctx.propriedade.id, ativo: true },
    include: { parcelas: { orderBy: { ordem: 'asc' } }, culturaReferencia: true }
  });

  return rows.map((row) => ({
    id: row.id,
    nomeFazenda: row.nomeFazenda,
    culturaNome: row.culturaReferencia?.nome ?? null,
    parcelas: row.parcelas.map(toParcelaDTO)
  }));
}

function toParcelaDTO(p: {
  id: string;
  safra: string;
  tipo: string;
  sacas: unknown;
  precoSc: unknown;
  usaPrecoReferencia: boolean;
  valorTotal: unknown;
  dataPagamento: Date;
}): ParcelaAquisicao {
  return {
    id: p.id,
    safra: p.safra,
    tipo: p.tipo as ParcelaAquisicao['tipo'],
    sacas: Number(p.sacas),
    precoSc: p.precoSc != null ? Number(p.precoSc) : undefined,
    usaPrecoReferencia: p.usaPrecoReferencia,
    valorTotal: Number(p.valorTotal),
    dataPagamento: p.dataPagamento.toISOString().slice(0, 10)
  };
}

function toDTO(row: {
  id: string;
  nomeFazenda: string;
  vendedor: string | null;
  denominacaoImovel: string | null;
  comarca: string | null;
  numeroMatricula: string | null;
  estado: string;
  municipio: string;
  areaTotalHa: number;
  areaAgricolaHa: number;
  dataAquisicao: Date;
  dataInicioPagamento: Date;
  dataVencimento: Date;
  prazoFinanciamentoMeses: number | null;
  tipoPagamento: string;
  periodicidade: string;
  culturaReferenciaId: string | null;
  culturaReferencia: { nome: string } | null;
  sacasHa: unknown;
  precoReferencia: unknown;
  precoHa: unknown;
  valorTotalManual: unknown;
  valorFinanciado: unknown;
  taxaJurosAA: unknown;
  valorEntrada: unknown;
  safraEntrada: string | null;
  valorTotalFluxo: unknown;
  totalSacas: number;
  parcelas: Parameters<typeof toParcelaDTO>[0][];
}): Aquisicao {
  return {
    id: row.id,
    nomeFazenda: row.nomeFazenda,
    vendedor: row.vendedor ?? undefined,
    denominacaoImovel: row.denominacaoImovel ?? undefined,
    comarca: row.comarca ?? undefined,
    numeroMatricula: row.numeroMatricula ?? undefined,
    estado: row.estado,
    municipio: row.municipio,
    areaTotalHa: row.areaTotalHa,
    areaAgricolaHa: row.areaAgricolaHa,
    dataAquisicao: row.dataAquisicao.toISOString().slice(0, 10),
    dataInicioPagamento: row.dataInicioPagamento.toISOString().slice(0, 10),
    dataVencimento: row.dataVencimento.toISOString().slice(0, 10),
    prazoFinanciamentoMeses: row.prazoFinanciamentoMeses ?? undefined,
    tipoPagamento: row.tipoPagamento as Aquisicao['tipoPagamento'],
    periodicidade: row.periodicidade,
    culturaReferenciaId: row.culturaReferenciaId ?? undefined,
    culturaNome: row.culturaReferencia?.nome ?? undefined,
    sacasHa: row.sacasHa != null ? Number(row.sacasHa) : undefined,
    precoReferencia: row.precoReferencia != null ? Number(row.precoReferencia) : undefined,
    precoHa: row.precoHa != null ? Number(row.precoHa) : undefined,
    valorTotalManual: row.valorTotalManual != null ? Number(row.valorTotalManual) : undefined,
    valorFinanciado: row.valorFinanciado != null ? Number(row.valorFinanciado) : undefined,
    taxaJurosAA: row.taxaJurosAA != null ? Number(row.taxaJurosAA) : undefined,
    valorEntrada: row.valorEntrada != null ? Number(row.valorEntrada) : undefined,
    safraEntrada: row.safraEntrada ?? undefined,
    valorTotalFluxo: Number(row.valorTotalFluxo),
    totalSacas: row.totalSacas,
    parcelas: row.parcelas.map(toParcelaDTO)
  };
}
