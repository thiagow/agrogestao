# Especificação Técnica — Tela "Fluxo Mensal"

**Sistema:** AgroFlow — Análise de Produtor Rural
**Nome interno na tela (H1):** "Fluxo de Caixa Mensal"
**URL:** `https://agroflow-rkqdvzdd.manus.space/dashboard/1050001/fluxo-mensal`
**Menu lateral:** `Fluxo Mensal` (último item antes de "Apresentação do Grupo")
**Cliente/Propriedade analisada:** Grupo Pereira (id 1050001)
**Safra selecionada durante a análise:** 2026/2027
**Data da análise:** 26/08/2026
**Documento destinado a:** agente de execução (Claude Code) — ajustes desta tela

> Segue o mesmo padrão das specs anteriores. Como o solicitante hipotetizou, esta tela — assim como Análise Financeira — é um **espelho/consolidação mensal** dos lançamentos de Bancos, Aquisição Fazenda, Arrendamentos, Fornecedores, Comercialização e Quadro de Safra, com granularidade de calendário (mês a mês, 18 meses), diferente da visão anual/por safra das demais telas financeiras.

---

## 1. Visão Geral

A tela "Fluxo Mensal" (H1 "Fluxo de Caixa Mensal") é o módulo de **projeção de caixa mês a mês**, cobrindo um horizonte de 18 meses (Jan/2026 a Jun/2027 nesta análise — do início do ciclo agrícola até o encerramento da comercialização da safra seguinte). Diferente do "Fluxo de Safra" (visão agregada anual por safra) e da "Análise Financeira" (visão de balanço/índices), esta tela detalha **quando** cada entrada e saída de caixa efetivamente ocorre no calendário, cruzando isso com o calendário agrícola regional (plantio/colheita) do Centro-Oeste.

Subtítulo da tela: **"Calendário agrícola do Centro-Oeste — MT / GO / MS / TO"** — confirma que a lógica de distribuição temporal dos lançamentos automáticos (Custeio/Safra) segue um calendário agrícola regional pré-configurado para essas 4 UFs.

A tela é organizada em **3 blocos visuais principais** (não há sistema de abas como nas telas anteriores — tudo em uma página contínua com rolagem):

1. **Cabeçalho + 4 KPIs + gráfico "Curva de Caixa"** (linha temporal)
2. **"Calendário Agrícola — Centro-Oeste"** (heatmap por cultura x mês)
3. **"Lançamentos Mensais — 104 registros"** (lista detalhada mês a mês, com 18 blocos mensais)

---

## 2. Cabeçalho e Controles

| Elemento | Conteúdo |
|---|---|
| Título | "Fluxo de Caixa Mensal" |
| Subtítulo | "Calendário agrícola do Centro-Oeste — MT / GO / MS / TO" |
| Switch "Multi-Safra" | Toggle (estado observado: desligado) — provavelmente permite exibir/consolidar lançamentos de mais de uma safra simultaneamente no mesmo calendário mensal |
| Switch "Incluir Faturamento PJ" | Toggle (estado observado: desligado) — cruzamento direto com o módulo Balanço PJ (fora do escopo desta documentação, por instrução do solicitante), similar ao mecanismo de "Consolidado Grupo" já visto em Análise Financeira |
| Seletor de Safra | Combobox, "2026/2027" |
| Botão **"+ Lançamento"** | Abre modal "Novo Lançamento Manual" (ver seção 5) |
| Botão **"Gerar Auto"** (verde, destaque) | Provavelmente gera automaticamente os lançamentos previstos (Custeio/Safra) a partir do Quadro de Safra + calendário agrícola, para todos os meses da safra — não testado (ação de escrita) |
| Botão **"Sincronizar Todos"** | Tooltip/label completo: **"Sincroniza todos os registros já cadastrados com o fluxo mensal"** — **confirmação textual direta** de que os lançamentos deste calendário são sincronizados a partir de registros já existentes em outros módulos, não digitados originalmente aqui |

### 2.1 Cards de KPI (4 cards)

