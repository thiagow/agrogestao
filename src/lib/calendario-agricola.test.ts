import { describe, it, expect } from 'vitest';
import { linhasCalendarioPorCultura } from './calendario-agricola';

const meses = (fases: (string | null)[], fase: string) => fases.flatMap((f, i) => (f === fase ? [i + 1] : []));

describe('Calendário Agrícola por cultura (13/10/2026)', () => {
  it('uma linha por nome de cultura, sem repetir', () => {
    const linhas = linhasCalendarioPorCultura(['Soja', 'Café Arábica', 'soja']);
    expect(linhas.map((l) => l.cultura)).toEqual(['Soja', 'Café Arábica']);
  });

  it('Soja: SET-OUT custeio, NOV-JAN crescimento, FEV-ABR colheita', () => {
    const { etapa } = linhasCalendarioPorCultura(['Soja'])[0];
    expect(meses(etapa.fasesPorMes, 'PLANTIO_CUSTEIO')).toEqual([9, 10]);
    expect(meses(etapa.fasesPorMes, 'CRESCIMENTO')).toEqual([1, 11, 12]);
    expect(meses(etapa.fasesPorMes, 'COLHEITA_RECEITA')).toEqual([2, 3, 4]);
  });

  it('Café: MAI-JUL custeio, AGO-ABR colheita, sem crescimento', () => {
    const { etapa } = linhasCalendarioPorCultura(['Café Arábica'])[0];
    expect(meses(etapa.fasesPorMes, 'PLANTIO_CUSTEIO')).toEqual([5, 6, 7]);
    expect(meses(etapa.fasesPorMes, 'COLHEITA_RECEITA')).toEqual([1, 2, 3, 4, 8, 9, 10, 11, 12]);
    expect(meses(etapa.fasesPorMes, 'CRESCIMENTO')).toEqual([]);
  });

  it('cultura sem mapeamento cai em Outras Culturas, mantendo o nome', () => {
    const [linha] = linhasCalendarioPorCultura(['Sorgo']);
    expect(linha.cultura).toBe('Sorgo');
    expect(linha.etapa.categoria).toBe('OUTRAS_CULTURAS');
  });
});
