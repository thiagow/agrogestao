import { describe, expect, it } from 'vitest';
import { converterCotacaoCommodity } from './commodity-unidade';

// Números de referência do snapshot real documentado em
// docs/demandas/SPEC_TELA_COTACOES.md (seção 3.2), 25-26/08/2026 —
// câmbio USD/BRL 5,1470 (cotação venda do dólar naquele momento).
const CAMBIO = 5.147;

describe('converterCotacaoCommodity', () => {
  it('soja: USX/bu -> USD/sc -> R$/sc bate com o snapshot da spec', () => {
    const r = converterCotacaoCommodity('Soja Grão', 1233.5, CAMBIO);
    expect(r.precoUsd).toBeCloseTo(27.19, 1);
    expect(r.precoBrl).toBeCloseTo(139.97, 0);
    expect(r.unidadeFinal).toBe('sc');
  });

  it('milho: fator de bushel de 56lb é diferente do de soja/trigo', () => {
    const r = converterCotacaoCommodity('Milho Grão', 630, CAMBIO);
    // 630 USX/bu = 6.30 USD/bu * (60/25.4012) sc/bu ≈ 14.88 USD/sc
    expect(r.precoUsd).toBeCloseTo(14.88, 1);
    expect(r.unidadeFinal).toBe('sc');
  });

  it('boi gordo: USX/lb -> USD/@ usando arroba de 15kg', () => {
    const r = converterCotacaoCommodity('Boi Gordo', 224.575, CAMBIO);
    // 2.24575 USD/lb * (15/0.45359237) lb/@ ≈ 74.27 USD/@
    expect(r.precoUsd).toBeCloseTo(74.27, 1);
    expect(r.unidadeFinal).toBe('@');
  });

  it('café: USX/lb -> USD/sc usando saca de 60kg', () => {
    const r = converterCotacaoCommodity('Café Arábica', 442.72, CAMBIO);
    expect(r.unidadeFinal).toBe('sc');
    expect(r.precoUsd).toBeGreaterThan(0);
  });

  it('algodão (16/09/2026): USX/lb -> USD/@ usando arroba de 15kg, mesma regra do Boi Gordo', () => {
    const r = converterCotacaoCommodity('Algodão Pluma', 88.04, CAMBIO);
    // 0.8804 USD/lb * (15/0.45359237) lb/@ ≈ 29.11 USD/@
    expect(r.precoUsd).toBeCloseTo(29.11, 1);
    expect(r.unidadeFinal).toBe('@');
  });

  it('açúcar: USX/lb -> USD/sc usando saca de 50kg', () => {
    const r = converterCotacaoCommodity('Açúcar', 20, CAMBIO);
    // 0.20 USD/lb * (50/0.45359237) lb/sc ≈ 22.05 USD/sc
    expect(r.precoUsd).toBeCloseTo(22.05, 1);
    expect(r.unidadeFinal).toBe('sc');
  });

  it('farelo de soja: USD/ton curta (2.000lb) -> USD/tonelada métrica, sem escala de centavos', () => {
    const r = converterCotacaoCommodity('Farelo de Soja', 300, CAMBIO);
    // 300 USD/ton curta * (1000/907.18474) ton-métrica/ton-curta ≈ 330.69 USD/ton
    expect(r.precoUsd).toBeCloseTo(330.69, 1);
    expect(r.unidadeFinal).toBe('ton');
  });

  it('óleo de soja: sem fator confirmado, mantém USD/lb bruto (mesma cautela que valia pro algodão)', () => {
    const r = converterCotacaoCommodity('Óleo de Soja', 45, CAMBIO);
    expect(r.precoUsd).toBeCloseTo(0.45, 4);
    expect(r.unidadeFinal).toBe('lb');
  });

  it('arroz: USX/cwt -> USD/sc usando saca de 50kg', () => {
    const r = converterCotacaoCommodity('Arroz', 1400, CAMBIO);
    // 14.00 USD/cwt * (50/45.359237) sc/cwt ≈ 15.44 USD/sc
    expect(r.precoUsd).toBeCloseTo(15.44, 1);
    expect(r.unidadeFinal).toBe('sc');
  });

  it('álcool: USD/galão (sem escala de centavos) -> USD/litro', () => {
    const r = converterCotacaoCommodity('Álcool', 1.9, CAMBIO);
    // 1.90 USD/gal / 3.785411784 L/gal ≈ 0.5019 USD/L
    expect(r.precoUsd).toBeCloseTo(0.5019, 3);
    expect(r.unidadeFinal).toBe('L');
  });

  it('petróleo: USD/barril (sem escala de centavos), sem conversão de unidade', () => {
    const r = converterCotacaoCommodity('Petróleo', 75, CAMBIO);
    expect(r.precoUsd).toBeCloseTo(75, 4);
    expect(r.unidadeFinal).toBe('bbl');
  });

  it('óleo de aquecimento: USX/galão -> USD/litro', () => {
    const r = converterCotacaoCommodity('Óleo de Aquecimento', 250, CAMBIO);
    // 2.50 USD/gal / 3.785411784 L/gal ≈ 0.6604 USD/L
    expect(r.precoUsd).toBeCloseTo(0.6604, 3);
    expect(r.unidadeFinal).toBe('L');
  });

  it('commodity desconhecida cai no mesmo comportamento de "sem fator" (fail-safe)', () => {
    const r = converterCotacaoCommodity('Não Mapeada', 100, CAMBIO);
    expect(r.unidadeFinal).toBe('lb');
    expect(r.precoUsd).toBeCloseTo(1, 4);
  });
});
