# Plano de Replicação do AgroFlow

Roadmap de replicação do sistema AgroFlow no AgroGestão, com base em duas engenharias reversas locais (não versionadas, gitignored):
- `ENGENHARIA_REVERSA_AGROFLOW_2026.md.pdf` — versão inicial (21/07/2026), detalhava 5 dos 14 módulos.
- `ENGENHARIA_REVERSA_AGROFLOW_COMPLETA_2026.md` — versão expandida (21/07/2026), detalha os **14 módulos** em profundidade, com schema relacional completo.

## Etapa 1 — Telas navegáveis com dados mockados (concluída em 2026-07-24)

Escopo: só frontend, sem persistência real (Prisma/Postgres seguem scaffolded e desconectados — ver `CLAUDE.md`). Todas as telas usam dados mock de `src/data/initialData.ts`, com CRUD apenas em memória (state React), navegação real via `src/app/(app)/[tab]/page.tsx`.

### Rodada 1 — 5 módulos detalhados na doc inicial + Login + Fornecedores

| Tela | Arquivos principais |
|---|---|
| Login (não coberto pela doc, mock visual) | `src/app/login/page.tsx`, `src/app/(app)/layout.tsx` |
| Resumo | `src/components/views/ResumoView.tsx` |
| Cadastro Mestre (aba Sócios) | `src/components/views/CadastroMestreView.tsx`, `src/components/SocioDrawer.tsx` |
| Quadro de Safra | `src/components/views/QuadroSafraView.tsx`, `src/components/SafraDrawer.tsx` |
| Bancos | `src/components/views/BancosView.tsx`, `src/components/ContratoBancarioDrawer.tsx` |
| Análise Financeira (aba Índices) | `src/components/views/AnaliseFinanceiraView.tsx` |
| Fornecedores (ajuste de campos: CNPJ/CPF, contato, Compras/Faturas) | `src/components/SupplierDrawer.tsx` |

### Rodada 2 — 8 módulos restantes, a partir da doc expandida (14/14 módulos)

| Tela | Arquivos principais |
|---|---|
| Aquisição de Fazendas | `src/components/views/AquisicaoFazendaView.tsx`, `src/components/AquisicaoDrawer.tsx` |
| Arrendamentos | `src/components/views/ArrendamentosView.tsx`, `src/components/ArrendamentoDrawer.tsx` |
| Comercialização (Futuros/Hedge) | `src/components/views/ComercializacaoView.tsx`, `src/components/ContratoComercialDrawer.tsx` |
| Balanço PJ | `src/components/views/BalancoPjView.tsx` |
| Fluxo de Safra Projetado | `src/components/views/FluxoSafraView.tsx` |
| Cotações (upgrade da versão simples herdada do template original) | `src/components/views/CotacoesView.tsx` |
| Fluxo de Caixa Mensal | `src/components/views/FluxoMensalView.tsx` |
| Apresentação do Grupo | `src/components/views/ApresentacaoGrupoView.tsx` |

**Todos os 14 módulos do menu estão implementados.** `GenericView` deixou de ser usado por qualquer rota (mantido no código como fallback defensivo, não removido).

### Decisões e recortes desta etapa

