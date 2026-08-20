'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireContext } from '@/lib/session';
import { arrendamentoSchema } from '@/lib/validation';
import { PERIODICIDADE_ARRENDAMENTO_TO_DB, PERIODICIDADE_ARRENDAMENTO_FROM_DB } from '@/lib/enum-maps';
import { gerarParcelasArrendamento } from '@/lib/arrendamento-engine';
import { resolverPrecoFallback } from '@/server/cotacoes';
import { calcularSafra } from '@/lib/agro';
import type { ContratoArrendamento, ParcelaArrendamento } from '@/types';

export async function listArrendamentos(): Promise<ContratoArrendamento[]> {
  const ctx = await requireContext();
  if (!ctx.propriedade) return [];

  const rows = await db.contratoArrendamento.findMany({
    where: { propriedadeId: ctx.propriedade.id, ativo: true },
    include: { parcelas: { orderBy: { ordem: 'asc' } }, culturaReferencia: true },
    orderBy: { createdAt: 'desc' }
  });

  return rows.map(toDTO);
}

interface SaveArrendamentoInput {
  id?: string;
  nomeFazenda: string;
  proprietario?: string;
  denominacaoImovel?: string;
  municipio?: string;
  comarca?: string;
  numeroMatricula?: string;
  areaTotalHa?: number;
  areaArrendadaHa: number;
  dataInicio: string;
  dataVencimento: string;
  culturaReferenciaId?: string;
  tipoPagamento: 'SACAS' | 'REAIS';
  periodicidade: ContratoArrendamento['periodicidade'];
  sacasHa?: number;
  precoReferencia?: number;
  precoHa?: number;
  valorTotalManual?: number;
  possuiPagamentoAntecipado: boolean;
  valorAntecipado?: number;
  dataPagamentoAntecipado?: string;
  safraReferenciaAntecipacao?: string;
  observacoes?: string;
  status: ContratoArrendamento['status'];
}

export async function saveArrendamento(input: SaveArrendamentoInput): Promise<ContratoArrendamento> {
  const ctx = await requireContext();
  if (!ctx.propriedade) throw new Error('Nenhuma propriedade selecionada.');

  const parsed = arrendamentoSchema.parse(input);

  // Resolve o fallback de preço (I/O) ANTES de chamar o motor puro — mesmo
  // padrão de saveAquisicao/gerarParcelasAquisicao. Só busca fallback quando o
  // contrato está no modo SACAS sem "Preço de Referência" próprio E há
  // cultura selecionada (sem cultura não há como casar com uma commodity).
  let precoFallbackCotacao: number | null = null;
  if (parsed.tipoPagamento === 'SACAS' && parsed.precoReferencia == null && parsed.culturaReferenciaId) {
    const cultura = await db.cultura.findUnique({ where: { id: parsed.culturaReferenciaId } });
    if (cultura) precoFallbackCotacao = await resolverPrecoFallback(cultura.nome);
  }

  const parcelasGeradas = gerarParcelasArrendamento({
    tipoPagamento: parsed.tipoPagamento,
    areaArrendadaHa: parsed.areaArrendadaHa,
    dataInicio: parsed.dataInicio,
    dataVencimento: parsed.dataVencimento,
    sacasHa: parsed.sacasHa,
    precoReferencia: parsed.precoReferencia,
    precoFallbackCotacao,
    precoHa: parsed.precoHa,
    valorTotalManual: parsed.valorTotalManual,
    possuiPagamentoAntecipado: parsed.possuiPagamentoAntecipado,
    valorAntecipado: parsed.valorAntecipado,
    safraReferenciaAntecipacao: parsed.safraReferenciaAntecipacao || undefined
  });

  const valorTotalFluxo = parcelasGeradas.reduce((sum, p) => sum + (p.valorTotal ?? 0), 0);
  const totalSacas = parcelasGeradas.reduce((sum, p) => sum + p.sacasLiquidas, 0);

  const data = {
    nomeFazenda: parsed.nomeFazenda,
    proprietario: parsed.proprietario || null,
    denominacaoImovel: parsed.denominacaoImovel || null,
    municipio: parsed.municipio || null,
    comarca: parsed.comarca || null,
    numeroMatricula: parsed.numeroMatricula || null,
    areaTotalHa: parsed.areaTotalHa ?? null,
    areaArrendadaHa: parsed.areaArrendadaHa,
    dataInicio: new Date(parsed.dataInicio),
    dataVencimento: new Date(parsed.dataVencimento),
    culturaReferenciaId: parsed.culturaReferenciaId || null,
    tipoPagamento: parsed.tipoPagamento,
    periodicidade: PERIODICIDADE_ARRENDAMENTO_TO_DB[parsed.periodicidade],
    sacasHa: parsed.sacasHa ?? null,
    precoReferencia: parsed.precoReferencia ?? null,
    precoHa: parsed.precoHa ?? null,
    valorTotalManual: parsed.valorTotalManual ?? null,
    possuiPagamentoAntecipado: parsed.possuiPagamentoAntecipado,
    valorAntecipado: parsed.valorAntecipado ?? null,
    dataPagamentoAntecipado: parsed.dataPagamentoAntecipado ? new Date(parsed.dataPagamentoAntecipado) : null,
    safraReferenciaAntecipacao: parsed.safraReferenciaAntecipacao || null,
    observacoes: parsed.observacoes || null,
    status: parsed.status,
    valorTotalFluxo,
    totalSacas
  };

  const contratoId = await db.$transaction(async (tx) => {
    const row = input.id
      ? await tx.contratoArrendamento.update({
          where: { id: input.id, propriedadeId: ctx.propriedade!.id },
          data: { ...data, updatedById: ctx.user.id }
        })
      : await tx.contratoArrendamento.create({
          data: { ...data, propriedadeId: ctx.propriedade!.id, createdById: ctx.user.id }
        });

    await tx.parcelaArrendamento.deleteMany({ where: { contratoId: row.id } });
    if (parcelasGeradas.length > 0) {
      await tx.parcelaArrendamento.createMany({
        data: parcelasGeradas.map((p) => ({
          contratoId: row.id,
          safra: p.safra,
          sacasBrutas: p.sacasBrutas,
          sacasAntecipadas: p.sacasAntecipadas,
          sacasLiquidas: p.sacasLiquidas,
          precoSc: p.precoSc,
          origemPreco: p.origemPreco,
          valorTotal: p.valorTotal,
          ordem: p.ordem
        }))
      });
    }

    return row.id;
  });

  revalidatePath('/arrendamentos');
  revalidatePath('/resumo');

  const saved = await db.contratoArrendamento.findUniqueOrThrow({
    where: { id: contratoId },
    include: { parcelas: { orderBy: { ordem: 'asc' } }, culturaReferencia: true }
  });
  return toDTO(saved);
}

