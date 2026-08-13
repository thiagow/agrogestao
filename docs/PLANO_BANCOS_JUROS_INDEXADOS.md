# Bancos — Cronograma Consolidado e Juros Indexados (CDI / IPCA / Dólar)

> **Status: implementado em 13/08/2026.** 55 testes verdes (`npm test`), `tsc --noEmit` e `next build` limpos, migration `20260813120000_juros_indexados` aplicada em produção. Divergências entre o plano e o que foi entregue estão na seção "Ajustes durante a execução", no fim.

## Context

A aba **Cronograma** de Bancos hoje mostra uma tabela plana de parcelas de **um** contrato por vez ([BancosView.tsx:22-93](src/components/views/BancosView.tsx#L22-L93)), enquanto o AgroFlow original mostra uma **projeção consolidada por ano** de todos os contratos ativos: colunas Ano / Juros / Amortização / Total e uma coluna "Composição por Tipo" com chips por Tipo de Operação, fechando numa linha de Total Geral. Print fotografado pelo usuário em 13/08/2026.

Por baixo há um problema mais grave que o layout. O motor de cronograma ([src/lib/amortizacao.ts](src/lib/amortizacao.ts)) só conhece **uma** taxa nominal, e [contratos-bancarios.ts:133](src/server/contratos-bancarios.ts#L133) passa `taxaJurosAnual: parsed.taxaJuros` e nada mais. Consequência: **todo contrato `CDI + spread`, `IPCA + spread` ou `Dólar + juros` gera hoje um cronograma subestimado** — o indexador nunca entra na conta. O campo `taxaAdicional` (rotulado "Spread / Taxa Adicional" no Drawer) é persistido desde a Fase 3 e nunca foi lido por cálculo nenhum. E não existe no projeto nenhuma fonte de CDI ou IPCA: `Cotacao` cobre só commodities e câmbio USD/BRL.

Entrega desta fase: o Cronograma vira a projeção consolidada por ano do print, e os juros de cada contrato passam a refletir o indexador real somado ao spread, respeitando a Capitalização (Simples/Composta) e a Base de Cálculo já cadastradas.

**Decisões tomadas com o CTO:**

1. **Um único campo de taxa.** `taxaAdicional` é **removido** do schema e do Drawer. O campo `Taxa` passa a ser a taxa cheia no Pré-fixado e o spread nos indexados — dois campos para o mesmo conceito era ruído de modelagem herdado da Fase 3.
2. **Snapshot + botão "Atualizar Índices".** Índices persistidos num model novo, ingeridos do Banco Central; o botão regrava os cronogramas dos contratos indexados. Sem fetch a cada render — a tela não pode depender de rede para abrir, e a `Parcela` persistida não pode divergir do que a tela mostra.
3. **Dólar + juros = juros em USD + conversão.** Os juros são a taxa do campo aplicada sobre o saldo em USD; a parcela é convertida para BRL pela cotação vigente, que fica registrada no contrato. É como o contrato dolarizado (CPR/Barter) realmente funciona, e reaproveita o `moeda = USD` que já existe.

---

## Regra de negócio — taxa efetiva

| Tipo de Taxa | Taxa efetiva a.a. | Fonte do indexador |
|---|---|---|
| `Pré-fixado (% a.a.)` | `taxa` | — |
| `CDI + spread` | `CDI + taxa` | BCB SGS **4389** — CDI anualizado base 252 |
| `IPCA + spread` | `IPCA + taxa` | BCB SGS **13522** — IPCA acumulado 12 meses |
| `Dólar + juros` | `taxa` (juros sobre saldo em USD) | AwesomeAPI USD-BRL, para a conversão |

Endpoint verificado ao vivo em 13/08/2026:

```
GET https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados/ultimos/1?formato=json
→ [{"data":"12/08/2026","valor":"13.90"}]

GET https://api.bcb.gov.br/dados/serie/bcdata.sgs.13522/dados/ultimos/1?formato=json
→ [{"data":"01/07/2026","valor":"4.44"}]
```

API pública do Banco Central, sem chave, sem cadastro — mesma categoria de fonte das duas já usadas em [market-data.ts](src/lib/market-data.ts). É a fonte primária do dado, não um agregador: para um número que alimenta projeção de dívida de centenas de milhões, não se usa scraping de portal.

**Simples vs. Composta já está resolvido.** `taxaDoPeriodo()` ([amortizacao.ts:72-82](src/lib/amortizacao.ts#L72-L82)) já implementa `(1+i)^f − 1` para Composta e `i × f` para Simples, com a fração do ano vinda da Base de Cálculo. Nada muda ali — basta passar a taxa **efetiva** onde hoje entra a nominal.

**Índice indisponível nunca vira número inventado.** Se o índice nunca foi buscado ou a fonte falhou, o contrato é calculado só com o spread e marcado explicitamente na UI como pendente de atualização. Mesmo critério já adotado em [src/lib/indicadores.ts](src/lib/indicadores.ts), que expõe "indisponível" em vez de estimar.

---

## Arquitetura

```
BCB SGS 4389 (CDI) ─┐
BCB SGS 13522 (IPCA)├─→ market-data.ts ─→ server/indices.ts ─→ IndiceMercado (global)
AwesomeAPI USD-BRL ─┘                            │
                                                 ↓
                          contratos-bancarios.ts :: regerarCronograma()
                                                 │
                       lib/taxa-efetiva.ts ──────┤  (pura: tipoTaxa + taxa + índices → taxa a.a.)
                       lib/amortizacao.ts ───────┤  (pura: taxa a.a. → parcelas)
                                                 ↓
                                          Parcela (sempre em BRL)
                                                 ↓
                          listCronogramaConsolidado() → BancosView :: CronogramaTab
```

`IndiceMercado` é **global**, não pendura em `Conta` — o CDI é o mesmo para todos os tenants. Mesmo critério já usado por `Cotacao`, que é chaveada por `commodity` e não por propriedade.

`Parcela` continua **sempre em BRL**, mesmo para contrato em USD. BRL é a moeda de consolidação de todo o app (KPIs de Bancos, Resumo, Fluxo de Caixa Mensal); persistir parcela em moeda mista quebraria toda soma a jusante. A cotação aplicada fica registrada no contrato, e o botão Atualizar reprocessa.

---

## Implementação

### 1. Schema — `prisma/schema.prisma`

```prisma
enum TipoIndice { CDI  IPCA  USD }

model IndiceMercado {
  id             String     @id @default(cuid())
  tipo           TipoIndice @unique
  valor          Decimal    @db.Decimal(10, 4) // CDI/IPCA: % a.a. | USD: BRL por USD
  unidade        String                        // "% a.a." | "BRL/USD"
  fonte          String                        // "BCB SGS 4389" | "AwesomeAPI USD-BRL"
  dataReferencia DateTime                      // data do dado na fonte, não a do fetch
  atualizadoEm   DateTime   @default(now())
  @@map("indices_mercado")
}
```

Em `ContratoBancario` — **remover** `taxaAdicional` e **adicionar** a memória de cálculo do último cronograma gerado (sem isso não há como saber se o cronograma está velho nem de que número ele saiu):

```prisma
taxaEfetivaAplicada Decimal?  @db.Decimal(8, 4)  // % a.a. efetivamente usada
indiceReferencia    Decimal?  @db.Decimal(10, 4) // valor do CDI/IPCA/USD aplicado
indiceAtualizadoEm  DateTime?
```

`npm run db:migrate`. `prisma/seed.ts` passa a chamar `atualizarIndices()` para que ambiente novo não nasça sem índice.

### 2. `src/lib/market-data.ts` — nova fonte, mesmo contrato

Adicionar, seguindo exatamente o padrão fail-soft de `fetchDolarBRL` (timeout 8s via `AbortSignal.timeout`, `next: { revalidate: 0 }`, `if (!res.ok) return null`, `try/catch { return null }` — nunca lança):

```ts
export interface IndiceResult { valor: number; dataReferencia: string } // YYYY-MM-DD
export async function fetchSerieBcb(codigo: number): Promise<IndiceResult | null>
```

O BCB devolve `data` como `dd/MM/yyyy` — converter na leitura. `fetchDolarBRL()` é reaproveitado como está para o USD.

### 3. `src/lib/taxa-efetiva.ts` — novo, função pura

Coração da regra, isolado e testável — mesma filosofia de `amortizacao.ts`, `indicadores.ts` e `patrimonio.ts`:

```ts
export interface IndicesVigentes {
  cdiAA: number | null; ipcaAA: number | null; usdBrl: number | null; atualizadoEm?: string;
}

export interface TaxaEfetiva {
  taxaAnual: number;              // % a.a. a passar para gerarCronograma
  moedaCalculo: 'BRL' | 'USD';    // 'USD' só em Dólar + juros
  cotacaoAplicada: number | null; // usdBrl usado na conversão
  indiceUsado: number | null;     // CDI/IPCA/USD aplicado → indiceReferencia
  indisponivel: boolean;          // índice necessário faltando
  memoria: string;                // "CDI 13,90% + 4,00% = 17,90% a.a."
}

export function calcularTaxaEfetiva(
  tipoTaxa: ContratoBancario['tipoTaxa'],
  taxa: number,
  indices: IndicesVigentes
): TaxaEfetiva
```

`memoria` não é decoração: é o que a UI exibe no Drawer e na aba. O usuário precisa ver de onde saiu o número, tanto no cadastro quanto na projeção.

### 4. `src/server/indices.ts` — novo

- `listIndices(): Promise<IndicesVigentes>` — `requireUser()`, lê as 3 linhas de `IndiceMercado`.
- `atualizarIndices()` — `requireContext()`; busca as 3 fontes em sequência acumulando `falhas: string[]` sem abortar (padrão de `refreshCotacoes`, [cotacoes.ts:34-105](src/server/cotacoes.ts#L34-L105)), faz `upsert` por `tipo`, e em seguida **regrava o cronograma de todos os contratos indexados da propriedade ativa** (`tipoTaxa !== 'Pré-fixado (% a.a.)'`). Contratos pré-fixados não são tocados. Retorna `{ atualizados, falhas, contratosRecalculados }` e revalida `/bancos`, `/resumo`, `/fluxo_safra`.

### 5. `src/server/contratos-bancarios.ts` — refatorar

Extrair de `saveContratoBancario` (hoje L129-155) uma função interna `regerarCronograma(contrato, indices)`:

1. `calcularTaxaEfetiva(...)`;
2. `gerarCronograma({ ..., taxaJurosAnual: taxaEfetiva.taxaAnual })`;
3. quando `moedaCalculo === 'USD'`, converter cada parcela por `cotacaoAplicada` antes de persistir;
4. gravar `taxaEfetivaAplicada` / `indiceReferencia` / `indiceAtualizadoEm` no contrato;
5. `deleteMany` + `createMany` das parcelas — comportamento atual preservado (não há UI de baixa, nada de `pago` a proteger).

Chamada tanto pelo save quanto por `atualizarIndices()`.

Novo server action para a aba:

```ts
export async function listCronogramaConsolidado(): Promise<{
  anos: { ano: number; juros: number; amortizacao: number; total: number;
          porTipo: { tipoOperacao: string; total: number }[] }[];
  totalJuros: number; totalAmortizacao: number; totalGeral: number;
  anoInicial: number; anoFinal: number;
  contratosSemIndice: number;
}>
```

Uma query só, escopada por `requireContext()`:

```ts
db.parcela.findMany({
  where: { contrato: { propriedadeId: ctx.propriedade.id, ativo: true } },
  include: { contrato: { select: { tipoOperacao: true } } }
})
```

agregada em memória por ano de `dataPagamento`. `anoInicial` = menor ano com parcela; `anoFinal` = **maior ano de `dataVencimento` entre os contratos** — no print o título diz "2026 a 2036" com linhas só até 2029, ou seja, o teto vem do vencimento e não das parcelas. Linhas só para anos que têm parcela.

Remover `taxaAdicional` de `SaveContratoInput`, do objeto `data` (L105), de `ContratoRow` e de `toContratoDTO`.

### 6. Boundary e tipos

- [src/lib/validation.ts](src/lib/validation.ts) — tirar `taxaAdicional` de `contratoBancarioSchema`.
- [src/types.ts](src/types.ts) — tirar `taxaAdicional` de `ContratoBancario`.
- [src/lib/enum-maps.ts](src/lib/enum-maps.ts) — **nenhum mapa novo**: `TipoIndice` é ASCII puro e passa direto, mesmo caso de `SistemaAmortizacao` e `Currency`.

### 7. `src/components/ContratoBancarioDrawer.tsx`

- Remover o bloco condicional "Spread / Taxa Adicional (% a.a.)" (L362-371) e seu state.
- Label do campo Taxa passa a ser dinâmico pelo `tipoTaxa`: `Taxa (% a.a.)` / `Spread sobre o CDI (% a.a.)` / `Spread sobre o IPCA (% a.a.)` / `Juros em USD (% a.a.)`. Hoje o label diz "% a.a." mesmo em contrato indexado, o que é enganoso.
- `hint` do campo mostrando a taxa efetiva ao vivo — a `memoria` de `calcularTaxaEfetiva`, calculada no client a partir dos índices recebidos por prop. Função pura, roda nos dois lados sem custo.
- Corrigir o label fixo "Valor Contratado (R$)" para refletir a `moeda` selecionada (R$ / US$) — hoje mente em contrato USD.

### 8. `src/components/views/BancosView.tsx` — aba Cronograma

Reescrever `CronogramaTab` (L22-93):

- **Faixa de índices** no topo: `CDI 13,90% · IPCA 4,44% · USD 5,42 — atualizado em 12/08/2026` + botão **Atualizar Índices**, replicando o padrão de [CotacoesView.tsx:86-121](src/components/views/CotacoesView.tsx#L86-L121) (`useTransition` + `router.refresh()`, ícone `RefreshCw` com `animate-spin`, banner âmbar para falha parcial). Badge âmbar quando `contratosSemIndice > 0`.
- **Tabela consolidada** replicando o print: `Ano` / `Juros` (âmbar) / `Amortização` (azul) / `Total` (rose, bold) / `Composição por Tipo` (chips `Badge` tone `slate`, ordenados desc por valor). Linha final **Total Geral** com fundo `slate-50`.
- Cabeçalho: `Cronograma de Amortização — {anoInicial} a {anoFinal}`, subtítulo "Projeção consolidada de pagamentos por ano, incluindo juros e amortização de todos os contratos ativos."
- **Preservar o detalhamento por contrato** como sub-seção "Detalhar por contrato": o `Select` + tabela de parcelas atuais, intactos.

Os dados do consolidado vêm por **prop** de [(app)/[tab]/page.tsx](src/app/(app)/[tab]/page.tsx) (Server Component chamando `listCronogramaConsolidado()` e `listIndices()`), não por `useEffect` no client — é o padrão do projeto e elimina o flash de "Carregando…". `page.tsx` repassa via `TabView` para `BancosView`, mesmo caminho já usado por `contratos`. `listParcelas` por contrato segue client-side, pois depende de seleção.

### 9. Testes

Não existe runner no projeto — `npm run lint` é só `tsc --noEmit`. Um motor financeiro que projeta R$ 192 milhões não pode seguir sem gate. Introduzir **vitest** (`vitest` como devDependency, script `"test": "vitest run"`), cobrindo as funções puras:

- `src/lib/taxa-efetiva.test.ts` — as 4 combinações de tipo de taxa, índice ausente e as strings de memória.
- `src/lib/amortizacao.test.ts` — SAC / PRICE / BULLET / JUROS_PERIODICOS: soma dos principais igual ao saldo inicial, saldo final zero, PRICE com parcela constante, Simples produzindo juros menores que Composta, carência sem amortizar principal.

Vitest é a escolha certa aqui — nativo a ESM/TS, zero config. Não conflita com a regra de "sem lib de formulário" registrada no `CLAUDE.md`, que trata de validação de client.

---

## Arquivos

**Novos:** `src/lib/taxa-efetiva.ts`, `src/server/indices.ts`, `src/lib/taxa-efetiva.test.ts`, `src/lib/amortizacao.test.ts`, `vitest.config.ts`, migration.

**Modificados:** `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/market-data.ts`, `src/lib/validation.ts`, `src/types.ts`, `src/server/contratos-bancarios.ts`, `src/components/ContratoBancarioDrawer.tsx`, `src/components/views/BancosView.tsx`, `src/components/TabView.tsx`, `src/app/(app)/[tab]/page.tsx`, `package.json`, `CLAUDE.md`.

---

## Verificação

1. `npm run lint` (tsc) e `npm run test` (vitest) verdes.
2. **Migration sem perda de dado.** `taxaAdicional` só existia em contratos indexados e nunca alimentou cálculo nenhum, mas o número foi digitado por alguém. Conferir antes com `SELECT count(*) FROM contratos_bancarios WHERE "taxaAdicional" IS NOT NULL AND "taxaAdicional" > 0`; havendo linhas, a migration soma o spread na taxa (`UPDATE ... SET "taxaJuros" = "taxaJuros" + "taxaAdicional"`) **antes** do `DROP COLUMN`.
3. `npm run dev` → Bancos → cadastrar contrato **CDI + spread**, SAC, anual, 5 anos, R$ 10.000.000, taxa 4%. Os juros do 1º ano devem bater com 17,90% a.a. (CDI 13,90 + 4,00), não com 4%.
4. Duplicar o contrato mudando Capitalização para **Simples** — os juros devem cair.
5. Cadastrar contrato **Dólar + juros** em USD: a parcela em BRL deve ser igual à parcela em USD × cotação exibida na faixa de índices.
6. Clicar **Atualizar Índices**: a data de referência muda e os cronogramas indexados são regravados; os pré-fixados ficam byte-idênticos.
7. Conferir a tabela consolidada contra a soma manual das parcelas de 2 contratos em anos que se sobrepõem, e os chips de "Composição por Tipo" contra o Tipo de Operação de cada contrato.
8. **Fail-soft:** derrubar a rede e clicar Atualizar — a tela mantém os últimos índices e mostra o banner âmbar de falha parcial, nunca zera nem apaga cronograma.

---

## Ajustes durante a execução

**1. Dois bugs de arredondamento no motor de amortização, achados pelos testes novos.** Não estavam no escopo do plano — apareceram porque o `amortizacao.ts` nunca tinha tido teste:

- `valorTotal` era `round2(principal + juros)` enquanto `valorPrincipal` e `valorJuros` eram arredondados separadamente, então a parcela persistida não fechava consigo mesma (`principal + juros ≠ total`, diferença de 1 centavo).
- O saldo era rastreado sem arredondamento, e a soma dos principais não batia com o valor contratado (R$ 999.999,99 num contrato de R$ 1.000.000 com carência).

Corrigido: o saldo passa a ser mantido em centavos exatos a cada período e a última parcela liquida o remanescente. Agora a soma dos principais bate exatamente com o contratado, o saldo final é exatamente zero e `valorTotal === valorPrincipal + valorJuros` em toda parcela — os três invariantes estão travados por teste, nos 4 sistemas de amortização.

**2. Simples nem sempre cobra menos que Composta** — a verificação nº 4 deste plano ("mudar para Simples, os juros devem cair") estava errada e foi corrigida no teste. A relação depende da fração do ano de cada período: como Composta = `(1+i)^f − 1` e Simples = `i × f`, para períodos **mensais** (`f < 1`) a **Simples cobra mais**; para períodos **anuais sobre base 360** (`f > 1`) a **Composta cobra mais**. Não há uma direção única. As duas pontas viraram teste, justamente para ninguém "consertar" uma delas achando que é bug.

**3. `converterParcelasParaBrl` virou função pura exportada** (`taxa-efetiva.ts`) em vez de conversão inline no engine, para a conversão USD→BRL ficar testável sem tocar o banco.

**4. `regerarCronograma` foi para um módulo próprio** (`src/server/cronograma-engine.ts`, sem `'use server'`), porque é compartilhado entre dois módulos de server actions e um arquivo `'use server'` só pode exportar server actions assíncronas.

**5. O KPI "Custo Médio Ponderado" e a coluna "Taxa" da lista de contratos** passaram a usar a taxa **efetiva**, não a cadastrada. Com a nova semântica do campo, um contrato CDI + spread tem `taxaJuros = 4` — mostrar isso como custo da dívida subestimaria o indicador em ~14 pontos. A coluna exibe a efetiva em destaque e o spread como linha secundária.

**6. Migration aplicada com `migrate deploy`, não `migrate dev`.** O banco tinha **drift pré-existente**, e `migrate dev` exigia reset do banco de produção. O SQL foi gerado com `migrate diff` contra o banco real e aplicado com `migrate deploy`.

---

## Adendo (13/08/2026) — os dois pontos fora do escopo foram resolvidos

### Drift de migrations — eliminado

Com o shadow database (`db_agrogestao_shadow`) criado pelo CTO, o catch-up foi fechado:

1. SQL gerado por `migrate diff --from-migrations prisma/migrations --to-url <produção> --shadow-database-url <shadow>`.
2. **Revisado à mão**, com uma correção sobre o SQL gerado: `tipoOperacao` é `NOT NULL` sem `@default`, e o diff emitia `ADD COLUMN NOT NULL` sem default — que falha em tabela com linhas. Virou `ADD COLUMN ... DEFAULT` + `DROP DEFAULT`, deixando o schema final idêntico ao de produção.
3. Salvo como `20260807000000_agroflow_contratos_e_grupo_economico` (datado de quando o drift foi realmente introduzido, antes da migration de juros) e registrado em produção com `migrate resolve --applied` — **nenhum comando rodou contra o banco de produção**.
4. **Provado**, não presumido: as 15 migrations foram replicadas num banco vazio e comparadas. `diff(histórico replicado → produção)` = vazio; `diff(produção → schema.prisma)` = vazio. `migrate status` diz "Database schema is up to date!".

Impacto: staging e recuperação de desastre voltam a ser possíveis a partir do repositório, e um desenvolvedor novo consegue subir banco local. `prisma migrate dev` volta a funcionar (basta configurar `SHADOW_DATABASE_URL`).

Dois utilitários novos: `scripts/checar-shadow.mjs` (confere que o shadow está vazio antes do uso) e `scripts/limpar-shadow.mjs` (zera o shadow, com trava que verifica `current_database()` no servidor e recusa qualquer banco que não se chame `db_agrogestao_shadow`).

### Vulnerabilidades — `npm audit` em zero

Antes de agir, a exposição real foi medida, e é bem menor que o relatório sugere:

- **`sharp`**: `next/image` **não é importado em lugar nenhum** do projeto (o que parecia uso era `Image as ImageIcon`, do lucide-react), e não há `images` no `next.config.ts`. O sharp está instalado mas nunca é invocado.
- **`postcss`**: dependência de build, processando o nosso próprio CSS. A cópia vulnerável (8.4.31) era a interna do Next; o pipeline Tailwind já usava a 8.5.26 corrigida.

Também foi verificado que o backport `next@15.5.23` **ainda fixa postcss 8.4.31** — a linha 15.x não corrige, confirmando que o Next 16 é o único caminho oficial.

Resolvido por `overrides` no `package.json` (`postcss@^8.5.26`, `sharp@^0.35.3` — patches dentro da mesma major): `npm audit` foi de 3 high para **0 vulnerabilidades**, com `tsc`, os 55 testes e o `next build` inalterados (bundle byte a byte igual). O Next 16 deixa de ser urgência de segurança e vira upgrade planejado; quando acontecer, **os overrides devem ser removidos**.
