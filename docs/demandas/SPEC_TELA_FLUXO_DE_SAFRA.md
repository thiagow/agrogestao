# Especificação Técnica — Tela "Fluxo de Safra"

**Sistema:** AgroFlow — Análise de Produtor Rural
**Nome interno na tela (H1):** "Fluxo de Safra Projetado"
**URL:** `https://agroflow-rkqdvzdd.manus.space/dashboard/1050001/fluxo-caixa`
**Menu lateral:** `Fluxo de Safra` (entre "Balanço PJ" e "Cotações")
**Cliente/Propriedade analisada:** Grupo Pereira (id 1050001)
**Safra selecionada durante a análise:** 2026/2027
**Data da análise:** 20/08/2026
**Documento destinado a:** agente de execução (Claude Code) — ajustes desta tela

> Segue o mesmo padrão das specs anteriores (`SPEC_TELA_AQUISICAO_FAZENDA.md`, `SPEC_TELA_ARRENDAMENTO_RURAL.md`, `SPEC_TELA_COMERCIALIZACAO.md`): mapeamento completo, com de-para de campos, campos calculados e cruzamentos confirmados com outras telas.

---

## 1. Visão Geral

A tela "Fluxo de Safra" (rota interna `/fluxo-caixa`, título de menu "Fluxo de Safra", H1 "Fluxo de Safra Projetado") é o módulo **consolidador financeiro central** do AgroFlow. Diferente das telas de cadastro (Aquisição, Arrendamento, Comercialização), esta tela **não cadastra entidades primárias** — ela agrega e projeta dados de praticamente todos os demais módulos do sistema (Quadro Safra, Fornecedores, Bancos, Arrendamentos, Aquisição Fazenda) em um demonstrativo único de entradas x saídas, calcula o fluxo de caixa líquido da safra e projeta a necessidade de financiamento.

A única ação de cadastro disponível nesta tela é o botão **"Adicionar Item"**, que permite lançar itens manuais extraordinários (não capturados automaticamente pelos módulos de origem) — como dividendos, retiradas, estoques e manutenções.

Esta é, portanto, a tela mais dependente de dados de outras telas de todo o sistema mapeado até aqui — praticamente cada linha do demonstrativo tem uma tela de origem explícita, com **texto de ajuda do próprio sistema (ícone "i") confirmando a fonte de cada valor**, o que reduziu significativamente o grau de inferência necessário nesta documentação.

**Estado dos dados no momento da análise:** nenhum "item adicional" cadastrado (seção "Itens Adicionais Cadastrados" vazia). Todos os demais valores do demonstrativo são calculados automaticamente a partir de dados já existentes em outros módulos.

---

## 2. Cabeçalho e KPIs

### 2.1 Cabeçalho

| Elemento | Conteúdo |
|---|---|
| Título | "Fluxo de Safra Projetado" |
| Subtítulo | "Análise consolidada de receitas, custos e necessidade de financiamento" |
| Seletor de Safra | Combobox, valor atual "2026/2027" (mesmo seletor global do sistema) |
| Botão de ação | "Adicionar Item" (abre modal "Adicionar Item ao Fluxo") |

### 2.2 Cards de KPI (4 cards no topo)

| Card | Valor observado | Subtexto | Ícone |
|---|---|---|---|
| **Receita Projetada** | R$ 438.003.709 | "Realizada: R$ 0" | seta ascendente (verde) |
| **Total de Saídas** | R$ 343.901.289 | "Custos + Dívidas + Despesas" | seta descendente (vermelho) |
| **Fluxo Líquido** | R$ 94.102.420 | "Superávit" | ícone de pulso/atividade (verde) |
| **Índice de Cobertura** | 1,27x | "Saudável (≥ 1,2x)" | ícone de cifrão ($) |

**Campos calculados — fórmulas inferidas e conferidas:**

