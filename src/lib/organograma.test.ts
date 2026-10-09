import { describe, it, expect } from 'vitest';
import { montarOrganograma } from './organograma';
import type { Socio } from '@/types';

const HOJE = new Date('2026-08-20');

function pf(overrides: Partial<Socio> = {}): Socio {
  return { id: overrides.id ?? 'pf-1', tipoPessoa: 'PF', nome: 'Fulano', cpf: '12345678900', ...overrides };
}

function pj(overrides: Partial<Socio> = {}): Socio {
  return {
    id: overrides.id ?? 'pj-1',
    tipoPessoa: 'PJ',
    nome: 'Empresa X',
    cnpj: '12345678000199',
    tipoEmpresa: 'Empresa Operacional',
    ...overrides
  };
}

describe('montarOrganograma', () => {
  it('separa PF, Holdings e Empresas Operacionais em 3 faixas', () => {
    const org = montarOrganograma(
      [pf({ id: 'p1' }), pj({ id: 'h1', tipoEmpresa: 'Holding' }), pj({ id: 'o1' })],
      HOJE
    );
    expect(org.pessoasFisicas.map((n) => n.socioId)).toEqual(['p1']);
    expect(org.holdings.map((n) => n.socioId)).toEqual(['h1']);
    expect(org.operacionais.map((n) => n.socioId)).toEqual(['o1']);
  });

  it('cada integrante aparece uma única vez, mesmo sendo dono de uma PJ', () => {
    const org = montarOrganograma(
      [pf({ id: 'p1' }), pj({ id: 'e1', participacoes: [{ socioDonoId: 'p1', percentual: 100 }] })],
      HOJE
    );
    const todos = [...org.pessoasFisicas, ...org.holdings, ...org.operacionais];
    expect(todos.filter((n) => n.socioId === 'p1')).toHaveLength(1);
    expect(org.operacionais[0].vinculos).toEqual([
      { donoId: 'p1', donoNome: 'Fulano', faixaDono: 'PF', percentual: 100 }
    ]);
  });

  it('vínculos ordenados por % decrescente e aceitam PF e PJ como donos da mesma empresa', () => {
    const org = montarOrganograma(
      [
        pf({ id: 'p1', nome: 'Maria' }),
        pj({ id: 'h1', nome: 'Holding Y', tipoEmpresa: 'Holding' }),
        pj({
          id: 'e1',
          participacoes: [
            { socioDonoId: 'p1', percentual: 30 },
            { socioDonoId: 'h1', percentual: 70 }
          ]
        })
      ],
      HOJE
    );
    expect(org.operacionais[0].vinculos.map((v) => [v.donoId, v.faixaDono])).toEqual([
      ['h1', 'HOLDING'],
      ['p1', 'PF']
    ]);
  });

  it('PJ sem tipoEmpresa (cadastro legado) cai em Empresas Operacionais', () => {
    const org = montarOrganograma([pj({ id: 'e1', tipoEmpresa: undefined })], HOJE);
    expect(org.operacionais).toHaveLength(1);
  });

  it('calcula idade a partir de dataNascimento (PF) e ano de fundação (PJ)', () => {
    const org = montarOrganograma(
      [
        pf({ id: 'p1', dataNascimento: '1990-08-19' }), // já fez aniversário em 2026-08-20
        pf({ id: 'p2', dataNascimento: '1990-08-21' }), // ainda não fez
        pj({ id: 'e1', dataNascimento: '2010-01-01' })
      ],
      HOJE
    );
    expect(org.pessoasFisicas.find((n) => n.socioId === 'p1')!.idadeOuAnoFundacao).toBe('36 anos');
    expect(org.pessoasFisicas.find((n) => n.socioId === 'p2')!.idadeOuAnoFundacao).toBe('35 anos');
    expect(org.operacionais[0].idadeOuAnoFundacao).toBe('Fundada em 2010');
  });

  it('vínculo com dono inexistente ou com a própria empresa é ignorado, não quebra', () => {
    const org = montarOrganograma(
      [
        pj({
          id: 'e1',
          participacoes: [
            { socioDonoId: 'inexistente', percentual: 50 },
            { socioDonoId: 'e1', percentual: 50 }
          ]
        })
      ],
      HOJE
    );
    expect(org.operacionais[0].vinculos).toEqual([]);
  });
});
