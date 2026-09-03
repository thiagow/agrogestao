import { describe, expect, it } from 'vitest';
import {
  anosPecuariaVisiveis,
  calcularPecuariaBovina,
  calcularProducaoAnimal,
  custoTotalPorCabecaBovino,
  estoqueTotalBovino,
  valorEstoqueBovino,
  type PecuariaBovinaCalculavel
} from './pecuaria-calc';

// Fixtures replicando exatamente os números da planilha real do cliente
// (docs/demandas/Template Agro_Banco_PECUARIA.xlsx, aba "Quadro Pecuaria",
// coluna B = 2024).
function bovino2024(overrides: Partial<PecuariaBovinaCalculavel> = {}): PecuariaBovinaCalculavel {
  return {
    femeas0a12: 1445,
    femeas12a24: 1685,
    femeas24a36: 699,
    femeasAcima36: 3865,
    machos0a12: 2210,
    machos12a24: 2525,
    machos24a36: 204,
    machosAcima36: 552,

    custoAquisicaoPorCabeca: 2350,
    custoPastagemPorHectare: 750,
    diariaConfinamento: 0,
    diasConfinamento: 0,
    qtdAnimaisConfinados: 0,

    qtdMachosComercializados: 5680,
    pesoMedioMachos: 18,
    precoMedioMachos: 285,
    qtdFemeasComercializadas: 6000,
    pesoMedioFemeas: 16,
    precoMedioFemeas: 260,
    qtdOutrasComercializadas: 0,
    pesoMedioOutras: 0,
    precoMedioOutras: 0,
    ...overrides
  };
}

describe('estoqueTotalBovino', () => {
  it('soma as 8 categorias (planilha B12 = 13.185)', () => {
    expect(estoqueTotalBovino(bovino2024())).toBe(13185);
  });
});

describe('custoTotalPorCabecaBovino', () => {
  it('soma direta dos 5 campos, mesmo com unidades diferentes (planilha B23 = 3.100)', () => {
    expect(custoTotalPorCabecaBovino(bovino2024())).toBe(3100);
  });
});

describe('valorEstoqueBovino', () => {
  it('estoque total x custo de aquisição por cabeça', () => {
    expect(valorEstoqueBovino(bovino2024())).toBe(13185 * 2350);
  });
});

describe('calcularPecuariaBovina', () => {
  it('reproduz Receita/Custo/Resultado/Margem de 2024 da planilha do cliente', () => {
    const r = calcularPecuariaBovina(bovino2024());
    expect(r.receitaBruta).toBe(54098400); // B42
    expect(r.despesa).toBe(36208000); // B43 = 3100 * (5680+6000)
    expect(r.receitaLiquida).toBe(17890400); // B44
    expect(r.margem).toBeCloseTo(33.070109282344762, 6); // B45 (fração x100)
  });

  it('reproduz 2025 (crescimento com preço maior)', () => {
    const r = calcularPecuariaBovina(
      bovino2024({
        custoAquisicaoPorCabeca: 2550,
        custoPastagemPorHectare: 850,
        qtdMachosComercializados: 6250,
        pesoMedioMachos: 18,
        precoMedioMachos: 300,
        qtdFemeasComercializadas: 6854,
        pesoMedioFemeas: 16,
        precoMedioFemeas: 280
      })
    );
    expect(r.receitaBruta).toBe(64455920); // C42
    expect(r.despesa).toBe(44553600); // C43 = 3400 * (6250+6854)
    expect(r.receitaLiquida).toBe(19902320); // C44
  });

  it('"Outras Categorias" não entra no Custo Total de Produção (só na Receita)', () => {
    const semOutras = calcularPecuariaBovina(bovino2024());
    const comOutras = calcularPecuariaBovina(
      bovino2024({ qtdOutrasComercializadas: 100, pesoMedioOutras: 15, precoMedioOutras: 200 })
    );
    expect(comOutras.despesa).toBe(semOutras.despesa); // custo não muda
    expect(comOutras.receitaBruta).toBe(semOutras.receitaBruta + 100 * 15 * 200); // receita soma
  });

  it('margem cai para 0 quando receita bruta é zero, nunca divide por zero', () => {
    const r = calcularPecuariaBovina(
      bovino2024({
        qtdMachosComercializados: 0,
        qtdFemeasComercializadas: 0,
        qtdOutrasComercializadas: 0
      })
    );
    expect(r.receitaBruta).toBe(0);
    expect(r.margem).toBe(0);
  });
});

describe('calcularProducaoAnimal', () => {
  it('Suinocultura/Avicultura: receita/custo por cabeça, sem estoque nem peso', () => {
    const r = calcularProducaoAnimal({ producaoCabecas: 10000, precoMedioPorCabeca: 50, custoMedioPorCabeca: 30 });
    expect(r.receitaBruta).toBe(500000);
    expect(r.despesa).toBe(300000);
    expect(r.receitaLiquida).toBe(200000);
    expect(r.margem).toBeCloseTo(40, 6);
  });

  it('produção zero -> tudo zero, margem 0 (mesmo critério de calcularSafra)', () => {
    const r = calcularProducaoAnimal({ producaoCabecas: 0, precoMedioPorCabeca: 0, custoMedioPorCabeca: 0 });
    expect(r).toEqual({ receitaBruta: 0, despesa: 0, receitaLiquida: 0, margem: 0 });
  });
});

describe('anosPecuariaVisiveis', () => {
  it('janela rolante: ano atual e os 2 anos anteriores (3 no total)', () => {
    expect(anosPecuariaVisiveis(new Date('2026-09-02'))).toEqual([2024, 2025, 2026]);
  });
});
