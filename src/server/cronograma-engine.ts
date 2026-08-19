// Geração e regravação do cronograma de parcelas de um contrato bancário.
//
// Vive fora de 'use server' de propósito: é código de servidor reutilizado por
// dois módulos de server actions (contratos-bancarios.ts, no save do contrato, e
// indices.ts, quando os índices são atualizados), e um arquivo 'use server' só
// pode exportar server actions assíncronas — não helpers.
//
// A autorização (requireContext / escopo por propriedade) é responsabilidade de
// quem chama. Nada aqui recebe id vindo do client sem ter passado por lá.

import { db } from '@/lib/db';
import { gerarCronograma } from '@/lib/amortizacao';
import {
  calcularTaxaEfetiva,
  converterParcelasParaBrl,
  criarTaxaPorData,
  type IndicesVigentes,
  type IndicesSerieTemporal,
  type SerieIndice
} from '@/lib/taxa-efetiva';
import {
  TIPO_TAXA_FROM_DB,
  BASE_CALCULO_FROM_DB,
  TIPO_CAPITALIZACAO_FROM_DB,
  PERIODICIDADE_LIQUIDACAO_FROM_DB
} from '@/lib/enum-maps';
import type { ContratoBancario } from '@/types';

/** Campos do contrato necessários para projetar o cronograma. */
export interface ContratoParaCronograma {
  id: string;
  saldoInicial: unknown; // Prisma.Decimal
  taxaJuros: unknown; // Prisma.Decimal
  tipoTaxa: string;
  baseCalculo: string;
  capitalizacao: string;
  sistemaAmortizacao: string;
  periodicidadePrincipal: string;
  periodicidadeJuros: string;
  possuiCarencia: boolean;
  dataContratacao: Date;
  inicioPagamento: Date | null;
  dataVencimento: Date;
  moeda: string;
  ptaxInicial: unknown; // Prisma.Decimal | null
}

/** Colunas que `regerarCronograma` precisa ler — use em `select` do Prisma. */
export const SELECT_CRONOGRAMA = {
  id: true,
  saldoInicial: true,
  taxaJuros: true,
  tipoTaxa: true,
  baseCalculo: true,
  capitalizacao: true,
  sistemaAmortizacao: true,
  periodicidadePrincipal: true,
  periodicidadeJuros: true,
  possuiCarencia: true,
  dataContratacao: true,
  inicioPagamento: true,
  dataVencimento: true,
  moeda: true,
  ptaxInicial: true
} as const;

/** Lê os índices vigentes do banco. Sem auth — quem chama já autorizou. */
export async function carregarIndicesVigentes(): Promise<IndicesVigentes> {
  const rows = await db.indiceMercado.findMany();
  const valor = (tipo: 'CDI' | 'IPCA' | 'USD') => {
    const row = rows.find((r) => r.tipo === tipo);
    return row ? Number(row.valor) : null;
  };

  // A "última atualização" exibida é a do dado mais ANTIGO — é o que está
  // realmente defasado. Dizer que tudo é de hoje porque o dólar é de hoje
  // esconderia um IPCA de três meses atrás.
  const datas = rows.map((r) => r.dataReferencia.toISOString().slice(0, 10)).sort();

  return {
    cdiAA: valor('CDI'),
    ipcaAA: valor('IPCA'),
    usdBrl: valor('USD'),
    atualizadoEm: datas[0]
  };
}

/**
 * Lê a série temporal completa de CDI/IPCA (realizado + projeção Focus) —
 * Fase 5 (19/08/2026). Usada por `regerarCronograma` pra aplicar a taxa
 * correta em cada sub-período do cronograma, não uma taxa única.
 */
export async function carregarSerieIndices(): Promise<IndicesSerieTemporal> {
  const rows = await db.indiceMercado.findMany({
    where: { tipo: { in: ['CDI', 'IPCA'] } },
    orderBy: { dataReferencia: 'asc' }
  });

  const serieDe = (tipo: 'CDI' | 'IPCA'): SerieIndice => ({
    realizados: rows
      .filter((r) => r.tipo === tipo && r.origem === 'REALIZADO')
      .map((r) => ({ valor: Number(r.valor), dataReferencia: r.dataReferencia.toISOString().slice(0, 10) })),
    projetados: rows
      .filter((r) => r.tipo === tipo && r.origem === 'PROJETADO')
      .map((r) => ({ valor: Number(r.valor), dataReferencia: r.dataReferencia.toISOString().slice(0, 10) }))
  });

  return { cdi: serieDe('CDI'), ipca: serieDe('IPCA') };
}