```
Total_de_Saidas   = Custo_Producao + Fornecedores + Amortizacao_Bancos + Juros_Bancos
                     + Arrendamentos + Despesa_Comercial + Parcelas_Aquisicao
                   = 170.958.647 + 0 + 47.200.158 + 6.819.828 + 2.014.656 + 1.908.000 + 115.000.000
                   = 343.901.289  ✓ confere exatamente

Fluxo_Liquido     = Receita_Projetada - Total_de_Saidas
                   = 438.003.709 - 343.901.289 = 94.102.420  ✓ confere exatamente

Indice_Cobertura  = Receita_Projetada / Total_de_Saidas
                   = 438.003.709 / 343.901.289 ≈ 1,2737...  ✓ confere com "1,27x" exibido (arredondado p/ 2 casas)
```

**Regra de negócio do "Índice de Cobertura" (badge de status):** o texto "Saudável (≥ 1,2x)" sugere um limiar de classificação — provavelmente há também estados intermediários/críticos (ex.: "Atenção" entre 1,0x–1,2x, "Crítico" abaixo de 1,0x) que não puderam ser observados por falta de um cenário de teste com índice baixo. **Ponto de atenção para o agente:** confirmar os thresholds completos antes de qualquer ajuste na lógica de classificação.

**Receita Projetada vs. Realizada:** o subtexto "Realizada: R$ 0" indica que o sistema também rastreia quanto da receita projetada já foi efetivamente recebida (provavelmente ligado a contratos de Comercialização com status "Liquidado" e `data_liquidacao_financeira` já ocorrida — ver seção 7, cruzamento com Comercialização). Como não há contratos de comercialização cadastrados no ambiente (ver `SPEC_TELA_COMERCIALIZACAO.md`), o valor realizado é 0 — consistente e não é um bug.

---

## 3. Demonstrativo de Fluxo de Safra (bloco principal)

Título: **"Demonstrativo de Fluxo de Safra — Safra 2026/2027"**. Estrutura em formato de demonstrativo contábil (DRE-like), com duas seções expansíveis/colapsáveis (`(+) ENTRADAS` e `(-) SAÍDAS`), cada linha com um ícone de informação (`ⓘ`) que exibe um tooltip explicando a origem/regra de cálculo do valor — **essa é a fonte primária e mais confiável de todo o cruzamento de dados documentado neste arquivo.**

### 3.1 Seção "(+) ENTRADAS" — total R$ 438.003.709

| Linha | Valor | Texto de ajuda do sistema (tooltip, ⓘ) | Origem confirmada |
|---|---|---|---|
| Receita Projetada da Safra | R$ 438.003.709 | "Soma da receita bruta de todas as culturas e pecuária cadastradas no Quadro Safra" | **Quadro Safra** |

A seção possui apenas 1 linha nesta instância — coincide com o valor "Valor a Mercado" total exibido na tela Comercialização (R$ 438.003.709), confirmando que a Receita Projetada usa a mesma base de cálculo (produção total × cotação) já documentada em `SPEC_TELA_COMERCIALIZACAO.md`.

### 3.2 Seção "(-) SAÍDAS" — total (R$ 343.901.289)

| Linha | Valor | Texto de ajuda do sistema (tooltip, ⓘ) | Origem confirmada |
|---|---|---|---|
| Custo de Produção da Safra | (R$ 170.958.647) | "Custo total calculado pelo Quadro Safra (R$/ha × área total)" | **Quadro Safra** |
| Fornecedores (insumos e serviços) | R$ 0 | "Total de dívidas com fornecedores cadastrados para esta safra" | **Fornecedores** |
| Amortização Programada (Bancos) | (R$ 47.200.158) | "Principal a amortizar no ano conforme cronograma de cada contrato" | **Bancos** |
| Juros Programados (Bancos) | (R$ 6.819.828) | "Juros calculados pelo cronograma de amortização de cada contrato (SAC/PRICE/Bullet)" | **Bancos** |
| Arrendamentos | (R$ 2.014.656) | "Custo total anual de arrendamentos cadastrados para esta safra" | **Arrendamentos** |
| Despesa Comercial (3 sc/ha soja) | (R$ 1.908.000) | "Estimativa de despesa comercial: 3 sacas de soja por hectare plantado" | Calculado internamente (regra fixa: 3 sc/ha de soja) |
| Parcelas de Aquisição de Fazenda | (R$ 115.000.000) | "Parcelas de aquisição de fazendas (sacas × cotação ou valor em R$) para esta safra" | **Aquisição Fazenda** |

