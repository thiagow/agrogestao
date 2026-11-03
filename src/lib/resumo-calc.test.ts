import { describe, expect, it } from 'vitest';
import { perfilDividaCpLp, rankingParticipacao } from './resumo-calc';

describe('rankingParticipacao', () => {
  it('agrupa por nome, ordena e calcula % sobre o total geral', () => {
    const r = rankingParticipacao([
      { nome: 'Itaú', valor: 10 },
      { nome: 'Banco do Brasil', valor: 60 },
      { nome: 'Itaú', valor: 10 },
      { nome: 'ABC', valor: 20 }
    ]);
    expect(r.total).toBe(100);
    expect(r.linhas.map((l) => l.nome)).toEqual(['Banco do Brasil', 'Itaú', 'ABC']);
    expect(r.linhas[0].percentual).toBe(60);
    expect(r.linhas[1].valor).toBe(20);
  });

  it('ignora valores zerados/negativos e respeita o limite sem mudar o total', () => {
    const r = rankingParticipacao(
      [
        { nome: 'A', valor: 50 },
        { nome: 'B', valor: 30 },
        { nome: 'C', valor: 20 },
        { nome: 'D', valor: 0 },
        { nome: 'E', valor: -5 }
      ],
      2
    );
    expect(r.linhas).toHaveLength(2);
    expect(r.total).toBe(100);
    expect(r.linhas[1].percentual).toBe(30);
  });

  it('lista vazia não divide por zero', () => {
    expect(rankingParticipacao([])).toEqual({ linhas: [], total: 0 });
  });
});

describe('perfilDividaCpLp', () => {
  it('calcula percentuais que fecham 100%', () => {
    const p = perfilDividaCpLp(25, 75);
    expect(p.cpPercentual).toBe(25);
    expect(p.lpPercentual).toBe(75);
    expect(p.total).toBe(100);
  });

  it('sem dívida devolve zeros', () => {
    const p = perfilDividaCpLp(0, 0);
    expect(p.cpPercentual).toBe(0);
    expect(p.lpPercentual).toBe(0);
  });
});
