import { describe, it, expect } from 'vitest';
import { calcularPosicaoComercializacao } from './comercializacao';
import type { CulturaSafraAno, ContratoComercial, Cotacao } from '@/types';

function quadroSafra(overrides: Partial<CulturaSafraAno>): CulturaSafraAno {
  return {
    id: 'qs-1',
    cultura: 'Soja',
    anoSafra: '2026/2027',
    hectares: 1000,
    haPropria: 1000,
    haArrendada: 0,
    rendimento: 60,
    unidadeProducao: 'sc',
    precoMedio: 120,
    custoProducao: 3000,
    ...overrides
  };
}

function contrato(overrides: Partial<ContratoComercial>): ContratoComercial {
  return {
    id: `contrato-${Math.random()}`,
    cultura: 'Soja',
    safra: '2026/2027',
    quantidadeSc: 10000,
    precoFixado: 115,
    tipoContrato: 'FUTURO',
    dataContrato: '2026-01-01',
    dataVencimento: '2026-12-01',
    status: 'ATIVO',
    compradorNome: 'Bunge',
    ...overrides
  };
}

function cotacao(overrides: Partial<Cotacao>): Cotacao {
  return {
    id: 'cot-1',
    commodity: 'Soja Grão',
    bolsa: 'CBOT',
    ticker: 'ZS=F',
    precoBrl: 999, // nunca deve ser usado — só precoDefinidoSafra
    unidade: 'R$',
    variacaoPercentual: 0,
    maxima: 0,
    minima: 0,
    volume: 0,
    atualizadoEm: '00:00:00',
    ...overrides
  };
}

describe('calcularPosicaoComercializacao — Posição por Cultura', () => {
  it('calcula produção total (hectares × rendimento) e quantidade a fixar', () => {
    const { porCultura } = calcularPosicaoComercializacao({
      quadroSafra: [quadroSafra({})],
      contratos: [],
      cotacoes: [],
      safra: '2026/2027'
    });
    expect(porCultura).toHaveLength(1);
    expect(porCultura[0].producaoTotal).toBe(60000);
    expect(porCultura[0].quantidadeFixada).toBe(0);
    expect(porCultura[0].quantidadeAFixar).toBe(60000);
  });

  it('soma sacas/receita fixada só dos contratos ATIVOS da safra e cultura certas', () => {
    const { porCultura } = calcularPosicaoComercializacao({
      quadroSafra: [quadroSafra({})],
      contratos: [
        contrato({ quantidadeSc: 10000, precoFixado: 115 }),
        contrato({ status: 'CANCELADO', quantidadeSc: 5000 }), // não deve entrar
        contrato({ cultura: 'Milho', quantidadeSc: 5000 }), // outra cultura, não deve entrar
        contrato({ safra: '2025/2026', quantidadeSc: 5000 }) // outra safra, não deve entrar
      ],
      cotacoes: [],
      safra: '2026/2027'
    });
    expect(porCultura[0].quantidadeFixada).toBe(10000);
    expect(porCultura[0].quantidadeAFixar).toBe(50000);
    expect(porCultura[0].receitaFixada).toBe(10000 * 115);
  });

  it('usa Cotacao.precoDefinidoSafra da commodity mapeada (Soja -> Soja Grão), nunca precoBrl', () => {
    const { porCultura } = calcularPosicaoComercializacao({
      quadroSafra: [quadroSafra({})],
      contratos: [],
      cotacoes: [cotacao({ precoDefinidoSafra: 118 })],
      safra: '2026/2027'
    });
    expect(porCultura[0].cotacao).toBe(118);
    expect(porCultura[0].valorAMercado).toBe(60000 * 118);
  });

  it('cotacao/valorAMercado ficam null (nunca 0) quando a commodity não tem preço definido', () => {
    const { porCultura } = calcularPosicaoComercializacao({
      quadroSafra: [quadroSafra({})],
      contratos: [],
      cotacoes: [cotacao({ precoDefinidoSafra: undefined })],
      safra: '2026/2027'
    });
    expect(porCultura[0].cotacao).toBeNull();
    expect(porCultura[0].valorAMercado).toBeNull();
  });

  it('cotacao/valorAMercado ficam null quando a cultura não tem commodity mapeada (ex: Seringueira)', () => {
    const { porCultura } = calcularPosicaoComercializacao({
      quadroSafra: [quadroSafra({ cultura: 'Seringueira' })],
      contratos: [],
      cotacoes: [cotacao({ commodity: 'Soja Grão', precoDefinidoSafra: 118 })],
      safra: '2026/2027'
    });
    expect(porCultura[0].cotacao).toBeNull();
  });

  it('resolve o cruzamento Bovino -> Boi Gordo (nomes que não batem por substring)', () => {
    const { porCultura } = calcularPosicaoComercializacao({
      quadroSafra: [quadroSafra({ cultura: 'Bovino', rendimento: 10 })],
      contratos: [],
      cotacoes: [cotacao({ commodity: 'Boi Gordo', precoDefinidoSafra: 365 })],
      safra: '2026/2027'
    });
    expect(porCultura[0].cotacao).toBe(365);
  });

  it('quantidadeAFixar nunca fica negativa quando fixado excede a produção', () => {
    const { porCultura } = calcularPosicaoComercializacao({
      quadroSafra: [quadroSafra({ hectares: 10, rendimento: 60 })], // produção = 600
      contratos: [contrato({ quantidadeSc: 999_999 })],
      cotacoes: [],
      safra: '2026/2027'
    });
    expect(porCultura[0].quantidadeAFixar).toBe(0);
  });
});

describe('calcularPosicaoComercializacao — Por Comprador', () => {
  it('agrupa por comprador e calcula % de concentração sobre o total fixado', () => {
    const { porComprador } = calcularPosicaoComercializacao({
      quadroSafra: [quadroSafra({})],
      contratos: [
        contrato({ compradorNome: 'Bunge', quantidadeSc: 30000 }),
        contrato({ compradorNome: 'Cargill', quantidadeSc: 10000 })
      ],
      cotacoes: [],
      safra: '2026/2027'
    });
    expect(porComprador).toHaveLength(2);
    expect(porComprador[0].comprador).toBe('Bunge'); // ordenado por volume desc
    expect(porComprador[0].percentualConcentracao).toBe(75);
    expect(porComprador[1].percentualConcentracao).toBe(25);
  });

  it('um único comprador soma 100% de concentração', () => {
    const { porComprador } = calcularPosicaoComercializacao({
      quadroSafra: [quadroSafra({})],
      contratos: [contrato({ compradorNome: 'Bunge', quantidadeSc: 10000 })],
      cotacoes: [],
      safra: '2026/2027'
    });
    expect(porComprador[0].percentualConcentracao).toBe(100);
  });

  it('sem contratos fixados, retorna lista vazia sem dividir por zero', () => {
    const { porComprador } = calcularPosicaoComercializacao({
      quadroSafra: [quadroSafra({})],
      contratos: [],
      cotacoes: [],
      safra: '2026/2027'
    });
    expect(porComprador).toEqual([]);
  });

  it('agrupa contratos sem comprador definido sob um rótulo comum', () => {
    const { porComprador } = calcularPosicaoComercializacao({
      quadroSafra: [quadroSafra({})],
      contratos: [contrato({ compradorNome: undefined, quantidadeSc: 5000 })],
      cotacoes: [],
      safra: '2026/2027'
    });
    expect(porComprador[0].comprador).toBe('Sem comprador definido');
  });
});
