# CLAUDE.md — AgroGestão

Sistema de gestão financeira e controle agrícola (fornecedores, safras, bancos, cotações, arrendamentos, comercialização).

## Stack

- **Next.js 15 (App Router)** + React 19 + TypeScript
- **Tailwind CSS v4** (config CSS-first via `@tailwindcss/postcss`, **sem** `tailwind.config.js` — tokens/tema em `@theme` dentro de `src/app/globals.css`)
- **Prisma ORM + Postgres** (Neon/Supabase) — ver seção "Prisma" abaixo, é o padrão oficial mas **ainda não está plugado no app**
- `lucide-react` para ícones, `motion` para animação
- Fontes via `next/font/google`: Manrope (`--font-manrope` → `font-sans`) e JetBrains Mono (`--font-jetbrains-mono` → `font-mono`), conforme `DESIGN.md`
- Sem lib de formulário/validação (react-hook-form, zod, etc.) — forms usam `useState` por campo + `required` HTML nativo
- Sem auth real ainda — perfil fixo no `Sidebar` ("thiago"), fica para rodada futura

Essas ausências (auth, validação de forms) são deliberadas por ora. Não introduza sem alinhar antes — é mudança de arquitetura, não detalhe de implementação.

## Roteamento

Navegação é **roteamento real por URL**, não mais estado de aba:
- `src/app/[tab]/page.tsx` — rota dinâmica única. Lê o segmento `tab`, valida contra `isActiveTab()` (`src/lib/nav.ts`), renderiza `<TabView tab={tab} />`. Aba inválida → 404.
- `src/app/page.tsx` — redireciona `/` → `/fornecedores` (`defaultTab` em `src/lib/nav.ts`).
- `src/lib/nav.ts` — **fonte única de verdade** do menu: cada `NavEntry` tem `id` (= segmento de rota), `label` (Sidebar), `icon`, `title`/`subtitle` (Header). Adicionar uma aba nova = adicionar uma entrada aqui + o `id` já vira `ActiveTab` (`src/types.ts`) e uma rota funcional.

## Estrutura

```
src/
  app/
    layout.tsx              # root layout: fontes + <AppShell>
    page.tsx                 # redirect "/" -> "/{defaultTab}"
    [tab]/page.tsx            # rota dinâmica, valida tab e renderiza TabView
    globals.css                # @import "tailwindcss" + @theme (fontes) + custom-scrollbar
  lib/
    nav.ts                    # menu/roteamento — fonte única de verdade
    app-shell-context.tsx      # Context para ações de chrome (abrir sidebar mobile / modal de imagem)
  types.ts                    # tipos de domínio centralizados
  data/initialData.ts          # mocks + helpers puros (formatCurrency, formatDateBR, isCurtoPrazo...)
  components/
    ui/                       # design system — primitivos reutilizáveis (Button, Input, Select, Textarea, Card, Badge, Drawer, Modal)
    AppShell.tsx               # "use client" — dono do estado de chrome global (sidebar mobile, modal de imagem), provider do app-shell-context
    TabView.tsx                # "use client" — corpo de cada rota: estado de dados da aba + roteia para a view certa
    Sidebar.tsx / Header.tsx    # client components, usam usePathname()/useAppShell()
    <Entity>Table.tsx / <Entity>Drawer.tsx  # ex: SupplierTable, SupplierDrawer
    MetricCards.tsx
    views/
      <Nome>View.tsx           # "página" de uma aba (ResumoView, BancosView, QuadroSafraView, CotacoesView...)
      GenericView.tsx           # placeholder para abas ainda não implementadas
prisma/
  schema.prisma                # scaffold — ver seção Prisma
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

**Regra de padronização**: toda nova tela do menu (adicionada em `src/lib/nav.ts`) deve seguir a estrutura da tela Fornecedores:
1. `Header` (compartilhado, título/subtítulo vêm de `nav.ts`, ações específicas via prop `actions`)
2. `MetricCards` no topo, se fizer sentido para a entidade
3. Listagem em `Card` com tabela própria (colunas variam por entidade, não abstraia a tabela em si)
4. `Drawer` lateral para criar/editar (não modal central)
5. Toda a UI usa os primitivos de `src/components/ui/`

Para ativar uma nova tela: adicionar a entrada em `src/lib/nav.ts`, criar a `*View.tsx` em `views/`, e adicionar o branch em `TabView.tsx` (substituindo o fallback `GenericView`).

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