| Card | Valor observado | Cor |
|---|---|---|
| Total Entradas | R$ 876,01M | Verde |
| Total Saídas | R$ 274,79M | Vermelho |
| Resultado Líquido | R$ 601,22M | Azul |
| Situação | "↘ Risco" — "3 meses negativos" | Vermelho/alerta |

**Fórmula conferida:**
```
Resultado_Liquido = Total_Entradas - Total_Saidas = 876,01M - 274,79M = 601,22M  ✓
```

**Indicador "Situação: Risco — 3 meses negativos"** — badge qualitativo baseado na contagem de meses com resultado mensal negativo (Entradas mês < Saídas mês) dentro do horizonte de 18 meses exibido. **Divergência a investigar:** ao contar manualmente os meses com resultado líquido mensal negativo na lista detalhada (seção 6), foram identificados **5 meses** com saldo do mês negativo (Out/2026: -R$53,96M · Nov/2026: -R$38,85M · Dez/2026: -R$30,24M · Jan/2027: -R$30,08M · Mai/2027: -R$4,34M), não 3. É possível que o critério real do badge considere apenas os meses com **Saldo Acumulado** negativo (métrica de caixa cumulativo, diferente do resultado isolado do mês) — essa hipótese não pôde ser confirmada visualmente nesta sessão. **Ponto de atenção para o agente de execução** (ver seção 8).

### 2.2 Gráfico "Curva de Caixa — Safra 2026/2027"

**Tipo:** gráfico combinado (barras + linha), eixo X = 18 meses (Jan/26 a Jun/27), eixo Y em R$ mil (escala observada de -R$250.000k a R$750.000k, ou seja, R$ -250 milhões a R$ 750 milhões).

**3 séries confirmadas (legenda):**

| Série | Tipo visual | Cor |
|---|---|---|
| Entradas | Barra | Verde |
| Saídas | Barra | Vermelho |
| Saldo Acum. | Linha | Azul |

**Base de cálculo inferida:**
```
Entradas(mês)      = SUM(lançamentos do tipo Entrada no mês)
Saídas(mês)         = SUM(lançamentos do tipo Saída no mês)
Saldo_Acum(mês)      = Saldo_Acum(mês-1) + Entradas(mês) - Saídas(mês)
```
Esta é provavelmente a métrica usada para o badge "Situação" (ver seção 2.1) — se "Saldo Acum." ficar negativo em algum ponto da curva, indicaria risco real de descasamento de caixa (necessidade de capital de giro), diferente de apenas ter um mês isolado com saída maior que entrada.

---

## 3. Bloco "Calendário Agrícola — Centro-Oeste"

Tabela tipo heatmap/gantt: linhas = culturas, colunas = meses (Jan a Dez, calendário civil, não safra), células coloridas conforme a fase da cultura naquele mês.

**5 culturas confirmadas nas linhas:** Soja · Milho 1ª Safra · Milho Safrinha · Algodão Safra · Pecuária Bovina

**Legenda de cores (3 fases):**

| Cor | Fase |
|---|---|
| 🟧 Laranja | Plantio/Custeio |
| 🟢 Verde | Colheita/Receita |
| 🔵 Azul claro | Crescimento |

**Padrões observados:**
- Soja: verde em Mar/Abr (colheita) — plantio (laranja) não visível nos meses capturados (provavelmente Set-Dez, fora da tela capturada)
- Milho 1ª Safra: verde em Mar/Abr/Mai (colheita)
- Milho Safrinha: laranja em Jan/Fev (plantio/custeio), verde em Jun/Jul/Ago (colheita)
- Algodão Safra: verde em Ago/Set (colheita)
- Pecuária Bovina: verde em **todos os meses observados (Jan a Set)** — sem fase de "plantio", consistente com pecuária ser uma atividade contínua, não sazonal como grãos

**Cruzamento inferido:** este calendário é provavelmente a **regra de negócio central** que determina em qual mês cada lançamento automático "Custeio" (saída) e "Safra" (entrada) é posicionado na lista de lançamentos mensais (seção 6) — ou seja, é o motor por trás do botão "Gerar Auto". Não há confirmação textual direta disso (sem tooltip explicando a integração), mas a correlação entre as fases aqui e os tipos de lançamento observados na seção 6 é forte (ex.: "Custeio Milho 1ª Safra" aparece em Jan e Out/Nov, compatível com um ciclo de plantio próximo a essas datas).

