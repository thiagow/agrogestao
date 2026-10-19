import { describe, it, expect } from 'vitest';
import { safraAtualDaData, safraSeguinte, safraAnterior, safrasDoAnoCivilBlend } from './safra-periodo';

describe('safraAtualDaData (13/10/2026)', () => {
  const safras = ['2025/2026', '2026/2027', '2028/2029'];

  it('Jul-Dez pertence à safra iniciada no ano corrente', () => {
    expect(safraAtualDaData(safras, '2026-10-18')).toBe('2026/2027');
  });

  it('Jan-Jun pertence à safra iniciada no ano anterior', () => {
    expect(safraAtualDaData(safras, '2027-03-10')).toBe('2026/2027');
  });

  it('se a safra da data não existe, cai na mais próxima anterior', () => {
    expect(safraAtualDaData(safras, '2027-09-01')).toBe('2026/2027'); // 2027/2028 não cadastrada
  });

  it('se todas são posteriores, usa a primeira', () => {
    expect(safraAtualDaData(['2029/2030', '2030/2031'], '2026-10-18')).toBe('2029/2030');
  });

  it('lista vazia devolve string vazia', () => {
    expect(safraAtualDaData([], '2026-10-18')).toBe('');
  });
});

describe('helpers de safra', () => {
  it('seguinte e anterior', () => {
    expect(safraSeguinte('2026/2027')).toBe('2027/2028');
    expect(safraAnterior('2026/2027')).toBe('2025/2026');
  });

  it('ano civil alimenta duas safras no blend', () => {
    expect(safrasDoAnoCivilBlend(2028)).toEqual(['2027/2028', '2028/2029']);
  });
});