/**
 * Recalcula e regrava as parcelas de um contrato, e registra no contrato a
 * memória de cálculo usada (taxa efetiva, índice e sua data).
 *
 * O cronograma é sempre recriado do zero — não há UI de baixa de parcela, então
 * não existe estado (`pago`) a preservar entre gerações.
 */
export async function regerarCronograma(
  contrato: ContratoParaCronograma,
  indices: IndicesVigentes,
  series?: IndicesSerieTemporal
): Promise<void> {
  const tipoTaxa = TIPO_TAXA_FROM_DB[contrato.tipoTaxa as keyof typeof TIPO_TAXA_FROM_DB];
  const taxaCadastrada = Number(contrato.taxaJuros);
  const saldoInicial = Number(contrato.saldoInicial);
  const dataContratacaoStr = toDateStr(contrato.dataContratacao);
  const hojeStr = toDateStr(new Date());

  const efetiva = calcularTaxaEfetiva(tipoTaxa, taxaCadastrada, indices, {
    moeda: contrato.moeda as ContratoBancario['moeda'],
    ptaxInicial: contrato.ptaxInicial != null ? Number(contrato.ptaxInicial) : null,
    dataContratacao: dataContratacaoStr
  });

  // "Início de Pagamento" só entra no cronograma quando a carência está marcada
  // — o campo é persistido de qualquer forma (ver contratos-bancarios.ts).
  const temCarencia = contrato.possuiCarencia && !!contrato.inicioPagamento;

  // Fase 5: CDI+spread/IPCA+spread aplicam o índice REALIZADO nas parcelas já
  // vencidas e a PROJEÇÃO (BCB Focus) nas futuras, em vez de uma taxa única
  // pro cronograma inteiro. `efetiva.taxaAnual` (a taxa "atual") segue sendo
  // usada pra moldar a curva de Principal e como memória de cálculo exibida.
  const taxaJurosAnualPorData = series
    ? criarTaxaPorData(tipoTaxa, taxaCadastrada, series, hojeStr, efetiva.taxaAnual)
    : undefined;

  const parcelasMoedaOrigem = gerarCronograma({
    saldoInicial,
    taxaJurosAnual: efetiva.taxaAnual,
    taxaJurosAnualPorData,
    sistemaAmortizacao: contrato.sistemaAmortizacao as ContratoBancario['sistemaAmortizacao'],
    periodicidadePrincipal:
      PERIODICIDADE_LIQUIDACAO_FROM_DB[contrato.periodicidadePrincipal as keyof typeof PERIODICIDADE_LIQUIDACAO_FROM_DB],
    periodicidadeJuros:
      PERIODICIDADE_LIQUIDACAO_FROM_DB[contrato.periodicidadeJuros as keyof typeof PERIODICIDADE_LIQUIDACAO_FROM_DB],
    baseCalculo: BASE_CALCULO_FROM_DB[contrato.baseCalculo as keyof typeof BASE_CALCULO_FROM_DB],
    capitalizacao:
      TIPO_CAPITALIZACAO_FROM_DB[contrato.capitalizacao as keyof typeof TIPO_CAPITALIZACAO_FROM_DB],
    dataContratacao: dataContratacaoStr,
    dataVencimento: toDateStr(contrato.dataVencimento),
    possuiCarencia: temCarencia,
    inicioPagamento: temCarencia ? toDateStr(contrato.inicioPagamento as Date) : undefined
  });

  // Contrato dolarizado: o cronograma acima está em USD e precisa virar BRL
  // antes de ser persistido. A cotação usada fica registrada em
  // `indiceReferencia`, para a projeção continuar auditável depois.
  const cambio = efetiva.moedaCalculo === 'USD' && contrato.moeda === 'USD' ? efetiva.cotacaoAplicada : null;
  const parcelas = converterParcelasParaBrl(parcelasMoedaOrigem, cambio);

  await db.$transaction([
    db.contratoBancario.update({
      where: { id: contrato.id },
      data: {
        taxaEfetivaAplicada: efetiva.taxaAnual,
        indiceReferencia: efetiva.indiceUsado,
        indiceAtualizadoEm: indices.atualizadoEm ? new Date(indices.atualizadoEm) : null
      }
    }),
    db.parcela.deleteMany({ where: { contratoId: contrato.id } }),
    db.parcela.createMany({
      data: parcelas.map((p) => ({
        contratoId: contrato.id,
        numero: p.numero,
        dataPagamento: new Date(p.dataPagamento),
        valorPrincipal: p.valorPrincipal,
        valorJuros: p.valorJuros,
        valorTotal: p.valorTotal,
        saldoDevedor: p.saldoDevedor
      }))
    })
  ]);
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}
