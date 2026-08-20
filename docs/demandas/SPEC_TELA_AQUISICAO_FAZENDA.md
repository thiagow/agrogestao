# ESPECIFICAÇÃO TÉCNICA DETALHADA — TELA "AQUISIÇÃO FAZENDA"

**Sistema:** AgroFlow — Análise de Produtor Rural
**Rota:** `/dashboard/1050001/aquisicoes`
**Item de menu:** "Aquisição Fazenda" (ícone de prédio/localização)
**Finalidade deste documento:** Servir de input para um agente de execução (Claude Code) realizar ajustes/correções nesta tela específica. Contém de-para de campos, cálculos, cruzamentos com outras telas e bugs identificados.
**Data do levantamento:** 21/07/2026
**Dataset de referência usado na análise:** Grupo Pereira → 1 aquisição cadastrada ("Fazenda Pedra")

---

## ÍNDICE

1. [Visão Geral da Tela](#1-visão-geral-da-tela)
2. [Cabeçalho e Cards de KPI](#2-cabeçalho-e-cards-de-kpi)
3. [Aba "Contratos"](#3-aba-contratos)
4. [Modal "Nova Aquisição" / "Editar Aquisição"](#4-modal-nova-aquisição--editar-aquisição)
5. [Aba "Fluxo por Safra"](#5-aba-fluxo-por-safra)
6. [Aba "Análise de Impacto"](#6-aba-análise-de-impacto)
7. [Aba "Gráficos"](#7-aba-gráficos)
8. [Modelo de Dados Inferido](#8-modelo-de-dados-inferido)
9. [Cruzamentos com Outras Telas](#9-cruzamentos-com-outras-telas)
10. [BUGS E PONTOS DE ATENÇÃO (Lista Consolidada para Correção)](#10-bugs-e-pontos-de-atenção-lista-consolidada-para-correção)
11. [Anexo de Imagens](#11-anexo-de-imagens)

---

## 1. VISÃO GERAL DA TELA

| Item | Valor |
|---|---|
| Título (H1) | "Aquisição de Fazendas" |
| Subtítulo | "Registro e fluxo de pagamento de compras de propriedades rurais" |
| Ícone do título | Prédio/edifício (verde) |
| Ícone do menu lateral | Pin de localização |
| Ação principal (topo direito) | Botão verde `+ Nova Aquisição` |
| Estrutura | 3 (ou 4, ver seção 2) cards de KPI → 4 abas → conteúdo da aba ativa |
| Abas | `Contratos (N)` \| `Fluxo por Safra` \| `Análise de Impacto` \| `Gráficos` |
| Aba padrão ao carregar | `Contratos` |

Ver imagem: `screenshot-1787231895053-3c496314.jpg`

---

## 2. CABEÇALHO E CARDS DE KPI

4 cards horizontais no topo da página, acima das abas.

| # | Label | Valor observado | Fórmula/Origem inferida |
|---|---|---|---|
| 1 | Aquisições | `1` | `COUNT(aquisicoes ativas do grupo)` |
| 2 | Área Total Adquirida | `5.000 ha` | `SUM(area_hectares)` de todas as aquisições ativas |
| 3 | Sacas/Safra Atual | `1.000.000 sc` | Sacas da parcela correspondente à "safra atual" do sistema (safra vigente, ex: 2026/2027) |
| 4 | Valor Safra Atual | `R$ 115.000.000` | Valor Total da parcela da "safra atual" (2026/2027) |

**Observação importante:** os cards 3 e 4 usam o conceito de "safra atual" (safra vigente do sistema, aparentemente 2026/2027 no dataset analisado). Esse conceito de "safra atual" é global e compartilhado com outras telas (Comercialização, Fluxo Mensal, Cotações também usam "Safra 2026/2027" como referência). **Confirmar se esse valor vem de uma configuração central (ex: `propriedade.safra_atual`) e não de cálculo local da tela.**

Quando existem múltiplas aquisições, os cards 3 e 4 devem somar os valores de todas as parcelas com `safra = safra_atual`.

---

## 3. ABA "CONTRATOS"

### 3.1 Card de Contrato (visão fechada/colapsada)

Cada aquisição é exibida como um card na lista. Estrutura do card:

| Elemento | Tipo | Exemplo | Notas |
|---|---|---|---|
| Chevron (`˅`/`˃`) | Botão de expandir/colapsar | — | Alterna exibição da tabela de fluxo de pagamento |
| Nome da Fazenda | Texto (título, bold) | "Fazenda Pedra" | — |
| Localização | Texto (cinza, abaixo do nome) | "Cristalina - GO" | Formato: `{Município} - {UF}` |
| Badge Cultura/Sacas por ha | Chip | "SOJA · 200,00/ha" | Formato: `{CULTURA} · {sacas_ha},00/ha` |
| Badge Período de safras | Chip | "2026/2027 → 2029/2030" | Safra inicial → Safra final do contrato |
| Badge Área | Chip | "5.000 ha" | Área total do imóvel |
| Badge Periodicidade | Chip (verde claro) | "ANUAL" | Periodicidade de pagamento |
| Valor Total Fluxo | Texto (label + valor, alinhado à direita) | "Valor Total Fluxo — R$ 470.000.000" | `SUM(valor_total de todas as parcelas + entrada)` |
| Total de sacas | Texto (cinza, abaixo do valor) | "4.086.957 sc total" | `SUM(sacas de todas as parcelas + entrada)` |
| Ícone editar (lápis) | Botão | ✏️ | Abre modal "Editar Aquisição" |
| Ícone deletar (lixeira) | Botão (vermelho) | 🗑️ | Deve abrir confirmação antes de excluir (não testado nesta sessão — **validar se existe modal de confirmação**) |

Ver imagem: `screenshot-1787231895053-3c496314.jpg`

### 3.2 Tabela expandida (fluxo de pagamento do contrato)

Ao clicar no chevron, expande uma tabela abaixo do card com o detalhamento de todas as parcelas do contrato.

**Colunas da tabela:**

| # | Coluna | Tipo | Exemplo | Notas |
|---|---|---|---|---|
| 1 | Safra | Texto | "2027/2028" | Safra à qual o lançamento pertence |
| 2 | Tipo | Badge | "Entrada" (verde escuro) / "Parcela" (cinza claro) | Classifica o lançamento |
| 3 | Sacas | Número + "sc" | "1.000.000 sc" | Quantidade de sacas do lançamento |
| 4 | Preço/sc | Moeda + selo | "R$ 115 ✓ref." | Preço por saca; selo "✓ref." indica que está usando o **preço de referência** do contrato (não um preço específico daquela parcela) |
| 5 | Valor Total | Moeda | "R$ 115.000.000" | `= Sacas × Preço/sc` |
| 6 | Data Pagamento | Data (dd/mm/aaaa) | "31/03/2027" | Data de vencimento do lançamento |

**Dados completos capturados (contrato "Fazenda Pedra"):**

| Safra | Tipo | Sacas | Preço/sc | Valor Total | Data Pagamento |
|---|---|---|---|---|---|
| 2027/2028 | Entrada | 86.957 sc | R$ 115 ✓ref. | R$ 10.000.000 | ⚠️ **"Invalid Date"** |
| 2026/2027 | Parcela | 1.000.000 sc | R$ 115 ✓ref. | R$ 115.000.000 | 31/03/2027 |
| 2027/2028 | Parcela | 1.000.000 sc | R$ 115 ✓ref. | R$ 115.000.000 | 31/03/2028 |
| 2028/2029 | Parcela | 1.000.000 sc | R$ 115 ✓ref. | R$ 115.000.000 | 31/03/2029 |
| 2029/2030 | Parcela | 1.000.000 sc | R$ 115 ✓ref. | R$ 115.000.000 | 31/03/2030 |

**Verificação de somatórios:**
- Sacas: 86.957 + 1.000.000×4 = **4.086.957 sc** ✓ confere com o total exibido no card
- Valor: 10.000.000 + 115.000.000×4 = **R$ 470.000.000** ✓ confere com o total exibido no card

Ver imagem: `screenshot-1787231996532-6f7881cc.jpg`

> 🐞 **BUG #1 (crítico):** A linha do tipo "Entrada" exibe `Invalid Date` na coluna "Data Pagamento". Ver seção 10 para detalhes e hipótese de causa.

---

## 4. MODAL "NOVA AQUISIÇÃO" / "EDITAR AQUISIÇÃO"

Mesmo componente de formulário é reaproveitado para criação (`Registrar Aquisição de Fazenda`, campos vazios) e edição (`Editar Aquisição`, campos pré-preenchidos). Estrutura idêntica.

Botão de abertura:
- Criação: botão `+ Nova Aquisição` (topo da página)
- Edição: ícone de lápis (✏️) no card do contrato

Botão de fechar: `X` no canto superior direito do modal, ou tecla `Esc`.

### 4.1 Seção "1. Identificação"

| Campo | Label exibido | Tipo | Obrigatório | Placeholder | Valor no exemplo (edição) |
|---|---|---|---|---|---|
| nome_fazenda | Nome da Fazenda * | Texto | **Sim** (asterisco) | "Ex: Fazenda Santa Cruz" | "Fazenda Pedra" |
| vendedor | Vendedor / Proprietário | Texto | Não | "Nome do vendedor" | (vazio) |
| denominacao_imovel | Denominação do Imóvel | Texto | Não | "Denominação conforme matrícula" | (vazio) |
| comarca | Comarca | Texto | Não | "Comarca" | (vazio) |
| numero_matricula | Nº da Matrícula | Texto | Não | "Número da matrícula" | (vazio) |
| estado | Estado | Dropdown (UF) | Não (mas tem valor padrão) | "UF" | "GO" |
| municipio | Município | Texto | Não | "Cidade" | "Cristalina" |

Layout: campos em coluna única até "Denominação do Imóvel"; depois "Comarca" e "Nº da Matrícula" lado a lado (2 colunas); "Estado" e "Município" lado a lado (2 colunas).

Ver imagens: `screenshot-1787232074553-1e24f806.jpg` (edição) e `screenshot-1787232360945-213f6ebc.jpg` (novo, vazio).

### 4.2 Seção "2. Área"

| Campo | Label | Tipo | Obrigatório | Valor no exemplo |
|---|---|---|---|---|
| area_total_ha | Área Total (ha) | Número decimal | Aparenta não ter asterisco, mas é usada nos cálculos | `5000,0000` |
| area_agricola_ha | Área Agrícola (ha) | Número decimal | Idem | `4000,0000` |

Layout: 2 colunas lado a lado. Placeholder padrão `0,00` quando vazio.

> ⚠️ **Nota:** existem 2 conceitos de área: "Área Total" (usada no cálculo `Valor Total = Preço/ha × Área Total`, conforme visto em "23.000,00/ha × 5.000 ha") e "Área Agrícola" (aparentemente não usada em nenhum cálculo visível nesta tela — **investigar se deveria ser usada como base do cálculo de sacas/produção ao invés da Área Total**, já que nem toda a área de uma fazenda é cultivável).

Ver imagem: `screenshot-1787232142627-4e217094.jpg`

### 4.3 Seção "3. Contrato"

| Campo | Label | Tipo | Valor no exemplo | Comportamento |
|---|---|---|---|---|
| data_aquisicao | Data da Aquisição | Date picker | 10/02/2025 | Livre |
| data_inicio_pagamento | Data de Início do Pagamento | Date picker | 10/02/2026 | Ao alterar, recalcula automaticamente a "Safra inicial" |
| (calculado) safra_inicial | "Safra inicial:" | Texto derivado (não editável) | "2026/2027" | Calculado a partir de `data_inicio_pagamento` |
| data_vencimento | Data de Vencimento (Fim do Pagamento) | Date picker | 10/02/2031 | Ao alterar, recalcula "Safra final" |
| (calculado) safra_final | "Safra final:" | Texto derivado | "2029/2030" | Calculado a partir de `data_vencimento` |
| (calculado) resumo_safras | "Safras do contrato:" | Texto derivado (banner cinza) | "2026/2027 → 2029/2030" | Concatenação de safra_inicial → safra_final |
| (calculado) chips_safras | "Safras cobertas pelo contrato" | Lista de chips (verde) | 2026/2027, 2027/2028, 2028/2029, 2029/2030 | Todas as safras entre início e fim |
| prazo_financiamento_meses | Prazo de Financiamento (meses) | Número inteiro | **vazio** (placeholder "Ex: 60") | Campo livre, **não calculado automaticamente** apesar de o intervalo de datas permitir calcular (10/02/2026 → 10/02/2031 = 60 meses exatos) |

> ⚠️ Quando o formulário está vazio (novo registro) e nenhuma data foi preenchida, o banner de resumo exibe: *"Safras do contrato: Preencha as datas acima para calcular automaticamente"* (itálico, cinza).

Ver imagens: `screenshot-1787232142627-4e217094.jpg`, `screenshot-1787232188738-65771818.jpg`

> 🐞 **BUG #2:** O campo "Prazo de Financiamento (meses)" não é preenchido automaticamente mesmo quando `data_inicio_pagamento` e `data_vencimento` já definem esse valor de forma exata e inequívoca. Ver seção 10.

### 4.4 Seção "4. Condições de Pagamento"

Campos fixos:

| Campo | Label | Tipo | Opções |
|---|---|---|---|
| tipo_pagamento | Tipo de Pagamento | Dropdown | `Em Sacas (commodity)` \| `Em Reais (R$)` |
| periodicidade | Periodicidade | Dropdown | `Anual` (única opção observada — **verificar se existem outras: Mensal, Semestral, etc.**) |

Este dropdown **altera dinamicamente os campos seguintes** (campos condicionais):

#### Quando `Tipo de Pagamento = "Em Sacas (commodity)"` (padrão):

| Campo | Label | Tipo | Valor exemplo |
|---|---|---|---|
| cultura_referencia | Cultura de Referência | Dropdown | "Soja" |
| sacas_ha | Sacas/ha | Número decimal | 200,0000 |
| (calculado) total_sacas_safra | "Total:" | Texto derivado | "1.000.000 sc/safra" (= sacas_ha × área total) |
| preco_referencia | Preço de Referência (R$/sc) | Número decimal | 115,0000 |
| (calculado) valor_estimado_total | "Valor estimado total" (destaque, banner cinza) | Moeda derivada | R$ 115.000.000 |
| (calculado) memoria_calculo | subtítulo do banner | Texto derivado | "23.000,00/ha × 5.000 ha" (= sacas_ha × preco_referencia = R$/ha; × área total) |

Ver imagem: `screenshot-1787232233135-4ea08f9d.jpg`

#### Quando `Tipo de Pagamento = "Em Reais (R$)"`:

| Campo | Label | Tipo |
|---|---|---|
| preco_ha | Preço por ha (R$) | Número decimal (com spinner ▲▼) |
| valor_total_manual | Valor Total (R$) | Número decimal |
| valor_financiado | Valor Financiado (R$) | Número decimal |
| taxa_juros_aa | Taxa de Juros (% a.a.) | Número decimal |

Ver imagem: `screenshot-1787232449406-b2f56029.jpg`

> ⚠️ **Observação para o dev:** no modo "Em Reais", aparecem os campos `Valor Financiado` e `Taxa de Juros`, que sugerem cálculo de amortização/juros — mas **não há nenhuma seção de cronograma de amortização visível no formulário nem confirmação de que esses dois campos realmente geram parcelas com juros compostos** no fluxo (a tabela de parcelas observada no dataset de teste foi gerada no modo "Em Sacas"). **Recomenda-se testar a criação de uma aquisição completa em modo "Em Reais" para validar se o cronograma de parcelas é gerado corretamente e se considera a taxa de juros.**

> 🐞 **BUG #3 (numeração de seções):** Em **ambos os modos** (Em Sacas e Em Reais), a numeração das seções do formulário pula de **"4. Condições de Pagamento"** diretamente para **"6. Entrada (Sinal)"**. Não existe nenhuma seção "5." em nenhum dos dois fluxos testados. Ver seção 10 para detalhes.

### 4.5 Seção "6. Entrada (Sinal)"

| Campo | Label | Tipo | Valor exemplo |
|---|---|---|---|
| valor_entrada | Valor da Entrada (R$) | Número decimal | 10.000.000,00 (exibido como "10000000,00") |
| safra_entrada | Safra da Entrada | Dropdown (lista as safras cobertas pelo contrato) | "2027/2028" |

> ⚠️ Note que no exemplo, a Entrada é lançada na safra **2027/2028**, não na safra inicial do contrato (2026/2027). Isso é consistente com o que se vê na tabela de fluxo (linha "Entrada" com safra 2027/2028), mas é um comportamento não intuitivo — vale confirmar com o usuário/PO se está correto ou se a Entrada deveria sempre cair na primeira safra do contrato.

### 4.6 Rodapé do modal

| Elemento | Tipo |
|---|---|
| `Salvar Aquisição` | Botão primário (verde), full width ou alinhado à direita — **confirmar visualmente, não foi possível capturar o rodapé completo por limitação de viewport nesta sessão** |
| `X` (Close) | Botão de fechar no canto superior direito |

### 4.7 Resumo de todos os campos do formulário (tabela consolidada para dev)

| Ordem | Seção | Campo (nome sugerido) | Tipo | Obrigatório | Calculado? |
|---|---|---|---|---|---|
| 1 | 1. Identificação | nome_fazenda | text | Sim | Não |
| 2 | 1. Identificação | vendedor | text | Não | Não |
| 3 | 1. Identificação | denominacao_imovel | text | Não | Não |
| 4 | 1. Identificação | comarca | text | Não | Não |
| 5 | 1. Identificação | numero_matricula | text | Não | Não |
| 6 | 1. Identificação | estado (UF) | select | Não | Não |
| 7 | 1. Identificação | municipio | text | Não | Não |
| 8 | 2. Área | area_total_ha | number | Não* | Não |
| 9 | 2. Área | area_agricola_ha | number | Não* | Não |
| 10 | 3. Contrato | data_aquisicao | date | Não* | Não |
| 11 | 3. Contrato | data_inicio_pagamento | date | Não* | Não |
| 12 | 3. Contrato | safra_inicial | derivado | — | **Sim** |
| 13 | 3. Contrato | data_vencimento | date | Não* | Não |
| 14 | 3. Contrato | safra_final | derivado | — | **Sim** |
| 15 | 3. Contrato | safras_cobertas | derivado (lista) | — | **Sim** |
| 16 | 3. Contrato | prazo_financiamento_meses | number | Não | Não (deveria ser calculável) |
| 17 | 4. Condições | tipo_pagamento | select | Sim* | Não |
| 18 | 4. Condições | periodicidade | select | Sim* | Não |
| 19a | 4. Condições (modo Sacas) | cultura_referencia | select | Condicional | Não |
| 19b | 4. Condições (modo Sacas) | sacas_ha | number | Condicional | Não |
| 19c | 4. Condições (modo Sacas) | total_sacas_safra | derivado | — | **Sim** |
| 19d | 4. Condições (modo Sacas) | preco_referencia | number | Condicional | Não |
| 19e | 4. Condições (modo Sacas) | valor_estimado_total | derivado | — | **Sim** |
| 20a | 4. Condições (modo Reais) | preco_ha | number | Condicional | Não |
| 20b | 4. Condições (modo Reais) | valor_total_manual | number | Condicional | Não |
| 20c | 4. Condições (modo Reais) | valor_financiado | number | Condicional | Não |
| 20d | 4. Condições (modo Reais) | taxa_juros_aa | number | Condicional | Não |
| 21 | 6. Entrada (Sinal) | valor_entrada | number | Não | Não |
| 22 | 6. Entrada (Sinal) | safra_entrada | select | Não | Não |

`*` = campo sem asterisco visível na UI, mas essencial para os cálculos — validar regra de obrigatoriedade real no backend/validação do form.

---

## 5. ABA "FLUXO POR SAFRA"

**Título da seção:** "Fluxo Consolidado por Safra"

Tabela única, **agregando todas as aquisições do grupo** (não apenas uma), com uma coluna adicional em relação à tabela expandida da aba Contratos:

| # | Coluna | Notas |
|---|---|---|
| 1 | Safra | — |
| 2 | **Fazenda** | Coluna extra (não existe na tabela expandida da aba Contratos) — nome da fazenda de origem do lançamento. Necessária pois esta view é multi-contrato. |
| 3 | Tipo | Entrada / Parcela |
| 4 | Cultura | Ex: "SOJA" |
| 5 | Sacas | — |
| 6 | Preço/sc | — |
| 7 | Valor Total | — |
| 8 | Data Pagamento | — |

**Dados completos capturados** (idênticos aos da aba Contratos, já que há apenas 1 aquisição no dataset de teste):

| Safra | Fazenda | Tipo | Cultura | Sacas | Preço/sc | Valor Total | Data Pagamento |
|---|---|---|---|---|---|---|---|
| 2026/2027 | Fazenda Pedra | Parcela | SOJA | 1.000.000 sc | R$ 115 | R$ 115.000.000 | 31/03/2027 |
| 2027/2028 | Fazenda Pedra | Entrada | SOJA | 86.957 sc | R$ 115 | R$ 10.000.000 | ⚠️ **Invalid Date** |
| 2027/2028 | Fazenda Pedra | Parcela | SOJA | 1.000.000 sc | R$ 115 | R$ 115.000.000 | 31/03/2028 |
| 2028/2029 | Fazenda Pedra | Parcela | SOJA | 1.000.000 sc | R$ 115 | R$ 115.000.000 | 31/03/2029 |
| 2029/2030 | Fazenda Pedra | Parcela | SOJA | 1.000.000 sc | R$ 115 | R$ 115.000.000 | 31/03/2030 |

> Note que a ordenação difere ligeiramente da tabela expandida da aba "Contratos" (aqui a primeira linha é 2026/2027 Parcela, não a Entrada) — **confirmar se a ordenação pretendida é por data crescente ou por ordem de inserção**; hoje parece inconsistente entre as duas telas (a aba Contratos lista Entrada primeiro, Fluxo por Safra lista a Parcela de 2026/2027 primeiro).

> 🐞 O mesmo **BUG #1 (Invalid Date)** se repete aqui — confirma que a origem do bug está no dado/cálculo da parcela tipo "Entrada", não em um problema de renderização isolado de uma única tela.

Ver imagem: `screenshot-1787232513526-b8ab2743.jpg`

---

## 6. ABA "ANÁLISE DE IMPACTO"

Exibe um card por safra coberta pelo(s) contrato(s), comparando o compromisso da aquisição com a produção de soja projetada para aquela safra.

### 6.1 Estrutura de cada card

| Elemento | Tipo | Exemplo |
|---|---|---|
| Label "Safra" | Texto pequeno | "Safra" |
| Safra | Texto (bold) | "2026/2027" |
| **% de impacto** (destaque grande) | Número percentual grande, colorido | "277,47%" |
| Subtítulo do %  | Texto pequeno | "da prod. soja" |
| Sacas Aquisição | Linha label + valor | "1.000.000 sc" |
| Produção Soja | Linha label + valor | "360.400 sc" |
| Valor Total | Linha label + valor | "R$ 115.000.000" |
| Tag de alerta (condicional) | Badge | "Compromisso elevado (>30%)" |

### 6.2 Fórmula do indicador principal

```
% Impacto = (Sacas Aquisição da safra / Produção Soja projetada da safra) × 100
```

### 6.3 Dados completos capturados

| Safra | % Impacto | Sacas Aquisição | Produção Soja | Valor Total | Alerta exibido? |
|---|---|---|---|---|---|
| 2026/2027 | **277,47%** | 1.000.000 sc | 360.400 sc | R$ 115.000.000 | Sim — "Compromisso elevado (>30%)" |
| 2027/2028 | **301,60%** | 1.086.957 sc | 360.400 sc | R$ 125.000.000 | Sim — "Compromisso elevado (>30%)" |
| 2028/2029 | **0,00%** | 1.000.000 sc | **0 sc** | R$ 115.000.000 | Não |
| 2029/2030 | **0,00%** | 1.000.000 sc | **0 sc** | R$ 115.000.000 | Não |

### 6.4 Regras de negócio identificadas

1. **Regra do alerta:** o badge "Compromisso elevado (>30%)" aparece quando `% Impacto > 30%`. Cor do card muda para tom avermelhado/rosado quando o alerta está ativo (ver imagem).
2. **Cor do %:** vermelho quando alto (277%, 301%); a cor para 0,00% não foi claramente distinguível no viewport capturado — **validar visualmente qual é a cor/estado do card quando não há alerta**.
3. **Dependência direta do módulo "Quadro Safra":** o valor "Produção Soja" **não é um dado próprio desta tela** — vem do módulo `Quadro Safra` (campo "Total de Produção (sc)" da cultura Soja, para a safra correspondente). Isso é uma **dependência cross-módulo crítica**: qualquer alteração no Quadro de Safra impacta diretamente os cálculos desta aba.
4. **Tratamento de dado ausente:** para as safras 2028/2029 e 2029/2030, o Quadro de Safra não possui produção de soja cadastrada (fora do horizonte de 4 safras exibido naquele módulo, que vai até 2027/2028). Nesses casos, `Produção Soja = 0`, e o sistema **não gera erro de divisão por zero** — resulta em `0,00%`. **Ponto de atenção:** matematicamente `1.000.000 / 0` é indefinido; o sistema provavelmente tem uma proteção `if (producao === 0) return 0`. Isso pode ser **enganoso para o usuário**, pois "0,00%" sugere "sem compromisso", quando na verdade significa "sem dado de produção cadastrado para comparar". **Sugestão de melhoria:** exibir "N/D" ou "Sem dados de produção" ao invés de "0,00%" quando `Produção Soja = 0`.

Ver imagem: `screenshot-1787232553229-406dbcb3.jpg`

---

## 7. ABA "GRÁFICOS"

Dois gráficos empilhados verticalmente.

### 7.1 Gráfico 1 — "Sacas de Aquisição vs. Produção por Safra"

- Tipo: gráfico de barras agrupadas (2 séries)
- Eixo X: Safras (2026/2027, 2027/2028, 2028/2029, e presumivelmente 2029/2030 fora da área capturada)
- Eixo Y: escala numérica (0 a 1.200.000, incrementos de 300.000)
- Série 1: "Sacas Aquisição" (barra vermelha)
- Série 2: "Produção Soja" (barra verde)
- Legenda inferior com quadrados coloridos
- É a representação gráfica dos mesmos dados da aba "Análise de Impacto" (seção 6.3)

### 7.2 Gráfico 2 — "Distribuição por Fazenda (Valor Total)"

- Tipo: gráfico de pizza/rosca (donut ou pie)
- No dataset de teste (1 única aquisição): "Fazenda Pedra 100%" — um único segmento verde ocupando todo o círculo
- Presumivelmente, com múltiplas aquisições, cada fazenda apareceria como uma fatia proporcional ao seu "Valor Total Fluxo"

> **Observação:** como o dataset de teste possui apenas uma aquisição, não foi possível validar o comportamento do gráfico de pizza com múltiplos segmentos (cores, legendas, ordenação). **Recomenda-se testar com pelo menos 2-3 aquisições cadastradas.**

Ver imagem: `screenshot-1787232592157-09ed7bdf.jpg` (parte superior do gráfico de barras; captura completa dos dois gráficos não foi possível salvar em disco nesta sessão devido a uma queda de conexão do navegador — recomenda-se recapturar se necessário).

---

## 8. MODELO DE DADOS INFERIDO

```
Aquisicao {
  id: UUID (PK)
  propriedade_id: UUID (FK)
  nome_fazenda: string                    // "1. Identificação"
  vendedor: string | null
  denominacao_imovel: string | null
  comarca: string | null
  numero_matricula: string | null
  estado: string(2)                       // UF
  municipio: string
  area_total_ha: decimal                  // "2. Área"
  area_agricola_ha: decimal
  data_aquisicao: date                    // "3. Contrato"
  data_inicio_pagamento: date
  data_vencimento: date
  prazo_financiamento_meses: int | null
  tipo_pagamento: enum('SACAS','REAIS')   // "4. Condições de Pagamento"
  periodicidade: enum('ANUAL', ...)
  // campos condicionais modo SACAS:
  cultura_referencia_id: UUID | null
  sacas_ha: decimal | null
  preco_referencia: decimal | null
  // campos condicionais modo REAIS:
  preco_ha: decimal | null
  valor_total_manual: decimal | null
  valor_financiado: decimal | null
  taxa_juros_aa: decimal | null
  // "6. Entrada (Sinal)"
  valor_entrada: decimal | null
  safra_entrada: string | null            // "AAAA/AAAA"
  ativo: boolean
  criado_em: datetime
  modificado_em: datetime
}

ParcelaAquisicao {
  id: UUID (PK)
  aquisicao_id: UUID (FK)
  safra: string                           // "AAAA/AAAA"
  tipo: enum('ENTRADA','PARCELA')
  sacas: decimal
  preco_sc: decimal
  usa_preco_referencia: boolean           // determina o selo "✓ref."
  valor_total: decimal                    // = sacas × preco_sc
  data_pagamento: date                    // ⚠️ ver BUG #1 — nula/inválida para tipo ENTRADA
}
```

---

## 9. CRUZAMENTOS COM OUTRAS TELAS

| Tela de origem/destino | Campo/Indicador | Como se relaciona com "Aquisição Fazenda" |
|---|---|---|
| **Quadro Safra** (`/safra`) | "Total de Produção (sc)" da cultura Soja, por safra | Usado como denominador no cálculo de "% Impacto" na aba **Análise de Impacto**. Ver seção 6.4. |
| **Fluxo de Safra Projetado** (`/fluxo-caixa`) | Linha "Parcelas de Aquisição de Fazenda" na seção "(-) SAÍDAS" | Valor observado: `(R$ 115.000.000)` para a safra 2026/2027 — **confere exatamente** com a Parcela de 2026/2027 desta tela (R$ 115.000.000). ✅ Consistente. |
| **Resumo / Dashboard** (`/`) | Card "Endividamento" → linha "Aquisição Fazenda" | Valores observados em sessão anterior: `R$ 130.000.000` (coluna "2027/2028 CP esta safra") e `R$ 120.000.000` (coluna "2028/2029 LP próx. safra"). **⚠️ Não confere** com os valores desta tela: a soma Entrada+Parcela de 2027/2028 aqui é R$ 125.000.000 (10M + 115M), e a Parcela pura de 2028/2029 é R$ 115.000.000. Diferença de R$ 5.000.000 em ambos os casos. Ver **BUG #4** na seção 10. |
| **Fluxo Mensal** (`/fluxo-mensal`) | Calendário agrícola / lançamentos mensais | Não foi possível confirmar nesta sessão se as parcelas de aquisição aparecem detalhadas mês a mês nesta tela ou apenas de forma agregada anual. **Recomenda-se validar.** |
| **Cotações** (`/cotacoes`) | Preço de referência de Soja (R$/sc) | O campo "Preço de Referência (R$/sc)" do formulário de aquisição (modo "Em Sacas") pode ou não estar puxando/sugerindo o valor da cotação atual de Soja. No exemplo, o preço usado é R$ 115/sc — **próximo mas não igual** ao preço de R$ 139,14/sc de Soja visto no módulo Cotações em sessão anterior (safra diferente/momento diferente de captura, portanto não é necessariamente inconsistência — apenas **confirmar se há algum tipo de sugestão automática de preço a partir do módulo Cotações** ao preencher este campo). |
| **Análise Financeira** (`/analise-financeira`) | Ativo Não Circulante / Passivo (Balanço) | As aquisições de fazenda provavelmente compõem o Ativo Não Circulante (imóveis) e o saldo a pagar compõe o Passivo. Não foi possível confirmar o vínculo direto nesta sessão. |

---

## 10. BUGS E PONTOS DE ATENÇÃO (LISTA CONSOLIDADA PARA CORREÇÃO)

### 🐞 BUG #1 — "Invalid Date" na coluna Data Pagamento da parcela tipo "Entrada" (CRÍTICO)

- **Onde ocorre:** Aba "Contratos" → tabela expandida do card; e Aba "Fluxo por Safra" → tabela consolidada (mesmo bug replicado nas duas telas, confirma que a causa é no dado, não na renderização).
- **Sintoma:** a célula "Data Pagamento" da linha `Tipo = Entrada` exibe o texto literal `Invalid Date` ao invés de uma data formatada.
- **Hipótese de causa:** o campo `safra_entrada` (dropdown "Safra da Entrada" no formulário) provavelmente não está sendo convertido corretamente para uma data de vencimento real (ex: o sistema pode estar tentando usar `new Date(safra_entrada)` diretamente sobre uma string tipo "2027/2028", que não é um formato de data válido em JavaScript, gerando `Invalid Date`).
- **Correção sugerida:** ao gerar a parcela de "Entrada", calcular uma `data_pagamento` real (ex: primeiro dia da safra selecionada, ou usar `data_inicio_pagamento` do contrato, ou permitir que o usuário informe uma data específica para a entrada no formulário — atualmente só existe o dropdown de safra, não um campo de data).
- **Impacto:** qualquer relatório, ordenação por data, ou fluxo de caixa que dependa da "Data Pagamento" da Entrada estará quebrado ou terá exceções.

### 🐞 BUG #2 — Campo "Prazo de Financiamento (meses)" não calculado automaticamente

- **Onde ocorre:** Modal Editar/Nova Aquisição, seção "3. Contrato".
- **Sintoma:** o campo permanece vazio mesmo quando `data_inicio_pagamento` e `data_vencimento` já estão preenchidas e definem um intervalo exato (no exemplo: 10/02/2026 → 10/02/2031 = 60 meses).
- **Correção sugerida:** auto-calcular `prazo_financiamento_meses = diferença em meses entre data_inicio_pagamento e data_vencimento`, populando o campo automaticamente (mantendo-o editável, se necessário, para ajustes manuais).

### 🐞 BUG #3 — Numeração de seções do formulário pula de "4" para "6" (falta a seção "5")

- **Onde ocorre:** Modal Editar/Nova Aquisição — confirmado em **ambos** os modos de pagamento (Em Sacas e Em Reais).
- **Sintoma:** após "4. Condições de Pagamento", a próxima seção exibida é "6. Entrada (Sinal)". Não existe seção "5." em nenhum fluxo testado.
- **Hipótese:** resquício de uma seção removida do formulário (possivelmente relacionada a "Garantias", "Documentos" ou "Custos Adicionais/Cartório-ITBI") sem a renumeração subsequente ter sido ajustada.
- **Correção sugerida:** renumerar "6. Entrada (Sinal)" para "5. Entrada (Sinal)", **OU** restaurar a seção "5" que foi removida, se ela ainda for necessária (ex: campos de custos adicionais como ITBI, escritura, cartório, que hoje não aparecem em nenhum lugar do formulário e podem estar faltando).

### 🐞 BUG #4 — Possível divergência de valores entre "Aquisição Fazenda" e o card "Endividamento" do Dashboard/Resumo

- **Onde ocorre:** comparação entre esta tela e o módulo Resumo/Dashboard (`/dashboard/1050001`).
- **Sintoma:** o card "Endividamento" do Resumo mostra `R$ 130.000.000` e `R$ 120.000.000` para Aquisição Fazenda, enquanto os valores equivalentes calculados nesta tela são `R$ 125.000.000` (Entrada + Parcela 2027/2028) e `R$ 115.000.000` (Parcela 2028/2029) — diferença de R$ 5.000.000 em ambos os pontos.
- **Observação:** essa divergência foi observada comparando capturas de **sessões diferentes** de exploração do sistema — **não é 100% certo que seja um bug real**, pode ser resultado de dados de demonstração que foram regenerados/alterados entre as sessões. **Recomenda-se validação cuidadosa e específica**: abrir as duas telas na mesma sessão/mesmo estado de dados e comparar os valores diretamente antes de tratar como bug confirmado.

### ⚠️ Ponto de atenção #5 — "% Impacto = 0,00%" quando não há dado de produção (não é bug, mas é confuso)

- Ver seção 6.4, item 4. Sugestão: trocar a exibição para "N/D" ou "Sem dados" quando a produção correspondente for zero/ausente, evitando interpretação equivocada de "0% de risco".

### ⚠️ Ponto de atenção #6 — Campo "Área Agrícola (ha)" aparentemente não utilizado em nenhum cálculo

- Ver seção 4.2. Validar com o PO/negócio se esse campo deveria ser a base real para cálculo de sacas/produção (ao invés da "Área Total").

### ⚠️ Ponto de atenção #7 — Modo de pagamento "Em Reais" não testado ponta a ponta

- Ver seção 4.4. Os campos "Valor Financiado" e "Taxa de Juros (% a.a.)" existem no formulário, mas não foi possível confirmar nesta sessão se eles de fato geram um cronograma de parcelas com juros compostos ao salvar. **Recomenda-se um teste funcional completo criando uma aquisição nova no modo "Em Reais".**

### ⚠️ Ponto de atenção #8 — Ordenação inconsistente das linhas entre "Contratos" (tabela expandida) e "Fluxo por Safra"

- Ver seção 5. A aba Contratos lista a linha "Entrada" (safra 2027/2028) antes da "Parcela" de 2026/2027; já a aba "Fluxo por Safra" lista a Parcela de 2026/2027 primeiro. Padronizar critério de ordenação (sugestão: sempre por `data_pagamento` crescente, uma vez que o BUG #1 seja corrigido).

### ⚠️ Ponto de atenção #9 — Botão de exclusão (🗑️) sem confirmação testada

- Não foi possível, nesta sessão, clicar no ícone de lixeira para validar se existe um diálogo de confirmação antes da exclusão definitiva do contrato de aquisição. **Validar que existe confirmação (modal "Tem certeza?") antes de qualquer ação destrutiva**, consistente com o padrão do restante do sistema.

---

## 11. ANEXO DE IMAGENS

Todas as imagens abaixo estão salvas na mesma pasta deste documento.

| Arquivo | Conteúdo |
|---|---|
| `screenshot-1787231895053-3c496314.jpg` | Aba Contratos — visão geral com os 4 cards de KPI |
| `screenshot-1787231996532-6f7881cc.jpg` | Card expandido — tabela de fluxo de pagamento (Entrada + Parcelas) |
| `screenshot-1787232074553-1e24f806.jpg` | Modal "Editar Aquisição" — Seção 1. Identificação |
| `screenshot-1787232142627-4e217094.jpg` | Modal — Seção 2. Área + início da Seção 3. Contrato (datas) |
| `screenshot-1787232188738-65771818.jpg` | Modal — Safras cobertas pelo contrato + início da Seção 4 |
| `screenshot-1787232233135-4ea08f9d.jpg` | Modal — Valor estimado total + **evidência do BUG #3** (pula "4." para "6.") |
| `screenshot-1787232360945-213f6ebc.jpg` | Modal "Registrar Aquisição de Fazenda" (novo, campos vazios) |
| `screenshot-1787232397246-9f9d6411.jpg` | Dropdown "Tipo de Pagamento" aberto — 2 opções disponíveis |
| `screenshot-1787232449406-b2f56029.jpg` | Campos condicionais do modo "Em Reais (R$)" |
| `screenshot-1787232513526-b8ab2743.jpg` | Aba "Fluxo por Safra" — tabela consolidada |
| `screenshot-1787232553229-406dbcb3.jpg` | Aba "Análise de Impacto" — cards por safra com % de impacto |
| `screenshot-1787232592157-09ed7bdf.jpg` | Aba "Gráficos" — início do gráfico de barras |

---

## RESUMO EXECUTIVO PARA O AGENTE DE EXECUÇÃO (Claude Code)

Ao trabalhar nesta tela, priorizar nesta ordem:

1. **Corrigir BUG #1** (Invalid Date na parcela de Entrada) — impacto alto, quebra ordenação/relatórios em 2 telas.
2. **Corrigir BUG #3** (numeração de seção do formulário) — impacto visual/cosmético, mas fácil de corrigir e afeta credibilidade do formulário.
3. **Implementar cálculo automático do BUG #2** (Prazo de Financiamento em meses).
4. **Investigar e confirmar/descartar BUG #4** (divergência de valores com o Dashboard) antes de alterar qualquer lógica de cálculo compartilhada.
5. Avaliar as melhorias de UX dos pontos de atenção #5 a #9 como itens de backlog secundário.

Todos os campos, fórmulas e estruturas de dados necessários para implementar essas correções estão detalhados nas seções 3 a 8 deste documento.
