import { describe, it, expect } from 'vitest';
import { montarOrganograma } from './organograma';
import type { Socio } from '@/types';

const HOJE = new Date('2026-08-20');

function pf(overrides: Partial<Socio> = {}): Socio {
  return {
    id: overrides.id ?? 'pf-1',
    tipoPessoa: 'PF',
    nome: 'Fulano',
    cpf: '12345678900',
    participacao: 50,
    ...overrides
  };
}

function pj(overrides: Partial<Socio> = {}): Socio {
  return {
    id: overrides.id ?? 'pj-1',
    tipoPessoa: 'PJ',
    nome: 'Empresa X',
    cnpj: '12345678000199',
    participacao: 0,
    ...overrides
  };
}

describe('montarOrganograma', () => {
  it('um PF solto vira nó raiz sem filhos', () => {
    const arvore = montarOrganograma([pf({ id: 'p1', participacao: 100 })], HOJE);
    expect(arvore).toHaveLength(1);
    expect(arvore[0].tipoPessoa).toBe('PF');
    expect(arvore[0].filhos).toEqual([]);
  });

  it('PJ com 2 donos PF vira raiz com 2 filhos, ordenados por % decrescente', () => {
    const socios: Socio[] = [
      pf({ id: 'p1', nome: 'Dono Maior', participacao: 10 }),
      pf({ id: 'p2', nome: 'Dono Menor', participacao: 5 }),
      pj({
        id: 'e1',
        nome: 'Empresa X',
        participacoes: [
          { socioPfId: 'p2', percentual: 40 },
          { socioPfId: 'p1', percentual: 60 }
        ]
      })
    ];

    const arvore = montarOrganograma(socios, HOJE);
    const empresa = arvore.find((n) => n.socioId === 'e1')!;
    expect(empresa.filhos.map((f) => f.socioId)).toEqual(['p1', 'p2']);
    expect(empresa.filhos[0].percentual).toBe(60);
  });

  it('PF que também é dono de uma PJ aparece como raiz E como filho da PJ', () => {
    const socios: Socio[] = [
      pf({ id: 'p1', nome: 'Dono', participacao: 30 }),
      pj({ id: 'e1', participacoes: [{ socioPfId: 'p1', percentual: 100 }] })
    ];

    const arvore = montarOrganograma(socios, HOJE);
    expect(arvore.some((n) => n.socioId === 'p1')).toBe(true);
    const empresa = arvore.find((n) => n.socioId === 'e1')!;
    expect(empresa.filhos[0].socioId).toBe('p1');
  });

  it('calcula idade a partir de dataNascimento (PF) e ano de fundação (PJ)', () => {
    const socios: Socio[] = [
      pf({ id: 'p1', dataNascimento: '1990-08-19' }), // já fez aniversário em 2026-08-20
      pf({ id: 'p2', dataNascimento: '1990-08-21' }), // ainda não fez
      pj({ id: 'e1', dataNascimento: '2010-01-01' })
    ];

    const arvore = montarOrganograma(socios, HOJE);
    expect(arvore.find((n) => n.socioId === 'p1')!.idadeOuAnoFundacao).toBe('36 anos');
    expect(arvore.find((n) => n.socioId === 'p2')!.idadeOuAnoFundacao).toBe('35 anos');
    expect(arvore.find((n) => n.socioId === 'e1')!.idadeOuAnoFundacao).toBe('Fundada em 2010');
  });

  it('participação referenciando socioPfId inexistente é ignorada, não quebra', () => {
    const socios: Socio[] = [pj({ id: 'e1', participacoes: [{ socioPfId: 'inexistente', percentual: 50 }] })];
    const arvore = montarOrganograma(socios, HOJE);
    expect(arvore[0].filhos).toEqual([]);
  });
});
