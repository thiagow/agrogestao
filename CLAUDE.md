# CLAUDE.md — AgroGestão

Sistema de gestão financeira e controle agrícola (fornecedores, safras, bancos, cotações, arrendamentos, comercialização), replicando o sistema **AgroFlow** com base em engenharia reversa documentada localmente (arquivos `ENGENHARIA_REVERSA_AGROFLOW*.md*`, não versionados). **Os 13 módulos do menu estão todos implementados** na UI (eram 14; "Balanço PJ" foi removido em 05/08/2026 a pedido do usuário — ver Fase 5/6 abaixo). Roadmap de replicação de tela, por fase: `docs/PLANO_REPLICACAO_AGROFLOW.md`.

**Backend em construção por fases** (`docs/PLANO_BACKEND_FASE1.md`). Fase 1 — concluída: identidade real (Better Auth), tenancy multi-conta, painel Admin Master, e os módulos Cadastro Mestre → Sócios e Fornecedores persistidos em Postgres via Prisma. Cadastro Mestre ganhou depois (05/08/2026) mais 4 sub-abas persistidas — Bens e Direitos (`BemDireito`), Garantias (`Garantia`), CAPEX (`Capex`) e Grupo Econômico (`PerfilGrupoEconomico`) — todas penduradas em `Conta`, mesmo critério de `Socio`. Todas as 4 tiveram seus formulários reais fotografados pelo usuário no mesmo dia e foram implementadas como **réplica confirmada** da tela original do AgroFlow, não "design próprio" — inclusive Garantias e CAPEX, que numa primeira rodada tinham ficado como design próprio (essa versão foi descartada; as 3 tabelas envolvidas estavam vazias em produção, sem risco de perda de dado). Bens e Direitos: `socioId` opcional (Sócio Titular, vazio = "Grupo"), `grupoIrpf` (taxonomia padrão da Declaração de Bens e Direitos da Receita Federal), `codigoTipo` (texto livre, não enum fechado — a doc não confirma a tabela completa de códigos por grupo, e inventar código de IRPF é arriscado demais pra um dado que pode alimentar declaração fiscal real; só o exemplo do print, "18 — Imóvel Rural", está confirmado), `valorDeclaradoIrpf`, `valorMercadoEstimado`, `dataAquisicao`/`valorAquisicao` (ambos opcionais), `liquidez` (Alta/Média/Baixa), `ltv`, `elegivelGarantia`, `geraFluxoCaixa` e `observacoes`. Garantias: `tipoAtivo`/`tipoGarantia` (texto livre — lista completa de opções ainda não confirmada, print mostra os selects fechados), `descricao`, `bancoVinculado` (texto livre com chips de sugestão de bancos comuns — abandonou o vínculo real com `ContratoBancario` que existia antes, pra bater com o print), `numeroOperacao`, `valor`/`moeda` (reaproveita o enum `Currency` já usado em `ContratoBancario`). CAPEX: `tipo`/`status` (texto livre, mesma lógica de Garantias — só "Máquina / Equipamento", "Reforma / Modernização" e "Planejado" são confirmados), `ano` (seletor de ano, não mais data completa), `valorPlanejado`/`valorExecutado`/`percentualFinanciamento`; é o único cadastro do Cadastro Mestre que abre **inline na própria aba** em vez de Drawer lateral (`CapexForm.tsx`), pedido explícito do usuário pra bater com o fluxo real do AgroFlow — KPIs (Total Planejado/Executado, Financiamento, Capital Próprio) calculados ao vivo por ano. Grupo Econômico: o print mostra um **perfil único do grupo** (nome/e-mail/telefone/atividade principal/fundação/sede/consultor responsável) + um "Painel Consolidado" — não uma lista de empresas relacionadas; substituiu inteiramente o antigo `EmpresaGrupo` (lista Controladora/Controlada/Coligada, que não existe na tela real e também estava vazio). Nome/Razão Social/CNPJ do grupo **não moram em `PerfilGrupoEconomico`** — são cadastrados pelo Admin Master na criação da conta (`Conta.nome`/`razaoSocial`/`cnpj`, `src/server/contas.ts`) e a aba só lê esses campos direto de `Conta` (via `requireContext()`, passados por prop desde `(app)/[tab]/page.tsx`), read-only ali; `PerfilGrupoEconomico` guarda só os campos extras que o usuário da conta preenche por cima (e-mail/telefone/atividade/fundação/sede/consultor). O Painel Consolidado (Patrimônio Total Bruto/Ponderado, Garantia Ponderada Total, Patrimônio por Sócio) é **sempre computado ao vivo** a partir dos Bens e Direitos e Sócios já persistidos (`src/lib/patrimonio.ts`, função pura), nunca persistido como número solto — mesmo critério de `src/lib/indicadores.ts`; bem vinculado a um sócio entra ponderado pela participação dele, bem sem sócio ("Grupo") entra 100%. "Histórico do Grupo" também veio do print — resolve a pendência que existia antes ("audit log automático vs. linha do tempo manual"): não é nenhum dos dois, é um único campo de texto livre (`PerfilGrupoEconomico.historico`), usado na Apresentação do Grupo (Slide 2) e no Parecer Executivo. "Importar Declaração de IR (PDF)" (IA extrai bens/direitos do PDF do IRPF) aparece no print mas ficou fora de escopo — registrado em `docs/PLANO_BACKEND_FASE1.md`, Fase 6. Fase 2 — concluída: Quadro de Safra (`QuadroSafra`) persistido, Resumo lendo os mesmos dados reais, e Fluxo de Caixa Mensal computado ao vivo a partir do Quadro de Safra real da propriedade (não é tabela própria — é projeção, não lançamento real; ver `src/server/lancamentos.ts`). Calendário Agrícola permanece como referência estática (`initialData.ts`) — é conhecimento agronômico genérico, não dado editável por conta. Fase 3 — concluída: Bancos (`ContratoBancario`) persistido, com cronograma de amortização SAC/PRICE/BULLET auto-gerado a cada save (`src/lib/amortizacao.ts`, função pura testável) e persistido em `Parcela`; aba "Cronograma" de Bancos já mostra o cronograma real por contrato. "Por Credor" e "Fluxo Detalhado" seguem em construção (sem spec). Fase 4 — concluída: Aquisição de Fazendas (`Aquisicao`), Arrendamentos (`ContratoArrendamento`) e Comercialização (`ContratoComercial`) persistidos. `valorTotalFluxo` de Aquisição segue como total resumo — sem `ParcelaAquisicao`, pois não há spec de detalhamento por parcela na UI. Fase 5 — concluída: `BalancoPatrimonial` (Análise Financeira, com Drawer de edição) persistido; os índices de liquidez/endividamento são **sempre computados ao vivo** a partir do balanço (`src/lib/indicadores.ts`) — nunca persistidos como número solto. Só 7 dos 12 indicadores do AgroFlow original são computáveis com as 6 contas agregadas que temos (sem caixa/estoques/EBITDA/EBIT); os outros 5 aparecem explicitamente como "indisponível" na UI, nunca com um valor inventado. `Cotacao` ganhou ingestão real: AwesomeAPI (câmbio USD/BRL) e Yahoo Finance (futuros CBOT/CME/ICE, mesmos tickers do mock), ambas sem chave — `src/lib/market-data.ts`, acionado pelo botão "Atualizar". **Atenção**: `precoUsd`/`precoBrl` de commodities são a cotação bruta do contrato futuro convertida só de moeda (USD→BRL) — não há tabela de conversão bushel/lb → saca de 60kg ainda, então não é preço de fechamento pronto. `PosicaoComercializacao` (aba "Posição por Cultura" de Comercialização) segue no mock — cruza produção com cotação e merece revisão própria depois que a conversão por saca existir. Os demais módulos ainda leem `src/data/initialData.ts` até suas fases. **Fase 6 — pendente, não iniciada:** planos e limites, impersonation, audit log, upload real de comprovantes, geração de `.pptx`. Escopo detalhado (com as decisões de produto em aberto de cada item) em `docs/PLANO_BACKEND_FASE1.md`, seção "Fase 6". **Balanço PJ removido (05/08/2026)**: módulo (`EmpresaPJ`, model + migration + `BalancoPjView` + `src/server/empresas-pj.ts` + entrada de menu) descartado por completo a pedido do usuário — a tabela estava vazia em produção, sem risco de perda de dado. `BalancoPatrimonial`/Análise Financeira (balanço consolidado do grupo) não foi afetado, é módulo distinto. **Fornecedores ajustado (05/08/2026)**: o formulário "Cadastrar Fornecedor" também teve seu print real conferido pelo usuário — `cnpjCpf`/`contatoNome`/`contatoTelefone`/`contatoEmail` foram removidos do `Supplier` (schema + Drawer), pois não existem na tela real; eram um campo "estimado" da doc de engenharia reversa, nunca confirmado, e os 3 fornecedores existentes só tinham dado de demo/seed nesses campos (sem risco de perda de dado real). `imageUrl` foi removido logo em seguida, no mesmo dia — o "Gerador de Links de Imagem HTML" (`DirectImageLinksModal.tsx`) continua existindo como utilitário standalone acessível pela Sidebar/Header (`AppShellContext.openImageModal()`, sem parâmetro), só não tem mais nenhum vínculo com `Supplier`.

