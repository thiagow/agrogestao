/**
 * Script de migração: corrige o catálogo de culturas padrão em produção
 *
 * Após a mudança da lista oficial de culturas padrão (Soja, Milho, Algodão Safrinha,
 * Algodão Safra, Bovino, Outras Culturas), este script:
 * 1. Soft-deleta globais que deixam de ser padrão (Seringueira, Cana de Açúcar, etc)
 * 2. Cria novos globais que faltam (Algodão Safrinha, Algodão Safra)
 * 3. Backfill de unidadeMedida nos globais mantidos
 *
 * Rodado uma vez por ambiente: npx tsx scripts/migrar-culturas-padrao.ts
 */

import { db } from '../src/lib/db';

const CULTURAS_PADRAO_NOVA = [
  { nome: 'Soja', unidadeMedida: 'sc' },
  { nome: 'Milho', unidadeMedida: 'sc' },
  { nome: 'Algodão Safrinha', unidadeMedida: '@' },
  { nome: 'Algodão Safra', unidadeMedida: '@' },
  { nome: 'Bovino', unidadeMedida: '@' },
  { nome: 'Outras Culturas', unidadeMedida: 'sc' }
];

const CULTURAS_ANTIGAS_REMOVER = ['Seringueira', 'Cana de Açúcar', 'Café Irrigado', 'Eucalipto', 'Arroz'];

async function main() {
  console.log('🌾 Migrando catálogo de culturas padrão...\n');

  // 1. Soft-delete das culturas antigas que não são mais padrão
  for (const nome of CULTURAS_ANTIGAS_REMOVER) {
    const cultura = await db.cultura.findFirst({
      where: { contaId: null, nome, ativo: true }
    });

    if (cultura) {
      await db.cultura.update({
        where: { id: cultura.id },
        data: { ativo: false }
      });
      console.log(`✓ Soft-deleted (ativo=false): ${nome}`);
    }
  }

  console.log('');

  // 2. Create/update das culturas padrão oficiais
  for (const cultura of CULTURAS_PADRAO_NOVA) {
    const existente = await db.cultura.findFirst({
      where: { contaId: null, nome: cultura.nome }
    });

    if (!existente) {
      await db.cultura.create({
        data: {
          nome: cultura.nome,
          unidadeMedida: cultura.unidadeMedida,
          contaId: null,
          ativo: true
        }
      });
      console.log(`✓ Criada (nova): ${cultura.nome} (${cultura.unidadeMedida})`);
    } else if (!existente.ativo) {
      // Se foi soft-deletada antes, reativa
      await db.cultura.update({
        where: { id: existente.id },
        data: { ativo: true, unidadeMedida: cultura.unidadeMedida }
      });
      console.log(`✓ Reativada: ${cultura.nome} (${cultura.unidadeMedida})`);
    } else {
      // Já existe e está ativa, só atualiza unidade se necessário
      if (existente.unidadeMedida !== cultura.unidadeMedida) {
        await db.cultura.update({
          where: { id: existente.id },
          data: { unidadeMedida: cultura.unidadeMedida }
        });
        console.log(`✓ Atualizada unidade: ${cultura.nome} → ${cultura.unidadeMedida}`);
      } else {
        console.log(`✓ Já existe: ${cultura.nome} (${cultura.unidadeMedida})`);
      }
    }
  }

  console.log('\n✅ Migração concluída!');
}

main()
  .catch((err) => {
    console.error('❌ Erro:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
