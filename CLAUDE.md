# CLAUDE.md — AgroGestão

Sistema de gestão financeira e controle agrícola (fornecedores, safras, bancos, cotações, arrendamentos, comercialização), replicando o sistema **AgroFlow** com base em engenharia reversa documentada localmente (`ENGENHARIA_REVERSA_AGROFLOW_2026.md.pdf`, não versionado). Roadmap completo de replicação, por fase e tela: `docs/PLANO_REPLICACAO_AGROFLOW.md`.

## Stack

- **Next.js 15 (App Router)** + React 19 + TypeScript
- **Tailwind CSS v4** (config CSS-first via `@tailwindcss/postcss`, **sem** `tailwind.config.js` — tokens/tema em `@theme` dentro de `src/app/globals.css`)
- **Prisma ORM + Postgres** (Neon/Supabase) — ver seção "Prisma" abaixo, é o padrão oficial mas **ainda não está plugado no app**
- `lucide-react` para ícones, `motion` para animação
- Fontes via `next/font/google`: Manrope (`--font-manrope` → `font-sans`) e JetBrains Mono (`--font-jetbrains-mono` → `font-mono`), conforme `DESIGN.md`
- Sem lib de formulário/validação (react-hook-form, zod, etc.) — forms usam `useState` por campo + `required` HTML nativo
- `recharts` para gráficos (bar chart no Resumo, radar chart na Análise Financeira) — única lib de chart do projeto
- Tela de `/login` existe mas é **só mock visual** — "Entrar" navega direto para `/{defaultTab}` sem validar credenciais; perfil fixo no `Sidebar` ("thiago"). Auth real fica para rodada futura (ver `docs/PLANO_REPLICACAO_AGROFLOW.md`)

Essas ausências (auth, validação de forms) são deliberadas por ora. Não introduza sem alinhar antes — é mudança de arquitetura, não detalhe de implementação.

## Roteamento

Navegação é **roteamento real por URL**, não mais estado de aba. As rotas do app (com Sidebar/chrome) vivem no route group `(app)`; `/login` fica fora dele, sem chrome:
- `src/app/(app)/[tab]/page.tsx` — rota dinâmica única. Lê o segmento `tab`, valida contra `isActiveTab()` (`src/lib/nav.ts`), renderiza `<TabView tab={tab} />`. Aba inválida → 404.
- `src/app/(app)/page.tsx` — redireciona `/` → `/fornecedores` (`defaultTab` em `src/lib/nav.ts`).
- `src/app/(app)/layout.tsx` — envolve as rotas do grupo com `<AppShell>` (Sidebar + chrome fixo).
- `src/app/login/page.tsx` — fora do route group `(app)`, sem Sidebar.
- `src/lib/nav.ts` — **fonte única de verdade** do menu: cada `NavEntry` tem `id` (= segmento de rota), `label` (Sidebar), `icon`, `title`/`subtitle` (Header). Adicionar uma aba nova = adicionar uma entrada aqui + o `id` já vira `ActiveTab` (`src/types.ts`) e uma rota funcional.

Route groups do Next.js (`(app)`) não alteram a URL — `/fornecedores` continua `/fornecedores`, só a organização de pastas muda.

## Estrutura

