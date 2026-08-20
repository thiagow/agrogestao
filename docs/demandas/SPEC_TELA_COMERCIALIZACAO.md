# Especificação Técnica — Tela "Comercialização"

**Sistema:** AgroFlow — Análise de Produtor Rural
**URL:** `https://agroflow-rkqdvzdd.manus.space/dashboard/1050001/futuros`
**Menu lateral:** `Comercialização` (ícone entre "Arrendamentos" e "Balanço PJ")
**Cliente/Propriedade analisada:** Grupo Pereira (id 1050001)
**Safra selecionada durante a análise:** 2026/2027
**Data da análise:** 20/08/2026
**Documento destinado a:** agente de execução (Claude Code) — ajustes desta tela

> Este documento segue o mesmo padrão adotado em `SPEC_TELA_AQUISICAO_FAZENDA.md` e `SPEC_TELA_ARRENDAMENTO_RURAL.md`: mapeamento tela a tela, aba a aba, com de-para de campos, modais, campos calculados e cruzamentos com outras telas do sistema.

---

## 1. Visão Geral

A tela "Comercialização" (rota interna `/futuros`, nome de menu "Comercialização") é o módulo de **gestão de vendas/hedge de produção por safra**. Ela permite:

- Visualizar a posição de comercialização (fixado vs. a fixar) por cultura, para a safra selecionada.
- Cadastrar contratos de venda ("Novo Contrato" / "Cadastrar Contrato / Venda") vinculados a um comprador, cultura, safra, tipo de contrato e datas.
- Consultar os contratos já cadastrados (aba "Contratos Cadastrados").
- Consultar a posição consolidada por comprador (aba "Por Comprador").
- Visualizar gráficos de volume e valor por cultura e por comprador (aba "Gráficos").

**Estado dos dados no momento da análise:** a base do cliente "Grupo Pereira" **não possui nenhum contrato de comercialização cadastrado** para a safra 2026/2027. Isso significa que 100% dos indicadores desta tela estão no estado "zerado/a fixar total", o que é ao mesmo tempo uma limitação de cobertura de teste (não foi possível validar o comportamento da tela com dados reais) e um dado relevante em si (ver seção de BUGS, item sobre validação prematura do campo Comprador).

Diferente das telas Aquisição Fazenda e Arrendamento Rural (que trabalham sobre entidades já cadastradas e permitem explorar edição, exclusão e fluxos populados), a Comercialização, neste ambiente, só pôde ser documentada em seu **estado vazio** — a estrutura de campos do formulário e das abas foi mapeada por completo, mas o comportamento com contratos reais (edição, exclusão, recalculo de KPIs após cadastro) não pôde ser confirmado visualmente e deve ser tratado como **suposição a validar** pelo agente de execução.

---

## 2. Cabeçalho e KPIs

### 2.1 Cabeçalho

| Elemento | Conteúdo |
|---|---|
| Título | "Comercialização" |
| Subtítulo | "Posição de vendas, contratos e gestão de hedge por safra" |
| Seletor de Safra | Combobox, valor atual "2026/2027" (mesmo seletor global usado nas demais telas) |
| Botão de ação principal | "Novo Contrato" (abre modal "Cadastrar Contrato / Venda") |

### 2.2 Cards de KPI (5 cards no topo)

| Card | Valor observado | Subtexto | Observação |
|---|---|---|---|
| **Produção Total** | 1.689.764 sc | "Safra 2026/2027" | Soma da produção total de todas as culturas da safra (vem do Quadro de Safra — ver seção 8) |
| **Qtd Fixada** | 0 sc | "0.0% do total" | Soma do volume de contratos com preço fixado |
| **Qtd a Fixar** | 1.689.764 sc | "100.0% disponível" | = Produção Total − Qtd Fixada |
| **Preço Médio Fixado** | "—" (traço, não "R$ 0") | "Média ponderada" | Exibe "—" quando não há volume fixado (0 sc), ao invés de "R$ 0,00" — comportamento correto de guarda contra divisão por zero |
| **Receita Fixada** | R$ 0 | "+ R$ 438.003.709 a mercado" | Receita já travada em contratos fixados; o subtexto mostra o valor potencial a mercado do volume ainda não fixado |

