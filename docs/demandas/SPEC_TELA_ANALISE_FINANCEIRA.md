# Especificação Técnica — Tela "Análise Financeira"

**Sistema:** AgroFlow — Análise de Produtor Rural
**Nome interno na tela (H1):** "Análise de Índices Financeiros"
**URL:** `https://agroflow-rkqdvzdd.manus.space/dashboard/1050001/analise-financeira`
**Menu lateral:** `Análise Financeira` (entre "Cotações" e "Fluxo Mensal")
**Cliente/Propriedade analisada:** Grupo Pereira (id 1050001)
**Safra selecionada durante a análise:** 2025/2026 (⚠️ diferente da safra padrão 2026/2027 usada nas telas anteriores — ver seção 2)
**Data da análise:** 26/08/2026
**Escopo desta documentação:** conforme orientação do solicitante, o foco é exclusivamente **Pessoa Física (PF)** — o módulo separado "Balanço PJ" (`/dashboard/1050001/balanco-pj`, menu próprio) **não foi explorado** nesta sessão.
**Documento destinado a:** agente de execução (Claude Code) — ajustes desta tela

> Segue o mesmo padrão das specs anteriores. Esta é a tela com maior densidade de campos calculados de todo o sistema mapeado até agora (30+ índices financeiros), e — como o solicitante corretamente hipotetizou — é, junto com Fluxo Mensal, um **espelho/consolidação** dos dados já cadastrados em Bancos, Aquisição de Fazenda, Arrendamentos, Fornecedores, Comercialização e Quadro de Safra. Essa hipótese foi **confirmada por texto explícito do próprio sistema** (ver seção 5).

---

## 1. Visão Geral

A tela "Análise Financeira" (H1 "Análise de Índices Financeiros") é o módulo de **diagnóstico financeiro consolidado** do produtor rural. Ela monta um balanço patrimonial completo (Ativo/Passivo/PL) e uma DRE (Demonstrativo de Resultados), calcula **mais de 30 índices financeiros** organizados em 6 grupos temáticos, e oferece uma visão de **consolidação de grupo econômico** (Pessoa Física do produtor + Pessoas Jurídicas do grupo, quando houver).

A tela possui **4 abas**:

1. **📊 Índices** — aba padrão/ativa ao carregar; radar de "Saúde Financeira" + Balanço Resumido + 30+ índices em 6 grupos + gráfico DRE
2. **⚖️ Balanço** — balanço patrimonial detalhado (Ativo/Passivo/PL) + DRE detalhado + patrimônio pessoal do(s) sócio(s) (bens declarados em IRPF) — **esta é a aba de foco desta documentação (Pessoa Física)**
3. **✏️ Dados Complementares** — formulário de inputs manuais para os campos que não são preenchidos automaticamente pelos outros módulos
4. **🏢 Consolidado Grupo** — visão PF + PJ somadas, com mecanismo de eliminação de operações intercompany

**Confirmação direta do sistema sobre a fonte dos dados** (subtítulo da tela): *"Balanço patrimonial e 30+ indicadores financeiros por safra — **dados automáticos + inputs complementares**"*. Isso já anuncia, na própria UI, a arquitetura de dados que o solicitante hipotetizou: parte dos números vem automaticamente de outros módulos, parte precisa ser complementada manualmente (aba 3).

---

## 2. Observação sobre a Safra Selecionada

Diferente de todas as telas anteriores documentadas (que usavam a safra 2026/2027 como padrão), esta tela carregou com a safra **2025/2026** selecionada por padrão. Isso é relevante porque:
- Os valores de Receita Bruta (R$ 349.532.012) e Custos (R$ 161.190.776) desta tela **não batem diretamente** com os valores de Produção Total (1.689.764 sc) e Custo de Produção (R$ 170.958.647) documentados nas specs de Comercialização e Fluxo de Safra para a safra 2026/2027 — **isso é esperado e não é um bug**, pois são safras diferentes.
- **Ponto de atenção para o agente de execução:** ao validar cruzamentos de dados entre esta tela e as demais, é essencial confirmar que a comparação está sendo feita **na mesma safra** (usar o seletor de safra desta tela para alinhar com 2026/2027 antes de qualquer teste de regressão).

---

## 3. Aba "📊 Índices" (aba padrão)

### 3.1 Cabeçalho

| Elemento | Conteúdo |
|---|---|
| Título | "Análise de Índices Financeiros" |
| Subtítulo | "Balanço patrimonial e 30+ indicadores financeiros por safra — dados automáticos + inputs complementares" |
| Seletor de Safra | Combobox (mesmo padrão global); nesta sessão: "2025/2026" |

### 3.2 Gráfico "Saúde Financeira — Safra 2025/2026" (radar/spider chart)

**Tipo de gráfico:** radar (teia de aranha), preenchido em verde translúcido.

**6 eixos (dimensões):** Liquidez · Endividamento · Rentabilidade · Cobertura · Eficiência · Solvência

**Base de cálculo inferida:** cada eixo do radar provavelmente representa um **score agregado/normalizado** (0 a 100, ou 0 a 5) calculado a partir da média (ou média ponderada) dos indicadores individuais pertencentes àquele grupo temático, classificados nos badges de status "Excelente/Bom/Adequado/Atenção/Crítico" documentados na seção 3.4. Por exemplo, o eixo "Liquidez" provavelmente resume os 4 indicadores do Grupo 1 (Liquidez Corrente, Seca, Imediata, Geral). **Não foi possível confirmar a fórmula exata de normalização** (não há tooltip explicativo sobre o radar em si) — apenas os indicadores individuais que o compõem têm fórmula declarada. **Ponto de atenção:** validar com o time de produto a fórmula exata de agregação antes de qualquer ajuste nesse gráfico.

**Observação visual:** o polígono verde preenchido cobre a maior parte do radar de forma relativamente equilibrada entre os 6 eixos, consistente com o fato de a maioria dos indicadores individuais estarem classificados como "Excelente" ou "Bom" (ver seção 3.4) — exceto pontos isolados como "Liquidez Imediata: Crítico" e "Giro do Ativo: Crítico", que não pareceram derrubar visivelmente os eixos correspondentes (Liquidez e Eficiência ainda aparecem "cheios" no radar), sugerindo que o score de cada eixo é uma **média/agregação, não um "pior caso"**.

### 3.3 Bloco "Balanço Resumido — Safra 2025/2026"

Card ao lado do radar, com 3 colunas (ATIVO / PASSIVO / PATRIMÔNIO):

| ATIVO | Valor | PASSIVO | Valor | PATRIMÔNIO | Valor |
|---|---|---|---|---|---|
| Circulante | R$ 354.532.012 | Circulante | R$ 62.785.583 | Capital + Reservas | R$ 0 |
| Não Circulante | R$ 2.228.194.990 | Não Circulante | R$ 255.504.550 | Resultado Safra | R$ 169.374.828 |
| **Total Ativo** | **R$ 2.582.727.002** | **Total Passivo** | **R$ 318.290.133** | **PL Total** | **R$ 2.264.436.869** |

Abaixo: **Capital de Giro Líquido (CCL): R$ 291.746.429**