**Observações importantes:**
- O valor de **Arrendamentos (R$ 2.014.656)** bate exatamente com o card "Custo Anual" (R$ 2.014.656) documentado em `SPEC_TELA_ARRENDAMENTO_RURAL.md` — cruzamento confirmado sem divergência.
- O valor de **Amortização + Juros dos Bancos** (R$ 47.200.158 + R$ 6.819.828 = R$ 54.019.986) não foi comparado diretamente contra a tela "Bancos" nesta sessão — recomenda-se checagem cruzada futura.
- **Despesa Comercial (3 sc/ha soja)** é a única linha de saída cuja regra é uma **fórmula fixa hardcoded** (3 sacas de soja por hectare), não uma soma de outra tela — merece atenção especial, pois qualquer mudança na área de soja cadastrada no Quadro Safra deve refletir automaticamente aqui.
- O rótulo "(-) SAÍDAS" some com o sinal negativo entre parênteses no padrão contábil (`(R$ 170.958.647)`), consistente em todas as 7 linhas.

### 3.3 Total "Fluxo de Caixa Líquido"

Card de destaque abaixo do demonstrativo:

| Campo | Valor |
|---|---|
| Fluxo de Caixa Líquido | R$ 94.102.420 |
| Subtexto/status | "Operação auto-sustentável nesta safra" |

O subtexto parece ser um badge dinâmico condicionado ao sinal do resultado (positivo = "Operação auto-sustentável nesta safra"; presumivelmente negativo exibiria algo como "Operação requer financiamento externo" — **não confirmado, requer cenário de teste com déficit**).

---

## 4. Bloco "Estrutura de Financiamento Necessária"

| Linha | Valor |
|---|---|
| Renovação de Dívidas Bancárias (CP + LP) | R$ 181.490.133 |
| Fornecedores Previstos (próxima safra) | R$ 0 |
| **Total de Recursos a Estruturar** | **R$ 181.490.133** |

Este bloco não tem tooltips de ajuda (diferente do demonstrativo principal), então a origem exata de "Renovação de Dívidas Bancárias (CP + LP)" é **inferida, não confirmada**: provavelmente soma o saldo devedor total (curto + longo prazo) cadastrado na tela "Bancos", representando o total que precisará ser rolado/renovado, independentemente da amortização já contabilizada como saída no demonstrativo acima. **Ponto de atenção:** validar essa fórmula com a equipe/tela Bancos antes de qualquer ajuste, pois não há confirmação direta via tooltip como nas demais linhas.

---

## 5. Gráfico "Composição do Fluxo"

Gráfico de barras (tipo waterfall/cascata) com eixo X = categorias e valores em R$ (escala "k" = milhares), com 3 séries por cor:

| Categoria (eixo X, ordem observada) | Cor/Série |
|---|---|
| Receita Projetada | Entradas (verde) |
| Custo Safra | Saídas (vermelho) |
| Amort. Bancos | Saídas (vermelho) |
| Juros Est. | Estimados (laranja) |
| Arrendamentos | Estimados (laranja) |
| Desp. Comercial | (não confirmado — cortado pela viewport) |
| Aquisições | (não confirmado — cortado pela viewport) |

Eixo Y varia de -200.000k a 600.000k. O gráfico possui tooltip interativo ao passar o mouse (confirmado: hover sobre a barra "Receita Projetada" exibiu "Entrada: R$ 438.003.709").