---

## 4. Tags/Tipos de Lançamento (taxonomia central desta tela)

Cada lançamento na lista mensal (seção 6) é rotulado com um "tipo" (badge colorido). **4 tipos confirmados:**

| Tipo (badge) | Cor observada | Significado inferido | Editável pelo usuário? |
|---|---|---|---|
| **Custeio** | (neutro/cinza) | Saída automática de custo de produção, calculada a partir do Quadro de Safra (R$/ha × área, distribuído nos meses conforme o Calendário Agrícola) | Não (gerado automaticamente) |
| **Safra** | (neutro/cinza) | Entrada automática de receita estimada, calculada a partir da produção × cotação (mesma base de Comercialização/Cotações), distribuída no(s) mês(es) de colheita | Não (gerado automaticamente) |
| **Manual** | (destaque) | Lançamento vinculado a um registro específico de outro módulo (Bancos, Fornecedores, Arrendamentos) — ex.: "Cargill — FERTILIZANTES", "Fazenda Matagal — Arrendamento Anual", "Bradesco — Vencimento", "BTG Pactual — Parcela 1/4" | Provavelmente originado por "Sincronizar Todos", não digitado à mão apesar do nome "Manual" (ver BUG candidato na seção 8) |
| **Projeção** | (destaque, borda amarela) | Entrada projetada adicional, com prefixo "[PROJEÇÃO]" na descrição — ex.: "[PROJEÇÃO] Pecuária Bovina — 30d após colheita" | Não (gerado automaticamente, regra de negócio "+30 dias após colheita" para representar o recebimento efetivo, distinto da data de "Receita" contábil) |

**Achado importante sobre o tipo "Manual":** apesar do nome sugerir lançamento digitado manualmente pelo usuário, os exemplos observados (seção 6) mostram nomes específicos de fornecedores, bancos e fazendas com padrões de parcela ("Parcela 2/5", "Parcela 1/4") — **exatamente o tipo de dado que já existe cadastrado nas telas Bancos, Fornecedores e Arrendamentos**. Isso sugere fortemente que "Manual" é, na verdade, a categoria usada para **lançamentos sincronizados individualmente de outros módulos** (via botão "Sincronizar Todos"), e não lançamentos digitados à mão pelo usuário nesta tela — o nome do tipo pode ser um resquício de nomenclatura interna que não reflete mais o comportamento real. **Ver BUG candidato #1 na seção 8.**

**Padrão da "[PROJEÇÃO] — 30d após colheita":** aparece consistentemente para Pecuária Bovina (todo mês, valor fixo R$ 6,73M ou R$ 7,06M) e depois para Outras Culturas/Soja/Milho nos meses de colheita da safra 2027 — parece representar o **recebimento financeiro efetivo** (com atraso de 30 dias), como um "espelho" da receita contábil "Safra" já lançada no mesmo mês ou anteriormente. Isso é consistente com o padrão de "Data de Liquidação Financeira" já documentado em `SPEC_TELA_COMERCIALIZACAO.md` — sugere que este módulo pode estar simulando o prazo de recebimento mesmo sem haver, ainda, contratos de comercialização reais cadastrados (lembrando que a spec de Comercialização documentou 0 contratos cadastrados no mesmo ambiente).

---

## 5. Modal "Novo Lançamento Manual"

Aberto pelo botão "+ Lançamento".

| # | Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|---|
| — | Toggle "↑ Entrada" / "↓ Saída" | Botões mutuamente exclusivos | — | Determina qual lista de categorias aparece no campo seguinte |
| 1 | Mês | combobox | Sim (`*`) | Default: mês atual ("Ago") |
| 2 | Ano | combobox | Sim (`*`) | Default: ano atual ("2026") |
| 3 | Categoria | combobox | Sim (`*`) | Lista muda conforme Entrada/Saída (ver abaixo) |
| 4 | Descrição | textbox | Não | Placeholder: "Ex: Venda de soja para Bunge" |
| 5 | Valor (R$) | number | Sim (`*`) | Placeholder "0,00" |
| 6 | Cultura (opcional) | textbox livre | Não | Placeholder: "Ex: Soja, Milho, Algodão" — **campo de texto livre, não combobox/enum** (diferente do padrão de outras telas, que usam enum fixo de cultura) |
| 7 | Observações | textarea | Não | Placeholder: "Informações adicionais..." |

**Botões:** "Cancelar" e "Adicionar".

### 5.1 Categorias de "↓ Saída" (11 opções, confirmadas integralmente)

Custeio Agrícola · Insumos · Mão de Obra · Arrendamento Pago · Parcela Bancária · Aquisição de Máquinas · Aquisição de Fazenda · Despesas Administrativas · Impostos e Taxas · Frete e Logística · Outras Despesas

### 5.2 Categorias de "↑ Entrada" (8 opções, confirmadas integralmente)

Venda de Grãos · Venda de Gado · Venda de Algodão · Recebimento de CPR · Arrendamento Recebido · Dividendos / Distribuição · Subvenção / Prêmio de Seguro · Outras Receitas

**Observação:** este é o único lançamento **verdadeiramente manual/livre** do módulo — os campos de categoria aqui (ex.: "Arrendamento Pago", "Parcela Bancária", "Aquisição de Fazenda") **espelham conceitualmente** as mesmas categorias já vistas automaticamente nos lançamentos tipo "Manual" da lista mensal (seção 4), reforçando a hipótese de que ambos os fluxos (sincronização automática vs. lançamento manual pelo usuário) convergem para a mesma estrutura de dados subjacente.

---

## 6. Bloco "Lançamentos Mensais — 104 registros"

Lista com 18 blocos mensais (Jan/2026 a Jun/2027), cada um com: cabeçalho do mês (entradas/saídas/saldo do mês) + lista de lançamentos individuais (ícone de tendência + descrição + tipo + cultura + valor).

### 6.1 Resumo por mês (18 meses)

| Mês | Entradas | Saídas | Saldo do mês |
|---|---|---|---|
| Jan/2026 | +R$ 6,73M | -R$ 5,59M | R$ 1,14M |
| Fev/2026 | +R$ 13,47M | -R$ 3,81M | R$ 9,66M |
| Mar/2026 | +R$ 13,47M | -R$ 3,81M | R$ 9,66M |
| Abr/2026 | +R$ 13,47M | -R$ 3,81M | R$ 9,66M |
| Mai/2026 | +R$ 13,47M | -R$ 3,81M | R$ 9,66M |
| Jun/2026 | +R$ 13,47M | -R$ 3,81M | R$ 9,66M |
| Jul/2026 | +R$ 13,47M | -R$ 3,81M | R$ 9,66M |
| Ago/2026 | +R$ 13,47M | -R$ 3,81M | R$ 9,66M |
| Set/2026 | +R$ 13,47M | -R$ 3,81M | R$ 9,66M |
| Out/2026 | +R$ 13,47M | **-R$ 67,42M** | **-R$ 53,96M** |
| Nov/2026 | +R$ 13,47M | **-R$ 52,32M** | **-R$ 38,85M** |
| Dez/2026 | +R$ 13,79M | **-R$ 44,04M** | **-R$ 30,24M** |
| Jan/2027 | +R$ 7,06M | **-R$ 37,14M** | **-R$ 30,08M** |
| Fev/2027 | +R$ 167,93M | -R$ 19,17M | R$ 148,76M |
| Mar/2027 | +R$ 342,60M | -R$ 0 | R$ 342,60M |
| Abr/2027 | +R$ 186,94M | -R$ 0 | R$ 186,94M |
| Mai/2027 | +R$ 14,28M | **-R$ 18,63M** | **-R$ 4,34M** |
| Jun/2027 | +R$ 2,01M | -R$ 0 | R$ 2,01M |