**Fórmulas conferidas:**
```
Total_Ativo    = Ativo_Circulante + Ativo_Nao_Circulante = 354.532.012 + 2.228.194.990 = 2.582.727.002  ✓
Total_Passivo  = Passivo_Circulante + Passivo_Nao_Circulante = 62.785.583 + 255.504.550 = 318.290.133  ✓
PL_Total       = Total_Ativo - Total_Passivo = 2.582.727.002 - 318.290.133 = 2.264.436.869  ✓
CCL            = Ativo_Circulante - Passivo_Circulante = 354.532.012 - 62.785.583 = 291.746.429  ✓
```

Todas as fórmulas conferem exatamente com os valores exibidos — alta confiança nos cálculos desta seção.

### 3.4 Grupos de Índices (30+ indicadores, 6 grupos)

Cada indicador é exibido em um card com: nome, badge de classificação qualitativa (Excelente/Bom/Adequado/Atenção/Crítico, com cor e ícone), valor numérico, fórmula (texto curto) e referência de mercado/benchmark.

#### GRUPO 1 — Índices de Liquidez

| Indicador | Status | Valor | Fórmula | Referência |
|---|---|---|---|---|
| Liquidez Corrente | Excelente | 5,65 | Ativo Circ. / Passivo Circ. | Agro: ≥ 1,5 (bom) |
| Liquidez Seca | Excelente | 5,65 | (AC - Estoques) / PC | Agro: ≥ 1,0 (bom) |
| Liquidez Imediata | **Crítico** | 0,00 | Caixa / Passivo Circ. | ≥ 0,3 (bom) |
| Liquidez Geral | Adequado | 1,11 | (AC + ARLP) / (PC + PELP) | ≥ 1,0 (adequado) |

**Observação:** Liquidez Corrente = Liquidez Seca (5,65) porque o "Estoque" desta safra é R$ 0 (confirmado na seção 4.1) — matematicamente consistente, não é bug. Liquidez Imediata = 0,00 porque "Caixa e Equivalentes" também é R$ 0 na safra 2025/2026 — este é o único indicador do grupo classificado como "Crítico", e é consistente com o balanço (não há caixa disponível, apesar de haver R$ 5 milhões em "Aplicações Financeiras", que não entram no cálculo de liquidez imediata por definição contábil padrão).

#### GRUPO 2 — Estrutura de Capital e Endividamento

| Indicador | Status | Valor | Fórmula | Referência |
|---|---|---|---|---|
| Endividamento Geral | Excelente | 12,32% | Passivo Total / Ativo Total | Agro: ≤ 50% (bom) |
| Composição CP/LP | Excelente | 19,73% | Passivo CP / Passivo Total | ≤ 40% (bom) |
| Dívida / EBITDA | Bom | 1,80x | (Dívida - Caixa) / EBITDA | Agro: ≤ 3,0x (bom) |
| Imobilização do PL | **Atenção** | 98,40% | Ativo Imob. / PL | ≤ 70% (bom) |
| Grau de Endividamento | Excelente | 0,14x | Passivo Total / PL | ≤ 1,0x (bom) |
| Alavancagem Financeira | Excelente | 1,14x | Ativo Total / PL | ≤ 2,5x (bom) |
| Cobertura de Juros | Excelente | 24,74x | EBIT / Despesas Financeiras | ≥ 3,0x (bom) |
| Endividamento CP | Excelente | 19,73% | Passivo CP / Passivo Total | ≤ 35% (bom) |

**Observação relevante:** "Imobilização do PL" (98,40%) é o único indicador deste grupo fora da faixa "boa" — extremamente alto porque o PL desta empresa é majoritariamente composto por **bens imóveis declarados em IRPF** (fazendas, ver seção 4.3), não por capital líquido/caixa. Isso é uma característica estrutural de produtores rurais com patrimônio concentrado em terra, não necessariamente um problema financeiro real — vale documentar essa nuance para quem for interpretar o indicador.

#### GRUPO 3 — Rentabilidade e Lucratividade

| Indicador | Status | Valor | Fórmula | Referência |
|---|---|---|---|---|
| Margem Bruta | Excelente | 53,88% | Lucro Bruto / Receita Líq. | Soja: 25-40% |
| Margem EBITDA | Excelente | 50,50% | EBITDA / Receita Líquida | Agro: ≥ 20% (bom) |
| Margem Operacional | Excelente | 50,50% | EBIT / Receita Líquida | Agro: ≥ 15% (bom) |
| Margem Líquida | Excelente | 48,46% | Lucro Líquido / Receita Líq. | Agro: ≥ 10% (bom) |
| ROE | **Atenção** | 7,48% | Lucro Líquido / PL | ≥ 12% (bom) |
| ROA | Bom | 6,56% | Lucro Líquido / Ativo Total | ≥ 6% (bom) |
| ROIC | Adequado | 7,00% | EBIT(1-t) / Capital Invest. | ≥ 10% (bom) |
| Giro do Ativo | **Crítico** | 0,14x | Receita Líquida / Ativo Total | Agro: 0,4-0,8x |

**Observação:** Margem EBITDA = Margem Operacional (50,50%) porque, na DRE desta safra, "Dividendos" (a única linha entre Resultado Operacional e EBITDA) é R$ 0 — consistente (ver DRE completa na seção 4.2). ROE (7,48%) e Giro do Ativo (0,14x) ficam abaixo da referência pelo mesmo motivo estrutural do Grupo 2: o Ativo Total e o PL são "inflados" pelo valor de mercado das fazendas/bens IRPF, o que dilui os retornos percentuais mesmo com margens de lucro excelentes. **Padrão recorrente a documentar:** os indicadores "por Real de ativo/patrimônio" (ROE, ROA, Giro do Ativo) tendem a ficar estruturalmente baixos neste tipo de negócio por causa do peso do imobilizado rural, enquanto os indicadores "por Real de receita" (margens) ficam excelentes. Isso não é um bug do sistema, é uma característica do setor — mas pode gerar percepção equivocada se o usuário não entender a causa raiz.

#### GRUPO 4 — Cobertura e Capacidade de Pagamento

| Indicador | Status | Valor | Fórmula | Referência |
|---|---|---|---|---|
| DSCR (Cobertura Dívida) | Excelente | 10,26x | EBITDA / Serviço da Dívida | Bancos: ≥ 1,3x |
| Cobertura CP | Excelente | 5,57x | (Caixa + CR) / Passivo CP | ≥ 1,0x (bom) |
| Capacidade de Pagamento | Excelente | 10,26x | (EBITDA - CAPEX) / Serv. Dívida | ≥ 1,2x (bom) |
| Cobertura Arrendamento | **Crítico** | —x (traço) | EBITDA / Custo Arrendamento | ≥ 2,5x (bom) |

**Observação:** "Cobertura Arrendamento" exibe "—x" (travessão) em vez de um número — indica **divisão por zero tratada corretamente** (Custo Arrendamento = R$ 0 nesta safra/cliente, confirmado no Passivo, linha "Arrendamentos (anual): R$ 0"), similar ao padrão já visto em "Preço Médio Fixado" na tela Comercialização. O badge "Crítico" para um resultado indefinido (não calculável) é uma escolha de UX questionável — classificar "sem dado" como "Crítico" pode ser enganoso, já que não há arrendamento algum registrado nesta safra para esta análise, não necessariamente uma situação financeira ruim. **Ponto de atenção (ver seção 8).**

#### GRUPO 5 — Eficiência Operacional

