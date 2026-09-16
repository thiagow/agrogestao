# Mapeamento de Fontes — Tela Cotações

Documento de referência técnica: de onde vem cada número exibido na tela Cotações (`src/components/views/CotacoesView.tsx`), qual endpoint é consultado, em que unidade/escala a fonte devolve o dado e como ele é convertido até chegar na tela. Complementa `SPEC_TELA_COTACOES.md` (que descreve a UI/UX da tela) — este documento é sobre a origem e a corretude dos dados.

Gerado em 16/09/2026, após uma auditoria que testou cada fonte ao vivo (não só a lógica do código) e encontrou 3 bugs reais (detalhados na seção final).

---

## 1. Painel de Indicadores

Bloco introduzido em 16/09/2026 — adicional aos cards que já existiam, nunca os substitui.

| Indicador | Fonte | Endpoint / Série | Onde é buscado | Onde é lido pela tela |
|---|---|---|---|---|
| **Selic** | BCB SGS, série **432** (Meta Selic definida pelo Copom, % a.a.) | `api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1` | Botão **Bancos → Cronograma → "Atualizar Índices"** (`atualizarIndices()`, `src/server/indices.ts`) | `listIndicadoresPainel()` — só leitura, Cotações não dispara fetch próprio |
| **CDI** | BCB SGS, série **4389** (CDI anualizado, base 252) | `api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados/ultimos/1` | idem | idem |
| **IPCA Acumulado (12m)** | BCB SGS, série **13522** | `api.bcb.gov.br/dados/serie/bcdata.sgs.13522/dados/ultimos/1` | idem | idem |
| **Dólar (USD/BRL)** | PTAX oficial do BCB (fallback: AwesomeAPI) | `olinda.bcb.gov.br/.../CotacaoDolarPeriodo` | Botão **Cotações → "Atualizar"** (`refreshCotacoes()`, `src/server/cotacoes.ts`) | `listCotacoes().dolar` |
| **Euro (EUR/BRL)** | PTAX oficial do BCB (fallback: AwesomeAPI) | `olinda.bcb.gov.br/.../CotacaoMoedaPeriodo(moeda='EUR')` | idem | `listCotacoes().euro` |

**Importante — Selic ≠ CDI**: são taxas distintas, buscadas de séries diferentes. O painel mostra as duas porque o usuário pediu — mas **nenhum cálculo de juros do sistema usa a Selic**. Os contratos bancários indexados (CDI+spread) sempre calculam com o CDI (série 4389). A Selic é só informativa.

**Por que Selic/CDI/IPCA não têm botão de atualizar na própria tela Cotações**: esses 3 índices já são buscados pelo motor de juros de Bancos (`atualizarIndices()`), que também regrava o cronograma de amortização dos contratos indexados. Duplicar essa busca em Cotações criaria dois pontos de verdade buscando a mesma coisa. Cotações só lê o valor mais recente já gravado.

---

## 2. Câmbio (Dólar / Euro)

Estratégia idêntica para os dois, com o Dólar sendo a peça histórica e o Euro replicando o mesmo desenho (16/09/2026):

1. **PTAX oficial do BCB** (fonte primária) — `olinda.bcb.gov.br`, mesmo host que `fetchExpectativasFocusAnuais` já usa com sucesso em produção.
   - Dólar usa o endpoint dedicado `CotacaoDolarPeriodo` — devolve só o fechamento oficial, 1 linha por dia útil.
   - Euro usa o endpoint genérico `CotacaoMoedaPeriodo(moeda='EUR')` — devolve **todos os boletins do dia** (Abertura + até 3× Intermediário + Fechamento). Por isso a consulta filtra `$filter=tipoBoletim eq 'Fechamento'` antes de pegar as 2 últimas linhas (hoje + dia útil anterior, para calcular a variação % de verdade).
2. **AwesomeAPI** (reserva) — só entra se a PTAX não responder. Mantida porque entrega máxima/mínima intradiárias que a PTAX não tem.

Nenhum cálculo do sistema depende do Euro. O Dólar é o único câmbio usado para converter as commodities de USD para R$ (ver seção 3).

---

## 3. Commodities Agrícolas (Yahoo Finance)

Todas buscadas em `query1.finance.yahoo.com/v8/finance/chart/{ticker}`, endpoint não-oficial mas de leitura pública amplamente usada. Falha por ticker é isolada (fail-soft) — se um cair, os outros seguem.

A conversão de unidade (`src/lib/commodity-unidade.ts`) tem duas etapas independentes:
- **Escala**: o preço vem em centavos de dólar (USX) ou em dólares inteiros (USD)? Isso **não é mais uma suposição fixa por commodity** — vem do campo `meta.currency` que a própria Yahoo devolve em cada resposta (ver "Bugs encontrados" abaixo).
- **Peso/volume**: fator físico (bushel/lb/cwt/ton/galão → saca/arroba/tonelada/litro), aplicado depois da escala.