```
src/
  app/
    layout.tsx                # root layout: só fontes + {children}, sem chrome
    login/page.tsx              # tela de login (mock), fora do route group (app)
    (app)/
      layout.tsx                 # <AppShell> (Sidebar + chrome fixo) para todas as rotas do grupo
      page.tsx                   # redirect "/" -> "/{defaultTab}"
      [tab]/page.tsx              # rota dinâmica, valida tab e renderiza TabView
    globals.css                # @import "tailwindcss" + @theme (fontes) + custom-scrollbar
  lib/
    nav.ts                    # menu/roteamento — fonte única de verdade
    app-shell-context.tsx      # Context para ações de chrome (abrir sidebar mobile / modal de imagem)
  types.ts                    # tipos de domínio centralizados
  data/initialData.ts          # mocks + helpers puros (formatCurrency, formatDateBR, isCurtoPrazo, calcularSafra...)
  components/
    ui/                       # design system — primitivos reutilizáveis (Button, Input, Select, Textarea, Card, Badge, Drawer, Modal, Tabs, KpiCard)
    AppShell.tsx               # "use client" — dono do estado de chrome global (sidebar mobile, modal de imagem), provider do app-shell-context
    TabView.tsx                # "use client" — corpo de cada rota: estado de dados da aba + roteia para a view certa
    Sidebar.tsx / Header.tsx    # client components, usam usePathname()/useAppShell()
    <Entity>Drawer.tsx          # SupplierDrawer, SocioDrawer, SafraDrawer, ContratoBancarioDrawer
    SupplierTable.tsx
    MetricCards.tsx
    views/
      <Nome>View.tsx           # "página" de uma aba (ResumoView, CadastroMestreView, QuadroSafraView, BancosView, AnaliseFinanceiraView, CotacoesView...)
      GenericView.tsx           # placeholder para abas ainda não implementadas
prisma/
  schema.prisma                # scaffold — ver seção Prisma
docs/
  PLANO_REPLICACAO_AGROFLOW.md  # roadmap de replicação do AgroFlow, por fase e tela
```

Convenção: componentes em PascalCase, `export const Nome: React.FC<Props> = ...` (named export). Componentes que usam hooks/estado/context precisam de `'use client'` no topo (padrão Next.js App Router).

## Design System (`src/components/ui/`)

Extraído do padrão validado na tela **Fornecedores** (tela-molde do projeto) e dos tokens em `DESIGN.md` (paleta "Agro-Industrial Precision": primary lime `#a3e635`, sidebar dark forest `#0b2310`, radius 8px padrão/16px cards grandes, tipografia Manrope).

Componentes disponíveis (`import { X } from './ui'`):
- `Button` — variantes `primary` (lime, CTA principal), `secondary` (ghost slate, cancelar), `ghost` (dark, footer de modal), `icon` (ação inline em tabela). Não força largura — passe `w-full`/`w-auto` via `className` conforme o layout.
- `Input`, `Select`, `Textarea` — campos de formulário com label/hint opcionais
- `Card` — casca branca `rounded-2xl border shadow-xs`, container de tabelas/painéis
- `Badge` — pill de status/categoria, tones: `amber`, `emerald`, `rose`, `blue`, `slate`
- `Drawer` — slide-over lateral para criar/editar entidades — **é o padrão de cadastro do app, não modal central**
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

**Módulos sem spec documentada**: 8 dos 14 módulos do menu ainda não têm engenharia reversa detalhada e continuam em `GenericView` — lista completa em `docs/PLANO_REPLICACAO_AGROFLOW.md`. Não inventar telas para eles sem uma fonte de spec.

## Prisma (scaffolded, não conectado)

`prisma/schema.prisma` já define datasource Postgres + o model `Supplier` (espelhando `src/types.ts`), mas **o app ainda não usa o Prisma Client em lugar nenhum** — toda a UI roda em cima de `src/data/initialData.ts`. Isso é intencional: estabelece o padrão de ORM/banco sem acoplar a stack de dados antes de ter uma connection string real.

Para ativar quando chegar a hora:
1. Configurar `DATABASE_URL` (Neon/Supabase) em `.env` local e nas env vars da Netlify.
2. `npm run db:migrate` (roda `prisma migrate dev`).
3. Substituir a leitura de `initialData.ts` por queries via `@prisma/client` (idealmente em Server Components/Server Actions, não direto nos client components).

## Deploy (Netlify)

`netlify.toml` já configurado com `@netlify/plugin-nextjs` (`next build`, suporte a rotas dinâmicas). `DATABASE_URL` (quando existir) deve ser configurada como env var no site da Netlify — nunca commitada.

## Referência visual

`DESIGN.md` na raiz é a fonte de verdade dos tokens (cores, tipografia, espaçamento, elevação, shapes). Qualquer componente novo deriva dali.
