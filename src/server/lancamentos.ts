'use server';

import { db } from '@/lib/db';
import { requireContext } from '@/lib/session';
import type { LancamentoMensal } from '@/types';

/**
 * Fluxo de Caixa Mensal é uma *projeção*, não um registro de lançamentos reais
 * (não há módulo de tesouraria ainda) — por isso não vira tabela própria.
 * Computa a mesma curva sazonal que o mock usava (src/data/initialData.ts),
 * mas agora a partir do QuadroSafra real da propriedade, na safra mais
 * recente cadastrada, em vez de dados fixos de 8 culturas hardcoded.
 */
export async function listLancamentosMensais(): Promise<LancamentoMensal[]> {
  const ctx = await requireContext();
  if (!ctx.propriedade) return [];

  const registros = await db.quadroSafra.findMany({
    where: { propriedadeId: ctx.propriedade.id, ativo: true }
  });
  if (registros.length === 0) return [];

  const anoSafraAtual = registros.reduce((max, r) => (r.anoSafra > max ? r.anoSafra : max), registros[0].anoSafra);
  const registrosAtuais = registros.filter((r) => r.anoSafra === anoSafraAtual);

  const lancamentos: LancamentoMensal[] = [];
  let seq = 1;

  for (const r of registrosAtuais) {
    const hectares = r.hectares;
    const rendimento = Number(r.rendimento);
    const precoMedio = Number(r.precoMedio);
    const despesaPorHa = Number(r.custoProducao);

    for (let mes = 1; mes <= 12; mes++) {
      const fatorSazonal = 1 + Math.sin((mes / 12) * Math.PI * 2) * 0.6;
      // Concentra ~32% da receita bruta projetada nos 4 meses de colheita — mesma
      // proporção usada no mock original, agora aplicada a números reais.
      const entrada = mes >= 4 && mes <= 7 ? Math.round(hectares * precoMedio * rendimento * 0.08) : 0;
      const saida = Math.round(hectares * despesaPorHa * 0.09 * Math.max(fatorSazonal, 0.3));

      if (entrada > 0) {
        lancamentos.push({
          id: `lanc-${seq++}`,
          cultura: r.cultura,
          mes,
          tipo: 'ENTRADA',
          categoria: 'Receita de Colheita (projeção)',
          valor: entrada
        });
      }

      lancamentos.push({
        id: `lanc-${seq++}`,
        cultura: r.cultura,
        mes,
        tipo: 'SAIDA',
        categoria: 'Custeio Operacional (projeção)',
        valor: saida
      });
    }
  }

  return lancamentos;
}
