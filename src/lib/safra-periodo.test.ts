import { describe, it, expect } from 'vitest';
import { janelaSafra, safraDaData, anoInicioSafra, safraDoAno, listarSafrasCobertas, classificarSafra } from './safra-periodo';

describe('janelaSafra', () => {
  it('safra "2026/2027" cobre 01/07/2026 a 30/06/2027', () => {
    expect(janelaSafra('2026/2027')).toEqual({ inicio: '2026-07-01', fim: '2027-06-30' });
  });

  it('anoInicioSafra/safraDoAno continuam consistentes com a janela', () => {
    const safra = '2030/2031';
    const janela = janelaSafra(safra);
    expect(janela.inicio.slice(0, 4)).toBe(String(anoInicioSafra(safra)));
    expect(safraDoAno(anoInicioSafra(safra))).toBe(safra);
  });
});

describe('safraDaData', () => {
  it('01/07 do ano N já é o início da safra N/N+1', () => {
    expect(safraDaData('2026-07-01')).toBe('2026/2027');
  });

  it('30/06 do ano N+1 ainda é a mesma safra N/N+1 (não vira N+1/N+2)', () => {
    expect(safraDaData('2027-06-30')).toBe('2026/2027');
  });

  it('30/06 (não 01/07) é o corte — datas de dezembro caem na safra iniciada naquele ano', () => {
    expect(safraDaData('2026-12-31')).toBe('2026/2027');
  });

  it('01/01 já caiu na segunda metade da safra iniciada no ano anterior', () => {
    expect(safraDaData('2027-01-01')).toBe('2026/2027');
  });

  it('é a inversa de janelaSafra nos dois extremos', () => {
    const safra = '2028/2029';
    const { inicio, fim } = janelaSafra(safra);
    expect(safraDaData(inicio)).toBe(safra);
    expect(safraDaData(fim)).toBe(safra);
  });
});

describe('classificarSafra (10/09/2026 — badges Realizado/Atual/Previsão)', () => {
  it('safra anterior à vigente é Realizado', () => {
    expect(classificarSafra('2024/2025', '2026/2027')).toBe('Realizado');
  });

  it('a própria safra vigente é Atual', () => {
    expect(classificarSafra('2026/2027', '2026/2027')).toBe('Atual');
  });

  it('safra posterior à vigente é Previsão', () => {
    expect(classificarSafra('2027/2028', '2026/2027')).toBe('Previsão');
  });
});

describe('listarSafrasCobertas (regressão — não deve mudar com a janela nova)', () => {
  it('continua contando por ano civil entre as datas, não pela janela jul-jun', () => {
    expect(listarSafrasCobertas('2026-02-10', '2030-02-10')).toEqual([
      '2026/2027',
      '2027/2028',
      '2028/2029',
      '2029/2030'
    ]);
  });
});