**5 meses com saldo do mês negativo** (destacados acima): Out/2026, Nov/2026, Dez/2026, Jan/2027, Mai/2027 — concentração clara no período de plantio/custeio pesado (Out-Dez, antes da colheita da safra 2026/2027) e um pico isolado em Mai/2027 (parcela bancária "Caixa Econômica Federal — Parcela 2/4" de R$18,63M). Ver discrepância com o badge "3 meses negativos" já registrada na seção 2.1.

### 6.2 Exemplos de lançamentos por tipo (amostra representativa)

**Tipo "Custeio" (saída automática, recorrente):** "Custeio Milho 1ª Safra" (MILHO), "Custeio Pecuária Bovina" (BOVINO), "Custeio Soja" (SOJA), "Custeio Outras Culturas" (aparece para CAFE_IRRIGADO, SERINGUEIRA, ARROZ, CANA_DE_ACUCAR, EUCALIPTO nos meses de pico Out-Dez/2026)

**Tipo "Safra" (entrada automática de receita estimada):** "Receita Pecuária Bovina (estimativa safra)" (recorrente todo mês, +R$6,73M), "Receita Soja (estimativa safra)", "Receita Outras Culturas (estimativa safra)" (por cultura), "Receita Milho 1ª Safra (estimativa safra)"

**Tipo "Manual" (sincronizado de outros módulos — ver seção 4):**
- Fornecedores: "Cargill — FERTILIZANTES" (-R$5,60M), "Syngenta — SEMENTES" (-R$21,00M), "Bunge — DEFENSIVOS" (-R$15,20M)
- Arrendamentos: "Fazenda Matagal — Arrendamento Anual" (SOJA, -R$2,01M), "Fazenda Pedra II — Arrendamento Anual" (SOJA, -R$0 — consistente com o BUG já documentado em `SPEC_TELA_ARRENDAMENTO_RURAL.md` sobre Fazenda Pedra II não ter preço de referência cadastrado)
- Bancos: "Bradesco — Vencimento" (-R$285K), "BRB — Parcela 2/5" (-R$7,58M), "Banco do Nordeste — Parcela 2/5" (-R$1,36M), "BTG Pactual — Parcela 1/4" (-R$5,00M), "Banco do Brasil — Parcela 2/4" (-R$7,76M), "Sicoob — Parcela 2/4" (-R$242K), "Caixa Econômica Federal — Parcela 2/4" (-R$18,63M)
- Aquisição Fazenda: "Fazenda Pedra — Parcela 2/6" (-R$19,17M, Fev/2027)

**Tipo "Projeção" (recebimento com atraso de 30 dias):** "[PROJEÇÃO] Pecuária Bovina — 30d após colheita" (recorrente, +R$6,73M/+R$7,06M), "[PROJEÇÃO] Soja — 30d após colheita", "[PROJEÇÃO] Milho 1ª Safra — 30d após colheita", "[PROJEÇÃO] Outras Culturas — 30d após colheita" (por cultura, nos meses de Mar-Mai/2027)

**Cruzamento confirmado com "Fazenda Pedra II — Arrendamento Anual: -R$ 0":** este valor zerado reaparece exatamente aqui, no mesmo padrão de bug já documentado na spec de Arrendamento Rural (contrato sem preço de referência cadastrado gera valor R$0 em cascata por todo o sistema) — **confirma que o bug se propaga até esta tela também**, reforçando a severidade/abrangência daquele BUG #1 original.

---

## 7. Cruzamentos com Outras Telas — Síntese