export async function deleteArrendamento(id: string) {
  const ctx = await requireContext();
  if (!ctx.propriedade) throw new Error('Nenhuma propriedade selecionada.');

  await db.contratoArrendamento.updateMany({
    where: { id, propriedadeId: ctx.propriedade.id },
    data: { ativo: false, updatedById: ctx.user.id }
  });

  revalidatePath('/arrendamentos');
  revalidatePath('/resumo');
}

/** Linha consolidada da aba "Fluxo por Safra" — junta as parcelas de todos os contratos ativos. */
export interface LinhaFluxoConsolidadoArrendamento {
  safra: string;
  fazenda: string;
  cultura: string;
  sacasBrutas: number;
  sacasAntecipadas: number;
  sacasLiquidas: number;
  precoSc: number | null;
  origemPreco: ParcelaArrendamento['origemPreco'] | null;
  valorTotal: number | null;
}

export async function listFluxoConsolidadoArrendamentos(): Promise<LinhaFluxoConsolidadoArrendamento[]> {
  const arrendamentos = await listArrendamentosComCultura();

  const linhas: LinhaFluxoConsolidadoArrendamento[] = [];
  for (const a of arrendamentos) {
    for (const p of a.parcelas) {
      linhas.push({
        safra: p.safra,
        fazenda: a.nomeFazenda,
        cultura: a.culturaNome ?? '—',
        sacasBrutas: p.sacasBrutas,
        sacasAntecipadas: p.sacasAntecipadas,
        sacasLiquidas: p.sacasLiquidas,
        precoSc: p.precoSc ?? null,
        origemPreco: p.origemPreco ?? null,
        valorTotal: p.valorTotal ?? null
      });
    }
  }

  linhas.sort((x, y) => x.safra.localeCompare(y.safra));
  return linhas;
}

/** Um card/linha da aba "Análise de Impacto" — cruza sacas comprometidas com a produção de Soja do Quadro de Safra. */
export interface ImpactoSafraArrendamento {
  safra: string;
  sacasArrendamento: number;
  producaoSoja: number;
  valorTotal: number;
  /** null quando não há registro de Soja cadastrado no Quadro de Safra para essa safra — nunca 0,00% enganoso. */
  percentualImpacto: number | null;
}

