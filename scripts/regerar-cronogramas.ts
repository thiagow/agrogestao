// Regrava o cronograma de TODOS os contratos bancários ativos (todas as
// propriedades, todas as contas), usando o motor e os índices vigentes atuais.
//
// Necessário depois da mudança de 13/08/2026 no BULLET (amortizacao.ts): antes
// dela, um contrato BULLET tinha uma única parcela no vencimento; agora tem uma
// linha por período, com o saldo capitalizando. Contratos BULLET salvos antes
// dessa mudança continuam com o formato antigo até serem regravados — este
// script faz isso uma vez, sem exigir que o usuário reabra e resalve cada um.
//
// Roda fora do boundary de servidor (sem requireContext()) de propósito: é
// script de manutenção de todas as contas, não uma ação de um usuário logado
// numa propriedade. Rodar com `npx tsx scripts/regerar-cronogramas.ts`.

import { db } from '../src/lib/db';
import { carregarIndicesVigentes, regerarCronograma, SELECT_CRONOGRAMA } from '../src/server/cronograma-engine';

async function main() {
  const indices = await carregarIndicesVigentes();
  console.log('Índices vigentes:', indices);

  const contratos = await db.contratoBancario.findMany({
    where: { ativo: true },
    select: { ...SELECT_CRONOGRAMA, banco: true }
  });

  console.log(`${contratos.length} contrato(s) ativo(s) encontrado(s).\n`);

  let ok = 0;
  let falhas = 0;

  for (const c of contratos) {
    try {
      await regerarCronograma(c, indices);
      console.log(`✔ ${c.banco} (${c.sistemaAmortizacao}) — ${c.id}`);
      ok++;
    } catch (err) {
      console.error(`✘ ${c.banco} (${c.sistemaAmortizacao}) — ${c.id}:`, err);
      falhas++;
    }
  }

  console.log(`\n${ok} regravado(s), ${falhas} falha(s).`);
  await db.$disconnect();
  if (falhas > 0) process.exit(1);
}

main().catch(async (err) => {
  console.error(err);
  await db.$disconnect();
  process.exit(1);
});
