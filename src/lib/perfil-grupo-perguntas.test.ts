import { describe, it, expect } from 'vitest';
import { SECOES_PERGUNTAS_GRUPO, CHAVES_RESPOSTAS_GRUPO } from './perfil-grupo-perguntas';

describe('perfil-grupo-perguntas', () => {
  it('chaves das perguntas de texto são únicas (chave repetida sobrescreveria resposta)', () => {
    expect(new Set(CHAVES_RESPOSTAS_GRUPO).size).toBe(CHAVES_RESPOSTAS_GRUPO.length);
  });

  it('contém as 5+8+8+4+1+4 perguntas do documento do cliente (taxa de desfrute é coluna própria)', () => {
    const por = Object.fromEntries(SECOES_PERGUNTAS_GRUPO.map((s) => [s.id, s.perguntas.length]));
    expect(por).toEqual({ historico: 4, gestao: 5, agricultura: 8, pecuaria: 8, financeiro: 4, coligadas: 1 });
    expect(CHAVES_RESPOSTAS_GRUPO).toHaveLength(4 + 5 + 8 + 7 + 4 + 1);
  });
});