| Indicador | Status | Valor | Fórmula | Referência |
|---|---|---|---|---|
| PMR (Recebimento) | **Crítico** | 365 dias | CR / (Receita / 365) | ≤ 60 dias (bom) |
| PMP (Pagamento) | Excelente | 95 dias | Fornecedores / (CPV / 365) | ≥ 45 dias (bom) |
| Giro de Estoque | **Crítico** | —x (traço) | CPV / Estoque Médio | Agro: 2-4x/ano |
| Índice de Bancabilidade | Excelente | 711,44% | PL / Passivo Total | ≥ 30% (bom) |

**Observação relevante — possível bug real:** PMR (Prazo Médio de Recebimento) = **365 dias** é um valor extremo e coincide exatamente com o número de dias do ano civil usado na fórmula (`CR / (Receita / 365)`), o que **matematicamente só ocorre quando Contas a Receber = Receita Total** (ou seja, 100% da receita da safra ainda está pendente de recebimento). Isso é consistente com "Contas a Receber (Safra): R$ 349.532.012" ser idêntico a "Receita Bruta: R$ 349.532.012" no balanço (seção 4.1/4.2) — ou seja, **nenhuma receita da safra foi efetivamente recebida em caixa ainda**, o que também bate com "Caixa e Equivalentes: R$ 0". Não é um bug de cálculo, mas é um valor extremo que estoura completamente a referência (≤ 60 dias) e pode ser resultado de a safra ainda estar em andamento/não comercializada (consistente com a spec de Comercialização, onde 0% da produção 2026/2027 estava fixada — aqui é a safra 2025/2026, mas o padrão de "tudo a receber" é semelhante). **Giro de Estoque** também mostra "—x" pelo mesmo motivo de divisão por zero tratada (Estoque de Grãos = R$ 0).

#### GRUPO 6 — Indicadores Específicos do Agronegócio

| Indicador | Status | Valor | Fórmula | Referência |
|---|---|---|---|---|
| Receita / HA | Excelente | R$ 10.191 | Receita Líquida / Área Total | Soja: R$ 5-8k/ha |
| Custo / HA | Adequado | R$ 4.700 | Custo Total / Área Total | Soja: R$ 3-5k/ha |
| Margem / HA | Excelente | R$ 5.491 | Lucro Bruto / Área Total | Soja: R$ 1-2k/ha |
| Dívida / HA | **Crítico** | R$ 9.280 | Dívida Total / Área Total | ≤ R$ 2,5k/ha (bom) |

**Fórmula conferida:** `Receita / HA = 349.532.012 / 34.297 ha ≈ R$ 10.192/ha` ✓ (área total de 34.297 ha confirmada na seção "Dados de Referência" do Balanço, seção 4.4). Este grupo usa explicitamente "Soja" como cultura de referência para os benchmarks, embora a propriedade tenha 8 culturas diferentes (confirmado em specs de Comercialização) — os benchmarks "Soja: R$ 5-8k/ha" etc. podem não ser totalmente representativos para uma operação tão diversificada. **Ponto de atenção não crítico:** considerar se os benchmarks deveriam ser ponderados pela mix de culturas real da propriedade.

### 3.5 Gráfico "Demonstrativo de Resultados (DRE) — Safra 2025/2026"

**Tipo:** gráfico de barras verticais (barras verdes), eixo Y em R$ milhões (escala de R$0 a R$360M observada).

**6 categorias no eixo X (ordem confirmada):** Receita Bruta · Receita Líquida · Lucro Bruto · EBITDA · EBIT · Lucro Líquido

**Valores correspondentes (da DRE detalhada, seção 4.2):**

| Categoria | Valor |
|---|---|
| Receita Bruta | R$ 349.532.012 |
| Receita Líquida | R$ 349.532.012 |
| Lucro Bruto | R$ 188.341.236 |
| EBITDA | R$ 176.508.771 |
| EBIT | R$ 176.508.771 (= Resultado Operacional, pois Depreciação = R$ 0) |
| Lucro Líquido | R$ 169.374.828 |

Visualmente, as duas primeiras barras (Receita Bruta e Receita Líquida) têm a mesma altura (pois Impostos/Deduções = R$ 0), seguidas de uma queda visível para Lucro Bruto e depois um patamar mais estável até Lucro Líquido — consistente com os valores acima.

---

## 4. Aba "⚖️ Balanço" (foco desta documentação — Pessoa Física)

Esta aba apresenta o balanço patrimonial completo em formato de demonstrativo contábil, seguido da DRE detalhada e, ao final, do detalhamento do **patrimônio pessoal dos sócios (Pessoa Física, via IRPF)** — que é exatamente o escopo solicitado.

### 4.1 Bloco "ATIVO — Safra 2025/2026"

| Ativo Circulante | Valor |
|---|---|
| Caixa e Equivalentes | R$ 0 |
| Aplicações Financeiras | R$ 5.000.000 |
| Contas a Receber (Safra) | R$ 349.532.012 |
| Estoque de Grãos | R$ 0 |
| Estoque de Insumos | R$ 0 |
| Outros Créditos CP | R$ 0 |
| **Total Ativo Circulante** | **R$ 354.532.012** |

| Ativo Não Circulante | Valor |
|---|---|
| Contas a Receber LP | R$ 0 |
| Outros Créditos LP | R$ 0 |
| Investimentos | R$ 0 |
| Máquinas e Equipamentos | R$ 0 |
| Benfeitorias | R$ 0 |
| Fazendas | R$ 115.000.000 |
| (-) Depreciação Acumulada | (R$ 0) |
| **Total Ativo Não Circulante** | **R$ 2.228.194.990** |
| **TOTAL DO ATIVO** | **R$ 2.582.727.002** |

**Achado importante:** a soma das linhas explícitas de Ativo Não Circulante (Contas a Receber LP + Outros Créditos LP + Investimentos + Máquinas e Equip. + Benfeitorias + Fazendas − Depreciação) = R$ 0 + R$ 0 + R$ 0 + R$ 0 + R$ 0 + R$ 115.000.000 − R$ 0 = **R$ 115.000.000**, mas o "Total Ativo Não Circulante" exibido é **R$ 2.228.194.990** — uma diferença de **R$ 2.113.194.990**. Essa diferença bate exatamente com o valor "↳ Bens IRPF Imóveis/Móveis: R$ 2.113.194.990" observado na aba "Consolidado Grupo" (seção 6.3) — ou seja, **o Total Ativo Não Circulante desta aba já inclui, de forma "invisível" (sem linha própria nesta tabela específica), os bens declarados em IRPF dos sócios**, que só aparecem explicitamente listados no bloco separado "Bens e Direitos IRPF" mais abaixo nesta mesma aba (seção 4.3) e de forma mais clara na aba Consolidado Grupo. **Isso não é um erro de cálculo (a soma bate), mas é uma lacuna de transparência na UI da aba Balanço: falta uma linha explícita "Bens IRPF" no bloco ATIVO NÃO CIRCULANTE para que a soma das linhas visíveis bata com o total exibido.** Ver BUG candidato #1 na seção 8.

### 4.2 DRE — Demonstrativo de Resultados — Safra 2025/2026 (detalhado)

