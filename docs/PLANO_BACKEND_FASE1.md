# Backend AgroGestão — Fase 1: Identidade, Tenancy, Painel Master e Cadastros Base

## Context

O AgroGestão tem os 14 módulos do menu implementados no frontend, mas **nenhuma linha de backend**: não existe `src/app/api`, `middleware.ts`, server action, nem `PrismaClient` importado em lugar algum. `prisma/schema.prisma` modela 1 de 17 entidades (`Supplier`). O login em [login/page.tsx:16](src/app/login/page.tsx#L16) é `router.push('/resumo')` — qualquer pessoa acessa qualquer URL. Todo o estado vive em `useState` no [TabView.tsx](src/components/TabView.tsx) e se perde a cada troca de aba.

A engenharia reversa do AgroFlow confirma `Propriedade` como raiz de tenancy (URL `/dashboard/1050001`, seletor de propriedade, link "Clientes"), soft-delete via `ativo` e auditoria `criado_por/modificado_por` em todos os registros — mas **não documenta usuário, papel, permissão ou conta**. Essa camada é trabalho novo.

Esta fase entrega a fundação sobre a qual as fases 2-6 apenas replicam padrão: identidade real, isolamento multi-tenant, o painel do Admin Master que cadastra as empresas/contas e distribui acesso, e os dois primeiros módulos de negócio persistidos (Cadastro Mestre + Fornecedores).

**Decisões tomadas com o CTO:**
- Tenancy: `Conta` (cliente) → N `Propriedade` → dados de negócio. Usuários pertencem à Conta.
- Auth: **Better Auth** (self-hosted, adapter Prisma, plugins `admin` + `organization`).
- Onboarding: senha provisória gerada pelo Admin Master, exibida uma única vez, troca obrigatória no 1º login. Sem dependência de e-mail transacional.
- Painel Master: route group `(admin)` próprio, fora de `(app)`. Escopo desta fase: **CRUD de contas e usuários apenas** (sem planos, impersonation ou audit log).
- Postgres: servidor próprio, conectado via `DATABASE_URL`.

**Ponto que exige aval explícito:** o `CLAUDE.md` do projeto registra a ausência de lib de validação como deliberada. Um backend sem validação na fronteira é inaceitável — este plano introduz **`zod` apenas no boundary de servidor** (server actions e rotas), sem tocar nos forms de client, que seguem com `useState` + `required`. Se não quiser, digo e removo; a alternativa é validação manual escrita à mão, mais código e mais superfície de erro.

---

## Arquitetura

### Modelo de tenancy

```
Conta (tenant)                  ← Admin Master cria
 ├─ Membership (User ↔ Conta, role)
 ├─ Propriedade[]               ← seletor no Header do app
 │   └─ Supplier, Socio, Safra, ContratoBancario, ... (todo o domínio)
 └─ Cultura[] (custom)          ← além das culturas globais seedadas
```

- **Isolamento**: *toda* query de negócio filtra por `propriedadeId`, e o `propriedadeId` vem **exclusivamente da sessão do servidor** — nunca de parâmetro de client. É a regra que impede vazamento entre contas.
- **Papéis de conta** (`Membership.role`): `OWNER` (dono, gerencia usuários), `ADMIN` (CRUD total dos dados), `MEMBER` (CRUD dos módulos), `VIEWER` (somente leitura).
- **Papel de plataforma**: `User.role = 'superadmin'` (campo do plugin `admin` do Better Auth). Superadmin **não** acessa dados de negócio de nenhuma conta nesta fase — só metadados (nome, CNPJ, usuários, status).

### Camadas

```
src/
  lib/
    db.ts               # PrismaClient singleton (evita esgotar pool no dev/HMR)
    auth.ts             # betterAuth() — server config
    auth-client.ts      # createAuthClient() — client
    session.ts          # requireUser / requireContext / requireSuperAdmin
    validation.ts       # schemas zod compartilhados
  server/
    contas.ts           # repositórios: recebem ctx tipado, nunca IDs crus do client
    usuarios.ts
    propriedades.ts
    socios.ts
    suppliers.ts
    culturas.ts
  app/
    api/auth/[...all]/route.ts
    (admin)/            # SUPERADMIN — layout e chrome próprios
    (app)/              # cliente — exige sessão + conta + propriedade ativa
    login/
middleware.ts           # guarda otimista por cookie de sessão
```

**Leitura** via Server Components (`async` pages chamando `src/server/*`). **Escrita** via Server Actions (`'use server'`) chamadas pelos Drawers existentes. Não criamos API REST — não há consumidor externo.

**Contexto de request** (`src/lib/session.ts`):
```ts
requireContext(): Promise<{ user, conta, membership, propriedade }>
```
Resolve sessão → conta ativa → propriedade ativa (cookie `ag_prop`, **validado contra as propriedades da conta a cada request**) → 404/redirect se qualquer elo falhar. Todo repositório em `src/server/*` recebe esse contexto como primeiro argumento.

---

## Schema Prisma

Substituir integralmente [prisma/schema.prisma](prisma/schema.prisma) (hoje só `Supplier`, sem migrations — não há nada a preservar).

**Identidade (gerados/exigidos pelo Better Auth):** `User`, `Session`, `Account`, `Verification`. Campos extras em `User`: `mustChangePassword Boolean @default(true)`, `role String?` (superadmin), `banned`, `ativo`.

**Tenancy (nossos):**
```prisma
model Conta {
  id            String   @id @default(cuid())
  nome          String
  razaoSocial   String?
  cnpj          String?  @unique
  status        ContaStatus @default(ATIVA)   // ATIVA | SUSPENSA
  ativo         Boolean  @default(true)
  memberships   Membership[]
  propriedades  Propriedade[]
  // auditoria
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdById String?
  @@map("contas")
}

model Membership {
  id       String @id @default(cuid())
  userId   String
  contaId  String
  role     MembershipRole @default(MEMBER)
  ativo    Boolean @default(true)
  @@unique([userId, contaId])
  @@index([contaId])
}

model Propriedade {
  id                String @id @default(cuid())
  contaId           String
  nome              String
  cidade            String?
  estado            String?  // UF, 2 chars
  areaTotalHectares Float?
  ativo             Boolean @default(true)
  @@index([contaId])
}
```

**Cadastros base (Fase 1):**
- `Cultura` — `contaId String?` nullable: `null` = catálogo global seedado (Soja, Milho, Algodão, Café, Cana, Eucalipto, Arroz, Bovino); preenchido = cultura própria da conta. `@@unique([contaId, nome])`.
- `Safra` — `contaId`, `anoSafra` ("2026/2027"), `dataInicio`, `dataFim`, `atual Boolean`. `@@unique([contaId, anoSafra])`. Normaliza a string livre que hoje se repete em 6+ interfaces de `src/types.ts`.
- `Socio` — **pendurado em `contaId`**, não em propriedade: participação societária é do grupo econômico, não da fazenda (divergindo conscientemente da engenharia reversa, que usa `propriedade_id`). Campos de `src/types.ts:64-74` + `EstadoCivil` enum + auditoria. `@@unique([contaId, cpf])`.
- `Supplier` — `propriedadeId`, todos os campos de `src/types.ts:24-42` (incluindo os que faltam no schema atual: `cnpjCpf`, `contatoNome/Telefone/Email`), `vencimento DateTime`, `dividaTotal Decimal(18,2)`.
- `CompraFornecedor` — `supplierId` (relação 1:N já prevista em `Supplier.compras`), `onDelete: Cascade`.

**Convenções aplicadas a todo model de negócio:**
- `Decimal(18,2)` para dinheiro e `Decimal(12,4)` para taxas/percentuais — **nunca `Float`**. O schema atual usa `Float` em `dividaTotal`; isso é bug de arredondamento em valores de R$ 130M. Serializar para `number` na borda (Server Component → Client Component).
- `ativo Boolean @default(true)` para soft-delete (regra da engenharia reversa).
- `createdAt/updatedAt/createdById/updatedById` em tudo.
- Índice composto `@@index([propriedadeId, ativo])` em cada tabela de negócio — o filtro de tenant é o predicado de toda query.
- Enums em ASCII com `@map` para o rótulo acentuado, seguindo o padrão já estabelecido no arquivo ([schema.prisma:17-25](prisma/schema.prisma#L17-L25)). Afeta `PRÉ`, `Viúvo`, `Atenção`, `Crítico`.

---

## Autenticação

`src/lib/auth.ts`:
```ts
betterAuth({
  database: prismaAdapter(db, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true, minPasswordLength: 12, autoSignIn: false },
  session: { expiresIn: 60*60*24*7, cookieCache: { enabled: true, maxAge: 5*60 } },
  rateLimit: { enabled: true, window: 60, max: 10 },     // anti brute-force no login
  user: { additionalFields: { mustChangePassword: { type: 'boolean', defaultValue: true } } },
  plugins: [admin({ adminRoles: ['superadmin'] })],
  advanced: { cookiePrefix: 'agrogestao', useSecureCookies: process.env.NODE_ENV === 'production' },
})
```

**Fluxo de acesso desenhado com o CTO:**
1. Admin Master cria a Conta + o usuário OWNER em `/admin/contas/nova`.
2. Server action gera senha provisória forte (`crypto.randomBytes` → 16 chars alfanuméricos), cria o usuário via `auth.api.createUser` com `mustChangePassword: true`.
3. A senha é retornada **uma única vez** no retorno da action e mostrada num painel copiável — nunca persistida em claro, nunca re-exibível. Reset gera uma nova.
4. Usuário faz login em `/login` (agora real). Se `mustChangePassword` → redirect forçado para `/trocar-senha`, que é a única rota acessível até a troca.
5. Após a troca, redirect para `/{defaultTab}`.

**Guardas em duas camadas** (padrão recomendado pelo Next 15 — middleware não é fronteira de segurança):
- [middleware.ts](middleware.ts) (novo, raiz): checagem otimista de cookie de sessão. Sem cookie em `(app)`/`(admin)` → redirect `/login`. Barato, roda no edge.
- `(app)/layout.tsx` e `(admin)/layout.tsx`: `requireContext()` / `requireSuperAdmin()` com hit real no banco. **Esta é a fronteira que vale.**

---

## Painel do Admin Master — `src/app/(admin)/`

Rotas, todas exigindo `role === 'superadmin'`:

| Rota | Conteúdo |
|---|---|
| `/admin` | KPIs (contas ativas/suspensas, usuários, propriedades) + últimas contas criadas |
| `/admin/contas` | Tabela de contas: nome, CNPJ, nº usuários, nº propriedades, status, criada em |
| `/admin/contas/nova` | Drawer: dados da conta + dados do usuário OWNER → cria os dois numa transação e devolve a senha provisória |
| `/admin/contas/[id]` | Detalhe: editar conta, suspender/reativar, listar usuários, criar usuário, resetar senha, desativar usuário |

Reaproveitar integralmente o design system de `src/components/ui/` (`Card`, `Table` local, `Badge`, `Drawer`, `Button`, `Input`, `Select`, `KpiCard`) e a estrutura da tela-molde Fornecedores exigida pelo `CLAUDE.md`: Header → KpiCards → Card com tabela → Drawer lateral. Chrome distinto — `AdminShell.tsx` com sidebar em tom neutro escuro (não o verde do produto), deixando visualmente inequívoco que é o painel interno. `nav.ts` **não** é tocado: o menu do admin é uma lista própria em `src/lib/admin-nav.ts`.

**Suspender uma conta** invalida as sessões dos seus usuários e bloqueia login — não é só um flag visual.

---

## Tenancy no app do cliente

- `(app)/layout.tsx` vira `async`, chama `requireContext()` e passa `conta`, `propriedade`, `propriedades[]` e `user` para o `AppShell` como props.
- **Seletor de Propriedade** novo no [Header.tsx](src/components/Header.tsx): dropdown que dispara uma server action gravando o cookie `ag_prop` + `revalidatePath('/', 'layout')`.
- [Sidebar.tsx](src/components/Sidebar.tsx): substituir o perfil fixo "thiago" pelo usuário real da sessão + menu com "Trocar senha" e "Sair".
- Conta sem propriedade → tela de primeiro acesso pedindo o cadastro da primeira propriedade (o OWNER cria).

---

## Migração dos módulos da Fase 1

Padrão a estabelecer aqui e replicar nas fases seguintes — [TabView.tsx](src/components/TabView.tsx) deixa de ser dono do estado desses módulos:

1. `(app)/[tab]/page.tsx` continua validando o tab, mas passa a **buscar os dados no servidor** para os módulos já migrados e injetá-los em `TabView` via props.
2. Cada `*View.tsx` recebe os dados por prop (já é assim hoje) e chama **server actions** em vez dos handlers in-memory.
3. Os pares `handleSaveX`/`handleDeleteX` de `TabView.tsx` são substituídos, um módulo por vez, por `saveSupplier(...)` / `deleteSupplier(...)` importados de `src/server/*`. Módulos ainda não migrados seguem com os mocks de `src/data/initialData.ts` — nada quebra.
4. `revalidatePath` após cada mutação.

**Migrar nesta fase:** Cadastro Mestre → aba Sócios (`SocioDrawer`, estado hoje local na view); Fornecedores completo (`SupplierDrawer`, `SupplierTable`, `MetricCards`, incluindo `CompraFornecedor`); e os cadastros base Cultura/Safra/Propriedade que sustentam os selects dos demais módulos.

**Preservar** os helpers puros de [initialData.ts](src/data/initialData.ts) — `formatCurrency`, `formatDateBR`, `isCurtoPrazo`, `calcularSafra`, `mesLabel`. São lógica de apresentação e devem sair de `data/` para `src/lib/format.ts` e `src/lib/agro.ts`, sem reescrita. `isCurtoPrazo` (CP se vencimento ≤ 360 dias) é regra de negócio da engenharia reversa e continua no servidor também.

---

## Seed — `prisma/seed.ts`

- Superadmin a partir de `SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD` (env, nunca commitados), idempotente.
- Catálogo global de culturas (as 8 de `CULTURA_BASES`).
- Flag `--demo`: cria a conta "Grupo Pereira" com uma propriedade e importa os mocks de `initialData.ts` (3 fornecedores, 3 sócios, 32 registros de cultura×safra) — indispensável para testar isolamento com duas contas.

---

## Arquivos principais

**Novos:** `middleware.ts`, `src/lib/{db,auth,auth-client,session,validation,admin-nav,format,agro}.ts`, `src/server/*.ts`, `src/app/api/auth/[...all]/route.ts`, `src/app/(admin)/**`, `src/app/trocar-senha/page.tsx`, `src/components/AdminShell.tsx`, `src/components/PropriedadeSelector.tsx`, `prisma/seed.ts`.

**Modificados:** `prisma/schema.prisma` (reescrito), `src/app/login/page.tsx` (auth real + tratamento de erro), `src/app/(app)/layout.tsx` e `[tab]/page.tsx` (async + contexto + fetch), `src/components/{AppShell,Sidebar,Header,TabView}.tsx`, `src/components/views/{CadastroMestreView,...}`, `src/types.ts` (tipos de identidade), `package.json`, `.env.example`, `README.md`, `CLAUDE.md`.

**Dependências novas:** `better-auth`, `zod`, `tsx` (dev, para o seed). Nada além disso.

---

## Verificação

1. `npm run db:migrate` aplica a migration inicial contra a `DATABASE_URL` do servidor Postgres, sem erro.
2. `npm run db:seed` cria superadmin + culturas; `npm run db:seed -- --demo` cria a conta de demonstração.
3. `npm run lint` (`tsc --noEmit`) e `npm run build` passam limpos.
4. **Fluxo manual ponta a ponta:**
   - `/resumo` sem sessão → redirect para `/login`. `/admin` idem.
   - Login como superadmin → `/admin`; cria a Conta A com usuário OWNER; copia a senha provisória.
   - Logout → login como o OWNER da Conta A → forçado a `/trocar-senha`; tentar navegar para `/resumo` antes da troca é bloqueado.
   - Após a troca: cria propriedade, cria fornecedor e sócio. **Refresh (F5) e troca de aba preservam os dados** — o teste que hoje falha.
   - Login como superadmin, cria a Conta B com outro OWNER. Logado como B, os fornecedores da A **não aparecem**; forçar o `id` de um registro da A na URL/action retorna 404, não os dados.
   - Suspender a Conta A no `/admin` → o OWNER de A perde a sessão e não consegue logar.
5. **Verificação direta no banco:** `SELECT` em `suppliers` confirma `propriedadeId` correto, `dividaTotal` como `numeric` (não `double precision`), e `createdById` preenchido.

---

## Progresso — Fases 2 a 5 (concluídas)

Executadas em sequência após a aprovação deste plano. Resumo do que cada uma entregou de fato (detalhe completo no `CLAUDE.md`, seção "Backend em construção por fases"):

- **Fase 2 — Safra e produção:** `QuadroSafra` (Quadro de Safra + Resumo) persistido com CRUD completo. Fluxo de Caixa Mensal deixou de ser mock fixo e passou a ser **projeção computada ao vivo** a partir do `QuadroSafra` real (`src/server/lancamentos.ts`) — não é uma tabela própria, é derivado. Calendário Agrícola ficou de fora deliberadamente: é referência agronômica estática, não dado de conta.
- **Fase 3 — Financeiro:** `ContratoBancario` + `Parcela`, com cronograma de amortização SAC/PRICE/BULLET auto-gerado a cada save (`src/lib/amortizacao.ts`, função pura, validada contra cálculo manual). Aba "Cronograma" de Bancos deixou de estar "em construção". "Por Credor" e "Fluxo Detalhado" seguem sem spec.
- **Fase 4 — Contratos:** `Aquisicao`, `ContratoArrendamento`, `ContratoComercial` persistidos. `ParcelaAquisicao` não foi criada — não há spec de detalhamento por parcela na UI/tipo atual, só um total resumo (`valorTotalFluxo`).
- **Fase 5 — Contábil e mercado:** `EmpresaPJ` (Balanço PJ, só leitura — sem Drawer de cadastro, decisão explícita do usuário) e `BalancoPatrimonial` (Análise Financeira, com Drawer de edição) persistidos. Indicadores financeiros são **sempre computados ao vivo** a partir do balanço (`src/lib/indicadores.ts`), nunca persistidos como número solto. Das 12 fórmulas do AgroFlow original, só 7 são sustentáveis pelas 6 contas agregadas do nosso `BalancoPatrimonial` (sem caixa, estoques, EBITDA, EBIT); as outras 5 aparecem na UI como "indisponível" com o motivo, nunca com valor inventado. `Cotacao` ganhou ingestão real sem chave de API: **AwesomeAPI** (câmbio USD/BRL) e **Yahoo Finance** (futuros CBOT/CME/ICE, mesmos tickers do mock) — `src/lib/market-data.ts`, acionado pelo botão "Atualizar" em `/cotacoes`. **Ressalva registrada:** `precoBrl` das commodities é conversão só de *moeda*, não de *unidade* — não existe tabela bushel/lb → saca de 60kg, então não é preço de fechamento pronto para negociar.

Estado após a Fase 5: **12 dos 14 módulos do menu** têm backend real (Cadastro Mestre→Sócios, Fornecedores, Quadro de Safra, Resumo, Fluxo Mensal, Bancos, Aquisição de Fazenda, Arrendamentos, Comercialização, Balanço PJ, Análise Financeira, Cotações). Faltam Apresentação do Grupo (não tem dado próprio, só compõe os outros) e a Fase 6 abaixo.

---

## Fase 6 — Plataforma (pendente, não iniciada)

Diferente das Fases 2–5, que replicavam um padrão já validado, a Fase 6 é heterogênea — cada item é uma decisão de produto própria, não uma repetição do padrão CRUD. Recomendo tratá-los como sub-fases independentes, na ordem abaixo (billing/segurança antes de conveniências).

1. **Planos e limites.** A engenharia reversa do AgroFlow registra Balanço PJ como paywall Essencial/Pro no produto original; aqui foi deliberadamente desbloqueado. Formalizar isso significa: model `Plano` (nome, limites — nº propriedades, nº usuários, módulos habilitados), campo `planoId` em `Conta`, e um middleware/guard que os server actions de cada módulo consultem antes de escrever. Decisão em aberto: cobrar de fato (Stripe ou similar) ou só modelar o gate sem cobrança nesta rodada — muda bastante o escopo.
2. **Impersonation.** O Admin Master já pode ver metadados de qualquer conta em `/admin`; falta poder "entrar como" um usuário da conta pra dar suporte. Better Auth tem suporte nativo a isso no plugin `admin` (`auth.api.impersonateUser`) — o trabalho é principalmente de UI (botão em `/admin/contas/[id]`, banner "impersonando X" visível no `AppShell` enquanto ativo, e reverter com segurança) mais decidir se toda ação feita durante impersonation grava `createdById` do admin ou do usuário impersonado (recomendo: do usuário, com uma flag separada indicando que foi via impersonation, para auditoria).
3. **Audit log.** Hoje `createdById`/`updatedById` existem em quase todo model, mas não há histórico de mudanças nem trilha de quem excluiu o quê quando. Precisa de um model `AuditLog` (ator, ação, entidade, entityId, diff ou snapshot, timestamp) e decidir se é escrito por um middleware do Prisma (`$extends`/`$use`, captura tudo automaticamente mas é mais opaco) ou explicitamente em cada server action (mais verboso, mas cada log é intencional e legível). Prefiro a segunda opção dado o volume atual de server actions — mas é uma decisão de arquitetura que vale confirmar antes de implementar.
4. **Upload real de comprovantes.** `Supplier.imageUrl`/`comprovanteUrl` e o "Gerador de Links de Imagem HTML" hoje só aceitam URL colada — não existe upload de arquivo. Precisa de um provedor de object storage (S3-compatible: Cloudflare R2, Supabase Storage, ou AWS S3 direto) e decidir isso com o usuário antes de escrever código, do mesmo jeito que decidimos Postgres/Better Auth/Yahoo Finance nas fases anteriores — não é uma escolha técnica neutra, tem custo recorrente.
5. **Geração de `.pptx` real.** `ApresentacaoGrupoView` hoje só simula idle→gerando→pronta sem gerar arquivo. Precisa de uma lib de geração de PPTX no Node (ex. `pptxgenjs`) e definir o conteúdo real do relatório — que dados de quais dos 12 módulos já persistidos entram nos slides. É o item mais próximo de "puro trabalho de implementação" desta lista, mas depende de spec de conteúdo que ainda não existe.
6. **Tabelas oficiais de opções em Bens e Direitos / Garantias / CAPEX.** Quatro campos do Cadastro Mestre ficaram como texto livre em vez de `Select` fechado porque os prints do AgroFlow mostravam os dropdowns fechados, sem a lista completa de opções: `BemDireito.codigoTipo` (05/08/2026 — só "18 — Imóvel Rural", Grupo "Bens Imóveis", está confirmado), `Garantia.tipoAtivo`/`tipoGarantia` (05/08/2026 — nenhum valor confirmado, só os provisórios em `GarantiaDrawer.tsx`), `Capex.tipo`/`status` (05/08/2026 — só "Máquina / Equipamento", "Reforma / Modernização" e "Planejado" confirmados, ver `CapexForm.tsx`). Quando o usuário tiver a lista real de cada um (a tabela oficial da Receita Federal, no caso de `codigoTipo`; ou só abrindo os selects do AgroFlow e printando, nos outros três), trocar o array local de opções do componente pela lista real — não precisa de migration, os campos já são `String` no schema.
7. **Importar Declaração de IR (PDF).** O print do Cadastro Mestre (05/08/2026) mostra um banner "Importar Declaração de IR (PDF)" com botão "Importar IR (PDF)": upload do PDF do IRPF de cada sócio, IA extrai automaticamente os bens e direitos, cria o sócio e consolida o patrimônio do grupo. Ficou fora de escopo da rodada que replicou os campos das 4 sub-abas — é uma feature de IA/parsing de documento bem maior que ajuste de formulário, precisa de decisão de provedor (mesma lógica do item 4, upload de comprovantes) e de estratégia de extração (LLM com vision, OCR + parser estruturado, etc.) antes de codar.

Cada um desses sete itens deveria começar por uma rodada de perguntas ao usuário antes de qualquer código — são decisões de produto (cobrar ou não, qual storage, qual conteúdo no relatório, qual tabela de códigos, qual estratégia de extração de PDF), não apenas técnicas.