## Stack

- **Next.js 15 (App Router)** + React 19 + TypeScript
- **Tailwind CSS v4** (config CSS-first via `@tailwindcss/postcss`, **sem** `tailwind.config.js` — tokens/tema em `@theme` dentro de `src/app/globals.css`)
- **Prisma ORM + Postgres** — conectado. `prisma/schema.prisma` cobre identidade + tenancy + Sócios/Fornecedores; demais entidades entram fase a fase (ver `docs/PLANO_BACKEND_FASE1.md`)
- **Better Auth** (self-hosted, adapter Prisma) — auth real por e-mail/senha, plugin `admin` com role de plataforma `superadmin` (custom, via access control próprio — não é o `admin` default do plugin)
- `lucide-react` para ícones, `motion` para animação
- Fontes via `next/font/google`: Manrope (`--font-manrope` → `font-sans`) e JetBrains Mono (`--font-jetbrains-mono` → `font-mono`), conforme `DESIGN.md`
- `zod` **só no boundary de servidor** (`src/lib/validation.ts`, usado por server actions) — os forms de client continuam com `useState` por campo + `required` HTML nativo, sem lib de formulário
- `recharts` para gráficos (bar chart no Resumo, radar chart na Análise Financeira) — única lib de chart do projeto

Validação de forms de client segue deliberadamente sem lib (useState + required). Não introduza uma sem alinhar antes.

