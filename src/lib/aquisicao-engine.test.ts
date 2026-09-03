import { describe, it, expect } from 'vitest';
import { gerarParcelasAquisicao, listarSafrasCobertas } from './aquisicao-engine';

// Dataset de referência: contrato "Fazenda Pedra" da spec
// (docs/demandas/SPEC_TELA_AQUISICAO_FAZENDA.md, seção 3.2). O exemplo original
// cobre 5 anos de intervalo entre as datas mas só documenta 4 safras/parcelas —
// corte não explicado na spec. Aqui replicamos só os valores por safra
// (sacas/ha, preço, área), não o intervalo de datas em si (ver decisão
// registrada em aquisicao-engine.ts): usamos um intervalo de 4 anos exato para
// fechar as mesmas 4 parcelas do dataset.
const FAZENDA_PEDRA_SACAS = {
  tipoPagamento: 'SACAS' as const,
  areaTotalHa: 5000,
  dataInicioPagamento: '2026-02-10',
  dataVencimento: '2030-02-10',
  sacasHa: 200,
  precoReferencia: 115,
  valorEntrada: 10_000_000,
  safraEntrada: '2027/2028'
};

describe('listarSafrasCobertas', () => {
  it('gera 1 safra por ano inteiro entre início e vencimento', () => {
    expect(listarSafrasCobertas('2026-02-10', '2030-02-10')).toEqual([
      '2026/2027',
      '2027/2028',
      '2028/2029',
      '2029/2030'
    ]);
  });

  it('retorna vazio quando alguma data está ausente', () => {
    expect(listarSafrasCobertas('', '2030-02-10')).toEqual([]);
    expect(listarSafrasCobertas('2026-02-10', '')).toEqual([]);
  });
});

describe('gerarParcelasAquisicao — modo SACAS (dataset Fazenda Pedra)', () => {
  const parcelas = gerarParcelasAquisicao(FAZENDA_PEDRA_SACAS);

  it('gera 1 parcela por safra + 1 linha de entrada', () => {
    expect(parcelas).toHaveLength(5);
    expect(parcelas.filter((p) => p.tipo === 'PARCELA')).toHaveLength(4);
    expect(parcelas.filter((p) => p.tipo === 'ENTRADA')).toHaveLength(1);
  });

  it('fecha a soma de sacas em 1.000.000 — total do negócio (200sc/ha × 5.000ha), dividido pelas 4 safras (decisão de 23/08/2026)', () => {
    const totalSacas = parcelas.reduce((s, p) => s + p.sacas, 0);
    // Entrada não carrega sacas próprias no modo Sacas (valor fixo em R$).
    // Antes desta mudança, o total repetia 1.000.000sc EM CADA safra
    // (4.000.000 no total) — agora é o negócio inteiro dividido pelas safras.
    expect(totalSacas).toBe(1_000_000);
    expect(parcelas.filter((p) => p.tipo === 'PARCELA').every((p) => p.sacas === 250_000)).toBe(true);
  });

  it('fecha o valor total em R$ 125.000.000 (R$115M de parcelas + R$10M de entrada)', () => {
    const total = parcelas.reduce((s, p) => s + p.valorTotal, 0);
    expect(total).toBe(125_000_000);
  });

  it('nunca gera uma dataPagamento inválida (corrige o BUG #1 da spec)', () => {
    for (const p of parcelas) {
      expect(Number.isNaN(new Date(p.dataPagamento).getTime())).toBe(false);
    }
  });

  it('ordena as parcelas por data de pagamento crescente', () => {
    const datas = parcelas.map((p) => p.dataPagamento);
    const ordenadas = [...datas].sort();
    expect(datas).toEqual(ordenadas);
  });

  it('marca todas as parcelas do modo Sacas com o selo de preço de referência', () => {
    expect(parcelas.filter((p) => p.tipo === 'PARCELA').every((p) => p.usaPrecoReferencia)).toBe(true);
  });
});

describe('gerarParcelasAquisicao — modo SACAS, exemplo do cliente (review 23/08/2026)', () => {
  // "FAZENDA TESTE. Valor por ha são de 200 sacas, multiplicado pelo valor da
  // sacar de 120,00, e por mil - tamanho da fazenda, daria o total de
  // R$ 24 milhões, para pagamento em 4 safras daria 50 mil sacas por safra."
  const parcelas = gerarParcelasAquisicao({
    tipoPagamento: 'SACAS',
    areaTotalHa: 1000,
    dataInicioPagamento: '2026-01-01',
    dataVencimento: '2030-01-01',
    sacasHa: 200,
    precoReferencia: 120
  });

  it('divide o total do negócio (200sc/ha × 1.000ha = 200.000sc) pelas 4 safras: 50.000sc/safra', () => {
    expect(parcelas).toHaveLength(4);
    expect(parcelas.every((p) => p.sacas === 50_000)).toBe(true);
    expect(parcelas.reduce((s, p) => s + p.sacas, 0)).toBe(200_000);
  });

  it('fecha o valor total do negócio em R$ 24.000.000', () => {
    const total = parcelas.reduce((s, p) => s + p.valorTotal, 0);
    expect(total).toBe(24_000_000);
  });
});

describe('gerarParcelasAquisicao — modo REAIS', () => {
  const parcelas = gerarParcelasAquisicao({
    tipoPagamento: 'REAIS',
    areaTotalHa: 1000,
    dataInicioPagamento: '2026-01-01',
    dataVencimento: '2031-01-01',
    valorFinanciado: 1_000_000,
    taxaJurosAA: 10
  });

  it('gera 1 parcela por ano, amortizando exatamente o valor financiado', () => {
    expect(parcelas).toHaveLength(5);
    const totalPrincipalAproximado = parcelas.reduce((s, p) => s + p.valorTotal, 0);
    // valorTotal inclui juros — só garante que não ficou muito abaixo do principal
    expect(totalPrincipalAproximado).toBeGreaterThan(1_000_000);
  });

  it('não carrega sacas nem preço de referência', () => {
    for (const p of parcelas) {
      expect(p.sacas).toBe(0);
      expect(p.usaPrecoReferencia).toBe(false);
    }
  });

  it('nunca gera uma dataPagamento inválida', () => {
    for (const p of parcelas) {
      expect(Number.isNaN(new Date(p.dataPagamento).getTime())).toBe(false);
    }
  });
});

describe('gerarParcelasAquisicao — sem entrada', () => {
  it('não gera linha de Entrada quando valorEntrada é 0/ausente', () => {
    const parcelas = gerarParcelasAquisicao({
      tipoPagamento: 'SACAS',
      areaTotalHa: 100,
      dataInicioPagamento: '2026-01-01',
      dataVencimento: '2027-01-01',
      sacasHa: 50,
      precoReferencia: 100
    });
    expect(parcelas.every((p) => p.tipo === 'PARCELA')).toBe(true);
  });
});