| Dado desta tela | Tela de origem | Confirmação |
|---|---|---|
| Lançamentos "Manual" (Bancos) | Bancos | Confirmado por nomes/padrões idênticos (parcelas por banco) |
| Lançamentos "Manual" (Fornecedores) | Fornecedores | Confirmado por nomes idênticos (Cargill, Syngenta, Bunge) |
| Lançamentos "Manual" (Arrendamentos) | Arrendamentos | Confirmado por nomes idênticos (Fazenda Matagal, Fazenda Pedra II) + reprodução do mesmo bug de preço zerado |
| Lançamentos "Manual" (Aquisição Fazenda) | Aquisição Fazenda | Confirmado por nome idêntico ("Fazenda Pedra — Parcela 2/6") |
| Lançamentos "Safra"/"Custeio" | Quadro de Safra | Inferido pela mesma lógica de custo/receita já documentada em `SPEC_TELA_FLUXO_DE_SAFRA.md` |
| Valores de receita por cultura | Cotações / Comercialização | Inferido — mesma base de cálculo (produção × cotação) já documentada |
| Botão "Sincronizar Todos" | Todos os módulos acima | **Confirmado por texto explícito**: "Sincroniza todos os registros já cadastrados com o fluxo mensal" |
| Switch "Incluir Faturamento PJ" | Balanço PJ | Inferido pelo nome — fora do escopo desta documentação |

**Conclusão sobre a hipótese do solicitante:** confirmada. A tela Fluxo Mensal é, de fato, um espelho/consolidação temporal (mês a mês) dos dados de Bancos, Aquisição Fazenda, Arrendamentos, Fornecedores e (indiretamente, via Quadro de Safra e Cotações) Comercialização — com a particularidade adicional de introduzir uma camada própria de **projeção de calendário agrícola** (Custeio/Safra automáticos por mês, conforme a fase de cada cultura) que não existe nas outras telas financeiras já documentadas.

---

## 8. BUGS e Pontos de Atenção

### Bugs candidatos

**BUG #1 — Nomenclatura "Manual" para lançamentos que parecem ser sincronizados automaticamente, não digitados pelo usuário**
Lançamentos como "Cargill — FERTILIZANTES", "BTG Pactual — Parcela 1/4" e "Fazenda Matagal — Arrendamento Anual" estão rotulados com o tipo "Manual", mas seus nomes e valores batem exatamente com registros já existentes em Fornecedores, Bancos e Arrendamentos — sugerindo fortemente que vieram do botão "Sincronizar Todos", não de digitação manual do usuário nesta tela. Isso pode ser apenas uma escolha de nomenclatura interna (ex.: "Manual" = "vinculado a um registro individual" vs. "Custeio/Safra" = "calculado em lote pela regra do Quadro de Safra"), mas é uma fonte de confusão para quem for interpretar/editar esse código. **Prioridade: Baixa-Média** — recomenda-se renomear para algo como "Sincronizado" ou "Vinculado" se de fato a origem for automática, reservando "Manual" apenas para lançamentos criados via modal "+ Lançamento" pelo próprio usuário.

**BUG #2 (candidato) — Divergência entre badge "3 meses negativos" e a contagem real de 5 meses com saldo mensal negativo**
Documentado em detalhe na seção 2.1 e 6.1. Pode ser explicado se o critério real for "Saldo Acumulado negativo" (não "saldo do mês negativo") — hipótese não confirmável nesta sessão por falta de acesso aos valores exatos de saldo acumulado mês a mês (só disponíveis visualmente no gráfico, não extraídos em texto). **Prioridade: Média** — recomenda-se ao agente de execução extrair os valores exatos da série "Saldo Acum." do gráfico (via inspeção do componente de gráfico ou API) para confirmar a fórmula exata do badge "Situação".

**BUG #3 (reincidente, já documentado em `SPEC_TELA_ARRENDAMENTO_RURAL.md`) — "Fazenda Pedra II — Arrendamento Anual" aparece com valor R$ 0**
Confirma que o bug de contrato sem preço de referência se propaga também para esta tela (Out/2026), não ficando restrito à tela de origem (Arrendamentos). Reforça a severidade/abrangência do bug original.

### Pontos de atenção (não confirmados como bugs)