## Autenticação e Tenancy

Modelo: `Conta` (tenant do cliente) → N `Propriedade` → dados de negócio (sempre filtrados por `propriedadeId`, resolvido só a partir da sessão do servidor, nunca de parâmetro vindo do client). `Socio` pendura em `Conta` (participação societária é do grupo, não da fazenda). Usuários se ligam à Conta via `Membership` (`role`: OWNER/ADMIN/MEMBER/VIEWER). Papel de plataforma (`User.role`) é separado: só `'superadmin'` acessa `/admin`.

- `src/lib/auth.ts` / `auth-client.ts` — config do Better Auth (server/client).
- `src/lib/session.ts` — `requireUser()`, `requireSuperAdmin()`, `requireContext()` (resolve conta + propriedade ativa a partir do cookie `ag_prop`, validado contra as propriedades da conta a cada request). **Toda leitura de dado de negócio passa por `requireContext()`.**
- `middleware.ts` — guarda otimista por cookie de sessão (redireciona sem sessão), roda no edge. A checagem que vale é `requireContext()`/`requireSuperAdmin()` nos layouts — nunca confie só no middleware.
- Onboarding: Admin Master cria a Conta + usuário OWNER em `/admin/contas/nova` com senha provisória (visível uma única vez); usuário é forçado a `/trocar-senha` no 1º login (`User.mustChangePassword`).
- `src/lib/enum-maps.ts` — Prisma exige identificadores de enum em ASCII; os rótulos acentuados de `src/types.ts` (`MAQUINÁRIOS`, `Viúvo`, etc.) são traduzidos aqui nos dois sentidos. Qualquer novo enum compartilhado entre `types.ts` e `schema.prisma` com acento precisa de uma entrada aqui — não passe o valor acentuado direto pro Prisma Client.