**Observação:** a legenda declara 3 categorias de série ("Entradas", "Saídas", "Estimados"), mas pela lista de itens do demonstrativo (seção 3), linhas como "Juros Programados (Bancos)" e "Arrendamentos" já são valores calculados/confirmados, não estimativas — a classificação de cor "Estimados" para essas barras específicas não é totalmente consistente com a nomenclatura usada no restante da tela ("Programada", "calculado"). **Ponto de atenção (não confirmado como bug, requer inspeção visual mais profunda do código de cores do gráfico).**

---

## 6. Bloco "Análise — Próxima Safra"

| Campo | Valor |
|---|---|
| Fluxo disponível | R$ 94.102.420 (= Fluxo de Caixa Líquido desta safra) |
| Custo projetado safra | R$ 170.958.647 (= mesmo valor do "Custo de Produção da Safra" da seção 3.2 — presumivelmente projeção do custo da PRÓXIMA safra, mas exibe o mesmo valor da safra atual) |
| Déficit / Superávit | -R$ 76.856.228 |
| Badge de status | "✓ Produtor com boa capacidade de pagamento. Bancabilidade sólida." (fundo verde) |

**Fórmula:**
```
Deficit_Superavit = Fluxo_disponivel - Custo_projetado_safra
                   = 94.102.420 - 170.958.647 = -76.856.228  ✓ confere
```

**Ponto de atenção relevante:** o resultado desta conta é **negativo (déficit de R$ 76,8 milhões)**, mas o badge de status exibido é **positivo/verde** ("boa capacidade de pagamento, bancabilidade sólida"). Isso é uma **inconsistência aparente** entre o sinal do resultado numérico e a mensagem qualitativa exibida ao usuário — ver BUG #1 na seção 8. É possível que a regra de negócio real considere "sólido" mesmo com esse tipo de déficit pontual (por exemplo, se o Índice de Cobertura geral ainda estiver acima de 1,2x, como está), mas a UI não deixa essa lógica clara para o usuário, o que pode gerar confusão.

---

## 7. Modal "Adicionar Item ao Fluxo"

Aberto pelo botão "Adicionar Item" no cabeçalho.

| # | Campo | Tipo | Obrigatório | Placeholder / Default |
|---|---|---|---|---|
| 1 | Categoria | combobox agrupado | Não confirmado (sem `*` visível) | "Selecione..." |
| 2 | Descrição | textbox | Não confirmado | "Detalhe o item..." |
| 3 | Valor (R$) | number | Não confirmado | "0,00" |
| 4 | Observações | textarea | Não (campo opcional, placeholder "Opcional...") | "Opcional..." |

**Botões:** "Adicionar" (submit) e "Close" (X).

**Opções do combobox "Categoria"** — agrupadas em 2 grupos, confirmadas integralmente (9 opções):

| Grupo | Opções |
|---|---|
| **ENTRADAS** | Receita Venda de Fazenda · Estoques de Grãos (entrada) · Estoques de Algodão (entrada) · Estoques de Gado (entrada) · Outras Entradas |
| **SAÍDAS** | Dividendos / Retiradas · Manutenção de Máquinas · Correção de Solo · Outras Saídas |

**Observação:** o texto vazio da seção "Itens Adicionais Cadastrados" ("Nenhum item adicional. Use o botão 'Adicionar Item' para incluir dividendos, estoques, manutenções, etc.") menciona apenas 3 dos 9 exemplos de categoria disponíveis — consistente, apenas exemplos ilustrativos, não é bug.