1. **Campo "Cultura (opcional)" no modal de lançamento manual é texto livre**, não um combobox de enum fixo como em outras telas do sistema (Comercialização, Aquisição, etc.) — risco de inconsistência de digitação (ex.: "soja" vs "Soja" vs "SOJA") que poderia quebrar agregações/gráficos que dependem de correspondência exata de string de cultura. Recomenda-se padronizar como combobox, seguindo o padrão das demais telas.
2. **Botão "Gerar Auto" não testado** — comportamento exato (sobrescreve lançamentos automáticos já existentes? gera duplicatas se clicado mais de uma vez?) não confirmado nesta sessão de mapeamento somente-leitura.
3. **Botão "Sincronizar Todos" não testado** — mesmo ponto de atenção do botão acima: risco de duplicação de lançamentos "Manual" se sincronizado repetidamente sem checagem de idempotência.
4. **Switches "Multi-Safra" e "Incluir Faturamento PJ"** não testados (ambos desligados no estado padrão) — comportamento exato do calendário mensal ao ativá-los não documentado nesta sessão.
5. **Regra "+30 dias após colheita" das entradas tipo "Projeção"** é uma inferência baseada em padrão observado, não confirmada por tooltip/texto explícito do sistema — vale confirmar a regra exata (é sempre 30 dias fixos, ou varia por cultura/tipo de contrato de comercialização?).

---

## 9. Modelo de Dados Inferido

```sql
-- Lançamento individual do fluxo mensal (a única escrita própria deste módulo via modal, além do que é sincronizado)
Lancamento_Fluxo_Mensal (
  id                    PK
  propriedade_id         FK -> Propriedade
  safra_id                 FK -> Safra
  mes                       INT (1-12)
  ano                        INT
  tipo_fluxo                  ENUM (ENTRADA, SAIDA)
  tipo_origem                  ENUM (CUSTEIO, SAFRA, MANUAL, PROJECAO)
  categoria                     ENUM (
                                  -- categorias de Saída:
                                  CUSTEIO_AGRICOLA, INSUMOS, MAO_DE_OBRA, ARRENDAMENTO_PAGO,
                                  PARCELA_BANCARIA, AQUISICAO_MAQUINAS, AQUISICAO_FAZENDA,
                                  DESPESAS_ADMINISTRATIVAS, IMPOSTOS_TAXAS, FRETE_LOGISTICA, OUTRAS_DESPESAS,
                                  -- categorias de Entrada:
                                  VENDA_GRAOS, VENDA_GADO, VENDA_ALGODAO, RECEBIMENTO_CPR,
                                  ARRENDAMENTO_RECEBIDO, DIVIDENDOS_DISTRIBUICAO,
                                  SUBVENCAO_PREMIO_SEGURO, OUTRAS_RECEITAS
                                )
  descricao                      VARCHAR
  cultura                          VARCHAR NULLABLE   -- texto livre (não enum, ver BUG/ponto de atenção)
  valor                              DECIMAL
  observacoes                         TEXT NULLABLE
  registro_origem_tipo                   ENUM (BANCO, FORNECEDOR, ARRENDAMENTO, AQUISICAO, NULL) NULLABLE
  registro_origem_id                       FK NULLABLE  -- vínculo com o registro original, quando sincronizado
  created_at / updated_at
)

-- View agregada mensal (não persistida; base do gráfico "Curva de Caixa" e dos cards de KPI)
Fluxo_Mensal_Resumo (safra_id, mes, ano) {
  entradas_mes    = SUM(Lancamento.valor) WHERE tipo_fluxo = ENTRADA AND mes/ano correspondem
  saidas_mes       = SUM(Lancamento.valor) WHERE tipo_fluxo = SAIDA AND mes/ano correspondem
  saldo_mes         = entradas_mes - saidas_mes
  saldo_acumulado    = SUM(saldo_mes) de todos os meses anteriores + saldo_mes atual (running total)
}

Calendario_Agricola_Regional (
  regiao          ENUM (CENTRO_OESTE, ...)   -- MT/GO/MS/TO agrupados nesta versão
  cultura           VARCHAR
  mes                INT (1-12)
  fase                 ENUM (PLANTIO_CUSTEIO, CRESCIMENTO, COLHEITA_RECEITA)
)
```

---

## 10. Anexo de Imagens

