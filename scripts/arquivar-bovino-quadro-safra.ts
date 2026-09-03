// Script de apoio (não é gate) — roda uma única vez após a migration
// 20260902214237_quadro_pecuaria_suinocultura_avicultura, que introduziu o
// módulo dedicado de Pecuária (QuadroPecuariaBovina) e tirou "Bovino" do
// catálogo de Cultura do Quadro de Safra.
//
// Arquiva (soft-delete, nunca hard-delete) os registros antigos de
// `QuadroSafra` com cultura="Bovino" e a entrada global "Bovino" em
// `Cultura` — decisão confirmada com o usuário: não há como reconstruir uma
// estrutura de rebanho (fêmeas/machos por faixa etária, comercialização)
// a partir de hectares/rendimento sem inventar dado financeiro, então os
// registros ficam preservados no banco (ativo=false) para histórico/
// auditoria, sem migração automática para o novo model.
//
// Uso: npx tsx scripts/arquivar-bovino-quadro-safra.ts

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const registros = await db.quadroSafra.findMany({ where: { cultura: 'Bovino', ativo: true } });
  console.log(`Registros de QuadroSafra com cultura="Bovino" ativos: ${registros.length}`);
  registros.forEach((r) => console.log(`  - ${r.id} | propriedadeId=${r.propriedadeId} | safra=${r.anoSafra}`));

  if (registros.length > 0) {
    const result = await db.quadroSafra.updateMany({
      where: { cultura: 'Bovino', ativo: true },
      data: { ativo: false }
    });
    console.log(`Arquivados (ativo=false): ${result.count}`);
  }

  const culturaGlobal = await db.cultura.findMany({ where: { nome: 'Bovino', contaId: null, ativo: true } });
  console.log(`Entradas globais de Cultura "Bovino" ativas: ${culturaGlobal.length}`);
  if (culturaGlobal.length > 0) {
    const result = await db.cultura.updateMany({
      where: { nome: 'Bovino', contaId: null, ativo: true },
      data: { ativo: false }
    });
    console.log(`Arquivadas (ativo=false): ${result.count}`);
  }

  console.log('Concluído.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
