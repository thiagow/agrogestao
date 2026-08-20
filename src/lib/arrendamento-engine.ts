// Geração das parcelas (1 linha por safra) de um Contrato de Arrendamento —
// réplica confirmada da tela "Arrendamento Rural" do AgroFlow (spec
// fotografada em 21/07/2026, docs/demandas/SPEC_TELA_ARRENDAMENTO_RURAL.md).
//
// Função pura, sem I/O — mesmo critério de aquisicao-engine.ts. Chamada por
// src/server/arrendamentos.ts a cada save, que resolve o fallback de preço de
// Cotações (I/O) ANTES de chamar este motor — o motor em si só recebe o preço
// já resolvido.
//
// ── BUG #1 da spec (corrigido aqui) ──────────────────────────────────────
// No AgroFlow original, um contrato sem "Preço de Referência" preenchido
// quebrava o cálculo silenciosamente em 5 pontos da tela (preço sumia, valor
// virava "R$ 0" em alguns lugares e célula vazia em outros, gráfico de pizza
// perdia a fatia). Aqui o preço nunca é "inventado": cada parcela carrega
// `origemPreco` (CONTRATO/COTACAO/null) e `valorTotal` só existe quando há uma
// origem de preço real — null se propaga em vez de virar 0 (corrige também o
// BUG #2: a UI decide como mostrar "sem preço", o motor nunca mente com um 0).
//
// ── Pagamento Antecipado (seção 5 da spec, não existe em Aquisição) ───────
// Deduz de sacasBrutas (modo SACAS) ou diretamente de valorTotal (modo REAIS)
// só na safra igual a `safraReferenciaAntecipacao` — nas demais safras do
// contrato o valor antecipado é 0.

import { listarSafrasCobertas } from '@/lib/safra-periodo';
import type { TipoPagamentoAquisicao } from '@/types';

export type OrigemPrecoArrendamento = 'CONTRATO' | 'COTACAO';

export interface ParcelaArrendamentoGerada {
  safra: string;
  sacasBrutas: number;
  sacasAntecipadas: number;
  sacasLiquidas: number;
  precoSc: number | null;
  origemPreco: OrigemPrecoArrendamento | null;
  valorTotal: number | null;
  ordem: number;
}

export interface GerarParcelasArrendamentoInput {
  tipoPagamento: TipoPagamentoAquisicao;
  areaArrendadaHa: number;
  dataInicio: string; // YYYY-MM-DD
  dataVencimento: string; // YYYY-MM-DD
  // Modo SACAS
  sacasHa?: number | null;
  precoReferencia?: number | null;
  // Preço de fallback já resolvido pelo caller (src/server/cotacoes.ts,
  // resolverPrecoFallback) a partir de Cotacao.precoDefinidoSafra — o motor
  // não faz I/O, só decide a origem.
  precoFallbackCotacao?: number | null;
  // Modo REAIS
  precoHa?: number | null;
  valorTotalManual?: number | null;
  // Pagamento Antecipado
  possuiPagamentoAntecipado?: boolean;
  valorAntecipado?: number | null; // sacas (SACAS) ou R$ (REAIS)
  safraReferenciaAntecipacao?: string | null;
}

export function gerarParcelasArrendamento(input: GerarParcelasArrendamentoInput): ParcelaArrendamentoGerada[] {
  const safras = listarSafrasCobertas(input.dataInicio, input.dataVencimento);
  const parcelas: ParcelaArrendamentoGerada[] = [];

  const antecipacaoAtiva = Boolean(
    input.possuiPagamentoAntecipado && input.valorAntecipado && input.safraReferenciaAntecipacao
  );

  if (input.tipoPagamento === 'SACAS') {
    const sacasHa = input.sacasHa ?? 0;
    const sacasPorSafra = sacasHa * input.areaArrendadaHa;

    let precoSc: number | null = null;
    let origemPreco: OrigemPrecoArrendamento | null = null;
    if (input.precoReferencia != null) {
      precoSc = input.precoReferencia;
      origemPreco = 'CONTRATO';
    } else if (input.precoFallbackCotacao != null) {
      precoSc = input.precoFallbackCotacao;
      origemPreco = 'COTACAO';
    }

    for (const safra of safras) {
      const sacasAntecipadas = antecipacaoAtiva && safra === input.safraReferenciaAntecipacao
        ? Math.min(input.valorAntecipado ?? 0, sacasPorSafra)
        : 0;
      const sacasLiquidas = sacasPorSafra - sacasAntecipadas;

      parcelas.push({
        safra,
        sacasBrutas: sacasPorSafra,
        sacasAntecipadas,
        sacasLiquidas,
        precoSc,
        origemPreco,
        valorTotal: origemPreco ? sacasLiquidas * (precoSc ?? 0) : null,
        ordem: 0
      });
    }
  } else {
    const valorAnual = input.valorTotalManual
      ? input.valorTotalManual / Math.max(safras.length, 1)
      : (input.precoHa ?? 0) * input.areaArrendadaHa;

    for (const safra of safras) {
      const antecipadoReais =
        antecipacaoAtiva && safra === input.safraReferenciaAntecipacao
          ? Math.min(input.valorAntecipado ?? 0, valorAnual)
          : 0;

      parcelas.push({
        safra,
        sacasBrutas: 0,
        sacasAntecipadas: 0,
        sacasLiquidas: 0,
        precoSc: null,
        origemPreco: valorAnual > 0 ? 'CONTRATO' : null,
        valorTotal: valorAnual > 0 ? valorAnual - antecipadoReais : null,
        ordem: 0
      });
    }
  }

  parcelas.forEach((p, i) => {
    p.ordem = i;
  });

  return parcelas;
}
