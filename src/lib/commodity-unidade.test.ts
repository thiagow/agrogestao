import { describe, expect, it } from 'vitest';
import { converterCotacaoCommodity } from './commodity-unidade';

// Números de referência do snapshot real documentado em
// docs/demandas/SPEC_TELA_COTACOES.md (seção 3.2), 25-26/08/2026 —
// câmbio USD/BRL 5,1470 (cotação venda do dólar naquele momento).
const CAMBIO = 5.147;

describe('converterCotacaoCommodity', () => {
  it('soja: USX/bu -> USD/sc -> R$/sc bate com o snapshot da spec', () => {
    const r = converterCotacaoCommodity('Soja Grão', 1233.5, CAMBIO, 'USX');
    expect(r.precoUsd).toBeCloseTo(27.19, 1);
    expect(r.precoBrl).toBeCloseTo(139.97, 0);
    expect(r.unidadeFinal).toBe('sc');
  });

  it('milho: fator de bushel de 56lb é diferente do de soja/trigo', () => {
    const r = converterCotacaoCommodity('Milho Grão', 630, CAMBIO, 'USX');
    // 630 USX/bu = 6.30 USD/bu * (60/25.4012) sc/bu ≈ 14.88 USD/sc
    expect(r.precoUsd).toBeCloseTo(14.88, 1);
    expect(r.unidadeFinal).toBe('sc');
  });

  it('boi gordo: USX/lb -> USD/@ usando arroba de 15kg', () => {
    const r = converterCotacaoCommodity('Boi Gordo', 224.575, CAMBIO, 'USX');
    // 2.24575 USD/lb * (15/0.45359237) lb/@ ≈ 74.27 USD/@
    expect(r.precoUsd).toBeCloseTo(74.27, 1);
    expect(r.unidadeFinal).toBe('@');
  });

  it('café: USX/lb -> USD/sc usando saca de 60kg', () => {
    const r = converterCotacaoCommodity('Café Arábica', 442.72, CAMBIO, 'USX');
    expect(r.unidadeFinal).toBe('sc');
    expect(r.precoUsd).toBeGreaterThan(0);
  });

  it('algodão (16/09/2026): USX/lb -> USD/@ usando arroba de 15kg, mesma regra do Boi Gordo', () => {
    const r = converterCotacaoCommodity('Algodão Pluma', 88.04, CAMBIO, 'USX');
    // 0.8804 USD/lb * (15/0.45359237) lb/@ ≈ 29.11 USD/@
    expect(r.precoUsd).toBeCloseTo(29.11, 1);
    expect(r.unidadeFinal).toBe('@');
  });

  it('açúcar: USX/lb -> USD/sc usando saca de 50kg', () => {
    const r = converterCotacaoCommodity('Açúcar', 20, CAMBIO, 'USX');
    // 0.20 USD/lb * (50/0.45359237) lb/sc ≈ 22.05 USD/sc
    expect(r.precoUsd).toBeCloseTo(22.05, 1);
    expect(r.unidadeFinal).toBe('sc');
  });

  it('farelo de soja: vem em USD/ton curta (2.000lb) -> USD/tonelada métrica, sem escala de centavos', () => {
    const r = converterCotacaoCommodity('Farelo de Soja', 300, CAMBIO, 'USD');
    // 300 USD/ton curta * (1000/907.18474) ton-métrica/ton-curta ≈ 330.69 USD/ton
    expect(r.precoUsd).toBeCloseTo(330.69, 1);
    expect(r.unidadeFinal).toBe('ton');
  });

  it('óleo de soja: USX/lb, sem fator de peso confirmado, mantém USD/lb bruto (mesma cautela que valia pro algodão)', () => {
    const r = converterCotacaoCommodity('Óleo de Soja', 45, CAMBIO, 'USX');
    expect(r.precoUsd).toBeCloseTo(0.45, 4);
    expect(r.unidadeFinal).toBe('lb');
  });

  it('arroz: vem em USD/cwt (NÃO centavos, diferente da maioria dos grãos CBOT) -> USD/sc usando saca de 50kg', () => {
    // Verificado ao vivo em 16/09/2026: ZR=F devolve meta.currency='USD', preço
    // real ~15,90 USD/cwt — cadastrar como USX (como os outros grãos) daria um
    // preço 100x menor. Ver moedaOriginal em market-data.ts/commodity-unidade.ts.
    const r = converterCotacaoCommodity('Arroz', 15.9, CAMBIO, 'USD');
    // 15.90 USD/cwt * (50/45.359237) sc/cwt ≈ 17.53 USD/sc
    expect(r.precoUsd).toBeCloseTo(17.53, 1);
    expect(r.unidadeFinal).toBe('sc');
  });

  it('álcool: USD/galão (sem escala de centavos) -> USD/litro', () => {
    const r = converterCotacaoCommodity('Álcool', 1.9, CAMBIO, 'USD');
    // 1.90 USD/gal / 3.785411784 L/gal ≈ 0.5019 USD/L
    expect(r.precoUsd).toBeCloseTo(0.5019, 3);
    expect(r.unidadeFinal).toBe('L');
  });

  it('petróleo: USD/barril (sem escala de centavos), sem conversão de unidade', () => {
    const r = converterCotacaoCommodity('Petróleo', 75, CAMBIO, 'USD');
    expect(r.precoUsd).toBeCloseTo(75, 4);
    expect(r.unidadeFinal).toBe('bbl');
  });

  it('óleo de aquecimento: vem em USD/galão (NÃO centavos) -> USD/litro', () => {
    // Verificado ao vivo em 16/09/2026: HO=F devolve meta.currency='USD',
    // preço real ~4,97 USD/gal — cadastrar como USX daria 100x menor.
    const r = converterCotacaoCommodity('Óleo de Aquecimento', 4.97, CAMBIO, 'USD');
    // 4.97 USD/gal / 3.785411784 L/gal ≈ 1.3131 USD/L
    expect(r.precoUsd).toBeCloseTo(1.3131, 3);
    expect(r.unidadeFinal).toBe('L');
  });

  it('sem moedaOriginal informado, assume USX (fallback conservador — todo chamador real sempre informa)', () => {
    const r = converterCotacaoCommodity('Soja Grão', 1233.5, CAMBIO);
    expect(r.precoUsd).toBeCloseTo(27.19, 1);
  });

  it('commodity desconhecida cai no mesmo comportamento de "sem fator" (fail-safe)', () => {
    const r = converterCotacaoCommodity('Não Mapeada', 100, CAMBIO, 'USX');
    expect(r.unidadeFinal).toBe('lb');
    expect(r.precoUsd).toBeCloseTo(1, 4);
  });
});
