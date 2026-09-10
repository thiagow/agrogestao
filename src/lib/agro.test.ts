import { describe, it, expect } from 'vitest';
import { calcularSafra, consolidarMargemLavoura, isCurtoPrazo } from './agro';

describe('calcularSafra', () => {
  it('deriva produção/receita/despesa/margem a partir de hectares, rendimento, preço e custo', () => {
    const r = calcularSafra({ hectares: 100, rendimento: 60, precoMedio: 150, custoProducao: 4000 });

    expect(r.totalProducao).toBe(6000); // 100 * 60
    expect(r.receitaBruta).toBe(900_000); // 6000 * 150
    expect(r.despesa).toBe(400_000); // 100 * 4000
    expect(r.receitaLiquida).toBe(500_000);
    expect(r.margem).toBeCloseTo((500_000 / 900_000) * 100, 6);
  });

  it('receita zero não gera divisão por zero na margem', () => {
    const r = calcularSafra({ hectares: 0, rendimento: 0, precoMedio: 0, custoProducao: 0 });
    expect(r).toEqual({ totalProducao: 0, receitaBruta: 0, despesa: 0, receitaLiquida: 0, margem: 0 });
  });
});

describe('consolidarMargemLavoura (item 1.6, 10/09/2026)', () => {
  it('soma receita/custo de todos os registros e calcula a margem final', () => {
    const registros = [
      { hectares: 100, rendimento: 60, precoMedio: 150, custoProducao: 4000 }, // receita 900k, custo 400k
      { hectares: 50, rendimento: 40, precoMedio: 100, custoProducao: 3000 } // receita 200k, custo 150k
    ];
    const r = consolidarMargemLavoura(registros);

    expect(r.receitaTotal).toBe(1_100_000);
    expect(r.custoTotal).toBe(550_000);
    expect(r.margemRs).toBe(550_000);
    expect(r.margemPercent).toBeCloseTo(50, 6);
  });

  it('lista vazia devolve tudo zerado, sem inventar número', () => {
    expect(consolidarMargemLavoura([])).toEqual({ receitaTotal: 0, custoTotal: 0, margemRs: 0, margemPercent: 0 });
  });
});

describe('isCurtoPrazo', () => {
  it('sem data de vencimento, considera curto prazo por padrão', () => {
    expect(isCurtoPrazo('')).toBe(true);
  });
});