| Linha | Valor |
|---|---|
| (+) Receita Bruta | R$ 349.532.012 |
| (-) Impostos / Deduções | (R$ 0) |
| **= Receita Líquida** | **R$ 349.532.012** |
| (-) Custos (CPV / Custo Safra) | (R$ 161.190.776) |
| (-) Arrendamentos (safra) | (R$ 0) |
| **= Lucro Bruto** | **R$ 188.341.236** |
| (-) Despesas Comerciais (3 sc/ha) | (R$ 11.832.465) |
| **= Resultado Operacional** | **R$ 176.508.771** |
| (-) Dividendos | (R$ 0) |
| **= EBITDA** | **R$ 176.508.771** — *Margem EBITDA: 50,5%* |
| (-) Custo Financeiro (Juros / Bancos) | (R$ 7.133.944) |
| (-) Depreciação e Amortização | (R$ 0) |
| **= LAIR** | **R$ 169.374.828** |
| (-) IR/CSLL | (R$ 0) |
| **= Resultado Líquido** | **R$ 169.374.828** |

**Fórmulas conferidas (todas batem exatamente):**
```
Receita_Liquida = 349.532.012 - 0 = 349.532.012  ✓
Lucro_Bruto     = 349.532.012 - 161.190.776 - 0 = 188.341.236  ✓
Resultado_Op.   = 188.341.236 - 11.832.465 = 176.508.771  ✓
EBITDA          = 176.508.771 - 0 = 176.508.771  ✓
LAIR            = 176.508.771 - 7.133.944 - 0 = 169.374.828  ✓
Resultado_Liq.  = 169.374.828 - 0 = 169.374.828  ✓
```
**Observação — "(-) Custos (CPV / Custo Safra)": R$ 161.190.776** — este valor **não bate exatamente** com "Custo de Produção da Safra" documentado em `SPEC_TELA_FLUXO_DE_SAFRA.md` (R$ 170.958.647), mas isso é **esperado**, pois aquela spec referia-se à safra 2026/2027 e esta tela está na safra 2025/2026 (ver seção 2 — safras diferentes, não é divergência real).

**"(-) Despesas Comerciais (3 sc/ha)": R$ 11.832.465** — mesma regra fixa de "3 sacas de soja por hectare" já documentada em `SPEC_TELA_FLUXO_DE_SAFRA.md`, aqui reaparecendo de forma idêntica e consistente — reforça que essa é uma regra de negócio central compartilhada entre os dois módulos (Fluxo de Safra e Análise Financeira), calculada a partir da mesma base (Quadro de Safra).

### 4.3 Bloco "PASSIVO — Safra 2025/2026"

| Passivo Circulante | Valor | Origem provável |
|---|---|---|
| Bancos CP | R$ 284.597 | **Bancos** |
| Fornecedores CP | R$ 41.800.000 | **Fornecedores** |
| Arrendamentos (anual) | R$ 0 | **Arrendamentos** |
| Aquisição de Fazendas CP | R$ 20.700.986 | **Aquisição Fazenda** |
| Obrigações Trabalhistas | R$ 0 | Input manual (aba Dados Complementares) |
| Obrigações Fiscais CP | R$ 0 | Input manual |
| Outras Obrigações CP | R$ 0 | Input manual |
| **Total Passivo Circulante** | **R$ 62.785.583** | |

| Passivo Não Circulante | Valor | Origem provável |
|---|---|---|
| Bancos LP | R$ 171.205.536 | **Bancos** |
| Aquisição de Fazendas LP | R$ 84.299.014 | **Aquisição Fazenda** |
| Fornecedores LP | R$ 0 | **Fornecedores** |
| Obrigações Fiscais LP | R$ 0 | Input manual |
| Outras Obrigações LP | R$ 0 | Input manual |
| Partes Relacionadas | R$ 0 | Input manual |
| **Total Passivo Não Circulante** | **R$ 255.504.550** | |
| **TOTAL DO PASSIVO** | **R$ 318.290.133** | |

**Cruzamento notável:** "Bancos CP + Bancos LP" = R$ 284.597 + R$ 171.205.536 = **R$ 171.490.133**. Esse valor é muito próximo (mas não idêntico) ao valor "Renovação de Dívidas Bancárias (CP + LP): R$ 181.490.133" documentado como não-confirmado-por-tooltip em `SPEC_TELA_FLUXO_DE_SAFRA.md` — a diferença de exatos **R$ 10.000.000** entre os dois números é suspeita e pode indicar que um dos dois valores inclui uma linha adicional (ex.: uma nova captação prevista) que o outro não inclui, ou que as safras diferentes (2025/2026 vs. 2026/2027) explicam a diferença. **Recomenda-se investigação cruzada específica deste ponto pelo agente de execução, comparando as duas telas na mesma safra.**

### 4.4 Bloco "PATRIMÔNIO LÍQUIDO"

| Linha | Valor |
|---|---|
| Capital Social | R$ 0 |
| Reservas e Lucros Acumulados | R$ 0 |
| Resultado da Safra | R$ 169.374.828 |
| **PATRIMÔNIO LÍQUIDO** | **R$ 2.264.436.869** |
| **PASSIVO + PL** | **R$ 2.582.727.002** (= Total do Ativo ✓ — balanço fecha corretamente) |

**Observação:** assim como no Ativo, a soma visível de Capital Social + Reservas + Resultado da Safra (R$ 0 + R$ 0 + R$ 169.374.828 = R$ 169.374.828) **não bate** com o PL Total exibido (R$ 2.264.436.869) — a diferença de R$ 2.095.062.041 é, novamente, o valor dos bens IRPF entrando "por fora" da soma visível de PL. Mesma observação de transparência do BUG candidato #1.

### 4.5 Bloco "Dados de Referência"

| Campo | Valor |
|---|---|
| Área Total Plantada | 34.297 ha |
| Bancos CP / LP | R$ 284.597 / R$ 171.205.536 |
| Fornecedores CP / LP | R$ 41.800.000 / R$ 0 |
| Arrendamentos (anual) | R$ 0 |
| Fazendas (imobilizado) | R$ 115.000.000 |

Bloco-resumo de auditoria rápida — repete valores já detalhados acima, útil para conferência visual sem precisar rolar toda a tela.

### 4.6 Bloco "Bens e Direitos IRPF — Detalhamento por Categoria" (⭐ Pessoa Física — núcleo do escopo solicitado)

Subtítulo: **"Patrimônio Pessoal dos Sócios"**

#### 4.6.1 Cards-resumo

| Card | Valor | Detalhe |
|---|---|---|
| Fazendas Próprias (IRPF) | R$ 0 | 0 ha |
| Máquinas e Equipamentos | R$ 0 | 0 itens |
| Bens e Direitos IRPF | R$ 2.118.194.990 | 15 itens |
| **Patrimônio Total** | **R$ 2.233.194.990** | Garantia: R$ 0 |

**Observação:** os cards "Fazendas Próprias (IRPF)" e "Máquinas e Equipamentos" aparecem zerados (R$ 0, 0 itens), mas a listagem detalhada abaixo (seção 4.6.2) mostra claramente 13 fazendas e 1 item de "Maquinários" com valores substanciais — **inconsistência entre os cards-resumo do topo e a listagem detalhada logo abaixo**. Ver BUG candidato #2 na seção 8.

#### 4.6.2 Listagem detalhada — "IMÓVEIS RURAIS (IRPF)" (13 itens)