**Campo calculado — fórmulas inferidas:**

```
Qtd Fixada        = SUM(Contrato.volume_sacas) WHERE Contrato.preco_fixado IS NOT NULL
Qtd a Fixar        = Producao_Total - Qtd_Fixada
% Fixado           = Qtd_Fixada / Producao_Total * 100
Preco_Medio_Fixado = SUM(Contrato.volume_sacas * Contrato.preco) / Qtd_Fixada   [se Qtd_Fixada > 0, senão exibe "—"]
Receita_Fixada     = SUM(Contrato.volume_sacas * Contrato.preco) WHERE preco_fixado
Valor_a_Mercado    = Qtd_a_Fixar * Cotacao_Atual_da_Cultura   (somado entre todas as culturas)
```

### 2.3 Barra de progresso "Progresso de Comercialização"

Componente abaixo dos cards, título "Progresso de Comercialização — Safra 2026/2027":

- Barra dupla: segmento "Fixado" (0.0%, verde/vazio no estado atual) + segmento "A Fixar" (100.0%, amarelo).
- Legenda esquerda: "0 sc fixadas — R$ 0"
- Legenda direita: "1.689.764 sc a fixar — R$ 438.003.709 a mercado"
- Indicador de status (bolinha verde) no canto superior direito do card — significado exato não confirmado (possivelmente indicador de "dados atualizados"/health check, presente também em outras telas do sistema).

---

## 3. Navegação por Abas

A tela possui 4 abas, todas abaixo do card de progresso:

1. **Posição por Cultura** (aba padrão/ativa ao carregar a tela)
2. **Contratos Cadastrados**
3. **Por Comprador**
4. **Gráficos**

---

## 4. Aba "Posição por Cultura"

Tabela única "Posição por Cultura — Safra 2026/2027" com 7 colunas e uma linha por cultura presente na safra, mais linha de TOTAL.

**Colunas:** Cultura | Produção Total | Fixado / A Fixar | Receita Fixada | Preço Médio | Valor a Mercado | Cotação

**Dados completos observados (8 culturas):**

| Cultura | Produção Total | Fixado (sc / %) | A Fixar (sc / %) | Receita Fixada | Valor a Mercado | Cotação |
|---|---|---|---|---|---|---|
| SOJA | 360.400 sc | 0 sc (0.0%) | 360.400 sc (100.0%) | R$ 0 | R$ 43.248.000 | R$ 120/sc |
| MILHO | 154.700 sc | 0 sc (0.0%) | 154.700 sc (100.0%) | R$ 0 | R$ 8.044.400 | R$ 52/sc |
| SERINGUEIRA | 1.604 sc | 0 sc (0.0%) | 1.604 sc (100.0%) | R$ 0 | R$ 9.784.400 | R$ 6.100/sc |
| CANA_DE_ACUCAR | 188.400 sc | 0 sc (0.0%) | 188.400 sc (100.0%) | R$ 0 | R$ 24.303.600 | R$ 129/sc |
| CAFE_IRRIGADO | 99.055 sc | 0 sc (0.0%) | 99.055 sc (100.0%) | R$ 0 | R$ 178.299.000 | R$ 1.800/sc |
| EUCALIPTO | 513.285 sc | 0 sc (0.0%) | 513.285 sc (100.0%) | R$ 0 | R$ 76.992.750 | R$ 150/sc |
| ARROZ | 150.060 sc | 0 sc (0.0%) | 150.060 sc (100.0%) | R$ 0 | R$ 16.206.480 | R$ 108/sc |
| BOVINO | 222.260 sc | 0 sc (0.0%) | 222.260 sc (100.0%) | R$ 0 | R$ 81.125.079 | R$ 365/sc |
| **TOTAL** | **1.689.764 sc** | **0 sc (0.0%)** | **1.689.764 sc (100.0%)** | **R$ 0** | **R$ 438.003.709** | — |

