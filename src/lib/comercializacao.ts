// Cruzamento de leitura entre Quadro de Safra (produção real), Contratos
// Comerciais (fixações) e Cotações (preço de mercado) — réplica confirmada da
// tela "Comercialização" do AgroFlow (spec fotografada em 20/08/2026,
// docs/demandas/SPEC_TELA_COMERCIALIZACAO.md).
//
// Função pura, sem I/O — mesmo critério de amortizacao.ts/aquisicao-engine.ts.
// Diferente de Aquisição/Arrendamento, aqui não existe uma "parcela" a
// persistir: Posição por Cultura e Por Comprador são puro cálculo em cima de
// 3 fontes já carregadas (mesmo critério de ResumoView.tsx), então não há
// server action de agregação — só esta função, chamada no client a cada troca
// do seletor de safra.
//
// ── Preço/Cotação (decisão registrada em 20/08/2026, atualizada em 26/08/2026
// quando o preço travado ganhou dimensão de safra própria) ─────────────────
// A "Cotação" de cada cultura vem SEMPRE de `PrecoDefinidoSafra` (o preço que
// o usuário já confirmou manualmente na tela Cotações, para a safra em
// questão), nunca de `Cotacao.precoBrl` (cotação bruta de mercado — ver
// src/server/cotacoes.ts). Cultura sem commodity mapeada (cultura-commodity.ts)
// OU commodity ainda sem preço definido para a safra -> cotacao/valorAMercado
// ficam `null`, nunca "0" nem um número inventado (mesmo critério do BUG #2
// de Arrendamento).

import { calcularSafra } from '@/lib/agro';
import { commodityDaCultura } from '@/lib/cultura-commodity';
import type { CulturaSafraAno, ContratoComercial, PrecoDefinidoSafra } from '@/types';

export interface PosicaoCultura {
  cultura: string;
  producaoTotal: number;
  quantidadeFixada: number;
  quantidadeAFixar: number;
  receitaFixada: number;
  cotacao: number | null;
  valorAMercado: number | null;
}

export interface PosicaoComprador {
  comprador: string;
  quantidadeSc: number;
  receitaFixada: number;
  /** % sobre o total fixado (em sacas) da safra — usado no badge de risco de concentração. */
  percentualConcentracao: number;
}

export interface PosicaoComercializacao {
  porCultura: PosicaoCultura[];
  porComprador: PosicaoComprador[];
}

export interface CalcularPosicaoInput {
  quadroSafra: CulturaSafraAno[];
  contratos: ContratoComercial[];
  precosDefinidos: PrecoDefinidoSafra[];
  safra: string;
}

export function calcularPosicaoComercializacao(input: CalcularPosicaoInput): PosicaoComercializacao {
  const registrosSafra = input.quadroSafra.filter((r) => r.anoSafra === input.safra);
  // Contratos "fixados" = ativos da safra selecionada — mesmo critério já usado hoje na tela.
  const contratosSafra = input.contratos.filter((c) => c.status === 'ATIVO' && c.safra === input.safra);

  const precoDefinidoPorCommodity = new Map(
    input.precosDefinidos.filter((p) => p.anoSafra === input.safra).map((p) => [p.commodity, p.precoBrl])
  );

  const porCultura: PosicaoCultura[] = registrosSafra.map((r) => {
    const { totalProducao } = calcularSafra({
      hectares: r.hectares,
      rendimento: r.rendimento,
      precoMedio: r.precoMedio,
      custoProducao: r.custoProducao
    });

    const contratosCultura = contratosSafra.filter((c) => c.cultura.toLowerCase() === r.cultura.toLowerCase());
    const quantidadeFixada = contratosCultura.reduce((sum, c) => sum + c.quantidadeSc, 0);
    const quantidadeAFixar = Math.max(totalProducao - quantidadeFixada, 0);
    const receitaFixada = contratosCultura.reduce((sum, c) => sum + c.quantidadeSc * c.precoFixado, 0);

    const nomeCommodity = commodityDaCultura(r.cultura);
    const precoDefinido = nomeCommodity ? precoDefinidoPorCommodity.get(nomeCommodity) : undefined;
    const cotacao = precoDefinido ?? null;
    const valorAMercado = cotacao != null ? quantidadeAFixar * cotacao : null;

    return { cultura: r.cultura, producaoTotal: totalProducao, quantidadeFixada, quantidadeAFixar, receitaFixada, cotacao, valorAMercado };
  });

  const porCompradorMap = new Map<string, { quantidadeSc: number; receitaFixada: number }>();
  for (const c of contratosSafra) {
    const comprador = c.compradorNome?.trim() || 'Sem comprador definido';
    const atual = porCompradorMap.get(comprador) ?? { quantidadeSc: 0, receitaFixada: 0 };
    atual.quantidadeSc += c.quantidadeSc;
    atual.receitaFixada += c.quantidadeSc * c.precoFixado;
    porCompradorMap.set(comprador, atual);
  }
  const totalFixadoSacas = Array.from(porCompradorMap.values()).reduce((sum, v) => sum + v.quantidadeSc, 0);
  const porComprador: PosicaoComprador[] = Array.from(porCompradorMap.entries())
    .map(([comprador, v]) => ({
      comprador,
      quantidadeSc: v.quantidadeSc,
      receitaFixada: v.receitaFixada,
      percentualConcentracao: totalFixadoSacas > 0 ? (v.quantidadeSc / totalFixadoSacas) * 100 : 0
    }))
    .sort((a, b) => b.quantidadeSc - a.quantidadeSc);

  return { porCultura, porComprador };
}