## Roteamento

Três áreas, cada uma com seu próprio chrome:
- `src/app/(app)/[tab]/page.tsx` — rota dinâmica do produto do cliente. Lê o segmento `tab`, valida contra `isActiveTab()` (`src/lib/nav.ts`), busca os dados já migrados (`src/server/*`) e renderiza `<TabView tab={tab} .../>`. Aba inválida → 404. `(app)/layout.tsx` é `async`, chama `requireContext()`; sem propriedade cadastrada, mostra o onboarding (`PrimeiraPropriedadeForm`) em vez do `AppShell`.
- `src/app/admin/**` — painel Admin Master, **fora** do route group `(app)` (é um segmento de URL real, não só um route group — route groups não mudam a URL). Protegido por `requireSuperAdmin()` em `admin/layout.tsx`. Menu próprio em `src/lib/admin-nav.ts` — nunca misturar com `nav.ts`.
- `src/app/login/`, `src/app/trocar-senha/` — fora de `(app)` e de `admin/`, sem chrome de nenhum dos dois.
- `src/lib/nav.ts` — **fonte única de verdade** do menu do cliente: cada `NavEntry` tem `id` (= segmento de rota), `label` (Sidebar), `icon`, `title`/`subtitle` (Header). Adicionar uma aba nova = adicionar uma entrada aqui + o `id` já vira `ActiveTab` (`src/types.ts`) e uma rota funcional.

## Estrutura

