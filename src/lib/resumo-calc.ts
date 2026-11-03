// Derivações de apresentação do Resumo (ranking por credor e perfil CP/LP).
// Só reagrupam números que já existem (saldos de Bancos/Fornecedores); não
// introduzem regra de negócio. Funções puras, sem I/O.

export interface ItemParticipacao {
  nome: string;
  valor: number;
}

export interface LinhaParticipacao extends ItemParticipacao {
  /** 0–100, sobre o total de TODOS os itens com valor > 0 (não só os exibidos). */
  percentual: number;
}

export interface RankingParticipacao {
  linhas: LinhaParticipacao[];
  /** Soma de todos os itens com valor > 0, inclusive os que ficaram fora do "top N". */
  total: number;
}

/**
 * Agrupa por nome (mesmo credor em vários contratos vira uma linha), ordena do
 * maior para o menor e devolve os `limite` primeiros. O percentual é sempre
 * sobre o total geral, então os exibidos podem somar menos de 100%.
 */
export function rankingParticipacao(itens: ItemParticipacao[], limite = 5): RankingParticipacao {
  const porNome = new Map<string, number>();
  for (const { nome, valor } of itens) {
    if (!(valor > 0)) continue;
    const chave = nome.trim() || '—';
    porNome.set(chave, (porNome.get(chave) ?? 0) + valor);
  }
  const total = Array.from(porNome.values()).reduce((s, v) => s + v, 0);
  const linhas = Array.from(porNome.entries())
    .map(([nome, valor]) => ({ nome, valor, percentual: total > 0 ? (valor / total) * 100 : 0 }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, limite);
  return { linhas, total };
}

export interface PerfilDivida {
  total: number;
  cp: number;
  lp: number;
  cpPercentual: number;
  lpPercentual: number;
}

export function perfilDividaCpLp(cp: number, lp: number): PerfilDivida {
  const total = cp + lp;
  return {
    total,
    cp,
    lp,
    cpPercentual: total > 0 ? (cp / total) * 100 : 0,
    lpPercentual: total > 0 ? (lp / total) * 100 : 0
  };
}
