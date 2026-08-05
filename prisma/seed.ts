// Seed idempotente — ver docs/PLANO_BACKEND_FASE1.md.
// `npm run db:seed`         → superadmin + catálogo global de culturas
// `npm run db:seed -- --demo` → também cria a conta "Grupo Pereira" com os mocks de initialData.ts

import { auth } from '../src/lib/auth';
import { db } from '../src/lib/db';
import { initialSuppliers, initialSocios } from '../src/data/initialData';
import { CATEGORY_TO_DB, ESTADO_CIVIL_TO_DB } from '../src/lib/enum-maps';

const CULTURA_BASES = ['Soja', 'Milho', 'Seringueira', 'Cana de Açúcar', 'Café Irrigado', 'Eucalipto', 'Arroz', 'Bovino'];

async function seedSuperadmin() {
  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;

  if (!email || !password) {
    console.log('⚠️  SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD não definidos — pulando criação do superadmin.');
    return;
  }

  const existente = await db.user.findUnique({ where: { email } });
  if (existente) {
    console.log(`✔ Superadmin já existe: ${email}`);
    return;
  }

  await auth.api.createUser({
    body: {
      email,
      password,
      name: 'Admin Master',
      role: 'superadmin',
      data: { mustChangePassword: false, emailVerified: true }
    }
  });

  console.log(`✔ Superadmin criado: ${email}`);
}

async function seedCulturasGlobais() {
  // Prisma não aceita `null` no lado de um índice único composto em upsert
  // (@@unique([contaId, nome]) com contaId nullable) — busca manual + create.
  for (const nome of CULTURA_BASES) {
    const existente = await db.cultura.findFirst({ where: { contaId: null, nome } });
    if (!existente) {
      await db.cultura.create({ data: { nome, contaId: null } });
    }
  }
  console.log(`✔ Catálogo global de culturas (${CULTURA_BASES.length})`);
}

async function seedDemo() {
  const nomeConta = 'Grupo Pereira';
  const existente = await db.conta.findFirst({ where: { nome: nomeConta } });
  if (existente) {
    console.log(`✔ Conta demo já existe: ${nomeConta}`);
    return;
  }

  const email = 'demo@grupopereira.com.br';
  const created = await auth.api.createUser({
    body: {
      email,
      password: 'Demo12345678!',
      name: 'Roberto Pereira',
      data: { mustChangePassword: true }
    }
  });

  const conta = await db.conta.create({
    data: {
      nome: nomeConta,
      razaoSocial: 'Grupo Pereira Agropecuária Ltda',
      memberships: { create: { userId: created.user.id, role: 'OWNER' } }
    }
  });

  const propriedade = await db.propriedade.create({
    data: { contaId: conta.id, nome: 'Fazenda Pedra', cidade: 'Ofitoma', estado: 'GO', areaTotalHectares: 5000 }
  });

  await db.socio.createMany({
    data: initialSocios.map((s) => ({
      contaId: conta.id,
      nome: s.nome,
      cpf: s.cpf,
      participacao: s.participacao,
      estadoCivil: s.estadoCivil ? ESTADO_CIVIL_TO_DB[s.estadoCivil] : null,
      telefone: s.telefone,
      email: s.email,
      nacionalidade: s.nacionalidade,
      dataNascimento: s.dataNascimento ? new Date(s.dataNascimento) : null
    }))
  });

  for (const s of initialSuppliers) {
    await db.supplier.create({
      data: {
        propriedadeId: propriedade.id,
        nome: s.nome,
        categoria: CATEGORY_TO_DB[s.categoria],
        cultura: s.cultura,
        safra: s.safra,
        dividaTotal: s.dividaTotal,
        moeda: s.moeda,
        vencimento: new Date(s.vencimento),
        observacoes: s.observacoes,
        status: s.status,
        imageUrl: s.imageUrl,
        comprovanteUrl: s.comprovanteUrl,
        cnpjCpf: s.cnpjCpf,
        contatoNome: s.contatoNome,
        contatoTelefone: s.contatoTelefone,
        contatoEmail: s.contatoEmail,
        compras: s.compras
          ? { create: s.compras.map((c) => ({ data: new Date(c.data), valor: c.valor, descricao: c.descricao, culturaReferencia: c.culturaReferencia })) }
          : undefined
      }
    });
  }

  console.log(`✔ Conta demo criada: ${nomeConta} (login: ${email} / senha: Demo12345678!)`);
}

async function main() {
  await seedSuperadmin();
  await seedCulturasGlobais();

  if (process.argv.includes('--demo')) {
    await seedDemo();
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