**Inferência sobre impacto no demonstrativo:** presumivelmente, um item cadastrado com categoria do grupo "ENTRADAS" soma na seção "(+) ENTRADAS" do demonstrativo (seção 3.1) e um item do grupo "SAÍDAS" soma na seção "(-) SAÍDAS" (seção 3.2), possivelmente sob uma linha adicional "Itens Extras" ou similar. **Não confirmado** — não foi possível testar o cadastro de um item real nesta sessão (seria uma alteração de dados fora do escopo de mapeamento somente-leitura). Recomenda-se ao agente de execução testar esse fluxo em ambiente de homologação antes de qualquer ajuste que dependa do comportamento pós-cadastro.

---

## 8. Cruzamentos com Outras Telas

Esta tela tem o maior número de cruzamentos confirmados diretamente por texto do próprio sistema (tooltips), sem necessidade de inferência:

| Linha do Demonstrativo | Tela de origem | Confirmação |
|---|---|---|
| Receita Projetada da Safra | Quadro Safra | **Confirmado por tooltip** ("...cadastradas no Quadro Safra") |
| Custo de Produção da Safra | Quadro Safra | **Confirmado por tooltip** ("...calculado pelo Quadro Safra") |
| Fornecedores (insumos e serviços) | Fornecedores | **Confirmado por tooltip** |
| Amortização Programada (Bancos) | Bancos | **Confirmado por tooltip** |
| Juros Programados (Bancos) | Bancos | **Confirmado por tooltip** |
| Arrendamentos | Arrendamentos | **Confirmado por tooltip** — valor também bate exatamente com o card "Custo Anual" da tela Arrendamento Rural |
| Parcelas de Aquisição de Fazenda | Aquisição Fazenda | **Confirmado por tooltip** |
| Receita Projetada (implícito, produção × cotação) | Comercialização / Cotações | Valor total (R$ 438.003.709) idêntico ao "Valor a Mercado" total da tela Comercialização — **confirmado por coincidência exata de valor** |
| "Realizada: R$ 0" (subtexto do card Receita Projetada) | Comercialização (contratos com status Liquidado) | Inferido — consistente com a ausência de contratos cadastrados em Comercialização |
| Renovação de Dívidas Bancárias (CP + LP) | Bancos | **Não confirmado por tooltip** (único bloco sem ajuda textual) — inferência apenas |

**Direção do fluxo de dados:** ao contrário das telas anteriores (que em sua maioria só "alimentam" outros módulos), a tela Fluxo de Safra é **essencialmente um consumidor/agregador** — ela lê de 5 módulos diferentes e não escreve de volta a nenhum deles (exceto os "itens adicionais" manuais, que são exclusivos desta tela).

---

## 9. Modelo de Dados Inferido

```sql
-- Entidade para itens manuais lançados nesta tela (única escrita própria do módulo)
Item_Fluxo_Manual (
  id                PK
  propriedade_id    FK -> Propriedade
  safra_id          FK -> Safra
  categoria         ENUM (RECEITA_VENDA_FAZENDA, ESTOQUE_GRAOS_ENTRADA, ESTOQUE_ALGODAO_ENTRADA,
                            ESTOQUE_GADO_ENTRADA, OUTRAS_ENTRADAS,
                            DIVIDENDOS_RETIRADAS, MANUTENCAO_MAQUINAS, CORRECAO_SOLO, OUTRAS_SAIDAS)
  tipo              ENUM (ENTRADA, SAIDA)   -- derivado da categoria
  descricao         VARCHAR
  valor             DECIMAL
  observacoes       TEXT NULLABLE
  created_at / updated_at
)

-- View/cálculo agregado (não persistido; montado em tempo de exibição a partir de outras tabelas)
Fluxo_Safra_Projetado (safra_id) {
  receita_projetada        = SUM(Producao_Safra.qtd * Cotacao.preco)      -- Quadro Safra + Cotações
  custo_producao            = SUM(Quadro_Safra.custo_ha * area_total)      -- Quadro Safra
  fornecedores               = SUM(Fornecedor.divida_safra)                 -- Fornecedores
  amortizacao_bancos         = SUM(Contrato_Bancario.principal_ano)         -- Bancos
  juros_bancos                = SUM(Contrato_Bancario.juros_ano)             -- Bancos
  arrendamentos               = SUM(Contrato_Arrendamento.custo_anual)       -- Arrendamentos
  despesa_comercial            = area_soja_ha * 3 * cotacao_soja              -- regra fixa interna
  parcelas_aquisicao           = SUM(Aquisicao.parcela_ano)                   -- Aquisição Fazenda
  itens_manuais_entrada        = SUM(Item_Fluxo_Manual.valor) WHERE tipo=ENTRADA
  itens_manuais_saida          = SUM(Item_Fluxo_Manual.valor) WHERE tipo=SAIDA

  total_saidas       = custo_producao + fornecedores + amortizacao_bancos + juros_bancos
                        + arrendamentos + despesa_comercial + parcelas_aquisicao + itens_manuais_saida
  fluxo_liquido       = (receita_projetada + itens_manuais_entrada) - total_saidas
  indice_cobertura    = (receita_projetada + itens_manuais_entrada) / total_saidas
}
```

