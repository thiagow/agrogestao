// Geração das parcelas (Entrada + Parcelas) de uma Aquisição de Fazenda —
// réplica confirmada da tela "Aquisição de Fazendas" do AgroFlow (spec
// fotografada em 21/07/2026, docs/demandas/SPEC_TELA_AQUISICAO_FAZENDA.md).
//
// Função pura, sem I/O — mesmo critério de amortizacao.ts/taxa-efetiva.ts:
// vive em src/lib para poder ser testada isoladamente (vitest cobre
// src/**/*.test.ts, mas só as funções puras do domínio financeiro moram
// aqui). Chamada por src/server/aquisicoes.ts a cada save.
//
// ── Regra de safra (decisão registrada em 20/08/2026) ───────────────────────
// A spec mostra um exemplo em que "Data de Início do Pagamento" e "Data de
// Vencimento" distam 5 anos, mas só 4 safras aparecem cobertas — sem
// explicação documentada (não está na lista de bugs da spec, então não é um
// bug conhecido; é uma regra não confirmada). Em vez de replicar esse corte
// não explicado, o número de parcelas anuais geradas é o número de anos
// inteiros entre as duas datas (round(meses / 12), mínimo 1) — decisão
// confirmada com o usuário.
//
// ── BUG #1 da spec (corrigido aqui) ──────────────────────────────────────
// No AgroFlow original, a linha "Entrada" exibia "Invalid Date" porque a data
// de pagamento provavelmente vinha de `new Date(safra_entrada)` sobre uma
// string tipo "2027/2028" (não é uma data válida em JS). Aqui a data da
// Entrada usa a mesma convenção das Parcelas: 31/03 do segundo ano da safra.
//
// ── Modo REAIS ────────────────────────────────────────────────────────────
// Reaproveita o motor de amortização já usado por Contrato Bancário
// (src/lib/amortizacao.ts) sobre `valorFinanciado`/`taxaJurosAA`. A spec não
// documenta um seletor de Sistema de Amortização para Aquisição — PRICE
// (parcela constante) foi a convenção assumida (decisão confirmada com o
// usuário), com periodicidade Anual, mesma cadência do modo Sacas.

import { gerarCronograma } from '@/lib/amortizacao';
import { listarSafrasCobertas, dataReferenciaDaSafra } from '@/lib/safra-periodo';
import type { TipoLancamentoAquisicao, TipoPagamentoAquisicao } from '@/types';

export { listarSafrasCobertas };

export interface ParcelaGerada {
  safra: string;
  tipo: TipoLancamentoAquisicao;
  sacas: number;
  precoSc: number | null;
  usaPrecoReferencia: boolean;
  valorTotal: number;
  dataPagamento: string; // YYYY-MM-DD
  ordem: number;
}

export interface GerarParcelasAquisicaoInput {
  tipoPagamento: TipoPagamentoAquisicao;
  areaTotalHa: number;
  dataInicioPagamento: string; // YYYY-MM-DD
  dataVencimento: string; // YYYY-MM-DD
  // Modo SACAS
  sacasHa?: number | null;
  precoReferencia?: number | null;
  // Modo REAIS
  valorFinanciado?: number | null;
  taxaJurosAA?: number | null;
  // Entrada (Sinal) — comum aos dois modos
  valorEntrada?: number | null;
  safraEntrada?: string | null;
}

export function gerarParcelasAquisicao(input: GerarParcelasAquisicaoInput): ParcelaGerada[] {
  const safras = listarSafrasCobertas(input.dataInicioPagamento, input.dataVencimento);
  const parcelas: ParcelaGerada[] = [];

  if (input.tipoPagamento === 'SACAS') {
    const sacasHa = input.sacasHa ?? 0;
    const precoReferencia = input.precoReferencia ?? 0;
    const sacasPorSafra = sacasHa * input.areaTotalHa;

    for (const safra of safras) {
      parcelas.push({
        safra,
        tipo: 'PARCELA',
        sacas: sacasPorSafra,
        precoSc: precoReferencia,
        usaPrecoReferencia: true,
        valorTotal: sacasPorSafra * precoReferencia,
        dataPagamento: dataReferenciaDaSafra(safra),
        ordem: 0
      });
    }
  } else {
    const saldoInicial = input.valorFinanciado ?? 0;
    const taxaJurosAnual = input.taxaJurosAA ?? 0;

    if (saldoInicial > 0 && safras.length > 0) {
      const cronograma = gerarCronograma({
        saldoInicial,
        taxaJurosAnual,
        sistemaAmortizacao: 'PRICE',
        periodicidadePrincipal: 'Anual',
        periodicidadeJuros: 'Anual',
        baseCalculo: '360 dias corridos',
        capitalizacao: 'Composta',
        dataContratacao: input.dataInicioPagamento,
        dataVencimento: input.dataVencimento,
        possuiCarencia: false
      });

      cronograma.forEach((p, i) => {
        const safra = safras[i] ?? safras[safras.length - 1];
        parcelas.push({
          safra,
          tipo: 'PARCELA',
          sacas: 0,
          precoSc: null,
          usaPrecoReferencia: false,
          valorTotal: p.valorPrincipal + p.valorJuros,
          dataPagamento: p.dataPagamento,
          ordem: 0
        });
      });
    }
  }

  if (input.valorEntrada && input.valorEntrada > 0 && input.safraEntrada) {
    parcelas.push({
      safra: input.safraEntrada,
      tipo: 'ENTRADA',
      sacas: 0,
      precoSc: null,
      usaPrecoReferencia: false,
      valorTotal: input.valorEntrada,
      dataPagamento: dataReferenciaDaSafra(input.safraEntrada),
      ordem: 0
    });
  }

  // Ordena por data de pagamento crescente (resolve o ponto de atenção #8 da
  // spec: ordenação inconsistente entre as abas "Contratos" e "Fluxo por Safra"
  // no AgroFlow original) e atribui a ordem final estável.
  parcelas.sort((a, b) => a.dataPagamento.localeCompare(b.dataPagamento));
  parcelas.forEach((p, i) => {
    p.ordem = i;
  });

  return parcelas;
}