| Fazenda | Valor (R$) |
|---|---|
| FAZENDA STO ANTÔNIO DA LAGUNA - CENTRAL | R$ 56.693.700 |
| FAZENDA STO ANTÔNIO DA LAGUNA - FAZENDINHA | R$ 13.700.050 |
| FAZENDA POUSO ALEGRE | R$ 207.530.100 |
| FAZENDA GUARDA-MOR | R$ 109.755.000 |
| FAZENDA CANJICA | R$ 1.306.800 |
| FAZENDA SANTA BÁRBARA | R$ 312.000.000 |
| FAZENDA BURITI PAULISTA | R$ 200.000.000 |
| FAZENDA SÃO GONÇALO | R$ 365.322.440 |
| FAZENDA SERRA AZUL | R$ 83.732.320 |
| FAZENDA RIO DO FOGO | R$ 129.844.680 |
| FAZENDA SONHO MEU II - OURO VERDE | R$ 73.223.920 |
| FAZENDA ARARA AZUL | R$ 20.776.000 |
| FAZENDA ARARA AZUL (2ª ocorrência — mesmo nome) | R$ 456.788.980 |
| **Subtotal Imóveis Rurais** | **R$ 2.030.673.990** |

**Observação:** "FAZENDA ARARA AZUL" aparece **duas vezes** na lista, com valores muito diferentes (R$ 20.776.000 e R$ 456.788.980) — pode ser duas matrículas/glebas distintas da mesma fazenda (situação legítima e comum em cadastro rural, onde uma propriedade tem múltiplas matrículas), ou pode ser um registro duplicado por engano no cadastro. **Não é possível confirmar qual dos dois cenários é o real apenas por esta tela — recomenda-se checagem cruzada com o Cadastro Mestre / módulo de origem desses dados de IRPF.**

#### 4.6.3 Listagem detalhada — "IMÓVEIS URBANOS (IRPF)" (1 item)

| Item | Valor (R$) |
|---|---|
| Maquinários | R$ 82.521.000 |
| **Subtotal Imóveis Urbanos** | **R$ 82.521.000** |

**Observação (possível bug de categorização):** o item "Maquinários" está classificado na categoria **"IMÓVEIS URBANOS (IRPF)"**, o que é semanticamente incorreto — maquinário agrícola não é um imóvel urbano. Muito provavelmente deveria estar em uma categoria própria "Máquinas e Equipamentos" (que, aliás, já existe como card-resumo zerado no topo — seção 4.6.1, reforçando a suspeita de que há uma falha de mapeamento entre a categoria de origem do dado IRPF e a categoria exibida nesta tela). Ver BUG candidato #3 na seção 8.

#### 4.6.4 Listagem detalhada — "APLICAÇÕES FINANCEIRAS" (1 item)

| Item | Valor (R$) |
|---|---|
| CDB Santander | R$ 5.000.000 |
| **Subtotal Aplicações Financeiras** | **R$ 5.000.000** |

Este valor bate exatamente com "Aplicações Financeiras: R$ 5.000.000" do Ativo Circulante (seção 4.1) — **cruzamento interno confirmado, consistente.**

**Soma de verificação:** R$ 2.030.673.990 (rurais) + R$ 82.521.000 (urbanos/maquinário) + R$ 5.000.000 (aplicações) = **R$ 2.118.194.990** — bate exatamente com o card "Bens e Direitos IRPF: R$ 2.118.194.990" (seção 4.6.1). A soma interna das 3 categorias está correta; o problema é apenas a categorização "Maquinários" → "Imóveis Urbanos" e a inconsistência dos cards-resumo zerados no topo.

---

## 5. Aba "✏️ Dados Complementares" — Confirmação Direta da Arquitetura de Dados

Esta aba é a **evidência mais direta e explícita de todo o sistema** sobre quais módulos alimentam automaticamente esta tela e quais campos exigem input manual. Texto literal do próprio sistema, no topo da aba:

> **"Bancos, Fornecedores, Arrendamentos e Quadro de Safra são preenchidos automaticamente. Informe abaixo os dados complementares para a safra 2025/2026."**

Isso **confirma diretamente a hipótese do solicitante**: a tela Análise Financeira é, de fato, um espelho dos dados de Bancos, Fornecedores, Arrendamentos e Quadro de Safra (que por sua vez já reflete Comercialização/Cotações). **Aquisição Fazenda também está confirmada como fonte automática**, pela presença das linhas "Aquisição de Fazendas CP/LP" no Passivo (seção 4.3), mesmo não estando citada neste texto específico — possível pequena omissão de texto (ver seção 8).

### 5.1 Campos de input manual (organizados por seção do balanço)

| Seção | Campos disponíveis para input manual |
|---|---|
| **Ativo Circulante** | Caixa e Equivalentes (R$) · Aplicações Financeiras (R$) · Estoque de Grãos (R$) · Estoque de Insumos (R$) · Outros Créditos CP (R$) |
| **Ativo Não Circulante** | Contas a Receber LP (R$) · Outros Créditos LP (R$) · Participações/Investimentos (R$) · Máquinas e Equipamentos (R$) · Benfeitorias e Construções (R$) · Depreciação Acumulada (R$) |
| **Passivo Complementar** | Obrigações Trabalhistas CP (R$) · Obrigações Fiscais CP (R$) · Outras Obrigações CP (R$) · Obrigações Fiscais LP (R$) · Outras Obrigações LP (R$) · Partes Relacionadas (R$) |
| **Patrimônio Líquido** | Capital Social (R$) · Reservas e Lucros Acumulados (R$) |
| **DRE Complementar** | Deduções da Receita (%) · Despesas Operacionais (R$) · Despesas Administrativas (R$) · Despesas Comerciais (R$) — Fallback · Desp. Comerciais (sc/ha) · Dividendos (R$) · Custo Financeiro/Juros (R$) · Depreciação do Período (R$) · Alíquota IR/CSLL (%) |
| **Fluxo de Caixa** | CAPEX (R$) · Serviço da Dívida Total (R$) |

**Campo especialmente relevante — "Despesas Comerciais (R$) — Fallback":** o texto de ajuda declara *"Usado apenas se não houver preço de soja cadastrado"* — confirma diretamente que a regra "3 sc/ha de soja" (vista tanto aqui quanto em Fluxo de Safra) depende do **preço de soja cadastrado em Cotações**, e que existe um mecanismo de fallback manual caso essa cotação não esteja disponível. Isso é uma confirmação adicional do cruzamento com `SPEC_TELA_COTACOES.md`.

**Campo "Desp. Comerciais (sc/ha)":** confirma que o valor "3 sc/ha" não é necessariamente fixo/hardcoded como inferido em `SPEC_TELA_FLUXO_DE_SAFRA.md` — na verdade **é um parâmetro configurável pelo usuário**, com "padrão: 3 sc/ha" apenas como valor default. **Correção a essa spec anterior:** a regra "3 sc/ha" não é 100% hardcoded, é configurável nesta aba.

Botões: "Salvar Dados" (topo) e "Salvar Todos os Dados" (rodapé) — não testados nesta sessão (ação de escrita fora do escopo de mapeamento somente-leitura).

---

## 6. Aba "🏢 Consolidado Grupo"

### 6.1 Cabeçalho e status

> "Consolidado do Grupo — PF + PJ" — "Índices calculados somando os dados do Produtor Rural (PF) com os balanços das empresas do grupo (PJ). Safra de referência: 2025/2026 · Exercício PJ: 2025"

Status badges: **"📊 PF: ✅ dados carregados"** e **"🏢 PJ: 0 empresa(s) com balanço no exercício 2025"**

**Confirmação direta:** como não há nenhuma empresa PJ com balanço lançado, **todos os valores "consolidados" desta aba são idênticos aos valores PF** documentados nas seções 3 e 4 — não há, neste ambiente, nenhum dado real de PJ para contrastar. O rodapé da aba confirma isso explicitamente: *"Sem balanços PJ para o exercício 2025 — Acesse o módulo Balanço PJ para lançar os balanços das empresas do grupo. Os índices consolidados acima refletem apenas os dados do Produtor Rural (PF)."*

