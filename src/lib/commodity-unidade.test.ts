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

  it('algodão: sem fator confirmado, mantém USD/lb bruto (nunca inventa saca)', () => {
    const r = converterCotacaoCommodity('Algodão Pluma', 88.04, CAMBIO);
    expect(r.precoUsd).toBeCloseTo(0.8804, 4);
    expect(r.unidadeFinal).toBe('lb');
  });

  it('commodity desconhecida cai no mesmo comportamento de "sem fator" (fail-safe)', () => {
    const r = converterCotacaoCommodity('Não Mapeada', 100, CAMBIO);
    expect(r.unidadeFinal).toBe('lb');
    expect(r.precoUsd).toBeCloseTo(1, 4);
  });
});
