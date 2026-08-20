// Seed idempotente — ver docs/PLANO_BACKEND_FASE1.md.
// `npm run db:seed`         → superadmin + catálogo global de culturas + índices de mercado
// `npm run db:seed -- --demo` → também cria a conta "Grupo Pereira" com os mocks de initialData.ts

import { auth } from '../src/lib/auth';
import { db } from '../src/lib/db';
import { initialSuppliers } from '../src/data/initialData';
import { CATEGORY_TO_DB, ESTADO_CIVIL_TO_DB } from '../src/lib/enum-maps';
import type { EstadoCivil } from '../src/types';

// Sócios da conta demo — não é mais mock de UI (Sócios e Empresas persiste de
// verdade desde a Fase 1), então mora só aqui, seed-only. tipoPessoa: 'PF'
// porque a conta demo não ilustra o cenário de PJ/cap table ainda.
const SOCIOS_DEMO: {
  nome: string;
  cpf: string;
  participacao: number;
  estadoCivil?: EstadoCivil;
  telefone?: string;
  email?: string;
  nacionalidade?: string;
  dataNascimento?: string;
}[] = [
  {
    nome: 'Roberto Pereira',
    cpf: '123.456.789-01',
    participacao: 40,
    estadoCivil: 'Casado',
    telefone: '(62) 99123-4567',
    email: 'roberto.pereira@grupopereira.com.br',
    nacionalidade: 'Brasileira',
    dataNascimento: '1968-04-12'
  },
  {
    nome: 'Roger Machado Pereira',
    cpf: '234.567.890-12',
    participacao: 35,
    estadoCivil: 'Casado',
    telefone: '(62) 99234-5678',
    email: 'roger.pereira@grupopereira.com.br',
    nacionalidade: 'Brasileira',
    dataNascimento: '1972-09-03'
  },
  {
    nome: 'Augusto Pereira',
    cpf: '345.678.901-23',
    participacao: 25,
    estadoCivil: 'Solteiro',
    telefone: '(62) 99345-6789',
    email: 'augusto.pereira@grupopereira.com.br',
    nacionalidade: 'Brasileira',
    dataNascimento: '1995-11-27'
  }
];

const CULTURAS_PADRAO = [
  { nome: 'Soja', unidadeMedida: 'sc' },
  { nome: 'Milho', unidadeMedida: 'sc' },
  { nome: 'Algodão Safrinha', unidadeMedida: '@' },
  { nome: 'Algodão Safra', unidadeMedida: '@' },
  { nome: 'Bovino', unidadeMedida: '@' },
  { nome: 'Outras Culturas', unidadeMedida: 'sc' }
];

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
  // (@@unique([contaId, nome]) com contaId nullable) — busca manual + create/update.
  for (const cultura of CULTURAS_PADRAO) {
    const existente = await db.cultura.findFirst({ where: { contaId: null, nome: cultura.nome } });
    if (!existente) {
      await db.cultura.create({ data: { nome: cultura.nome, unidadeMedida: cultura.unidadeMedida, contaId: null } });
    } else if (existente.unidadeMedida !== cultura.unidadeMedida) {
      // Backfill de unidade caso a cultura já exista mas sem a unidade correta
      await db.cultura.update({ where: { id: existente.id }, data: { unidadeMedida: cultura.unidadeMedida } });
    }
  }
  console.log(`✔ Catálogo global de culturas (${CULTURAS_PADRAO.length})`);
}

// Índices de mercado (CDI/IPCA/dólar) — ambiente novo não pode nascer sem eles,
// senão todo contrato indexado é projetado só com o spread. Fail-soft: se as
// fontes estiverem fora do ar, o seed segue e o usuário atualiza pela UI.
async function seedIndices() {
  const { fetchSerieBcb, fetchDolarBRL, SERIE_BCB } = await import('../src/lib/market-data');

  const fontes = [
    { tipo: 'CDI' as const, unidade: '% a.a.', fonte: `BCB SGS ${SERIE_BCB.CDI}`, buscar: () => fetchSerieBcb(SERIE_BCB.CDI) },
    { tipo: 'IPCA' as const, unidade: '% a.a.', fonte: `BCB SGS ${SERIE_BCB.IPCA}`, buscar: () => fetchSerieBcb(SERIE_BCB.IPCA) },
    {
      tipo: 'USD' as const,
      unidade: 'BRL/USD',
      fonte: 'AwesomeAPI USD-BRL',
      buscar: async () => {
        const d = await fetchDolarBRL();
        return d ? { valor: d.precoBrl, dataReferencia: new Date().toISOString().slice(0, 10) } : null;
      }
    }
  ];

  for (const f of fontes) {
    const r = await f.buscar();
    if (!r) {
      console.log(`⚠️  ${f.tipo} indisponível na fonte — atualize pela aba Cronograma de Bancos.`);
      continue;
    }
    const dataReferencia = new Date(r.dataReferencia);
    const dados = { valor: r.valor, unidade: f.unidade, fonte: f.fonte, dataReferencia };
    await db.indiceMercado.upsert({
      where: { tipo_origem_dataReferencia: { tipo: f.tipo, origem: 'REALIZADO', dataReferencia } },
      update: { ...dados, atualizadoEm: new Date() },
      create: { tipo: f.tipo, origem: 'REALIZADO', ...dados }
    });
    console.log(`✔ ${f.tipo}: ${r.valor} (${r.dataReferencia})`);
  }
}

async function seedDemo() {
  const nomeConta = 'Grupo Pereira';
  const existente = await db.conta.findFirst({ where: { nome: nomeConta } });
  if (existente) {
    console.log(`✔ Conta demo já existe: ${nomeConta}`);
    return;
  }

  const email = process.env.DEMO_ACCOUNT_EMAIL || 'demo@grupopereira.com.br';
  const senha = process.env.DEMO_ACCOUNT_PASSWORD || 'Demo12345678!';
  const created = await auth.api.createUser({
    body: {
      email,
      password: senha,
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
    data: SOCIOS_DEMO.map((s) => ({
      contaId: conta.id,
      tipoPessoa: 'PF' as const,
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
        comprovanteUrl: s.comprovanteUrl,
        compras: s.compras
          ? { create: s.compras.map((c) => ({ data: new Date(c.data), valor: c.valor, descricao: c.descricao, culturaReferencia: c.culturaReferencia })) }
          : undefined
      }
    });
  }

  console.log(`✔ Conta demo criada: ${nomeConta} (login: ${email} / senha: ${senha})`);
}

async function main() {
  await seedSuperadmin();
  await seedCulturasGlobais();
  await seedIndices();

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