### 6.2 Bloco "Eliminações Intercompany — Exercício 2025"

Formulário para registrar ajustes de eliminação entre empresas do grupo (mútuos, partes relacionadas), com campos: Empresa origem (combobox) · Contraparte (combobox, default "Não identificada") · Conta contábil (default "Mútuos / Partes Relacionadas") · Valor (R$) · botão "Registrar ajuste". Texto de ajuda: *"Registre mútuos, partes relacionadas e operações entre empresas. Só ajustes aprovados pelo usuário master, com contraparte dentro do grupo, alteram o consolidado."* — indica um controle de governança (aprovação por "usuário master") não explorado em profundidade nesta sessão.

Estado vazio: "Nenhum ajuste intercompany registrado para este exercício." Cards de resumo: Ativo/Passivo/Receita/EBITDA "PJ ajustado" — todos R$ 0.

**Badge "Alertas de consolidação: 2"** — não foi possível abrir/expandir o detalhe desses 2 alertas nesta sessão (elemento não interativo isoladamente na árvore de acessibilidade). **Ponto de atenção:** recomenda-se ao agente de execução localizar e documentar o conteúdo desses 2 alertas antes de qualquer ajuste nesta aba.

### 6.3 Balanço, Passivo, PL e DRE Consolidados (PF + PJ)