**Observações:**
- A coluna "Cultura" exibe o valor em `UPPER_SNAKE_CASE` (ex.: `CANA_DE_ACUCAR`, `CAFE_IRRIGADO`) — provavelmente o enum bruto do banco sendo exibido sem formatação/label amigável. Isso é inconsistente com outras telas do sistema (ex.: Quadro Safra) que exibem nomes de cultura formatados ("Cana-de-açúcar", "Café Irrigado"). Ver BUG #1.
- A coluna "Cotação" vem de outro módulo (tela "Cotações" — ver seção 8, Cruzamentos).
- `Valor a Mercado` = `A Fixar (sc) × Cotação (R$/sc)` — conferido linha a linha (ex. SOJA: 360.400 × 120 = 43.248.000 ✓; BOVINO: 222.260 × 365 = 81.124.900, mas o valor exibido é 81.125.079 — pequena divergência de R$ 179, possivelmente por casas decimais na cotação real não exibidas na coluna arredondada de R$/sc. Ver BUG #2).
- A linha TOTAL não repete a coluna "Cotação" (correto, pois não há cotação agregada única).

---

## 5. Aba "Contratos Cadastrados"

**Estrutura:**
- Filtro no topo: combobox "Todas as safras" (permite filtrar contratos por safra específica ou ver todas).
- Título da seção: "Contratos e Operações Cadastradas".
- **Estado vazio observado:** "Nenhum contrato cadastrado."

Como não há contratos cadastrados no ambiente analisado, **não foi possível observar a estrutura de card/tabela de um contrato preenchido** (colunas exibidas, ações disponíveis — editar/excluir/liquidar, badges de status). Esse é um ponto de cobertura pendente — recomenda-se ao agente de execução cadastrar um contrato de teste (ex.: via botão "Novo Contrato") e recapturar esta aba para completar a especificação visual antes de programar ajustes que dependam da estrutura exata da listagem.

**Inferência razoável** (baseada no padrão das telas Aquisição e Arrendamento, que usam cards expansíveis por contrato com uma tabela de "fluxo de pagamento" interna): é provável que cada contrato cadastrado apareça como um card com cabeçalho (Cultura, Comprador, Status) e, ao expandir, detalhes do contrato (Volume, Preço, Câmbio, Datas). **Isso é uma suposição, não uma observação confirmada — deve ser validado antes de qualquer implementação.**

---

## 6. Aba "Por Comprador"

Três blocos de gráfico, todos em estado vazio no ambiente analisado:

| Bloco | Título | Estado vazio observado |
|---|---|---|
| 1 | "Volume por Comprador (sc) — Safra 2026/2027" | "Sem contratos para a safra 2026/2027" |
| 2 | "Valor por Comprador (R$) — Safra 2026/2027" | "Sem contratos para a safra 2026/2027" |
| 3 | "Concentração por Comprador — Safra 2026/2027" | "Sem dados" |

Esta aba consolida a exposição por comprador — útil para risco de concentração (ex.: alertar se >50% da produção fixada está com um único comprador). O bloco 3 ("Concentração por Comprador") sugere fortemente a existência de um cálculo de % de concentração, mas sem dados reais não foi possível confirmar o formato de exibição (gráfico de pizza, tabela, ou indicador tipo semáforo). **Ponto de atenção para o agente:** confirmar esse formato antes de qualquer ajuste que dependa dele.

---

## 7. Aba "Gráficos"

Dois gráficos de barras lado a lado, ambos com eixo X = cultura e comparando "Fixado" vs. valor complementar:

| Gráfico | Título | Séries | Culturas no eixo X (ordem observada) |
|---|---|---|---|
| 1 | "Volume por Cultura (sacas) — Safra 2026/2027" | "Fixado" e "A Fixar" | SOJA, MILHO, CANA_DE_ACUCAR, EUCALIPTO, BOVINO |
| 2 | "Valor por Cultura (R$) — Safra 2026/2027" | "Valor Fixado" e "Valor Mercado" | SOJA, MILHO, CANA_DE_ACUCAR, EUCALIPTO, BOVINO |

**Observação relevante:** embora a aba "Posição por Cultura" liste **8 culturas** (incluindo SERINGUEIRA, CAFE_IRRIGADO e ARROZ), os gráficos desta aba exibem eixo X com apenas **5 culturas** (SOJA, MILHO, CANA_DE_ACUCAR, EUCALIPTO, BOVINO). Não foi possível confirmar visualmente (falha recorrente de captura de tela/renderização) se as 3 culturas ausentes (SERINGUEIRA, CAFE_IRRIGADO, ARROZ) estão:
(a) sendo omitidas dos gráficos por algum critério de corte (top-N por volume, talvez top 5), ou
(b) presentes mas cortadas pela viewport/scroll horizontal do gráfico no momento da extração de texto.

Isso é registrado como **BUG candidato (#3)** — precisa de confirmação visual (screenshot completo/zoom do gráfico) antes de ser tratado como bug real, já que a extração foi feita via árvore de acessibilidade/texto, não via inspeção visual direta do SVG do gráfico.

Abaixo dos dois gráficos há uma faixa de resumo repetindo, em formato compacto, os mesmos KPIs do topo da tela (Produção Total, Fixado %, A Fixar %, Preço Médio Fixado) — redundância de exibição, não um bug, mas um ponto a observar quanto a duplicação de fonte de dados/API calls.

---

## 8. Modal "Novo Contrato" (título interno: "Cadastrar Contrato / Venda")

Aberto pelo botão "Novo Contrato" no cabeçalho. Inventário completo de campos, na ordem em que aparecem:

| # | Campo | Tipo | Obrigatório | Placeholder / Default | Opções (quando aplicável) |
|---|---|---|---|---|---|
| 1 | Cultura | combobox | Sim (`*`) | "Selecione" | Lista longa observada parcialmente: Soja, Milho, Algodão Safrinha, Algodão Safra, Bovino, Outras Culturas, Seringueira, Cana de açúcar, Café Irrigado, Eucalipto, (lista continua — não confirmada até o fim) |
| 2 | Safra | combobox | Sim (`*`) | "Selecione" | Não confirmado (esperado: lista de safras cadastradas, ex. 2026/2027) |
| 3 | Comprador | combobox | Sim (`*`) | "Selecione o comprador" | **Confirmado (14 opções):** Bunge, Cargill, ADM, Amaggi, COFCO, BTG Commodities, Louis Dreyfus, Viterra, Glencore, Agroavance, Coamo, Caramuru, Multigrain, Outros |
| 4 | Tipo de Contrato | combobox | Não (sem `*`) | "Selecione" | Disponível, Futuro B3, CBOT, NDF, CPR Física |
| 5 | Status | combobox | Não (sem `*`) | "Aberto" (valor pré-selecionado) | Aberto, Liquidado, Cancelado |
| 6 | Volume (sacas) | number | Não (sem `*`) | "0" | — |
| 7 | Preço (R$/saca) | number | Não (sem `*`) | "0,00" | — |
| 8 | Câmbio (R$/USD) | number | Não (sem `*`) | "0,00" | — |
| 9 | Data de Entrega | date | Não (sem `*`) | (vazio) | — |
| 10 | Data de Liquidação Financeira | date | Não (sem `*`) | (vazio) | **Texto de ajuda do próprio sistema:** "Data em que o pagamento será recebido — alimenta automaticamente o Fluxo de Caixa" — confirma cruzamento direto com o módulo Fluxo de Caixa (ver seção 9) |
| 11 | Observações | textarea/text | Não | "Notas adicionais" | — |

**Botões do modal:** "Cadastrar Contrato" (submit) e "Close" (X, fecha sem salvar).

**Lista de campos obrigatórios (marcados com `*`):** Cultura, Safra, Comprador — apenas 3 dos 11 campos. Volume e Preço, que são conceitualmente essenciais para um contrato de venda, **não são marcados como obrigatórios na UI** — ponto de atenção (ver BUGS).

---

## 9. Cruzamentos com Outras Telas

| Campo/Indicador em Comercialização | Origem/Destino | Tipo de cruzamento | Confirmação |
|---|---|---|---|
| Produção Total (por cultura e agregada) | Quadro de Safra | Comercialização **consome** produção total cadastrada por cultura | Inferido pela consistência dos valores (1.689.764 sc bate com o total de produção da safra 2026/2027 usado também em Aquisição Fazenda e Arrendamento Rural) |
| Cotação (R$/sc por cultura) | Tela "Cotações" | Comercialização **consome** cotação vigente por cultura | Inferido — mesma fonte usada em "Valor a Mercado" das telas Aquisição e Arrendamento |
| Data de Liquidação Financeira (contrato) | Fluxo de Caixa (Fluxo Mensal / Fluxo de Safra) | Comercialização **alimenta** o Fluxo de Caixa | **Confirmado diretamente pelo texto de ajuda do próprio sistema** no modal: "alimenta automaticamente o Fluxo de Caixa" |
| Receita Fixada / Volume Fixado | Resumo / Dashboard (tela "Resumo") | Possível consumo pelo Dashboard geral | Não verificado nesta sessão — recomenda-se checagem cruzada, seguindo o mesmo padrão de discrepância já encontrado em Aquisição e Arrendamento |
| Comprador (cadastro) | Cadastro Mestre | Comercialização possivelmente **consome** uma lista de compradores centralizada | Não confirmado — a lista de 14 compradores (Bunge, Cargill, ADM, etc.) pode ser hardcoded no formulário ou vir de um cadastro em "Cadastro Mestre"; não foi possível verificar por falta de tempo hábil de exploração antes da instabilidade do navegador. **Ponto de atenção para o agente de execução.** |

---

## 10. Modelo de Dados Inferido

```sql
-- Entidade principal
Contrato_Comercializacao (
  id                          PK
  propriedade_id              FK -> Propriedade (1050001 = Grupo Pereira)
  safra_id                    FK -> Safra (ex.: "2026/2027")
  cultura                     ENUM (SOJA, MILHO, SERINGUEIRA, CANA_DE_ACUCAR,
                                     CAFE_IRRIGADO, EUCALIPTO, ARROZ, BOVINO, ...)
  comprador                   VARCHAR | FK -> Comprador (a confirmar)
  tipo_contrato                ENUM (DISPONIVEL, FUTURO_B3, CBOT, NDF, CPR_FISICA) NULLABLE
  status                       ENUM (ABERTO, LIQUIDADO, CANCELADO) DEFAULT 'ABERTO'
  volume_sacas                 DECIMAL DEFAULT 0
  preco_por_saca                DECIMAL DEFAULT 0    -- se preenchido => "fixado"
  cambio_usd                   DECIMAL DEFAULT 0     -- NULL/0 quando contrato não é em USD
  data_entrega                 DATE NULLABLE
  data_liquidacao_financeira    DATE NULLABLE          -- consumido pelo Fluxo de Caixa
  observacoes                  TEXT NULLABLE
  created_at / updated_at
)

-- Entidades relacionadas (não editáveis nesta tela, apenas consumidas)
Producao_Safra (cultura, safra_id, producao_total_sacas)   -- de "Quadro Safra"
Cotacao (cultura, safra_id, preco_referencia_sc)            -- de "Cotações"
```

**Campos calculados (não persistidos, derivados em tempo de exibição):**

```
qtd_fixada_por_cultura   = SUM(volume_sacas) WHERE preco_por_saca > 0, agrupado por cultura
qtd_a_fixar_por_cultura  = producao_total_sacas - qtd_fixada_por_cultura
receita_fixada           = SUM(volume_sacas * preco_por_saca) WHERE preco_por_saca > 0
valor_a_mercado          = qtd_a_fixar * cotacao_vigente
preco_medio_fixado       = receita_fixada / qtd_fixada   (guarda contra divisão por zero -> exibe "—")
```

---

## 11. BUGS e Pontos de Atenção

### Bugs confirmados

**BUG #1 — Nome da cultura exibido em formato bruto de enum (UPPER_SNAKE_CASE)**
Na aba "Posição por Cultura" e nos gráficos, os nomes de cultura aparecem como `CANA_DE_ACUCAR`, `CAFE_IRRIGADO`, ao invés de rótulos amigáveis ("Cana-de-açúcar", "Café Irrigado") usados em outras partes do sistema (ex.: Quadro Safra). Impacto: cosmético, mas quebra a consistência visual do produto. **Prioridade: Média.**

**BUG #2 — Pequena divergência de arredondamento em "Valor a Mercado" (linha BOVINO)**
`222.260 sc × R$ 365/sc = R$ 81.124.900`, mas o sistema exibe `R$ 81.125.079` (diferença de R$ 179). Indica que a coluna "Cotação" exibida (R$ 365/sc) está arredondada, mas o cálculo real usa um valor de cotação com mais casas decimais não exibido na UI. Impacto: gera desconfiança do usuário ao tentar conferir a conta manualmente. **Prioridade: Baixa/Média** — recomenda-se exibir a cotação com mais casas decimais ou aplicar o mesmo arredondamento usado no cálculo.

**BUG #3 — Validação "Campo obrigatório" do campo Comprador aparece antes de qualquer interação do usuário**
Ao abrir o modal "Cadastrar Contrato / Venda" pela primeira vez, o campo "Comprador *" já exibe a mensagem de erro "Campo obrigatório" com borda vermelha, **sem que o usuário tenha clicado em Cadastrar Contrato ou saído do campo (blur)**. Isso foi observado de forma consistente em duas aberturas distintas do modal (duas sessões de navegador diferentes, mesma sequência de ações). Comportamento esperado: erros de validação deveriam aparecer somente após tentativa de submit ou após o campo perder foco (`onBlur`) com valor vazio — não no carregamento inicial do formulário. Impacto: UX confusa, sugere ao usuário que algo já está errado antes mesmo de ele preencher o formulário. **Prioridade: Média-Alta.**

### Pontos de atenção (não confirmados como bugs, requerem validação com dados reais)

1. **Cobertura de teste limitada por ausência de dados:** o ambiente não possui nenhum contrato cadastrado, então o comportamento da aba "Contratos Cadastrados" com dados reais (estrutura de card/listagem, ações de editar/excluir, recalculo dos KPIs do topo após cadastro) não pôde ser observado. Recomenda-se ao agente de execução cadastrar 1-2 contratos de teste antes de programar qualquer ajuste que dependa da estrutura real da listagem.
2. **Gráficos da aba "Gráficos" mostram apenas 5 das 8 culturas** existentes na aba "Posição por Cultura" (faltam SERINGUEIRA, CAFE_IRRIGADO, ARROZ). Não confirmado se é corte intencional (top-N) ou falha de renderização/consulta. Requer inspeção visual direta (captura de tela não foi possível nesta sessão devido a instabilidade do navegador).
3. **Origem da lista de "Comprador" (14 opções fixas)** não confirmada — pode estar hardcoded no front-end ou vir de um cadastro centralizado (possivelmente em "Cadastro Mestre"). Relevante para o agente saber antes de decidir onde ajustar a lista, caso necessário.
4. **Campos Volume e Preço não são obrigatórios na UI**, apesar de serem essenciais para o conceito de "contrato fixado". Isso permite, em teoria, cadastrar um contrato com Volume=0 e Preço=0 — que teoricamente não deveria contar como "fixado" nos KPIs, mas o comportamento exato (esse contrato aparece como fixado com R$0, ou é ignorado no cálculo?) não pôde ser testado.
5. **Aba "Por Comprador", bloco "Concentração por Comprador"** — formato de exibição real (gráfico de pizza, tabela, indicador) não confirmado por falta de dados de teste.
6. **Possível redundância de chamadas de API:** o resumo de KPIs aparece duplicado (topo da tela + rodapé da aba "Gráficos") — não é um bug funcional, mas vale confirmar se ambos os blocos usam a mesma fonte de dados/cache ou disparam requisições separadas.
7. **Cruzamento com o Dashboard/Resumo geral** (Receita Fixada, Qtd Fixada) não verificado nesta sessão — seguir o mesmo padrão de checagem cruzada já recomendado nas specs de Aquisição Fazenda e Arrendamento Rural, já que ambas encontraram divergências entre o valor calculado na tela de origem e o valor exibido no card agregado do Dashboard.

---

## 12. Anexo de Imagens

Devido a instabilidade recorrente do mecanismo de captura de tela (mesmo problema já registrado nas specs anteriores: timeouts de `Page.captureScreenshot`, viewport "0x0", renderer travado), **apenas 2 capturas de tela foram obtidas com sucesso** nesta sessão:

| Arquivo | Conteúdo |
|---|---|
| `screenshot-1787253766423-6762cb53.jpg` | Aba "Contratos Cadastrados" — estado vazio ("Nenhum contrato cadastrado."), com abas visíveis (Posição por Cultura / Contratos Cadastrados / Por Comprador / Gráficos) e menu lateral aberto |
| `screenshot-1787253957842-132662da.jpg` | Aba "Gráficos" — início dos dois gráficos de barra (títulos "Volume por Cultura (sacas)" e "Valor por Cultura (R$)"), menu lateral aberto, parte dos cards de KPI cortada pelo scroll |

**Limitação explícita:** não foi possível capturar visualmente o modal "Cadastrar Contrato / Venda" (incluindo o estado de erro do campo Comprador — BUG #3), os cards de KPI completos, a tabela "Posição por Cultura" completa, nem o dropdown aberto do campo Comprador. Todo o conteúdo dessas seções foi obtido via extração de texto/árvore de acessibilidade (`get_page_text` e `read_page`), que é tecnicamente confiável para texto e estrutura, mas não substitui a confirmação visual (cores, layout, alinhamento, elementos gráficos como o SVG dos gráficos de barra). Recomenda-se uma sessão dedicada de recaptura de tela antes de qualquer ajuste visual/CSS nesta tela.

---

## 13. Resumo Executivo para o Agente de Execução (Claude Code)

**Tela:** Comercialização (`/dashboard/{id}/futuros`)

**O que existe e está mapeado com confiança:**
- Estrutura de 5 KPIs + barra de progresso no topo, com fórmulas de cálculo inferidas e conferidas contra os dados exibidos.
- Estrutura completa de 4 abas (Posição por Cultura, Contratos Cadastrados, Por Comprador, Gráficos), incluindo estados vazios de cada uma.
- Estrutura completa do modal de cadastro (11 campos, 3 obrigatórios, opções de 3 dos 5 comboboxes confirmadas).
- Cruzamento direto confirmado: `Data de Liquidação Financeira` → Fluxo de Caixa (texto de ajuda do próprio sistema).
- Tabela "Posição por Cultura" com as 8 culturas e valores completos, fórmulas conferidas linha a linha.

**O que precisa de validação adicional antes de ajustes de código:**
1. Corrigir/confirmar BUG #3 (validação prematura do campo Comprador) — prioridade mais alta por impacto de UX.
2. Investigar BUG #1 (enum bruto exibido) — trocar por um mapa de labels amigáveis, mesmo padrão já usado em Quadro Safra.
3. Investigar BUG #2 (arredondamento de cotação) — decidir entre exibir cotação com mais casas decimais ou ajustar o cálculo para usar o valor arredondado exibido.
4. Cadastrar contratos de teste para documentar a estrutura real da aba "Contratos Cadastrados" e o comportamento dos gráficos/KPIs com dados não-zero — pré-requisito para qualquer ajuste na lógica de cálculo ou na listagem.
5. Confirmar se as 3 culturas ausentes dos gráficos de barra (SERINGUEIRA, CAFE_IRRIGADO, ARROZ) é um corte intencional ou falha.
6. Confirmar a origem da lista de compradores (hardcoded vs. cadastro).

**Dependências externas a não quebrar:** qualquer alteração no campo `Data de Liquidação Financeira` deve preservar a integração com o Fluxo de Caixa, explicitamente declarada pelo próprio sistema.