```
src/
  app/
    layout.tsx                # root layout: só fontes + {children}, sem chrome
    login/page.tsx              # login real (Better Auth)
    trocar-senha/page.tsx        # troca obrigatória da senha provisória
    api/auth/[...all]/route.ts   # handler do Better Auth
    admin/
      layout.tsx                 # requireSuperAdmin() + <AdminShell>
      page.tsx                   # dashboard (KPIs de contas/usuários/propriedades)
      contas/page.tsx, contas/[id]/page.tsx  # CRUD de contas e usuários
    (app)/
      layout.tsx                 # async — requireContext(); sem propriedade -> onboarding; senão <AppShell>
      page.tsx                   # redirect "/" -> "/{defaultTab}"
      [tab]/page.tsx              # rota dinâmica, busca dados via src/server/* e renderiza TabView
    globals.css                # @import "tailwindcss" + @theme (fontes) + custom-scrollbar
  lib/
    nav.ts / admin-nav.ts      # menu/roteamento — cliente / admin (fontes separadas, não misturar)
    auth.ts / auth-client.ts    # Better Auth (server / client)
    session.ts                 # requireUser / requireContext / requireSuperAdmin
    validation.ts               # schemas zod do boundary de servidor
    enum-maps.ts                 # tradução enum Prisma (ASCII) <-> rótulo acentuado da UI
    db.ts                       # PrismaClient singleton
    app-shell-context.tsx      # Context para ações de chrome (abrir sidebar mobile / modal de imagem)
  server/                      # server actions — única forma de escrita no banco (contas, usuarios, propriedades, socios, suppliers, culturas)
  types.ts                    # tipos de domínio centralizados
  data/initialData.ts          # mocks + helpers puros — ainda fonte dos módulos não migrados
  components/
    ui/                       # design system — primitivos reutilizáveis (Button, Input, Select, Textarea, Card, Badge, Drawer, Modal, Tabs, KpiCard)
    AppShell.tsx               # "use client" — chrome do produto do cliente (Sidebar + seletor de propriedade)
    AdminShell.tsx              # "use client" — chrome do painel Admin Master (sidebar neutra, deliberadamente distinta)
    TabView.tsx                # "use client" — corpo de cada rota: recebe dados iniciais via prop, chama server actions
    Sidebar.tsx / Header.tsx    # client components, usam usePathname()/useAppShell()
    <Entity>Drawer.tsx          # SupplierDrawer, SocioDrawer, SafraDrawer, ContratoBancarioDrawer
    SupplierTable.tsx
    MetricCards.tsx
    views/
      <Nome>View.tsx           # "página" de uma aba (ResumoView, CadastroMestreView, QuadroSafraView, BancosView, AnaliseFinanceiraView, CotacoesView...)
      GenericView.tsx           # placeholder para abas ainda não implementadas
prisma/
  schema.prisma                # identidade (Better Auth) + tenancy + cadastros base + Fornecedores
  seed.ts                      # superadmin + culturas globais + conta demo (--demo)
middleware.ts                  # guarda otimista por cookie de sessão
docs/
  PLANO_REPLICACAO_AGROFLOW.md  # roadmap de replicação do AgroFlow, por fase e tela
  PLANO_BACKEND_FASE1.md        # plano da Fase 1 de backend (identidade, tenancy, admin, cadastros base)
```

Convenção: componentes em PascalCase, `export const Nome: React.FC<Props> = ...` (named export). Componentes que usam hooks/estado/context precisam de `'use client'` no topo (padrão Next.js App Router).

## Design System (`src/components/ui/`)

Extraído do padrão validado na tela **Fornecedores** (tela-molde do projeto) e dos tokens em `DESIGN.md` (paleta "Agro-Industrial Precision": primary lime `#a3e635`, sidebar dark forest `#0b2310`, radius 8px padrão/16px cards grandes, tipografia Manrope).

Componentes disponíveis (`import { X } from './ui'`):
- `Button` — variantes `primary` (lime, CTA principal), `secondary` (ghost slate, cancelar), `ghost` (dark, footer de modal), `icon` (ação inline em tabela). Não força largura — passe `w-full`/`w-auto` via `className` conforme o layout.
- `Input`, `Select`, `Textarea` — campos de formulário com label/hint opcionais
- `Card` — casca branca `rounded-2xl border shadow-xs`, container de tabelas/painéis
- `Badge` — pill de status/categoria, tones: `amber`, `emerald`, `rose`, `blue`, `slate`
- `Drawer` — slide-over lateral para criar/editar entidades — **é o padrão de cadastro do app, não modal central**. Única exceção: CAPEX (Cadastro Mestre) abre o formulário inline na própria aba (`CapexForm.tsx`, não `Drawer`), decisão explícita do usuário pra bater com o fluxo real do AgroFlow — não usar como precedente pra outras entidades sem alinhar antes.
- `Modal` — casca de modal central, para ações que não são CRUD de entidade (ex: gerador de link de imagem)
- `Tabs` — abas horizontais com render-prop (`children(activeTabId)`), usado em telas com sub-seções (Cadastro Mestre, Bancos, Análise Financeira). Aba sem spec documentada usa um estado "em construção" em vez de conteúdo inventado.
- `KpiCard` — card de indicador (título, valor, subtítulo, `status` opcional com `Badge` colorida, `formula`/`referencia` opcionais) — usado em Resumo, Bancos, Análise Financeira. `MetricCards.tsx` (Fornecedores) é um card layout mais específico e não foi migrado para `KpiCard`.

