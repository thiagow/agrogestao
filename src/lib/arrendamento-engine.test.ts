import { describe, it, expect } from 'vitest';
import { gerarParcelasArrendamento } from './arrendamento-engine';

// Dataset de referência: contrato "Fazenda Matagal" da spec
// (docs/demandas/SPEC_TELA_ARRENDAMENTO_RURAL.md, seção 3.2) — 4 safras,
// 12,0 sc/ha, 1.499 ha, R$ 112/sc de preço de referência.
const FAZENDA_MATAGAL = {
  tipoPagamento: 'SACAS' as const,
  areaArrendadaHa: 1499,
  dataInicio: '2026-07-01',
  dataVencimento: '2030-07-01',
  sacasHa: 12
};

describe('gerarParcelasArrendamento — modo SACAS com Preço de Referência (dataset Fazenda Matagal)', () => {
  const parcelas = gerarParcelasArrendamento({ ...FAZENDA_MATAGAL, precoReferencia: 112 });

  it('gera 1 parcela por safra', () => {
    expect(parcelas).toHaveLength(4);
  });

  it('calcula sacas brutas = sacasHa × área (17.988 sc/safra)', () => {
    for (const p of parcelas) {
      expect(p.sacasBrutas).toBe(17988);
      expect(p.sacasLiquidas).toBe(17988);
      expect(p.sacasAntecipadas).toBe(0);
    }
  });

  it('usa o preço do contrato (origemPreco CONTRATO) e fecha o valor em R$ 2.014.656/safra', () => {
    for (const p of parcelas) {
      expect(p.origemPreco).toBe('CONTRATO');
      expect(p.precoSc).toBe(112);
      expect(p.valorTotal).toBe(2_014_656);
    }
  });
});

describe('gerarParcelasArrendamento — BUG #1 da spec: sem Preço de Referência e sem fallback', () => {
  const parcelas = gerarParcelasArrendamento(FAZENDA_MATAGAL);

  it('nunca inventa um preço nem um valor "0" — origemPreco e valorTotal ficam null (N/D)', () => {
    for (const p of parcelas) {
      expect(p.origemPreco).toBeNull();
      expect(p.precoSc).toBeNull();
      expect(p.valorTotal).toBeNull();
    }
  });

  it('mesmo sem preço, sacas brutas/líquidas continuam calculadas normalmente', () => {
    for (const p of parcelas) {
      expect(p.sacasBrutas).toBe(17988);
      expect(p.sacasLiquidas).toBe(17988);
    }
  });
});

describe('gerarParcelasArrendamento — fallback de Cotações quando não há Preço de Referência', () => {
  const parcelas = gerarParcelasArrendamento({ ...FAZENDA_MATAGAL, precoFallbackCotacao: 108 });

  it('usa o preço de fallback e marca origemPreco COTACAO', () => {
    for (const p of parcelas) {
      expect(p.origemPreco).toBe('COTACAO');
      expect(p.precoSc).toBe(108);
      expect(p.valorTotal).toBe(17988 * 108);
    }
  });

  it('preço de referência do contrato tem prioridade sobre o fallback quando ambos existem', () => {
    const comAmbos = gerarParcelasArrendamento({
      ...FAZENDA_MATAGAL,
      precoReferencia: 112,
      precoFallbackCotacao: 108
    });
    for (const p of comAmbos) {
      expect(p.origemPreco).toBe('CONTRATO');
      expect(p.precoSc).toBe(112);
    }
  });
});

describe('gerarParcelasArrendamento — Pagamento Antecipado (seção 5 da spec)', () => {
  const parcelas = gerarParcelasArrendamento({
    ...FAZENDA_MATAGAL,
    precoReferencia: 112,
    possuiPagamentoAntecipado: true,
    valorAntecipado: 5000,
    safraReferenciaAntecipacao: '2027/2028'
  });

  it('deduz o valor antecipado só da safra de referência', () => {
    const safraComAntecipacao = parcelas.find((p) => p.safra === '2027/2028')!;
    expect(safraComAntecipacao.sacasAntecipadas).toBe(5000);
    expect(safraComAntecipacao.sacasLiquidas).toBe(17988 - 5000);
    expect(safraComAntecipacao.valorTotal).toBe((17988 - 5000) * 112);

    const outrasSafras = parcelas.filter((p) => p.safra !== '2027/2028');
    for (const p of outrasSafras) {
      expect(p.sacasAntecipadas).toBe(0);
      expect(p.sacasLiquidas).toBe(17988);
    }
  });

  it('nunca deduz mais sacas do que as brutas da safra (clamp em 0)', () => {
    const [p] = gerarParcelasArrendamento({
      ...FAZENDA_MATAGAL,
      precoReferencia: 112,
      possuiPagamentoAntecipado: true,
      valorAntecipado: 999_999,
      safraReferenciaAntecipacao: '2026/2027'
    });
    expect(p.sacasLiquidas).toBe(0);
    expect(p.sacasAntecipadas).toBe(p.sacasBrutas);
  });
});

describe('gerarParcelasArrendamento — modo REAIS', () => {
  it('divide o valor total manual igualmente entre as safras cobertas', () => {
    const parcelas = gerarParcelasArrendamento({
      tipoPagamento: 'REAIS',
      areaArrendadaHa: 1000,
      dataInicio: '2026-01-01',
      dataVencimento: '2029-01-01',
      valorTotalManual: 900_000
    });
    expect(parcelas).toHaveLength(3);
    for (const p of parcelas) {
      expect(p.valorTotal).toBe(300_000);
      expect(p.sacasBrutas).toBe(0);
      expect(p.precoSc).toBeNull();
    }
  });

  it('calcula por Preço/ha × Área quando não há Valor Total manual', () => {
    const [p] = gerarParcelasArrendamento({
      tipoPagamento: 'REAIS',
      areaArrendadaHa: 500,
      dataInicio: '2026-01-01',
      dataVencimento: '2027-01-01',
      precoHa: 2000
    });
    expect(p.valorTotal).toBe(1_000_000);
  });

  it('deduz o pagamento antecipado (R$) da safra de referência', () => {
    const parcelas = gerarParcelasArrendamento({
      tipoPagamento: 'REAIS',
      areaArrendadaHa: 500,
      dataInicio: '2026-01-01',
      dataVencimento: '2028-01-01',
      precoHa: 2000,
      possuiPagamentoAntecipado: true,
      valorAntecipado: 100_000,
      safraReferenciaAntecipacao: '2027/2028'
    });
    const comAntecipacao = parcelas.find((p) => p.safra === '2027/2028')!;
    expect(comAntecipacao.valorTotal).toBe(1_000_000 - 100_000);
  });
});
