// Zera o schema public do SHADOW database.
//
// DESTRUTIVO por natureza — por isso a trava: recusa rodar se o banco conectado
// não se chamar exatamente `db_agrogestao_shadow`. A verificação é feita com
// `current_database()`, no próprio servidor, não confiando na string de conexão.
import { PrismaClient } from '@prisma/client';

const NOME_ESPERADO = 'db_agrogestao_shadow';

const url = process.env.SHADOW_DATABASE_URL;
if (!url) {
  console.error('SHADOW_DATABASE_URL não definida.');
  process.exit(1);
}

const db = new PrismaClient({ datasources: { db: { url } } });

const [{ banco }] = await db.$queryRawUnsafe('SELECT current_database() AS banco');
if (banco !== NOME_ESPERADO) {
  console.error(`ABORTADO: conectado em "${banco}", esperado "${NOME_ESPERADO}". Nada foi alterado.`);
  await db.$disconnect();
  process.exit(1);
}

await db.$executeRawUnsafe('DROP SCHEMA public CASCADE');
await db.$executeRawUnsafe('CREATE SCHEMA public');
console.log(`OK: schema public de "${banco}" recriado vazio.`);

await db.$disconnect();