| Commodity | Ticker | Bolsa | Escala real | Peso/volume nativo | Unidade final | Trava preço por safra? |
|---|---|---|---|---|---|---|
| Soja Grão | `ZS=F` | CBOT | USX | bushel (60 lb) | sc (60kg) | Sim |
| Milho Grão | `ZC=F` | CBOT | USX | bushel (56 lb) | sc (60kg) | Sim |
| Trigo | `ZW=F` | CBOT | USX | bushel (60 lb) | sc (60kg) | Sim |
| Boi Gordo | `GF=F` | CME | USX | lb | @ (15kg) | Sim |
| Café Arábica | `KC=F` | ICE | USX | lb | sc (60kg) | Sim |
| Algodão Pluma | `CT=F` | ICE | USX | lb | @ (15kg) | Sim |
| Açúcar | `SB=F` | ICE | USX | lb | sc (50kg) | Sim |
| Óleo de Soja | `ZL=F` | CBOT | USX | lb | lb (sem saca confirmada) | Sim |
| Farelo de Soja | `ZM=F` | CBOT | **USD** | ton curta (2.000 lb) | ton (métrica) | Sim |
| Arroz | `ZR=F` | CBOT | **USD** | cwt (100 lb) | sc (50kg) | Sim |
| Álcool | `EH=F` | CBOT | USD | galão | L (litro) | Sim |
| Petróleo | `CL=F` | CME (NYMEX) | USD | barril | bbl (sem conversão) | Sim |
| Óleo de Aquecimento | `HO=F` | CME (NYMEX) | **USD** | galão | L (litro) | Sim |
| Frango | — | **MANUAL** | — | — | kg | Sim (único preço que existe — não há cotação de mercado) |
| Suíno | — | **MANUAL** | — | — | kg | Sim (idem) |

**Frango e Suíno** não têm nenhuma fonte de bolsa — o preço varia por região e é sempre digitado pelo cliente diretamente no campo "Preço Definido". O botão "Atualizar" e o "Aplicar Mercado" nunca tocam nessas duas linhas.

**Óleo de Soja** fica sem conversão de peso confirmada (mantém USD/lb bruto) pelo mesmo motivo que valia para o Algodão até 16/09/2026: não existe uma embalagem/unidade comercial brasileira padronizada para óleo de soja a granel.

---

## 4. Preço Definido (trava por safra)

Independente da cotação de mercado, cada commodity pode ter um preço "travado" manualmente por safra (`PrecoDefinidoSafra`, global entre contas). É esse valor — nunca a cotação de mercado bruta — que alimenta Comercialização e Arrendamento (`resolverPrecoFallback()`). O botão "Aplicar Mercado" copia o preço de mercado atual para a trava da safra selecionada, exceto para Frango/Suíno (sem preço de mercado pra copiar).

---

## 5. Bugs encontrados nesta auditoria (16/09/2026) e já corrigidos

1. **Euro — variação % errada.** O endpoint `CotacaoMoedaPeriodo` devolve todos os boletins intradiários (não só o fechamento, diferente do endpoint dedicado do Dólar). Sem filtro, a consulta pegava o fechamento de hoje e o intermediário de minutos antes (mesmo dia) em vez do fechamento do dia útil anterior — o preço em si saía certo, mas a "variação %" comparava dois pontos do mesmo dia. **Corrigido** adicionando `$filter=tipoBoletim eq 'Fechamento'`.
2. **Arroz — preço 100× menor que o real.** Estava cadastrado com a mesma escala dos outros grãos (centavos/USX), mas o ticker `ZR=F` devolve o preço em dólares inteiros (USD). **Corrigido** — ver item 3 abaixo.
3. **Óleo de Aquecimento — mesmo bug do Arroz.** `HO=F` também devolve USD, não USX. **Corrigido** do mesmo jeito.

**Correção estrutural** (não só um patch nos 2 casos): a escala centavos-vs-dólar deixou de ser uma suposição fixa por commodity e passou a vir do campo `meta.currency` que a própria Yahoo devolve em cada resposta (`QuoteResult.moedaOriginal`, `src/lib/market-data.ts` → `converterCotacaoCommodity()`, `src/lib/commodity-unidade.ts`). Isso elimina essa classe inteira de bug — inclusive se a bolsa mudar a convenção de algum contrato no futuro, o sistema se ajusta sozinho, sem depender de alguém lembrar de atualizar uma tabela estática.

---

## 6. Limitações conhecidas

- Não foi possível testar ao vivo os endpoints de SGS (`api.bcb.gov.br`) a partir do ambiente de auditoria — o host rejeitou a requisição (mesmo padrão de bloqueio por IP de datacenter já documentado no projeto para a AwesomeAPI). Os números das séries (432/4389/13522) estão corretos por serem identificadores públicos e amplamente documentados do BCB, mas a checagem ao vivo ficou pendente para quando o código rodar no ambiente real (Netlify).
- Yahoo Finance é um endpoint não-oficial. Se a Yahoo mudar a estrutura da resposta (`meta.currency`, `regularMarketPrice`), o fail-soft garante que o sistema não trava — mas o preço daquela commodity simplesmente para de atualizar até alguém notar.