**Regra de padronização**: toda nova tela do menu (adicionada em `src/lib/nav.ts`) deve seguir a estrutura da tela Fornecedores:
1. `Header` (compartilhado, título/subtítulo vêm de `nav.ts`, ações específicas via prop `actions`)
2. `MetricCards`/`KpiCard` no topo, se fizer sentido para a entidade
3. Listagem em `Card` com tabela própria (colunas variam por entidade, não abstraia a tabela em si)
4. `Drawer` lateral para criar/editar (não modal central)
5. Toda a UI usa os primitivos de `src/components/ui/`

Para ativar uma nova tela: adicionar a entrada em `src/lib/nav.ts`, criar a `*View.tsx` em `views/`, e adicionar o branch em `TabView.tsx` (substituindo o fallback `GenericView`). Estado de dados mockados que precisa ser compartilhado entre telas (ex: `culturaSafras` usado em Resumo e Quadro de Safra) fica em `TabView.tsx`; estado local de uma única tela (ex: `Socio` em Cadastro Mestre) pode viver dentro da própria `*View.tsx`.

**Todos os 13 módulos do menu já têm tela própria** (`GenericView` não é mais usado por nenhuma rota, mas continua no código como fallback defensivo). Várias telas ainda têm sub-abas "em construção" por falta de spec detalhada nelas — lista completa em `docs/PLANO_REPLICACAO_AGROFLOW.md`. Não inventar conteúdo para essas sub-abas sem uma fonte de spec.

## Prisma — conectado

`prisma/schema.prisma` cobre identidade (Better Auth), tenancy (`Conta`/`Membership`/`Propriedade`) e os cadastros já migrados (`Cultura`, `Safra`, `Socio`, `BemDireito`, `Garantia`, `Capex`, `PerfilGrupoEconomico`, `Supplier`/`CompraFornecedor`, `QuadroSafra`, `ContratoBancario`/`Parcela`, `Aquisicao`, `ContratoArrendamento`, `ContratoComercial`, `BalancoPatrimonial`, `Cotacao`). Leitura via Server Components (`src/server/*` chamado direto de `page.tsx`), escrita via server actions (`'use server'` em `src/server/*`, chamadas pelos Drawers). Nunca importar `@prisma/client` direto em client component.

Convenções obrigatórias em todo model de negócio novo: `Decimal` para dinheiro/taxas (nunca `Float`), `ativo Boolean @default(true)` para soft-delete, `createdAt/updatedAt/createdById/updatedById`, `@@index([propriedadeId, ativo])` (ou `contaId` quando o model pendura na conta), enum em ASCII + `@map` para rótulo acentuado (ver `src/lib/enum-maps.ts`).

Para ativar um módulo novo (fases 2+, ver `docs/PLANO_BACKEND_FASE1.md`): adicionar o model ao schema, `npm run db:migrate`, criar `src/server/<entidade>.ts` com list/save/delete seguindo o padrão de `src/server/suppliers.ts`, buscar os dados em `(app)/[tab]/page.tsx` e passar por prop ao `TabView`/`*View`, substituindo a leitura de `initialData.ts` um módulo por vez — sem quebrar os ainda não migrados.

## Deploy (Netlify)

`netlify.toml` já configurado com `@netlify/plugin-nextjs` (`next build`, suporte a rotas dinâmicas). Env vars a configurar no site da Netlify (nunca commitadas): `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (origem pública do deploy), `SUPERADMIN_EMAIL`/`SUPERADMIN_PASSWORD` (só para rodar `npm run db:seed` uma vez).

## Referência visual

`DESIGN.md` na raiz é a fonte de verdade dos tokens (cores, tipografia, espaçamento, elevação, shapes). Qualquer componente novo deriva dali.
