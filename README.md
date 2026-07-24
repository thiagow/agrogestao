# AgroGestão

Sistema de gestão financeira e controle agrícola. Replicação do AgroFlow com suporte a fornecedores, safras, bancos, cotações, arrendamentos e comercialização.

## Stack

- **Next.js 15** (App Router) + React 19 + TypeScript
- **Tailwind CSS v4** (CSS-first, sem tailwind.config.js)
- **Prisma ORM** + PostgreSQL (Neon/Supabase)
- **Recharts** para visualizações
- `lucide-react` para ícones, `motion` para animações

## Rodar Localmente

**Pré-requisitos:** Node.js 18+

```bash
# Instalar dependências
npm install

# Rodar servidor de desenvolvimento (porta 3000)
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

A aplicação redireciona `/` para `/fornecedores` (módulo padrão).

## Módulos Implementados (14/14)

1. **Resumo** — Dashboard com métricas e gráficos
2. **Cadastro Mestre** — Gestão de sócios e informações da fazenda
3. **Quadro de Safra** — Planejamento e acompanhamento de safras
4. **Bancos** — Gestão de contas bancárias e saldos
5. **Fornecedores** — Controle de dívidas com fornecedores (CP/LP)
6. **Aquisição Fazenda** — Compras de insumos e equipamentos
7. **Arrendamentos** — Gestão de contratos de arrendamento
8. **Comercialização** — Vendas de produtos agrícolas
9. **Balanço PJ** — Demonstrativo financeiro
10. **Fluxo de Safra** — Fluxo de caixa da safra
11. **Cotações** — Acompanhamento de preços de mercado
12. **Análise Financeira** — Indicadores e análises financeiras
13. **Fluxo Mensal** — Fluxo de caixa mensal
14. **Apresentação do Grupo** — Informações da operação

## Estrutura

```
src/
  app/
    (app)/              # Route group: telas com chrome (Sidebar + Header)
      [tab]/page.tsx    # Rota dinâmica que valida e renderiza a aba
    login/              # Tela de login (mock visual, sem auth real)
    globals.css         # @import tailwindcss + @theme
  components/
    ui/                 # Design system: Button, Input, Card, Badge, Drawer, Modal, etc
    AppShell.tsx        # Dono do estado global de chrome
    Sidebar.tsx         # Menu navegação
    Header.tsx          # Título, subtítulo, ações
    views/              # Implementação de cada módulo
  lib/
    nav.ts              # Fonte única de verdade: menu + roteamento
  types.ts              # Tipos de domínio centralizados
  data/initialData.ts   # Mocks (dados não persistem)
```

## Design System

Paleta **Agro-Industrial Precision**: 
- Primary: Lime green `#a3e635` (CTAs)
- Sidebar: Dark forest `#0b2310` 
- Radius padrão: 8px (cards: 16px)
- Tipografia: Manrope (sans), JetBrains Mono (mono)

Tokens em `DESIGN.md` e `src/app/globals.css`.

## Dados

Atualmente usando mocks em `src/data/initialData.ts`. Prisma está scaffolded mas não conectado.

Para ativar banco real:
1. Configurar `DATABASE_URL` em `.env.local` (Neon/Supabase)
2. `npm run db:migrate`
3. Substituir leitura de mocks por queries via Prisma Client

## Build & Deploy

```bash
# Build para produção
npm run build

# Iniciar servidor (produção)
npm start
```

Deploy automático via Netlify (configured in `netlify.toml`).

## Roadmap de Replicação

Ver `docs/PLANO_REPLICACAO_AGROFLOW.md` para detalhes de implementação e sub-abas pendentes.

## Licença

Privado.
