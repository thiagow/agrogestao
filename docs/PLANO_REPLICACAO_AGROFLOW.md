# Plano de Replicação do AgroFlow

Roadmap de replicação do sistema AgroFlow no AgroGestão, com base em `ENGENHARIA_REVERSA_AGROFLOW_2026.md.pdf` (arquivo local, não versionado — engenharia reversa de 21/07/2026 do sistema em `https://agroflow-rkqdvzdd.manus.space`).

A documentação de origem detalha em nível de tela/campo **5 dos 14 módulos** do menu (Resumo, Cadastro Mestre, Quadro de Safra, Bancos, Análise Financeira) + 3 entidades (Sócio, Safra/Cultura, Contrato Bancário), além de um diagrama de entidades que cobre também Fornecedores. Os demais 8 módulos aparecem só como nome + URL, sem spec de tela — ficam como backlog até que exista mais engenharia reversa.

## Etapa 1 — Telas navegáveis com dados mockados (concluída em 2026-07-24)

Escopo: só frontend, sem persistência real (Prisma/Postgres seguem scaffolded e desconectados — ver `CLAUDE.md`). Todas as telas abaixo usam dados mock de `src/data/initialData.ts`, com CRUD apenas em memória (state React), navegação real via `src/app/(app)/[tab]/page.tsx`.

| Fase | Tela | Status | Arquivos principais |
|---|---|---|---|
| 0 | Fundamentos (tipos, mocks, `Tabs`, `KpiCard`, `recharts`) | ✅ | `src/types.ts`, `src/data/initialData.ts`, `src/components/ui/Tabs.tsx`, `src/components/ui/KpiCard.tsx` |
| 1 | Login | ✅ | `src/app/login/page.tsx`, `src/app/(app)/layout.tsx` |
| 2 | Resumo | ✅ | `src/components/views/ResumoView.tsx` |
| 3 | Cadastro Mestre (aba Sócios) | ✅ | `src/components/views/CadastroMestreView.tsx`, `src/components/SocioDrawer.tsx` |
| 4 | Quadro de Safra | ✅ | `src/components/views/QuadroSafraView.tsx`, `src/components/SafraDrawer.tsx` |
| 5 | Bancos | ✅ | `src/components/views/BancosView.tsx`, `src/components/ContratoBancarioDrawer.tsx` |
| 6 | Análise Financeira (aba Índices) | ✅ | `src/components/views/AnaliseFinanceiraView.tsx` |
| 7 | Fornecedores (ajuste de campos) | ✅ | `src/components/SupplierDrawer.tsx` |

### Decisões e recortes desta etapa

- **Cadastro Mestre**: só a aba "Sócios" tem grid/formulário completo (única com spec na doc). As abas Bens e Direitos, Garantias, CAPEX, Grupo Econômico e Histórico do Grupo mostram um estado "em construção".
- **Bancos**: só a aba "Contratos" tem grid completo. Por Credor, Cronograma e Fluxo Detalhado mostram "em construção".
- **Análise Financeira**: só a aba "Índices" tem conteúdo (radar de saúde financeira, balanço resumido, grupos de indicadores Liquidez e Estrutura de Capital). O **Grupo 3 — Rentabilidade e Lucratividade** não foi implementado: a documentação de origem registra esse grupo como "parcialmente visível", sem nomes/valores de indicador confirmados.
- **Fornecedores**: campos `cnpjCpf`, `contatoNome`, `contatoTelefone`, `contatoEmail` adicionados ao tipo `Supplier` e ao `SupplierDrawer`. Sub-lista "Compras/Faturas" implementada como listagem mock (somente leitura) dentro do Drawer de edição — a doc marca essa sub-entidade como "estimado", então não ganhou CRUD completo.
- **Login**: não coberto pela documentação do AgroFlow (a engenharia reversa começa direto no dashboard autenticado). Desenhado a partir dos tokens do `DESIGN.md`, sem integração de autenticação real (auth segue adiada — ver memória do projeto).
- **Valores de mock com base na doc**: sempre que a documentação trazia um valor concreto (ex: hectares por cultura no Resumo, saldos de contratos bancários, índices de liquidez/estrutura de capital), esse valor foi usado como base do mock. Onde a doc tinha inconsistências de OCR (ex: PL Total do balanço, "Área Arrendada 6,4%"), os campos foram preenchidos item a item e a inconsistência não foi reproduzida artificialmente.

## Backlog — módulos sem spec de tela (fases futuras)

Estes módulos existem no menu (`src/lib/nav.ts`) e continuam em `GenericView` (placeholder) até que haja engenharia reversa detalhada:

| Módulo | URL no AgroFlow | `ActiveTab` |
|---|---|---|
| Aquisição de Fazendas | `/dashboard/{id}/aquisicoes` | `aquisicao_fazenda` |
| Arrendamentos | `/dashboard/{id}/arrendamentos` | `arrendamentos` |
| Comercialização (Futuros/Hedge) | `/dashboard/{id}/futuros` | `comercializacao` |
| Balanço PJ | `/dashboard/{id}/balanco-pj` | `balanco_pj` |
| Fluxo de Safra | `/dashboard/{id}/fluxo-caixa` | `fluxo_safra` |
| Cotações | `/dashboard/{id}/cotacoes` | `cotacoes` (já tem uma view própria, herdada do template original — não a doc) |
| Fluxo Mensal | `/dashboard/{id}/fluxo-mensal` | `fluxo_mensal` |
| Apresentação do Grupo | `/dashboard/{id}/apresentacao` | `apresentacao_grupo` |

## Próximas etapas (fora do escopo desta rodada)

Conforme o "Resumo Final" da engenharia reversa e decisões já registradas em memória do projeto:

- **Etapa 2 — Persistência real**: conectar o schema Prisma (`prisma/schema.prisma`) a um Postgres real (Neon/Supabase), migrar as entidades hoje mockadas (Fornecedor, Sócio, Safra, Contrato Bancário, Balanço, Indicadores) e trocar leitura de `initialData.ts` por queries via `@prisma/client`.
- **Etapa 3 — Autenticação real**: sair da tela de Login mockada para autenticação de verdade (NextAuth/Auth.js ou similar), proteger as rotas do route group `(app)`.
- **Etapa 4 — Módulos do backlog**: assim que houver engenharia reversa detalhada dos 8 módulos listados acima, replicar o mesmo processo desta etapa (tipos → mocks → tela → drawer).
- **Etapa 5 — Regras de negócio avançadas**: cronograma de amortização por parcela (`Parcela`), sincronização de IR, permissões por papel de usuário — todos mencionados na engenharia reversa mas fora do escopo de telas navegáveis.