Estrutura em tabela de 2 colunas (PF | PJ) para cada linha, espelhando exatamente a mesma estrutura da aba Balanço (seção 4), com a coluna PJ sempre "—" (vazia) neste ambiente. **Achado relevante:** esta aba **é a única que exibe explicitamente a linha "↳ Bens IRPF Imóveis/Móveis: R$ 2.113.194.990"** dentro do bloco Ativo Não Circulante — a mesma linha que está "escondida"/implícita na aba Balanço (ver BUG candidato #1). Texto de confirmação direta do sistema:

> **"ℹ️ Coluna PF já consolida os bens declarados no IRPF dos sócios: imóveis, máquinas, aplicações financeiras, participações societárias, créditos e disponibilidades cadastrados na aba Bens e Direitos."**

Isso confirma definitivamente que a fonte dos R$ 2,1 bilhões "extras" no Ativo é a aba "Bens e Direitos IRPF" — resolve a dúvida da seção 4.1, mas reforça que essa transparência **deveria também existir na aba Balanço isolada (PF)**, não apenas na aba Consolidado Grupo.

### 6.4 Bloco "Faturamento Consolidado — PF + PJ" (gráfico de cards + ranking)

| Card | Valor | % do grupo |
|---|---|---|
| PF (Produtor Rural) | R$ 349.532.012 | 100,0% |
| PJ (Empresas do Grupo) | R$ 0 | 0,0% |
| **Total Consolidado** | **R$ 349.532.012** | Média: R$ 29.127.668/mês |

**Gráfico "RECEITA PF POR PRODUTO (CULTURA)"** — gráfico de barras horizontais, ranking decrescente por receita, com percentual do total:

| Cultura | Receita | % |
|---|---|---|
| CAFE_IRRIGADO | R$ 121.567.500 | 34,8% |
| EUCALIPTO | R$ 76.992.750 | 22,0% |
| BOVINO | R$ 64.455.542 | 18,4% |
| Soja | R$ 33.633.820 | 9,6% |
| CANA_DE_ACUCAR | R$ 24.492.000 | 7,0% |
| ARROZ | R$ 10.716.300 | 3,1% |
| SERINGUEIRA | R$ 9.784.400 | 2,8% |
| Milho | R$ 7.889.700 | 2,3% |

**Soma de verificação:** 121.567.500 + 76.992.750 + 64.455.542 + 33.633.820 + 24.492.000 + 10.716.300 + 9.784.400 + 7.889.700 = **R$ 349.531.012** — diferença de **R$ 1.000** em relação ao total declarado (R$ 349.532.012), provavelmente arredondamento de centavos em uma das 8 linhas. **Diferença desprezível, não classificada como bug.**

**Observação de formatação (menor):** duas culturas aparecem com a primeira letra maiúscula apenas ("Soja", "Milho"), enquanto as demais 6 aparecem em `UPPER_SNAKE_CASE`/caixa alta total ("CAFE_IRRIGADO", "EUCALIPTO", "BOVINO", "CANA_DE_ACUCAR", "ARROZ", "SERINGUEIRA") — **mesma inconsistência de formatação de nome de cultura já documentada como BUG #1 em `SPEC_TELA_COMERCIALIZACAO.md`**, aqui reaparecendo de forma ainda mais visível (mistura de 2 formatos na mesma lista, não só bruto vs. bonito).

### 6.5 Blocos de resumo e índices consolidados

"Consolidado Grupo" (6 métricas: Receita Bruta, Receita Líquida, Lucro Bruto, EBITDA, Resultado Líquido, Margem EBITDA, Margem Líquida Grupo) seguido de 3 grupos de índices reexibidos no contexto "GRUPO CONSOLIDADO" (Liquidez, Endividamento e Capital, Rentabilidade) — os mesmos indicadores e valores já documentados na seção 3.4, apenas re-rotulados como "— Grupo Consolidado" e, como não há PJ, **idênticos aos valores PF**. Botão final: "Exportar PDF Consolidado" (não testado).

---

## 7. Cruzamentos com Outras Telas — Síntese

Esta tela tem cruzamentos confirmados com o maior número de módulos de todo o sistema mapeado:

| Dado desta tela | Tela de origem | Confirmação |
|---|---|---|
| Bancos CP/LP (Passivo) | Bancos | **Confirmado por texto explícito** ("Bancos... preenchidos automaticamente") |
| Fornecedores CP/LP (Passivo) | Fornecedores | **Confirmado por texto explícito** |
| Arrendamentos (Passivo) | Arrendamentos | **Confirmado por texto explícito** |
| Custo de Produção / Receita (DRE) | Quadro de Safra | **Confirmado por texto explícito** |
| Aquisição de Fazendas CP/LP (Passivo) | Aquisição Fazenda | Confirmado pela presença consistente das linhas no Passivo (não citado no texto de ajuda, mas estruturalmente presente) |
| Despesa Comercial (fallback 3 sc/ha) | Cotações (preço de soja) | **Confirmado por texto explícito** do campo "Despesas Comerciais — Fallback" |
| Bens e Direitos IRPF (Ativo Não Circulante) | Aba "Bens e Direitos" (não documentada nesta sessão — provavelmente dentro de Cadastro Mestre) | **Confirmado por texto explícito** na aba Consolidado Grupo |
| Balanço PJ (aba Consolidado Grupo) | Tela separada "Balanço PJ" | **Confirmado por texto explícito** ("Acesse o módulo Balanço PJ para lançar os balanços...") — **fora do escopo desta documentação, por instrução do solicitante** |
| Receita por cultura (gráfico ranking) | Comercialização / Quadro de Safra | Inferido pela estrutura de 8 culturas idêntica à documentada em `SPEC_TELA_COMERCIALIZACAO.md` |

**Conclusão sobre a hipótese do solicitante:** confirmada integralmente. A tela Análise Financeira é, de fato, um agregador/espelho de Bancos, Aquisição Fazenda, Arrendamentos, Fornecedores e Quadro de Safra (que por sua vez incorpora Comercialização e Cotações), complementado por inputs manuais (aba 3) para os campos que nenhum módulo de origem cobre (ex.: Obrigações Trabalhistas, Capital Social, CAPEX) e por dados de patrimônio pessoal (IRPF) para compor o Ativo/PL na visão Pessoa Física.

---

## 8. BUGS e Pontos de Atenção

### Bugs candidatos (requerem confirmação/decisão de produto)

**BUG #1 — Falta de transparência: "Bens IRPF" soma no Total do Ativo/PL da aba Balanço sem linha própria visível**
Na aba "⚖️ Balanço" (visão PF isolada), o "Total Ativo Não Circulante" (R$ 2.228.194.990) e o "PL Total" (R$ 2.264.436.869) incluem R$ 2.113.194.990 e R$ 2.095.062.041 respectivamente referentes a bens declarados em IRPF, mas **nenhuma linha do bloco ATIVO NÃO CIRCULANTE ou PATRIMÔNIO LÍQUIDO desta aba específica soma esse valor explicitamente** — o usuário só descobre a origem dessa diferença ao rolar até o bloco separado "Bens e Direitos IRPF" mais abaixo (ou ao visitar a aba Consolidado Grupo, que tem a linha "↳ Bens IRPF Imóveis/Móveis" explícita). Recomenda-se adicionar essa linha também na aba Balanço isolada, para consistência com a aba Consolidado Grupo. **Prioridade: Média** (não afeta o cálculo, afeta a clareza/auditabilidade).

**BUG #2 — Cards-resumo "Fazendas Próprias (IRPF)" e "Máquinas e Equipamentos" zerados, mas a listagem abaixo mostra 13 fazendas e 1 item de maquinário com valores altos**
Os 2 primeiros cards do bloco "Bens e Direitos IRPF" (seção 4.6.1) mostram R$ 0 / 0 itens, enquanto a listagem detalhada logo abaixo mostra 13 imóveis rurais somando R$ 2.030.673.990 e 1 item "Maquinários" de R$ 82.521.000. Os cards-resumo parecem não estar lendo os mesmos dados exibidos na listagem detalhada — possível bug de agregação/contagem nesses 2 cards específicos. **Prioridade: Alta** (números zerados nos cards de destaque podem levar o usuário a subestimar drasticamente o patrimônio real do produtor).

**BUG #3 — Item "Maquinários" categorizado como "IMÓVEIS URBANOS (IRPF)"**
Semanticamente incorreto — maquinário não é imóvel urbano. Muito provavelmente há uma categoria "Máquinas e Equipamentos" própria (já existe como card no topo, também zerada, reforçando a suspeita de vínculo com o BUG #2) que não está recebendo esse item corretamente. **Prioridade: Média.**

**BUG #4 (candidato) — "Cobertura Arrendamento" e "Giro de Estoque" classificados como "Crítico" quando o valor é indefinido ("—x", divisão por zero por ausência de dado)**
Diferente de outros campos "sem dado" no sistema (que exibem "—" sem badge de status, como visto em Comercialização), aqui a ausência de dado é classificada com o badge de pior status possível ("Crítico"), o que pode ser enganoso — não há necessariamente uma situação financeira crítica, apenas ausência de arrendamento/estoque nesta safra. **Prioridade: Média** — sugestão: usar um badge neutro tipo "Não aplicável" ou "Sem dados" quando o denominador da fórmula for zero por ausência de operação (não por resultado ruim).

### Pontos de atenção (não confirmados como bugs)

1. **Divergência de R$ 10.000.000 entre "Bancos CP+LP" desta tela (R$ 171.490.133) e "Renovação de Dívidas Bancárias" do Fluxo de Safra (R$ 181.490.133)** — pode ser explicada por safras diferentes (2025/2026 vs. 2026/2027) ou por uma real divergência de fonte. Requer checagem cruzada na mesma safra.
2. **"FAZENDA ARARA AZUL" duplicada na lista de Imóveis Rurais (IRPF)**, com valores muito diferentes (R$ 20,7 milhões e R$ 456,7 milhões) — pode ser matrículas legítimas distintas ou duplicidade de cadastro. Requer checagem cruzada com o módulo de origem desses dados IRPF.
3. **Texto de ajuda da aba "Dados Complementares" não menciona "Aquisição Fazenda"** entre os módulos automáticos citados (só cita Bancos, Fornecedores, Arrendamentos, Quadro de Safra), embora os dados de Aquisição de Fazendas apareçam consistentemente no Passivo. Pequena omissão de texto/documentação da própria UI, não um bug funcional.
4. **Badge "Alertas de consolidação: 2"** na aba Consolidado Grupo não pôde ser expandido/detalhado nesta sessão — conteúdo desconhecido, recomenda-se investigação futura.
5. **Fórmula exata de agregação do radar "Saúde Financeira"** não confirmada (sem tooltip) — apenas os 6 eixos e os indicadores individuais que presumivelmente os compõem foram documentados.
6. **Benchmarks do Grupo 6 (Indicadores do Agronegócio) usam referência fixa de "Soja"**, apesar da operação ter 8 culturas diferentes — pode gerar interpretação distorcida dos indicadores "por hectare" para uma operação tão diversificada.
7. **Regra "Despesa Comercial 3 sc/ha" é configurável** (campo "Desp. Comerciais (sc/ha)" na aba Dados Complementares) — isso **corrige uma suposição da spec anterior** (`SPEC_TELA_FLUXO_DE_SAFRA.md`), que tratava esse valor como hardcoded. Recomenda-se atualizar aquela spec com esta informação caso o agente de execução for revisá-la.

---

## 9. Modelo de Dados Inferido

```sql
-- Dados complementares manuais (única escrita própria deste módulo, além dos ajustes intercompany)
Dados_Complementares_Financeiro (
  id                        PK
  propriedade_id             FK -> Propriedade
  safra_id                    FK -> Safra
  -- Ativo Circulante
  caixa_equivalentes          DECIMAL DEFAULT 0
  aplicacoes_financeiras        DECIMAL DEFAULT 0
  estoque_graos                  DECIMAL DEFAULT 0
  estoque_insumos                 DECIMAL DEFAULT 0
  outros_creditos_cp                DECIMAL DEFAULT 0
  -- Ativo Não Circulante
  contas_receber_lp                  DECIMAL DEFAULT 0
  outros_creditos_lp                   DECIMAL DEFAULT 0
  investimentos                          DECIMAL DEFAULT 0
  maquinas_equipamentos                    DECIMAL DEFAULT 0
  benfeitorias                               DECIMAL DEFAULT 0
  depreciacao_acumulada                        DECIMAL DEFAULT 0
  -- Passivo Complementar
  obrig_trabalhistas_cp / obrig_fiscais_cp / outras_obrig_cp DECIMAL DEFAULT 0
  obrig_fiscais_lp / outras_obrig_lp / partes_relacionadas    DECIMAL DEFAULT 0
  -- PL
  capital_social / reservas_lucros_acumulados                  DECIMAL DEFAULT 0
  -- DRE Complementar
  deducoes_receita_pct                    DECIMAL DEFAULT 0
  despesas_operacionais / despesas_administrativas DECIMAL DEFAULT 0
  despesas_comerciais_fallback              DECIMAL NULLABLE   -- só usado se sem cotação soja
  desp_comerciais_sc_ha                       DECIMAL DEFAULT 3  -- configurável, default 3
  dividendos / custo_financeiro / depreciacao_periodo DECIMAL DEFAULT 0
  aliquota_ir_csll_pct                          DECIMAL DEFAULT 0
  -- Fluxo de Caixa
  capex / servico_divida_total                    DECIMAL DEFAULT 0
)

-- Ajuste de eliminação intercompany (Consolidado Grupo)
Ajuste_Intercompany (
  id                PK
  exercicio          INT
  empresa_origem      FK -> Empresa (PJ do grupo)
  contraparte           FK -> Empresa (PJ do grupo) NULLABLE
  conta_contabil          ENUM (MUTUOS_PARTES_RELACIONADAS, ...)
  valor                     DECIMAL
  aprovado_por_master        BOOLEAN DEFAULT false
)

-- View agregada (não persistida; montada em tempo de exibição, combinando dados automáticos + complementares + IRPF)
Balanco_Financeiro_View (propriedade_id, safra_id) {
  ativo_circulante   = SUM(Dados_Complementares.caixa+aplicacoes+estoques+outros_cp) + Contas_Receber_Safra (via Comercialização/Quadro Safra)
  ativo_nao_circ      = SUM(Dados_Complementares.*_lp) + Aquisicao.fazendas_valor + SUM(Bens_Direitos_IRPF.valor)
  passivo_circulante   = Bancos.saldo_cp + Fornecedores.saldo_cp + Aquisicao.parcelas_cp + Dados_Complementares.obrig_*_cp
  passivo_nao_circ      = Bancos.saldo_lp + Aquisicao.parcelas_lp + Fornecedores.saldo_lp + Dados_Complementares.obrig_*_lp
  pl_total                = ativo_circulante + ativo_nao_circ - passivo_circulante - passivo_nao_circ
  ... (30+ índices calculados a partir dessas bases, ver fórmulas documentadas em cada grupo)
}
```

---

## 10. Anexo de Imagens

| Arquivo | Conteúdo |
|---|---|
| `screenshot-1787705908063-b9896fbe.jpg` | Aba "Índices" — radar "Saúde Financeira" completo + Balanço Resumido (ATIVO/PASSIVO/PATRIMÔNIO) |
| `screenshot-1787705927920-15b3d13e.jpg` | Aba "Balanço" — início do bloco ATIVO CIRCULANTE |
| `screenshot-1787705978163-f3101a39.jpg` | Aba "Balanço" — DRE detalhado completo (Lucro Bruto até Resultado Líquido) + início do PASSIVO |
| `screenshot-1787706058420-b7364325.jpg` | Aba "Balanço" — listagem de fazendas IRPF (final) + "IMÓVEIS URBANOS (IRPF)" com item "Maquinários" + início de "APLICAÇÕES FINANCEIRAS" |
| `screenshot-1787706173989-495aabf4.jpg` | Aba "Índices" — Grupo 6 (Indicadores do Agronegócio) + início do gráfico de barras DRE |
| `screenshot-1787706210289-35369c3b.jpg` | Aba "Consolidado Grupo" — cabeçalho, status PF/PJ, início de "Eliminações Intercompany" |
| `screenshot-1787706223686-bf92360a.jpg` | Aba "Consolidado Grupo" — formulário de ajuste intercompany + cards "Ativo/Passivo/Receita/EBITDA PJ ajustado" |
| `screenshot-1787706337412-8400d311.jpg` | Aba "Consolidado Grupo" — "Faturamento Consolidado PF+PJ" + início do ranking "Receita PF por Produto (Cultura)" |

**Cobertura:** boa cobertura visual nesta sessão (8 capturas bem-sucedidas), incluindo os 3 gráficos principais (radar de Saúde Financeira, barras de DRE, ranking horizontal de Receita por Cultura). Não foi possível capturar visualmente: o conteúdo expandido do badge "Alertas de consolidação: 2", nem o comportamento de salvamento dos formulários (Dados Complementares, Eliminações Intercompany) — ambos fora do escopo de mapeamento somente-leitura.

---

## 11. Resumo Executivo para o Agente de Execução (Claude Code)

**Tela:** Análise Financeira (`/dashboard/{id}/analise-financeira`) — escopo desta spec: **Pessoa Física apenas** (aba Balanço PJ separada não documentada, por instrução do solicitante)

**O que existe e está mapeado com alta confiança:**
- Estrutura completa das 4 abas (Índices, Balanço, Dados Complementares, Consolidado Grupo).
- 30+ índices financeiros em 6 grupos, com fórmula e referência de benchmark documentadas para cada um; a maioria das fórmulas foi conferida numericamente e bate exatamente.
- Balanço patrimonial completo (Ativo/Passivo/PL) e DRE detalhada, com todas as somas conferidas.
- **Confirmação textual direta e explícita da hipótese do solicitante**: Bancos, Fornecedores, Arrendamentos e Quadro de Safra alimentam automaticamente esta tela; Aquisição Fazenda também está estruturalmente confirmada; o restante são inputs manuais complementares.
- Bloco de patrimônio pessoal (IRPF) com 15 itens detalhados, cruzado com sucesso contra os totais do Ativo.
- 3 gráficos documentados (radar de Saúde Financeira, barras de DRE, ranking de Receita por Cultura), com estrutura visual confirmada por screenshot.

**O que precisa de validação/correção antes de ajustes de código (por prioridade):**
1. **BUG #2** (Alta prioridade): cards-resumo "Fazendas Próprias" e "Máquinas e Equipamentos" zerados incorretamente, apesar de a listagem detalhada abaixo mostrar valores substanciais.
2. **BUG #1** (Média): adicionar linha explícita de "Bens IRPF" no Ativo Não Circulante e no PL da aba Balanço isolada (hoje só visível na aba Consolidado Grupo), para consistência e transparência.
3. **BUG #3** (Média): corrigir categorização de "Maquinários" — está em "Imóveis Urbanos (IRPF)" e deveria estar em uma categoria de máquinas/equipamentos própria.
4. **BUG #4** (Média): revisar a classificação de badge "Crítico" para indicadores com denominador zero (ex.: Cobertura Arrendamento, Giro de Estoque) — considerar um badge neutro de "sem dados"/"não aplicável".
5. Investigar a divergência de R$ 10 milhões entre "Bancos CP+LP" desta tela e "Renovação de Dívidas Bancárias" do Fluxo de Safra, alinhando a mesma safra em ambas as telas.
6. Confirmar se "FAZENDA ARARA AZUL" duplicada é matrícula legítima ou erro de cadastro.
7. Atualizar `SPEC_TELA_FLUXO_DE_SAFRA.md` com a informação de que a regra "3 sc/ha" de Despesa Comercial é configurável (campo "Desp. Comerciais (sc/ha)"), não hardcoded como assumido naquela spec.
8. Confirmar a fórmula exata de agregação do radar "Saúde Financeira" e o conteúdo dos 2 "Alertas de consolidação".

**Dependência crítica a não quebrar:** esta é, junto com o Fluxo de Safra, a tela mais dependente de outros módulos de todo o sistema — qualquer alteração em Bancos, Fornecedores, Arrendamentos, Aquisição Fazenda, Quadro de Safra ou Cotações (via regra de fallback de Despesa Comercial) tem efeito cascata direto sobre os 30+ índices e o balanço completo desta tela. Testes de regressão nesta tela devem ser priorizados sempre que qualquer um desses módulos de origem for alterado.