---

## 10. BUGS e Pontos de Atenção

### Bugs candidatos (requerem confirmação/decisão de produto)

**BUG #1 — Badge "bancabilidade sólida" (verde) exibido junto a um resultado numérico de déficit**
Na seção "Análise — Próxima Safra", o cálculo `Déficit / Superávit` resulta em **-R$ 76.856.228** (déficit), mas o badge de status logo abaixo é positivo: "✓ Produtor com boa capacidade de pagamento. Bancabilidade sólida." (fundo verde). Não há, na UI, uma explicação de por que um resultado negativo recebe uma classificação positiva — possivelmente a regra real usa o Índice de Cobertura da safra atual (1,27x, "Saudável") como critério, e não o déficit da próxima safra isoladamente, mas isso não é explicitado ao usuário. Impacto: pode induzir o produtor/analista a subestimar uma necessidade real de financiamento para a próxima safra. **Prioridade: Média-Alta** — recomenda-se esclarecer a regra de negócio exata com o time de produto antes de decidir se é bug de exibição ou comportamento intencional mal comunicado.

### Pontos de atenção (não confirmados como bugs)

1. **Bloco "Estrutura de Financiamento Necessária" sem tooltip de origem** — diferente de todas as outras linhas do demonstrativo, "Renovação de Dívidas Bancárias (CP + LP)" (R$ 181.490.133) não tem ícone de ajuda explicando sua fórmula exata. Recomenda-se adicionar o tooltip por consistência, e confirmar a fórmula com a tela Bancos antes de qualquer ajuste.
2. **Classificação de cor "Estimados" (laranja) no gráfico "Composição do Fluxo"** aplicada a barras como "Juros Est." e "Arrendamentos", que segundo o próprio demonstrativo são valores "Programados"/"calculados", não estimativas — nomenclatura potencialmente inconsistente. Requer inspeção visual completa do gráfico (não foi possível capturar as barras "Desp. Comercial" e "Aquisições", cortadas pela viewport) antes de decidir se é ajuste necessário.
3. **Thresholds completos do "Índice de Cobertura" não confirmados** — só foi possível observar o estado "Saudável (≥ 1,2x)" com o valor 1,27x. Não há dados de teste para confirmar os textos/cores dos estados abaixo desse limiar.
4. **Comportamento do card "Fluxo de Caixa Líquido" em cenário de déficit** não testado — o subtexto "Operação auto-sustentável nesta safra" provavelmente muda para algo como "requer financiamento externo" quando negativo, mas isso não pôde ser confirmado.
5. **Comportamento pós-cadastro de "Item Adicional"** não testado (ver seção 7) — recomenda-se validar em ambiente de homologação antes de qualquer alteração de lógica que dependa da agregação desses itens no demonstrativo.
6. **Campos do modal "Adicionar Item" sem indicação visual de obrigatoriedade** (`*`) — diferente do modal de Comercialização, que marca claramente os campos obrigatórios. Não foi possível confirmar se há validação de obrigatoriedade no submit sem testar o cadastro real.