export async function listImpactoPorSafraArrendamentos(): Promise<ImpactoSafraArrendamento[]> {
  const ctx = await requireContext();
  if (!ctx.propriedade) return [];

  const arrendamentos = await db.contratoArrendamento.findMany({
    where: { propriedadeId: ctx.propriedade.id, ativo: true },
    include: { parcelas: true }
  });
  if (arrendamentos.length === 0) return [];

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
  for (const a of arrendamentos) {
    for (const p of a.parcelas) {
      const atual = porSafra.get(p.safra) ?? { sacas: 0, valor: 0 };
      atual.sacas += Number(p.sacasLiquidas);
      atual.valor += p.valorTotal != null ? Number(p.valorTotal) : 0;
      porSafra.set(p.safra, atual);
    }
  }

  return Array.from(porSafra.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([safra, { sacas, valor }]) => {
      const producaoSoja = producaoPorSafra.get(safra) ?? 0;
      return {
        safra,
        sacasArrendamento: sacas,
        producaoSoja,
        valorTotal: valor,
        percentualImpacto: producaoSoja > 0 ? (sacas / producaoSoja) * 100 : null
      };
    });
}

// ---- internos ----

async function listArrendamentosComCultura() {
  const ctx = await requireContext();
  if (!ctx.propriedade) return [];

  const rows = await db.contratoArrendamento.findMany({
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
  sacasBrutas: unknown;
  sacasAntecipadas: unknown;
  sacasLiquidas: unknown;
  precoSc: unknown;
  origemPreco: string | null;
  valorTotal: unknown;
}): ParcelaArrendamento {
  return {
    id: p.id,
    safra: p.safra,
    sacasBrutas: Number(p.sacasBrutas),
    sacasAntecipadas: Number(p.sacasAntecipadas),
    sacasLiquidas: Number(p.sacasLiquidas),
    precoSc: p.precoSc != null ? Number(p.precoSc) : undefined,
    origemPreco: (p.origemPreco as ParcelaArrendamento['origemPreco']) ?? undefined,
    valorTotal: p.valorTotal != null ? Number(p.valorTotal) : undefined
  };
}

function toDTO(row: {
  id: string;
  nomeFazenda: string;
  proprietario: string | null;
  denominacaoImovel: string | null;
  municipio: string | null;
  comarca: string | null;
  numeroMatricula: string | null;
  areaTotalHa: number | null;
  areaArrendadaHa: number;
  dataInicio: Date;
  dataVencimento: Date;
  culturaReferenciaId: string | null;
  culturaReferencia: { nome: string } | null;
  tipoPagamento: string;
  periodicidade: string;
  sacasHa: unknown;
  precoReferencia: unknown;
  precoHa: unknown;
  valorTotalManual: unknown;
  possuiPagamentoAntecipado: boolean;
  valorAntecipado: unknown;
  dataPagamentoAntecipado: Date | null;
  safraReferenciaAntecipacao: string | null;
  observacoes: string | null;
  status: string;
  valorTotalFluxo: unknown;
  totalSacas: number;
  parcelas: Parameters<typeof toParcelaDTO>[0][];
}): ContratoArrendamento {
  return {
    id: row.id,
    nomeFazenda: row.nomeFazenda,
    proprietario: row.proprietario ?? undefined,
    denominacaoImovel: row.denominacaoImovel ?? undefined,
    municipio: row.municipio ?? undefined,
    comarca: row.comarca ?? undefined,
    numeroMatricula: row.numeroMatricula ?? undefined,
    areaTotalHa: row.areaTotalHa ?? undefined,
    areaArrendadaHa: row.areaArrendadaHa,
    dataInicio: row.dataInicio.toISOString().slice(0, 10),
    dataVencimento: row.dataVencimento.toISOString().slice(0, 10),
    tipoPagamento: row.tipoPagamento as ContratoArrendamento['tipoPagamento'],
    periodicidade: PERIODICIDADE_ARRENDAMENTO_FROM_DB[row.periodicidade as keyof typeof PERIODICIDADE_ARRENDAMENTO_FROM_DB],
    culturaReferenciaId: row.culturaReferenciaId ?? undefined,
    culturaNome: row.culturaReferencia?.nome ?? undefined,
    sacasHa: row.sacasHa != null ? Number(row.sacasHa) : undefined,
    precoReferencia: row.precoReferencia != null ? Number(row.precoReferencia) : undefined,
    precoHa: row.precoHa != null ? Number(row.precoHa) : undefined,
    valorTotalManual: row.valorTotalManual != null ? Number(row.valorTotalManual) : undefined,
    possuiPagamentoAntecipado: row.possuiPagamentoAntecipado,
    valorAntecipado: row.valorAntecipado != null ? Number(row.valorAntecipado) : undefined,
    dataPagamentoAntecipado: row.dataPagamentoAntecipado?.toISOString().slice(0, 10),
    safraReferenciaAntecipacao: row.safraReferenciaAntecipacao ?? undefined,
    observacoes: row.observacoes ?? undefined,
    status: row.status as ContratoArrendamento['status'],
    valorTotalFluxo: Number(row.valorTotalFluxo),
    totalSacas: row.totalSacas,
    parcelas: row.parcelas.map(toParcelaDTO)
  };
}
