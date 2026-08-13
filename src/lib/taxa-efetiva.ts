// Taxa efetiva de um contrato bancário — a ponte entre o "Tipo de Taxa"
// cadastrado e o número que o motor de amortização (src/lib/amortizacao.ts)
// realmente usa. Função pura, sem I/O, para rodar igual no server (geração do
// cronograma) e no client (memória de cálculo ao vivo no Drawer).
//
// Regra confirmada com o CTO em 13/08/2026:
//
//   Pré-fixado (% a.a.)  → taxa cheia do campo "Taxa"
//   CDI + spread         → CDI vigente  + "Taxa"
//   IPCA + spread        → IPCA vigente + "Taxa"
//   Dólar + juros        → "Taxa" incide sobre o saldo em USD; a parcela é
//                          convertida para BRL pela cotação vigente
//
// O campo "Taxa" é o único campo de taxa do cadastro: taxa cheia no pré-fixado,
// spread nos indexados. (Havia um segundo campo "Spread / Taxa Adicional" até
// 13/08/2026 — era persistido mas nunca entrava em cálculo nenhum, e foi
// removido do schema com o valor somado a `taxaJuros` na migration.)
//
// Simples vs. Composta e a Base de Cálculo NÃO são resolvidos aqui — quem
// converte a taxa anual em taxa do período é `taxaDoPeriodo()` em
// amortizacao.ts. Este módulo só entrega a taxa anual correta.

import type { TipoTaxaBancaria } from '@/types';
import type { ParcelaCalculada } from './amortizacao';

export interface IndicesVigentes {
  cdiAA: number | null; // % a.a.
  ipcaAA: number | null; // % a.a. (acumulado 12 meses)
  usdBrl: number | null; // BRL por USD
  atualizadoEm?: string; // YYYY-MM-DD — data de referência mais antiga entre os índices
}

export interface TaxaEfetiva {
  /** % a.a. a passar para `gerarCronograma`. */
  taxaAnual: number;
  /** Moeda em que o cronograma é gerado. 'USD' só em "Dólar + juros" com moeda USD. */
  moedaCalculo: 'BRL' | 'USD';
  /** Cotação USD/BRL usada para converter as parcelas. `null` quando moedaCalculo === 'BRL'. */
  cotacaoAplicada: number | null;
  /** Valor do indexador aplicado (CDI, IPCA ou USD). `null` no pré-fixado. */
  indiceUsado: number | null;
  /**
   * `true` quando o contrato depende de um índice que ainda não foi buscado ou
   * cuja fonte falhou. Nesse caso `taxaAnual` cai para o spread puro — nunca se
   * inventa um valor de índice. A UI marca o contrato como pendente de
   * atualização (mesmo critério de src/lib/indicadores.ts).
   */
  indisponivel: boolean;
  /** Memória de cálculo legível: "CDI 13,90% + 4,00% = 17,90% a.a." */
  memoria: string;
}

export const INDICES_VAZIOS: IndicesVigentes = { cdiAA: null, ipcaAA: null, usdBrl: null };

export function calcularTaxaEfetiva(
  tipoTaxa: TipoTaxaBancaria,
  taxa: number,
  indices: IndicesVigentes
): TaxaEfetiva {
  switch (tipoTaxa) {
    case 'CDI + spread':
      return comIndexador('CDI', indices.cdiAA, taxa);

    case 'IPCA + spread':
      return comIndexador('IPCA', indices.ipcaAA, taxa);

    case 'Dólar + juros': {
      // Os juros são nominais em dólar — o saldo devedor é uma dívida em USD.
      // A variação cambial não é "juros": ela aparece na conversão da parcela.
      const cotacao = indices.usdBrl;
      if (cotacao === null || cotacao <= 0) {
        return {
          taxaAnual: taxa,
          moedaCalculo: 'BRL',
          cotacaoAplicada: null,
          indiceUsado: null,
          indisponivel: true,
          memoria: `${pct(taxa)} a.a. em USD — cotação do dólar indisponível, parcelas sem conversão`
        };
      }
      return {
        taxaAnual: taxa,
        moedaCalculo: 'USD',
        cotacaoAplicada: cotacao,
        indiceUsado: cotacao,
        indisponivel: false,
        memoria: `${pct(taxa)} a.a. sobre o saldo em USD · convertido a ${brl(cotacao)}/US$`
      };
    }

    case 'Pré-fixado (% a.a.)':
    default:
      return {
        taxaAnual: taxa,
        moedaCalculo: 'BRL',
        cotacaoAplicada: null,
        indiceUsado: null,
        indisponivel: false,
        memoria: `${pct(taxa)} a.a. (pré-fixado)`
      };
  }
}

function comIndexador(nome: 'CDI' | 'IPCA', valor: number | null, spread: number): TaxaEfetiva {
  if (valor === null) {
    return {
      taxaAnual: spread,
      moedaCalculo: 'BRL',
      cotacaoAplicada: null,
      indiceUsado: null,
      indisponivel: true,
      memoria: `${nome} indisponível — projeção com apenas ${pct(spread)} de spread`
    };
  }

  const total = valor + spread;
  return {
    taxaAnual: total,
    moedaCalculo: 'BRL',
    cotacaoAplicada: null,
    indiceUsado: valor,
    indisponivel: false,
    memoria: `${nome} ${pct(valor)} + ${pct(spread)} = ${pct(total)} a.a.`
  };
}

function pct(n: number): string {
  return `${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function brl(n: number): string {
  return `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Um contrato é indexado quando depende de uma fonte externa para ser projetado. */
export function ehIndexado(tipoTaxa: TipoTaxaBancaria): boolean {
  return tipoTaxa !== 'Pré-fixado (% a.a.)';
}

/**
 * Converte um cronograma gerado em USD para BRL.
 *
 * `Parcela` é sempre persistida em BRL — é a moeda de consolidação de todo o app
 * (KPIs de Bancos, Resumo, Fluxo de Caixa Mensal), e parcela em moeda mista
 * quebraria toda soma a jusante.
 *
 * `cambio` nulo ou não positivo devolve o cronograma intacto: sem cotação
 * confiável, é melhor mostrar o valor em moeda de origem e sinalizar na UI do
 * que multiplicar por um número inventado.
 */
export function converterParcelasParaBrl(
  parcelas: ParcelaCalculada[],
  cambio: number | null
): ParcelaCalculada[] {
  if (!cambio || cambio <= 0) return parcelas;

  const conv = (v: number) => Math.round(v * cambio * 100) / 100;

  return parcelas.map((p) => ({
    ...p,
    valorPrincipal: conv(p.valorPrincipal),
    valorJuros: conv(p.valorJuros),
    valorTotal: conv(p.valorTotal),
    saldoDevedor: conv(p.saldoDevedor)
  }));
}
