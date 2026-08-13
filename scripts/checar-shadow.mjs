// Confere que o shadow database existe, responde e está VAZIO antes de deixar o
// Prisma usá-lo — ele cria e derruba tabelas ali à vontade. Apontar para um
// banco com dado seria destrutivo.
import { PrismaClient } from '@prisma/client';

const url = process.env.SHADOW_DATABASE_URL;
if (!url) {
  console.error('SHADOW_DATABASE_URL não definida.');
  process.exit(1);
}

const db = new PrismaClient({ datasources: { db: { url } } });

const rows = await db.$queryRawUnsafe(
  `SELECT current_database() AS banco, count(*)::int AS tabelas
   FROM information_schema.tables
   WHERE table_schema = 'public'
   GROUP BY 1`
);

const banco = rows[0]?.banco ?? '(sem tabelas)';
const tabelas = rows[0]?.tabelas ?? 0;

console.log(`banco  : ${banco}`);
console.log(`tabelas: ${tabelas}`);
console.log(tabelas === 0 ? 'OK: shadow vazio, seguro de usar.' : 'PARE: shadow NÃO está vazio.');

await db.$disconnect();
process.exit(tabelas === 0 ? 0 : 1);
