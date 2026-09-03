// Regrava as ParcelaAquisicao de TODAS as Aquisições ativas no modo SACAS
// (todas as propriedades, todas as contas), usando o motor corrigido de
// aquisicao-engine.ts.
//
// Necessário depois da mudança de 23/08/2026 (review do cliente): antes dela,
// "Sacas/ha × área" era repetido INTEGRALMENTE em cada safra do parcelamento
// (réplica fiel do AgroFlow original); agora é o TOTAL do negócio, dividido
// pelo número de safras cobertas. Aquisições em modo SACAS já cadastradas
// ficam com o valor antigo até serem reprocessadas — este script faz isso uma
// vez, sem exigir que o usuário reabra e resalve cada uma.
//
// Roda fora do boundary de servidor (sem requireContext()) de propósito: é
// script de manutenção de todas as contas, não uma ação de um usuário logado
// numa propriedade. Rodar com `npx tsx scripts/regerar-parcelas-aquisicao.ts`.

import { db } from '../src/lib/db';
import { gerarParcelasAquisicao } from '../src/lib/aquisicao-engine';

async function main() {
  const aquisicoes = await db.aquisicao.findMany({
    where: { ativo: true, tipoPagamento: 'SACAS' },
    select: {
      id: true,
      nomeFazenda: true,
      areaTotalHa: true,
      dataInicioPagamento: true,
      dataVencimento: true,
      sacasHa: true,
      precoReferencia: true,
      valorEntrada: true,
      safraEntrada: true
    }
  });

  console.log(`${aquisicoes.length} aquisição(ões) ativa(s) em modo SACAS encontrada(s).\n`);

  let ok = 0;
  let falhas = 0;

  for (const a of aquisicoes) {
    try {
      const parcelasGeradas = gerarParcelasAquisicao({
        tipoPagamento: 'SACAS',
        areaTotalHa: Number(a.areaTotalHa),
        dataInicioPagamento: a.dataInicioPagamento.toISOString().slice(0, 10),
        dataVencimento: a.dataVencimento.toISOString().slice(0, 10),
        sacasHa: a.sacasHa != null ? Number(a.sacasHa) : null,
        precoReferencia: a.precoReferencia != null ? Number(a.precoReferencia) : null,
        valorEntrada: a.valorEntrada != null ? Number(a.valorEntrada) : null,
        safraEntrada: a.safraEntrada
      });

      const valorTotalFluxo = parcelasGeradas.reduce((sum, p) => sum + p.valorTotal, 0);
      const totalSacas = parcelasGeradas.reduce((sum, p) => sum + p.sacas, 0);

      await db.$transaction(async (tx) => {
        await tx.parcelaAquisicao.deleteMany({ where: { aquisicaoId: a.id } });
        if (parcelasGeradas.length > 0) {
          await tx.parcelaAquisicao.createMany({
            data: parcelasGeradas.map((p) => ({
              aquisicaoId: a.id,
              safra: p.safra,
              tipo: p.tipo,
              sacas: p.sacas,
              precoSc: p.precoSc,
              usaPrecoReferencia: p.usaPrecoReferencia,
              valorTotal: p.valorTotal,
              dataPagamento: new Date(p.dataPagamento),
              ordem: p.ordem
            }))
          });
        }
        await tx.aquisicao.update({
          where: { id: a.id },
          data: { valorTotalFluxo, totalSacas }
        });
      });

      console.log(`✔ ${a.nomeFazenda} — ${a.id} (total: ${totalSacas.toLocaleString('pt-BR')} sc / R$ ${valorTotalFluxo.toLocaleString('pt-BR')})`);
      ok++;
    } catch (err) {
      console.error(`✘ ${a.nomeFazenda} — ${a.id}:`, err);
      falhas++;
    }
  }

  console.log(`\n${ok} regravada(s), ${falhas} falha(s).`);
  await db.$disconnect();
  if (falhas > 0) process.exit(1);
}

main().catch(async (err) => {
  console.error(err);
  await db.$disconnect();
  process.exit(1);
});