---

## 11. Anexo de Imagens

Nesta sessão a captura de tela funcionou de forma mais estável que nas sessões anteriores (Arrendamento e Comercialização). **5 capturas de tela obtidas com sucesso:**

| Arquivo | Conteúdo |
|---|---|
| `screenshot-1787256361345-c826b4e2.jpg` | Topo da tela — 4 cards de KPI + início do Demonstrativo (seção ENTRADAS expandida, início de SAÍDAS), menu lateral aberto |
| `screenshot-1787256429917-e0e2b584.jpg` | Modal "Adicionar Item ao Fluxo" com dropdown "Categoria" aberto, mostrando os 9 grupos/opções (ENTRADAS/SAÍDAS) |
| `screenshot-1787256467910-fcbf8be7.jpg` (mesma área de `1787256... waterfall`) | Gráfico "Composição do Fluxo" com tooltip ativo mostrando "Receita Projetada — Entrada: R$ 438.003.709" |
| (mesma sequência de rolagem) | Bloco "Análise — Próxima Safra" com badge verde "Produtor com boa capacidade de pagamento. Bancabilidade sólida." e início da seção "Itens Adicionais Cadastrados" |

**Limitação:** não foi possível capturar visualmente a extensão completa do gráfico "Composição do Fluxo" (barras "Desp. Comercial" e "Aquisições" ficaram fora da viewport nas capturas obtidas) nem o estado vazio completo de "Itens Adicionais Cadastrados". Recomenda-se recaptura com viewport mais largo antes de qualquer ajuste visual nessas áreas específicas.

---

## 12. Resumo Executivo para o Agente de Execução (Claude Code)

**Tela:** Fluxo de Safra (`/dashboard/{id}/fluxo-caixa`)

**O que existe e está mapeado com alta confiança:**
- Estrutura completa dos 4 KPIs do topo, com fórmulas conferidas e batendo exatamente com os valores exibidos.
- Demonstrativo completo de Entradas/Saídas (8 linhas), com origem de cada linha **confirmada diretamente pelo texto de ajuda do próprio sistema** — o nível de confiança deste cruzamento é o mais alto entre todas as specs já produzidas.
- Modal "Adicionar Item ao Fluxo" com os 4 campos e as 9 opções de categoria confirmadas integralmente.
- Cruzamento numérico exato confirmado entre a linha "Arrendamentos" desta tela e o card "Custo Anual" da tela Arrendamento Rural.
- Cruzamento numérico exato confirmado entre "Receita Projetada" desta tela e "Valor a Mercado" total da tela Comercialização.

**O que precisa de validação adicional antes de ajustes de código:**
1. Esclarecer/corrigir BUG #1 (badge positivo com resultado numérico de déficit em "Análise — Próxima Safra") — prioridade mais alta.
2. Confirmar a fórmula exata de "Renovação de Dívidas Bancárias (CP + LP)" junto à tela Bancos (único valor sem tooltip de origem).
3. Testar o cadastro de um "Item Adicional" (entrada e saída) para confirmar como ele é refletido no demonstrativo e nos KPIs do topo.
4. Confirmar os thresholds completos de classificação do "Índice de Cobertura" (além do estado "Saudável ≥ 1,2x").
5. Recapturar visualmente o gráfico "Composição do Fluxo" em largura total para confirmar as 7 barras completas e validar a classificação de cor "Estimados".

**Dependências externas a não quebrar:** qualquer alteração nos módulos Quadro Safra, Fornecedores, Bancos, Arrendamentos, Aquisição Fazenda ou Comercialização tem potencial de impactar diretamente os valores desta tela, dado que ela é fundamentalmente um agregador. Alterações de schema nesses módulos exigem validação cruzada obrigatória com o Fluxo de Safra.