- **Cadastro Mestre**: Sócios, Bens e Direitos, Garantias, CAPEX e Grupo Econômico têm grid/formulário completo e persistência real (Prisma). Só "Sócios" tinha spec de campos na doc de engenharia reversa — as outras 4 usam estrutura de dados desenhada por julgamento de engenharia (não é réplica confirmada da tela original do AgroFlow), decisão explícita do usuário em 05/08/2026. Histórico do Grupo segue "em construção" — sem spec e sem decisão ainda se deve ser audit log automático (Fase 6) ou linha do tempo manual.
- **Bancos** *(desatualizado — snapshot da Etapa 1/mock; as 4 abas estão implementadas e persistidas desde 13/08/2026, ver `docs/PLANO_BANCOS_JUROS_INDEXADOS.md` e `docs/PLANO_BANCOS_FLUXO_DETALHADO.md`)*: originalmente só "Contratos" tinha grid completo; Por Credor, Cronograma e Fluxo Detalhado ficaram "em construção" até então.
- **Análise Financeira**: só a aba "Índices" tem conteúdo completo. O **Grupo 3 — Rentabilidade e Lucratividade** não foi implementado — mesmo a doc expandida lista as fórmulas (ROA, ROE, margens) mas não os valores/status, então os cards ficariam sem dado real para mostrar.
- **Fornecedores**: campos `cnpjCpf`, `contatoNome`, `contatoTelefone`, `contatoEmail`; sub-lista "Compras/Faturas" mockada (somente leitura no Drawer).
- **Login**: mock visual sem integração real, a partir dos tokens do `DESIGN.md` (auth segue adiada).
- **Aquisição de Fazendas / Arrendamentos / Comercialização**: abas "Fluxo por Safra", "Análise de Impacto", "Por Comprador" e "Gráficos" ficam "em construção" — a doc só detalha a aba principal (Contratos / Posição por Cultura) de cada uma.
- **Balanço PJ**: a doc original registra esse módulo como PREMIUM/paywall no AgroFlow real, mas por decisão do usuário foi implementado **desbloqueado**, com balanço + DRE mockados por empresa (não há paywall no AgroGestão).
- **Apresentação do Grupo**: o botão "Gerar Apresentação" simula a transição de estado (idle → gerando → pronta) sem produzir um arquivo `.pptx` real — geração de arquivo de verdade fica para quando houver backend.
- **Cotações**: reconstruída para bater com a doc (câmbio USD/BRL, cards de commodities com ticker/bolsa/máx/mín/volume, ações "Salvar"). A calculadora de trava que existia na versão anterior (não documentada na doc) foi removida para não divergir do padrão AgroFlow.
- **Fluxo de Caixa Mensal**: gráfico de curva de caixa (entradas/saídas/saldo acumulado) via `recharts`, calendário agrícola simplificado (pontos coloridos por mês/cultura em vez de Gantt completo), lançamentos mensais só como contagem/resumo (sem CRUD linha a linha nesta fase).
- **Discrepâncias entre as duas versões da doc**: a versão expandida traz valores diferentes da inicial para os mesmos campos em alguns pontos (ex: card "Endividamento" do Resumo, "Bancos: R$ 284.597" na doc expandida vs. saldo devedor total de ~R$ 171M no módulo Bancos da mesma doc — inconsistência da fonte, não do AgroGestão). Nesses casos os mocks foram preenchidos por módulo, sem tentar reconciliar artificialmente números que a própria fonte não reconcilia.

## Próximas etapas (fora do escopo desta rodada)

- **Etapa 2 — Persistência real**: conectar o schema Prisma (`prisma/schema.prisma`) a um Postgres real (Neon/Supabase) e migrar todas as entidades hoje mockadas — inclusive as 8 novas (Aquisição, Arrendamento, Contrato Comercial, Cotação, Lançamento Mensal, Empresa/Balanço PJ) — trocando `initialData.ts` por queries via `@prisma/client`.
- **Etapa 3 — Autenticação real**: sair do Login mockado para autenticação de verdade (NextAuth/Auth.js ou similar), proteger as rotas do route group `(app)`.
- **Etapa 4 — Abas "em construção"**: Bens e Direitos/Garantias/CAPEX/Grupo Econômico (Cadastro Mestre) implementados em 05/08/2026 — ver `prisma/schema.prisma` (`BemDireito`, `Garantia`, `Capex`, `EmpresaGrupo`). Restam: Histórico do Grupo (Cadastro Mestre), Por Credor/Cronograma/Fluxo Detalhado (Bancos), Fluxo por Safra/Análise de Impacto/Gráficos (Aquisição, Arrendamentos), Por Comprador/Gráficos (Comercialização), Balanço/Dados Complementares/Consolidado (Análise Financeira), Índices/Comparativo (Balanço PJ) — todas precisam de mais detalhamento de spec (campos, fórmulas) antes de sair do estado placeholder.
- **Etapa 5 — Regras de negócio avançadas**: cronograma de amortização por parcela, sincronização de IR (import de PDF), geração real de `.pptx`, cotações ao vivo (integração Yahoo Finance/CBOT/CME/ICE), permissões por papel de usuário.