| Arquivo | Conteúdo |
|---|---|
| `screenshot-1787707085323-91c2024d.jpg` | Cabeçalho completo — título, switches (Multi-Safra, Incluir Faturamento PJ), seletor de safra, botões (Lançamento/Gerar Auto/Sincronizar Todos), 4 cards de KPI, início do gráfico Curva de Caixa |
| `screenshot-1787707219266-8073d524.jpg` | Modal "Novo Lançamento Manual" completo — toggle Entrada/Saída, campos Mês/Ano/Categoria/Descrição/Valor/Cultura/Observações |
| `screenshot-1787707296963-eec9a78e.jpg` | Legenda do gráfico Curva de Caixa (Entradas/Saídas/Saldo Acum.) + tabela completa "Calendário Agrícola — Centro-Oeste" com as 5 culturas e legenda de cores (Plantio/Custeio, Colheita/Receita, Crescimento) |
| `screenshot-1787707321492-30c4a1f2.jpg` | Lista de lançamentos mensais — exemplo dos meses Jan-Abr/2026 com badges de tipo "Projeção" (borda amarela) visíveis |

**Cobertura:** boa cobertura visual nesta sessão (4 capturas bem-sucedidas cobrindo todos os elementos gráficos principais). Não foi possível capturar visualmente: o gráfico "Curva de Caixa" completo com os 18 meses no eixo X simultaneamente (apenas trechos parciais), os badges de cor completos para os 4 tipos de lançamento (Custeio/Safra/Manual/Projeção — apenas "Projeção" foi claramente distinguível visualmente), e o comportamento dos botões "Gerar Auto"/"Sincronizar Todos" (não testados).

---

## 11. Resumo Executivo para o Agente de Execução (Claude Code)

**Tela:** Fluxo Mensal (`/dashboard/{id}/fluxo-mensal`)

**O que existe e está mapeado com alta confiança:**
- Estrutura completa dos 3 blocos (KPIs+gráfico, Calendário Agrícola, Lançamentos Mensais) e do modal de lançamento manual (19 categorias no total, 11 de saída + 8 de entrada).
- **Confirmação textual direta da hipótese do solicitante**: botão "Sincronizar Todos" declara explicitamente sincronizar registros já cadastrados em outros módulos.
- Cruzamento confirmado por nomes idênticos com Bancos, Fornecedores, Arrendamentos e Aquisição Fazenda nos lançamentos tipo "Manual".
- Reincidência confirmada do bug de "Fazenda Pedra II" (preço zerado) já documentado na spec de Arrendamento Rural, provando que esse bug se propaga em cascata até esta tela.
- 104 lançamentos ao longo de 18 meses mapeados por padrão/amostra representativa (não letra por letra, dado o volume, mas a estrutura e os 4 tipos estão completamente documentados).

**O que precisa de validação adicional antes de ajustes de código:**
1. Investigar a fórmula exata do badge "Situação: Risco — 3 meses negativos" (divergência com a contagem manual de 5 meses com saldo mensal negativo) — provavelmente baseada em Saldo Acumulado, não saldo do mês isolado.
2. Confirmar se a nomenclatura "Manual" para lançamentos sincronizados automaticamente é intencional ou um resquício de nomenclatura que merece revisão (BUG #1).
3. Testar os botões "Gerar Auto" e "Sincronizar Todos" em ambiente de homologação para confirmar idempotência (não geram duplicatas ao clicar mais de uma vez).
4. Considerar padronizar o campo "Cultura (opcional)" do modal de lançamento manual como combobox de enum fixo, em vez de texto livre.
5. Confirmar a regra exata de "+30 dias após colheita" usada nos lançamentos tipo "Projeção".
6. Testar os switches "Multi-Safra" e "Incluir Faturamento PJ" para documentar seu efeito completo.

**Dependência crítica a não quebrar:** esta tela consome de praticamente todos os módulos operacionais do sistema (Bancos, Fornecedores, Arrendamentos, Aquisição Fazenda, Quadro de Safra) e introduz uma lógica própria adicional de distribuição temporal via Calendário Agrícola — qualquer alteração nesses módulos de origem, ou na lógica de datas/parcelas, tem impacto direto na precisão da "Curva de Caixa" e do indicador de risco desta tela. Assim como Fluxo de Safra e Análise Financeira, deve receber prioridade alta em testes de regressão sempre que os módulos de origem forem alterados.
