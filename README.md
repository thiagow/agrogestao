# AgroGestão

Sistema de gestão financeira e controle agrícola. Replicação do AgroFlow com suporte a fornecedores, safras, bancos, cotações, arrendamentos e comercialização.

## Stack

- **Next.js 15** (App Router) + React 19 + TypeScript
- **Tailwind CSS v4** (CSS-first, sem tailwind.config.js)
- **Prisma ORM** + PostgreSQL — conectado (ver `docs/PLANO_BACKEND_FASE1.md`)
- **Better Auth** — autenticação real, multi-tenant (Conta → Propriedades) + painel Admin Master
- **Recharts** para visualizações
- `lucide-react` para ícones, `motion` para animações

## Rodar Localmente

**Pré-requisitos:** Node.js 18+, um Postgres acessível

```bash
# Instalar dependências
npm install

# Copiar e preencher as variáveis de ambiente (DATABASE_URL, BETTER_AUTH_SECRET, SUPERADMIN_EMAIL/PASSWORD)
cp .env.example .env

# Aplicar o schema no banco
npm run db:migrate

# Criar o superadmin + catálogo global de culturas (adicione --demo para uma conta de teste)
npm run db:seed

# Rodar servidor de desenvolvimento (porta 3000)
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

A aplicação redireciona `/` para `/login`. Após autenticar, o cliente vai para `/{defaultTab}` (`/resumo`); o Admin Master (role `superadmin`) vai para `/admin`.

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
    (app)/              # Route group: telas do cliente (Sidebar + Header), exige conta+propriedade
      [tab]/page.tsx    # Rota dinâmica que valida a aba e busca os dados já persistidos
    admin/              # Painel Admin Master (SUPERADMIN) — contas, usuários, senha provisória
    login/              # Login real (Better Auth)
    trocar-senha/       # Troca obrigatória da senha provisória no 1º acesso
    api/auth/[...all]/  # Handler do Better Auth
    globals.css         # @import tailwindcss + @theme
  components/
    ui/                 # Design system: Button, Input, Card, Badge, Drawer, Modal, etc
    AppShell.tsx         # Dono do estado global de chrome do app cliente
    AdminShell.tsx        # Chrome do painel Admin Master
    Sidebar.tsx / Header.tsx
    views/              # Implementação de cada módulo
  lib/
    nav.ts              # Fonte única de verdade: menu do cliente + roteamento
    admin-nav.ts          # Menu do painel Admin Master
    auth.ts / auth-client.ts  # Config do Better Auth (server / client)
    session.ts             # requireUser / requireContext / requireSuperAdmin
    validation.ts           # Schemas zod do boundary de servidor
    enum-maps.ts            # Tradução entre enums Prisma (ASCII) e rótulos acentuados da UI
  server/               # Server actions — única forma de escrita no banco
  types.ts              # Tipos de domínio centralizados
  data/initialData.ts   # Mocks — ainda usados pelos módulos não migrados (Fases 2+)
prisma/
  schema.prisma          # Identidade (Better Auth) + tenancy + cadastros base + Fornecedores
  seed.ts                # Superadmin + culturas globais + conta demo (--demo)
```

## Design System

Paleta **Agro-Industrial Precision**: 
- Primary: Lime green `#a3e635` (CTAs)
- Sidebar: Dark forest `#0b2310` 
- Radius padrão: 8px (cards: 16px)
- Tipografia: Manrope (sans), JetBrains Mono (mono)

Tokens em `DESIGN.md` e `src/app/globals.css`.

## Dados e Backend

Fase 1 (identidade, tenancy, painel Admin Master, Cadastro Mestre → Sócios, Fornecedores), Fase 2 (Quadro de Safra, Resumo, Fluxo de Caixa Mensal como projeção ao vivo), Fase 3 (Bancos, com cronograma de amortização SAC/PRICE/BULLET auto-gerado), Fase 4 (Aquisição de Fazendas, Arrendamentos, Comercialização) e Fase 5 (Balanço PJ, Análise Financeira com indicadores computados ao vivo, Cotações com ingestão real via AwesomeAPI + Yahoo Finance) estão persistidas em Postgres via Prisma — ver `docs/PLANO_BACKEND_FASE1.md`. Os demais módulos ainda leem `src/data/initialData.ts` até suas respectivas fases.

Tenancy: `Conta` (cliente) → N `Propriedade`. O Admin Master cadastra a Conta e o usuário OWNER em `/admin`, com senha provisória de troca obrigatória no 1º login. Todo dado de negócio é filtrado por `propriedadeId` resolvido a partir da sessão do servidor — nunca por parâmetro vindo do client.

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
