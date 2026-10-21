import { describe, expect, it } from 'vitest';
import {
  anosPecuariaVisiveis,
  calcularPecuariaBovina,
  calcularProducaoAnimal,
  calcularQuantidadeTotalBovina,
  consolidarProducaoTotal,
  custoTotalPorCabecaBovino,
  estoqueTotalBovino,
  arrobasEstoqueBovino,
  mediaDoisAnos,
  valorEstoqueProducaoAnimal,
  receitaCustoPecuariaSafraBlend,
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

describe('calcularQuantidadeTotalBovina', () => {
  it('consolida Cabeças/Peso Médio/Preço Médio Total de 2024 (réplica da tabela "Quantidade total" da planilha)', () => {
    const r = calcularQuantidadeTotalBovina(bovino2024());
    expect(r.totalCabecas).toBe(11680); // 5680 machos + 6000 fêmeas
    expect(r.totalArrobas).toBe(198240); // 5680*18 + 6000*16
    expect(r.pesoMedio).toBeCloseTo(16.972602739726028, 6); // ~17 arrobas/cabeça, ponderado
    expect(r.precoMedioTotal).toBeCloseTo(272.89346246973366, 6); // receitaBruta / totalArrobas
    // Fecha exatamente com a Receita Bruta de calcularPecuariaBovina — nunca diverge por arredondamento.
    expect(r.totalCabecas * r.pesoMedio * r.precoMedioTotal).toBeCloseTo(calcularPecuariaBovina(bovino2024()).receitaBruta, 4);
  });

  it('sem nenhum animal comercializado, tudo zero (sem divisão por zero)', () => {
    const r = calcularQuantidadeTotalBovina(
      bovino2024({ qtdMachosComercializados: 0, qtdFemeasComercializadas: 0, qtdOutrasComercializadas: 0 })
    );
    expect(r).toEqual({ totalCabecas: 0, totalArrobas: 0, pesoMedio: 0, precoMedioTotal: 0 });
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

describe('receitaCustoPecuariaSafraBlend (16/09/2026 — 50% ano civil de início + 50% ano civil seguinte)', () => {
  it('mistura 50/50 os dois anos civis cobertos pela safra', () => {
    const producaoAnimal = [
      { anoCivil: 2023, producaoCabecas: 100, precoMedioPorCabeca: 10, custoMedioPorCabeca: 4 }, // receita 1.000, despesa 400
      { anoCivil: 2024, producaoCabecas: 100, precoMedioPorCabeca: 20, custoMedioPorCabeca: 8 } // receita 2.000, despesa 800
    ];
    const r = receitaCustoPecuariaSafraBlend('2023/2024', [], producaoAnimal);
    expect(r.receitaBruta).toBeCloseTo(1500, 6); // 0,5*1000 + 0,5*2000
    expect(r.despesa).toBeCloseTo(600, 6); // 0,5*400 + 0,5*800
  });

  it('ano civil sem nenhum registro entra como zero (sem lançar erro)', () => {
    const producaoAnimal = [{ anoCivil: 2023, producaoCabecas: 100, precoMedioPorCabeca: 10, custoMedioPorCabeca: 4 }];
    const r = receitaCustoPecuariaSafraBlend('2023/2024', [], producaoAnimal);
    expect(r.receitaBruta).toBeCloseTo(500, 6); // 0,5*1000 + 0,5*0
    expect(r.despesa).toBeCloseTo(200, 6);
  });
});

describe('anosPecuariaVisiveis (16/09/2026 — janela fixa de 6 anos, mesma largura do Quadro de Lavoura)', () => {
  it('6 anos civis fixos ancorados no 1º ano da safra vigente: 3 Realizado + Atual + 2 Previsão', () => {
    // Safra "2026/2027" -> ano civil "atual" = 2026 (1º ano da safra, não o 2º —
    // bug corrigido em 16/09/2026: marcava 2027 como Atual em vez de 2026).
    expect(anosPecuariaVisiveis('2026/2027')).toEqual([2023, 2024, 2025, 2026, 2027, 2028]);
  });

  it('acompanha a safra vigente configurada, não a data do sistema', () => {
    // Uma safra vigente diferente desloca a janela inteira, sem depender de `new Date()`.
    expect(anosPecuariaVisiveis('2029/2030')).toEqual([2026, 2027, 2028, 2029, 2030, 2031]);
  });
});

describe('consolidarProducaoTotal (item 2.5, 10/09/2026)', () => {
  it('soma lavoura + pecuária (bovino+avícola+suíno já consolidados)', () => {
    const r = consolidarProducaoTotal(
      { receitaTotal: 100_000, custoTotal: 60_000, margemRs: 40_000, margemPercent: 40 },
      { receitaBruta: 50_000, despesa: 20_000 }
    );

    expect(r.receitaTotal).toBe(150_000);
    expect(r.custoTotal).toBe(80_000);
    expect(r.margemRs).toBe(70_000);
    expect(r.margemPercent).toBeCloseTo((70_000 / 150_000) * 100, 6);
  });

  it('receita total zero não gera divisão por zero', () => {
    const r = consolidarProducaoTotal(
      { receitaTotal: 0, custoTotal: 0, margemRs: 0, margemPercent: 0 },
      { receitaBruta: 0, despesa: 0 }
    );
    expect(r.margemPercent).toBe(0);
  });
});

describe('estoque de rebanho — arrobas por idade × valor da @ (retorno do cliente, 21/10/2026)', () => {
  const zero = { femeas0a12: 0, femeas12a24: 0, femeas24a36: 0, femeasAcima36: 0, machos0a12: 0, machos12a24: 0, machos24a36: 0, machosAcima36: 0, custoAquisicaoPorCabeca: 2000 };

  it('arrobas = Σ cabeças × peso da faixa, separado por sexo', () => {
    const a = arrobasEstoqueBovino({ ...zero, femeas12a24: 10, machosAcima36: 2 });
    expect(a.femeas).toBeCloseTo(83, 8); // 10 × 8,3
    expect(a.machos).toBeCloseTo(34.6, 8); // 2 × 17,3
  });

  it('valor = arrobas × valor da @ do sexo', () => {
    const v = valorEstoqueBovino({ ...zero, femeas12a24: 10, machosAcima36: 2, valorArrobaFemea: 300, valorArrobaMacho: 320 });
    expect(v).toBe(Math.round(83 * 300 + 34.6 * 320));
  });

  it('sem valor da @ informado, cai no custo de aquisição × cabeças', () => {
    expect(valorEstoqueBovino({ ...zero, femeas12a24: 10, machosAcima36: 2 })).toBe(24_000);
  });

  it('Suínos/Aves: plantel × preço médio por cabeça', () => {
    expect(valorEstoqueProducaoAnimal({ plantel: 200, precoMedioPorCabeca: 35 })).toBe(7000);
  });

  it('média de dois anos usa o ano que existir quando só há um', () => {
    expect(mediaDoisAnos(100, 300)).toBe(200);
    expect(mediaDoisAnos(null, 300)).toBe(300);
    expect(mediaDoisAnos(100, null)).toBe(100);
    expect(mediaDoisAnos(null, null)).toBe(0);
  });
});
