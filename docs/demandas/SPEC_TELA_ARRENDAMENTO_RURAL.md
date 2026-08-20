# ESPECIFICAÇÃO TÉCNICA DETALHADA — TELA "ARRENDAMENTO RURAL"

**Sistema:** AgroFlow — Análise de Produtor Rural
**Rota:** `/dashboard/1050001/arrendamentos`
**Item de menu:** "Arrendamentos" (ícone de pin/localização)
**Finalidade deste documento:** Servir de input para um agente de execução (Claude Code) realizar ajustes/correções nesta tela específica. Contém de-para de campos, cálculos, cruzamentos com outras telas e bugs identificados. Segue o mesmo padrão da especificação já produzida para a tela "Aquisição Fazenda".
**Data do levantamento:** 21/07/2026
**Dataset de referência usado na análise:** Grupo Pereira → 2 contratos de arrendamento cadastrados ("Fazenda Matagal" e "Fazenda Pedra II")

---

## ÍNDICE

1. [Visão Geral da Tela](#1-visão-geral-da-tela)
2. [Cabeçalho e Cards de KPI](#2-cabeçalho-e-cards-de-kpi)
3. [Aba "Contratos"](#3-aba-contratos)
4. [Modal "Novo Contrato" / "Editar Contrato de Arrendamento"](#4-modal-novo-contrato--editar-contrato-de-arrendamento)
5. [Aba "Fluxo por Safra"](#5-aba-fluxo-por-safra)
6. [Aba "Análise de Impacto"](#6-aba-análise-de-impacto)
7. [Aba "Gráficos"](#7-aba-gráficos)
8. [Modelo de Dados Inferido](#8-modelo-de-dados-inferido)
9. [Cruzamentos com Outras Telas](#9-cruzamentos-com-outras-telas)
10. [Comparativo com a Tela "Aquisição Fazenda"](#10-comparativo-com-a-tela-aquisição-fazenda)
11. [BUGS E PONTOS DE ATENÇÃO (Lista Consolidada para Correção)](#11-bugs-e-pontos-de-atenção-lista-consolidada-para-correção)
12. [Anexo de Imagens](#12-anexo-de-imagens)

---

## 1. VISÃO GERAL DA TELA

| Item | Valor |
|---|---|
| Título (H1) | "Arrendamento Rural" |
| Subtítulo | "Contratos, fluxo por safra e análise de impacto" |
| Ícone do título | Pin de localização (verde) |
| Ícone do menu lateral | Mesmo pin de localização |
| Ação principal (topo direito) | Botão verde `+ Novo Contrato` |
| Estrutura | 4 cards de KPI → 4 abas → conteúdo da aba ativa |
| Abas | `Contratos` \| `Fluxo por Safra` \| `Análise de Impacto` \| `Gráficos` |
| Aba padrão ao carregar | `Contratos` |

> Nota: diferente da tela "Aquisição Fazenda", aqui a aba "Contratos" **não exibe contagem entre parênteses** no rótulo (ex: não é "Contratos (2)", apenas "Contratos"). Ver ponto de atenção na seção 11.

---

## 2. CABEÇALHO E CARDS DE KPI

4 cards horizontais no topo da página, acima das abas.

| # | Label | Valor observado | Fórmula/Origem inferida |
|---|---|---|---|
| 1 | Área Arrendada Total | `2.299 ha` | `SUM(area_arrendada_ha)` de todos os contratos ativos (1.499 + 800 = 2.299 ✓) |
| 2 | Sacas/ano (Safra Atual) | `27.588 sc` | Soma das "Sacas Líquidas" de todos os contratos na safra vigente (2026/2027): Matagal 17.988 + Pedra II 9.600 = 27.588 ✓ |
| 3 | Custo Anual (Safra Atual) | `R$ 2.014.656` | Soma do "Valor Total" de todos os contratos na safra vigente — **⚠️ considera apenas contratos com preço de referência preenchido** (ver BUG #1 na seção 11; Fazenda Pedra II não entra nesta soma) |
| 4 | Contratos Ativos | `2` | `COUNT(contratos com status = ATIVO)` |

Mesmo conceito de "safra atual" (2026/2027) compartilhado com o restante do sistema, já documentado na spec de Aquisição Fazenda.

---

## 3. ABA "CONTRATOS"

### 3.1 Card de Contrato (visão fechada/colapsada)

| Elemento | Tipo | Exemplo (Fazenda Matagal) | Exemplo (Fazenda Pedra II) | Notas |
|---|---|---|---|---|
| Chevron (`˅`/`˃`) | Botão de expandir/colapsar | — | — | Alterna exibição da tabela "Fluxo de Pagamento por Safra" |
| Nome da Fazenda | Texto (título, bold) | "Fazenda Matagal" | "Fazenda Pedra II" | — |
| Ícone/Localização | Texto (cinza, ao lado do nome) | *(ausente)* | "📍 Cristalina" | **Inconsistência:** Matagal não exibe localização, Pedra II exibe "Cristalina" ao lado do nome (não abaixo, como na tela de Aquisição). Provavelmente o campo "Município" está vazio no cadastro de Matagal. |
| Status | Badge (verde) | "ATIVO" | "ATIVO" | — |
| Cultura | Label + valor | "Cultura: SOJA" | "Cultura: SOJA" | — |
| Área | Label + valor | "Área: 1.499 ha" | "Área: 800 ha" | = área arrendada |
| Sacas/ha | Label + valor | "Sacas/ha: 12,0" | "Sacas/ha: 12,0" | — |
| Safras | Label + valor | "Safras: 2026/2027 → 2029/2030" | "Safras: 2025/2026 → 2031/2032" | Intervalo do contrato |
| Periodicidade | Label + valor | "Periodicidade: ANUAL" | "Periodicidade: ANUAL" | — |
| Custo Anual | Label + valor (vermelho) | "Custo Anual: R$ 2.014.656" | ⚠️ **Ausente** | Ver BUG #1 — só aparece quando o contrato tem preço de referência definido |
| Ícone editar (lápis) | Botão | ✏️ | ✏️ | Abre modal "Editar Contrato de Arrendamento" |
| Ícone deletar (lixeira) | Botão (vermelho) | 🗑️ | 🗑️ | Não testado nesta sessão (confirmação de exclusão não validada) |

### 3.2 Tabela expandida "FLUXO DE PAGAMENTO POR SAFRA"

Ao clicar no chevron, expande uma tabela com o detalhamento de todas as parcelas anuais do contrato.

**Colunas da tabela:**

| # | Coluna | Tipo | Exemplo | Notas |
|---|---|---|---|---|
| 1 | Safra | Texto | "2026/2027" | — |
| 2 | Tipo | Texto | "Normal" | Só foi observado o valor "Normal" — provavelmente existe também um tipo relacionado a "Antecipado" quando o pagamento antecipado está habilitado (ver seção 4.5) |
| 3 | Sacas Brutas | Número | "17.988" | = Sacas/ha × Área Arrendada (12,0 × 1.499 = 17.988 ✓) |
| 4 | (-) Antecipado | Número | *(vazio/não exibido quando 0)* | Dedução de sacas já pagas antecipadamente. Quando não há antecipação, a célula fica em branco (não mostra "0") |
| 5 | Sacas Líquidas | Número | "17.988" | = Sacas Brutas − Antecipado |
| 6 | Preço/sc | Moeda + selo | "R$ 112 ✓ref." | Selo "✓ref." = está usando o "Preço de Referência" do contrato |
| 7 | Valor Total | Moeda | "R$ 2.014.656" | = Sacas Líquidas × Preço/sc |

**Dados completos capturados (contrato "Fazenda Matagal"):**

| Safra | Tipo | Sacas Brutas | (-) Antecipado | Sacas Líquidas | Preço/sc | Valor Total |
|---|---|---|---|---|---|---|
| 2026/2027 | Normal | 17.988 | — | 17.988 | R$ 112 ✓ref. | R$ 2.014.656 |
| 2027/2028 | Normal | 17.988 | — | 17.988 | R$ 112 ✓ref. | R$ 2.014.656 |
| 2028/2029 | Normal | 17.988 | — | 17.988 | R$ 112 ✓ref. | R$ 2.014.656 |
| 2029/2030 | Normal | 17.988 | — | 17.988 | R$ 112 ✓ref. | R$ 2.014.656 |

Verificação: 17.988 × 112 = **R$ 2.014.656** ✓ (bate com o valor exibido no card e no KPI "Custo Anual (Safra Atual)")

> ⚠️ Não foi possível expandir e capturar a tabela do contrato "Fazenda Pedra II" nesta sessão devido a instabilidades técnicas do navegador. **Recomenda-se validar especificamente essa tabela**, já que se espera que as colunas "Preço/sc" e "Valor Total" apareçam vazias ou com o texto "Sem cotação" (consistente com o observado na aba "Fluxo por Safra", seção 5).

---

## 4. MODAL "NOVO CONTRATO" / "EDITAR CONTRATO DE ARRENDAMENTO"

Mesmo componente reaproveitado para criação (`Cadastrar Contrato de Arrendamento`, vazio) e edição (`Editar Contrato de Arrendamento`, pré-preenchido).

> ✅ **Diferente da tela "Aquisição Fazenda"**, aqui a numeração das seções está **correta e sequencial (1 → 2 → 3 → 4 → 5)**, sem nenhuma seção faltando. Confirmado em ambos os modos (Novo e Editar).

### 4.1 Seção "1. Identificação"

| Campo | Label exibido | Tipo | Obrigatório | Placeholder |
|---|---|---|---|---|
| nome_fazenda | Nome da Fazenda / Área * | Texto | **Sim** | "Ex: Fazenda Santa Maria" |
| proprietario | Proprietário | Texto | Não | "Nome do proprietário" |
| denominacao_imovel | Denominação do Imóvel | Texto | Não | "Denominação legal" |
| municipio | Município | Texto | Não | "Município" |
| comarca | Comarca | Texto | Não | "Comarca" |
| numero_matricula | Nº Matrícula | Texto | Não | "Número da matrícula" |

> Nota: comparado à Aquisição, aqui não existe campo "Estado (UF)" — apenas "Município" como texto livre. **Validar se essa ausência é intencional** (a Aquisição tem um dropdown de UF que a Arrendamento não replica).

### 4.2 Seção "2. Área"

| Campo | Label | Tipo | Obrigatório | Valor no exemplo (Fazenda Matagal) |
|---|---|---|---|---|
| area_total_ha | Área Total (ha) | Número decimal | Não | `2000,0000` |
| area_arrendada_ha | Área Arrendada (ha) * | Número decimal | **Sim** (asterisco) | `1499,0000` |

Confirmado visualmente (via zoom): campos corretamente populados na edição — sem o bug de "não preenchimento" que havia sido hipotetizado inicialmente (o `read_page`/accessibility tree não reflete valores reais de `<input>`, apenas placeholders; a confirmação visual via screenshot é obrigatória).

### 4.3 Seção "3. Contrato"

| Campo | Label | Tipo | Valor no exemplo | Comportamento |
|---|---|---|---|---|
| data_inicio | Data de Início | Date picker | 16/07/2026 | Recalcula "Safra inicial calculada" |
| (calculado) safra_inicial | "Safra inicial calculada:" | Texto derivado | "2026/2027" | — |
| data_vencimento | Data de Vencimento | Date picker | 16/07/2030 | Recalcula "Safra final calculada" |
| (calculado) safra_final | "Safra final calculada:" | Texto derivado | "2029/2030" | — |
| (calculado) resumo_safras | "Safras do contrato:" | Texto derivado (banner cinza) | "2026/2027 → 2029/2030" | — |

> Quando vazio (novo registro), o banner exibe: *"Preencha as datas acima para calcular automaticamente"*.

> ⚠️ **Diferença notável em relação à Aquisição:** aqui **não existe** o campo "Prazo de Financiamento (meses)" nem os chips visuais "Safras cobertas pelo contrato" (lista de badges). A Arrendamento apenas mostra o resumo textual "Safras do contrato: X → Y".

### 4.4 Seção "4. Condições Econômicas e Pagamento"

| Campo | Label | Tipo | Valor no exemplo |
|---|---|---|---|
| cultura | Cultura * | Dropdown | "Soja" |
| sacas_ha | Sacas/ha * | Número decimal | (no exemplo mostrado vazio no form "Novo"; 12,0 no contrato existente) |
| tipo_pagamento | Tipo de Pagamento | Dropdown | "Sacas" (única opção observada nesta sessão — **testar se existe também "Reais", como no formulário de Aquisição**) |
| periodicidade | Periodicidade | Dropdown | "Anual" |
| preco_referencia | Preço de Referência (R$/saca) | Número decimal | 112,00 (Matagal) / **vazio** (Pedra II — causa raiz do BUG #1) |

**Campos calculados (banner, aparecem somente com dados preenchidos):**

| Campo | Label | Valor no exemplo | Fórmula |
|---|---|---|---|
| (calc) sacas_ano | "Sacas/ano" | "17.988 sc" | = sacas_ha × área_arrendada_ha |
| (calc) valor_ha | "Valor/ha" | "R$ 1.344" | = sacas_ha × preco_referencia (12,0 × 112 = 1.344 ✓) |
| (calc) custo_anual_total | "Custo Anual Total" | "R$ 2.014.656" | = sacas_ano × preco_referencia, ou área × valor_ha |

### 4.5 Seção "5. Pagamento Antecipado"

| Campo | Label | Tipo |
|---|---|---|
| possui_pagamento_antecipado | Possui pagamento antecipado | Checkbox |

**Ao marcar o checkbox, revelam-se 4 campos condicionais** (confirmado via teste nesta sessão):

| Campo | Label | Tipo | Opções/Notas |
|---|---|---|---|
| tipo_antecipacao | Tipo de Antecipação | Dropdown | "Em Sacas" (única opção observada — **testar se existe "Em Reais"**) |
| valor_antecipado_sacas | Valor Antecipado (sacas) | Número decimal | — |
| data_pagamento_antecipado | Data do Pagamento Antecipado | Date picker | — |
| safra_referencia | Safra de Referência | Dropdown | Lista as safras cobertas pelo contrato (ex: "2026/2027") |

> ✅ Este é o mecanismo que alimenta a coluna "(-) Antecipado" na tabela de fluxo de pagamento (seção 3.2) e no "Fluxo Consolidado de Arrendamento" (seção 5). É um recurso **exclusivo do módulo Arrendamento** — não existe equivalente na tela de Aquisição Fazenda (lá, o conceito mais próximo é a "Entrada (Sinal)", que é estruturalmente diferente).

### 4.6 Campo "Observações" e rodapé

| Campo | Label | Tipo |
|---|---|---|
| observacoes | Observações | Textarea |

Botões: `Cancelar` | `Salvar Contrato` | `X` (Close, canto superior direito)

> ⚠️ **Nota de estabilidade de UI observada durante o teste:** em determinado momento desta sessão, o botão de fechar (X) do modal não respondeu ao clique de forma confiável, exigindo múltiplas tentativas e, em um dos casos, um recarregamento completo da página para conseguir fechar o modal. **Recomenda-se investigar se há algum problema de:** (a) z-index/sobreposição de camadas quando dois modais são acionados em sequência muito rápida, ou (b) memory leak / estado React inconsistente ao reabrir o modal repetidamente. Isso pode ser um artefato do ambiente de teste automatizado usado nesta sessão — **validar em uso manual normal antes de tratar como bug confirmado.**

---

## 5. ABA "FLUXO POR SAFRA"

**Título da seção:** "Fluxo Consolidado de Arrendamento"

Tabela única, agregando todos os contratos do grupo (Matagal + Pedra II), com uma coluna adicional em relação à tabela expandida da aba Contratos:

| # | Coluna | Notas |
|---|---|---|
| 1 | Safra | — |
| 2 | **Fazenda** | Coluna extra — nome da fazenda de origem do lançamento |
| 3 | **Cultura** | Coluna extra (não presente na tabela expandida individual) |
| 4 | Tipo | "Normal" |
| 5 | Sacas Brutas | — |
| 6 | (-) Antecipado | — |
| 7 | Sacas Líquidas | — |
| 8 | Preço/sc | ⚠️ Pode exibir literalmente o texto **"Sem cotação"** quando o contrato não tem preço de referência definido |
| 9 | Valor Total | ⚠️ Fica **ausente/em branco** na mesma condição acima (não mostra "R$ 0", simplesmente omite a célula) |

**Dados completos capturados:**

| Safra | Fazenda | Cultura | Tipo | Sacas Brutas | Sacas Líquidas | Preço/sc | Valor Total |
|---|---|---|---|---|---|---|---|
| 2025/2026 | Fazenda Pedra II | SOJA | Normal | 9.600 | 9.600 | **Sem cotação** | *(vazio)* |
| 2026/2027 | Fazenda Matagal | SOJA | Normal | 17.988 | 17.988 | R$ 112 ✓ref. | R$ 2.014.656 |
| 2026/2027 | Fazenda Pedra II | SOJA | Normal | 9.600 | 9.600 | **Sem cotação** | *(vazio)* |
| 2027/2028 | Fazenda Matagal | SOJA | Normal | 17.988 | 17.988 | R$ 112 ✓ref. | R$ 2.014.656 |
| 2027/2028 | Fazenda Pedra II | SOJA | Normal | 9.600 | 9.600 | **Sem cotação** | *(vazio)* |
| 2028/2029 | Fazenda Matagal | SOJA | Normal | 17.988 | 17.988 | R$ 112 ✓ref. | R$ 2.014.656 |
| 2028/2029 | Fazenda Pedra II | SOJA | Normal | 9.600 | 9.600 | **Sem cotação** | *(vazio)* |
| 2029/2030 | Fazenda Matagal | SOJA | Normal | 17.988 | 17.988 | R$ 112 ✓ref. | R$ 2.014.656 |
| 2029/2030 | Fazenda Pedra II | SOJA | Normal | 9.600 | 9.600 | **Sem cotação** | *(vazio)* |
| 2030/2031 | Fazenda Pedra II | SOJA | Normal | 9.600 | 9.600 | **Sem cotação** | *(vazio)* |
| 2031/2032 | Fazenda Pedra II | SOJA | Normal | 9.600 | 9.600 | **Sem cotação** | *(vazio)* |

**Linha TOTAL:** `139.152 sc` | `R$ 8.058.624`

**Verificação dos totais:**
- Sacas: (17.988 × 4) + (9.600 × 7) = 71.952 + 67.200 = **139.152 sc** ✓ (inclui todas as linhas, mesmo as sem preço)
- Valor: 17.988 × 112 × 4 = **R$ 8.058.624** ✓ (soma **apenas** as linhas da Fazenda Matagal — as linhas "Sem cotação" da Pedra II são silenciosamente excluídas do total de valor, mas suas sacas entram no total de sacas)

> 🐞 Este comportamento é o **BUG #1** desta especificação — ver detalhamento na seção 11.

---

## 6. ABA "ANÁLISE DE IMPACTO"

> ⚠️ **Diferença estrutural importante em relação à Aquisição Fazenda:** aqui a "Análise de Impacto" é renderizada como **uma única tabela** (não como cards individuais por safra, como na tela de Aquisição).

**Título da seção:** "Impacto do Arrendamento sobre a Produção"

**Colunas da tabela:**

| # | Coluna | Notas |
|---|---|---|
| 1 | Safra | — |
| 2 | Sacas Arrendamento | Soma das "Sacas Líquidas" de todos os contratos naquela safra |
| 3 | Produção Soja | Vem do módulo **Quadro Safra** (mesma dependência já documentada na tela de Aquisição) |
| 4 | % Comprometido | = Sacas Arrendamento / Produção Soja × 100 |
| 5 | Valor Total (R$) | Soma do "Valor Total" de todos os contratos naquela safra |

**Dados completos capturados:**

| Safra | Sacas Arrendamento | Produção Soja | % Comprometido | Valor Total (R$) |
|---|---|---|---|---|
| 2025/2026 | 9.600 sc | 292.468 sc | 3,3% | R$ 0 |
| 2026/2027 | 27.588 sc | 360.400 sc | 7,7% | R$ 2.014.656 |
| 2027/2028 | 27.588 sc | 360.400 sc | 7,7% | R$ 2.014.656 |
| 2028/2029 | 27.588 sc | *(ausente)* | 0,0% | R$ 2.014.656 |
| 2029/2030 | 27.588 sc | *(ausente)* | 0,0% | R$ 2.014.656 |
| 2030/2031 | 9.600 sc | *(ausente)* | 0,0% | R$ 0 |
| 2031/2032 | 9.600 sc | *(ausente)* | 0,0% | R$ 0 |

**Legenda de faixas de risco (rodapé da tabela):** `≤15% normal` | `15–30% atenção` | `>30% crítico`

> Diferente da Aquisição (que usava um único limiar de 30%), aqui há **3 faixas** de classificação. Presume-se que a cor da linha/badge da tabela muda conforme a faixa — **não foi possível confirmar visualmente as cores exatas nesta sessão devido a instabilidades do navegador; recomenda-se validação visual complementar.**

**Verificações de fórmula:**
- 2026/2027: 27.588 / 360.400 = 7,656% ≈ **7,7%** ✓
- 2025/2026: 9.600 / 292.468 = 3,283% ≈ **3,3%** ✓

**Observações:**
1. **Mesma limitação de dados do Quadro Safra** já documentada na Aquisição: para safras 2028/2029 em diante, não há "Produção Soja" cadastrada, resultando em % = 0,0% (mesma ambiguidade "0% pode significar sem risco OU sem dado" já sinalizada como ponto de melhoria na spec de Aquisição).
2. 🐞 **Inconsistência de exibição** entre esta aba e a aba "Fluxo por Safra": aqui, quando não há preço de referência, "Valor Total" mostra **"R$ 0"**; já na aba "Fluxo por Safra", a mesma situação (linhas da Fazenda Pedra II) mostra a célula **vazia/ausente** (nem "R$ 0" nem "Sem cotação" aparecem no total). Ver BUG #2 na seção 11.

---

## 7. ABA "GRÁFICOS"

> ⚠️ **Diferença estrutural importante em relação à Aquisição Fazenda:** aqui existem **3 gráficos** (não 2), e os dois primeiros ficam **lado a lado** (não empilhados verticalmente).

### 7.1 Gráfico 1 — "Sacas de Arrendamento vs Produção por Safra"

- Tipo: gráfico de barras agrupadas
- Eixo X: Safras (2025/2026 a 2031/2032)
- Eixo Y: escala numérica (0 a 380.000, incrementos de 95.000)
- Série 1: "Produção Soja" (barra verde) — visivelmente muito maior que a série de arrendamento
- Série 2: "Arrendamento" (barra vermelha)
- Legenda inferior com quadrados coloridos

### 7.2 Gráfico 2 — "Custo por Fazenda (R$)"

- Tipo: gráfico de pizza (donut)
- Resultado observado: **"Matagal 100%"** — uma única fatia azul ocupando todo o círculo

> 🐞 **BUG #3 (visual, decorrente do BUG #1):** mesmo havendo **2 contratos ativos** (Fazenda Matagal e Fazenda Pedra II), o gráfico de pizza exibe apenas 1 fatia (100% Matagal). A Fazenda Pedra II **desaparece completamente** deste gráfico porque seu custo calculado é R$ 0 / indefinido (falta de preço de referência). Isso pode induzir o usuário a pensar erroneamente que só existe 1 fazenda arrendada gerando custo, quando na verdade existem 2 (uma delas apenas sem o preço cadastrado).

### 7.3 Gráfico 3 — "% da Produção Comprometida com Arrendamento por Safra"

- Tipo: não confirmado com certeza (aparência de gráfico de linha ou área, eixo Y em % de 0 a 100%, incrementos de 25%)
- É a representação gráfica dos mesmos dados de "% Comprometido" da aba "Análise de Impacto" (seção 6)
- **Não foi possível capturar a renderização completa deste gráfico nesta sessão** devido a instabilidades do navegador — recomenda-se recaptura em sessão futura.

---

## 8. MODELO DE DADOS INFERIDO

```
ContratoArrendamento {
  id: UUID (PK)
  propriedade_id: UUID (FK)
  // "1. Identificação"
  nome_fazenda: string
  proprietario: string | null
  denominacao_imovel: string | null
  municipio: string | null
  comarca: string | null
  numero_matricula: string | null
  // "2. Área"
  area_total_ha: decimal | null
  area_arrendada_ha: decimal            // obrigatório
  // "3. Contrato"
  data_inicio: date
  data_vencimento: date
  // "4. Condições Econômicas e Pagamento"
  cultura_id: UUID                       // obrigatório
  sacas_ha: decimal                      // obrigatório
  tipo_pagamento: enum('SACAS', 'REAIS'?)  // "Reais" não confirmado
  periodicidade: enum('ANUAL', ...)
  preco_referencia: decimal | null       // se nulo, gera "Sem cotação" em cascata
  // "5. Pagamento Antecipado"
  possui_pagamento_antecipado: boolean
  tipo_antecipacao: enum('SACAS', 'REAIS'?) | null
  valor_antecipado_sacas: decimal | null
  data_pagamento_antecipado: date | null
  safra_referencia_antecipacao: string | null   // "AAAA/AAAA"
  observacoes: text | null
  status: enum('ATIVO', 'INATIVO'?, 'ENCERRADO'?)
  ativo: boolean
  criado_em: datetime
  modificado_em: datetime
}

ParcelaArrendamento {
  id: UUID (PK)
  contrato_id: UUID (FK)
  safra: string                          // "AAAA/AAAA"
  tipo: enum('NORMAL', 'ANTECIPADO'?)
  sacas_brutas: decimal                  // = sacas_ha × area_arrendada_ha
  sacas_antecipadas: decimal (default 0)
  sacas_liquidas: decimal                // = sacas_brutas - sacas_antecipadas
  preco_sc: decimal | null               // null quando contrato não tem preco_referencia
  usa_preco_referencia: boolean
  valor_total: decimal | null            // null/indefinido quando preco_sc é null
}
```

---

## 9. CRUZAMENTOS COM OUTRAS TELAS

| Tela de origem/destino | Campo/Indicador | Como se relaciona com "Arrendamento Rural" |
|---|---|---|
| **Quadro Safra** (`/safra`) | "Total de Produção (sc)" da cultura Soja, por safra | Usado como denominador no cálculo de "% Comprometido" na aba **Análise de Impacto**. Mesma dependência documentada para Aquisição. |
| **Resumo / Dashboard** (`/`) | Tabela "Quadro de Safra por Cultura" → linhas "Área Arrendada" e "Custo Arrendamento/ha" | Em sessão anterior, o Resumo mostrou "Área Arrendada: 7 ha / 6 ha / 2.305 ha" e "Custo Arrendamento/ha: R$ 874/ha (total R$ 2.014.656)" para a safra 2027/2028. **O valor total de R$ 2.014.656 confere exatamente** com o Custo Anual do contrato "Fazenda Matagal" desta tela. ✅ Consistente — mas **⚠️ a área "7 ha / 6 ha" do Resumo não bate com os 2.299 ha totais desta tela**, sugerindo que o Resumo usa outra métrica de área arrendada (possivelmente área arrendada *daquela cultura específica* dentro do Quadro de Safra, que é uma fonte de dados distinta e não 100% integrada com o cadastro de Contratos de Arrendamento desta tela). **Recomenda-se investigar se "Área Arrendada" do Quadro de Safra e "Área Arrendada Total" desta tela deveriam ser a mesma fonte de dados ou são propositalmente independentes.** |
| **Resumo / Dashboard** (`/`) | Card "Endividamento" → linha "Arrendamentos" | Valor observado em sessão anterior: R$ 3.310.560 (2027/2028) e R$ 3.310.560 (2028/2029, sem variação). **Não confere** com o Custo Anual desta tela (R$ 2.014.656). Diferença de R$ 1.295.904. **Possível explicação:** o card do Resumo pode estar somando o Custo Anual de Matagal (R$ 2.014.656) **mais** uma estimativa de custo da Fazenda Pedra II calculada de outra forma (já que aqui ela aparece com "Sem cotação"). Isso sugeriria que o Resumo tem acesso a um preço de referência para Pedra II que a própria tela de Arrendamento não está usando/exibindo — **um indício adicional de que o BUG #1 é real e não apenas uma falta de dado, mas sim um problema de exibição/cálculo nesta tela específica.** **Recomenda-se investigação prioritária deste ponto.** |
| **Fluxo de Safra Projetado** (`/fluxo-caixa`) | Linha "Arrendamentos" na seção "(-) SAÍDAS" | Valor observado em sessão anterior: `(R$ 2.014.656)` para a safra 2026/2027 — **confere exatamente** com o Custo Anual do contrato "Fazenda Matagal" (única fonte de valor calculável nesta tela). ✅ Consistente, mas reforça que o valor de Pedra II está sendo perdido/zerado em toda a cadeia de cálculo, não é um problema isolado desta tela. |
| **Fluxo Mensal** (`/fluxo-mensal`) | Calendário agrícola / lançamentos mensais | Não foi possível confirmar nesta sessão se os pagamentos de arrendamento aparecem detalhados mês a mês. **Recomenda-se validar.** |
| **Cotações** (`/cotacoes`) | Preço de referência de Soja (R$/sc) | Assim como na Aquisição, não foi possível confirmar se o campo "Preço de Referência (R$/saca)" sugere automaticamente o valor vindo do módulo Cotações. |

---

## 10. COMPARATIVO COM A TELA "AQUISIÇÃO FAZENDA"

Tabela-resumo das principais diferenças estruturais encontradas entre as duas telas (útil para o agente entender se deve *padronizar* comportamentos ou se as diferenças são propositais):

| Aspecto | Aquisição Fazenda | Arrendamento Rural |
|---|---|---|
| Contagem no rótulo da aba "Contratos" | Sim: "Contratos (1)" | ❌ Não: apenas "Contratos" |
| Numeração das seções do formulário | 🐞 Pula de "4" para "6" (falta "5") | ✅ Sequencial e correta (1→5) |
| Campo "Prazo de Financiamento (meses)" | Existe (mas não calculado automaticamente) | ❌ Não existe |
| Chips visuais "Safras cobertas pelo contrato" | Existe | ❌ Não existe (só texto "Safras do contrato: X → Y") |
| Campo "Estado (UF)" no formulário | Existe (dropdown) | ❌ Não existe (só "Município" texto livre) |
| Mecanismo de "adiantamento" | "6. Entrada (Sinal)" — valor fixo pago numa safra específica | "5. Pagamento Antecipado" — checkbox + 4 campos condicionais (sacas antecipadas deduzidas de uma safra) |
| Estrutura da aba "Análise de Impacto" | Cards individuais por safra | Tabela única com todas as safras |
| Nº de faixas de risco na "Análise de Impacto" | 1 faixa (>30% = alerta) | 3 faixas (≤15% / 15–30% / >30%) |
| Nº de gráficos na aba "Gráficos" | 2 (empilhados verticalmente) | 3 (2 lado a lado + 1 abaixo) |
| Bug de "Invalid Date" | 🐞 Sim (linha "Entrada") | Não observado (mas ver comportamento "—" para antecipado = 0) |
| Bug de item sem preço de referência quebrando cálculos | Não observado (não há caso de teste) | 🐞 Sim (Fazenda Pedra II) |

---

## 11. BUGS E PONTOS DE ATENÇÃO (LISTA CONSOLIDADA PARA CORREÇÃO)

### 🐞 BUG #1 — Contrato sem "Preço de Referência" quebra silenciosamente os cálculos em cascata (CRÍTICO)

- **Onde ocorre:** Card do contrato "Fazenda Pedra II" (aba Contratos), aba "Fluxo por Safra", aba "Análise de Impacto", aba "Gráficos" (gráfico de pizza), e possivelmente o card de KPI "Custo Anual (Safra Atual)" no topo da página.
- **Causa raiz:** o contrato "Fazenda Pedra II" não possui o campo "Preço de Referência (R$/saca)" preenchido (seção 4.4).
- **Sintomas em cascata:**
  1. O card do contrato não exibe a linha "Custo Anual:" (fica simplesmente omitida, sem indicar ao usuário que há um dado faltando).
  2. Na aba "Fluxo por Safra", a coluna "Preço/sc" mostra o texto "Sem cotação" e "Valor Total" fica vazio.
  3. O TOTAL da tabela de "Fluxo por Safra" soma corretamente as sacas de todos os contratos, mas **exclui silenciosamente** o valor financeiro de Pedra II — sem nenhum aviso ou rodapé explicando a exclusão.
  4. Na aba "Análise de Impacto", a mesma situação aparece como "R$ 0" (inconsistente com o "Sem cotação" da aba anterior — ver BUG #2).
  5. No gráfico de pizza "Custo por Fazenda (R$)", a Fazenda Pedra II **desaparece completamente**, mostrando "Matagal 100%" — dando a falsa impressão visual de que só existe 1 fazenda gerando custo de arrendamento.
  6. Possível impacto no card "Endividamento" do módulo Resumo/Dashboard, que mostra um valor de arrendamentos (R$ 3.310.560) maior que o Custo Anual calculável nesta tela (R$ 2.014.656) — sugerindo que outra parte do sistema **tem ou calcula** um valor para Pedra II que esta tela não está usando/exibindo. Ver seção 9.
- **Correção sugerida:**
  - Curto prazo: exibir um aviso visual explícito no card do contrato e nas tabelas (ex: badge "⚠️ Preço de referência não definido") ao invés de omitir silenciosamente os valores.
  - Médio prazo: investigar se existe uma fonte alternativa de preço (ex: módulo Cotações) que deveria ser usada como fallback quando o contrato não tem preço de referência próprio, evitando a perda total do cálculo.
  - Garantir que a soma de "TOTAL" em todas as tabelas deixe claro quando ela é parcial (não inclui 100% dos contratos).

### 🐞 BUG #2 — Inconsistência de exibição entre abas para o mesmo dado ausente

- **Onde ocorre:** comparação entre a aba "Fluxo por Safra" (mostra "Sem cotação" e célula vazia) e a aba "Análise de Impacto" (mostra "R$ 0") para exatamente a mesma condição (contrato sem preço de referência).
- **Correção sugerida:** padronizar a representação visual de "dado ausente/não calculável" em todas as abas — sugestão: usar sempre "—" ou "N/D" (nunca "R$ 0", que sugere valor real zero, nem omitir a célula sem explicação).

### ⚠️ Ponto de atenção #3 — Rótulo da aba "Contratos" sem contador

- Diferente da tela Aquisição Fazenda (que mostra "Contratos (1)"), aqui o rótulo é apenas "Contratos", sem indicar quantos contratos existem. **Sugestão de padronização:** exibir "Contratos (2)" para manter consistência de UX entre os dois módulos.

### ⚠️ Ponto de atenção #4 — Card "Fazenda Matagal" sem localização (Município)

- O card de "Fazenda Matagal" não exibe nenhuma informação de localização (município), enquanto "Fazenda Pedra II" exibe "📍 Cristalina". Isso é resultado direto do campo "Município" não ter sido preenchido no cadastro de Matagal — **não é necessariamente um bug de código**, mas reforça a necessidade de validação obrigatória ou aviso de campo recomendado não preenchido.

### ⚠️ Ponto de atenção #5 — Ausência de campo "Estado (UF)" no formulário de Arrendamento

- A tela de Aquisição Fazenda tem um dropdown de UF; a de Arrendamento não tem equivalente, apenas "Município" como texto livre. **Validar com o time de produto se isso é intencional** ou se deveria ser padronizado entre os dois formulários (importante para relatórios/filtros geográficos consistentes).

### ⚠️ Ponto de atenção #6 — Ausência de "Prazo de Financiamento" e "chips de safras cobertas"

- Diferenças estruturais do formulário em relação à Aquisição (seção 10). Não é necessariamente um erro, mas **validar se são omissões propositais** (o conceito de "financiamento" faz menos sentido para arrendamento do que para aquisição, então pode ser intencional) ou se deveriam ser padronizadas.

### ⚠️ Ponto de atenção #7 — Possível divergência entre "Área Arrendada" desta tela e a do módulo Resumo/Quadro de Safra

- Ver seção 9, linha 2. O Resumo mostra área arrendada muito menor (7 ha / 6 ha) que o total desta tela (2.299 ha). **Recomenda-se investigação para confirmar se são fontes de dados diferentes por design ou se há uma falha de integração entre os módulos.**

### ⚠️ Ponto de atenção #8 — Estabilidade do modal (fechamento inconsistente)

- Ver seção 4.6. Observado nesta sessão de teste automatizado que o botão de fechar modal (X) nem sempre respondeu de imediato, exigindo reload de página em um dos casos. **Recomenda-se teste manual dedicado** para confirmar se é um problema real de UI ou uma limitação do ambiente de automação usado nesta análise.

### ⚠️ Ponto de atenção #9 — Opções de dropdown não totalmente testadas

- "Tipo de Pagamento" (só "Sacas" foi confirmado; testar se existe "Reais", análogo à Aquisição).
- "Tipo de Antecipação" (só "Em Sacas" foi confirmado; testar se existe "Em Reais").
- "Periodicidade" (só "Anual" foi observado em ambos os contratos de teste; confirmar se existem outras opções como Mensal/Semestral).

### ⚠️ Ponto de atenção #10 — Botão de exclusão (🗑️) sem confirmação testada

- Mesma observação já registrada na spec de Aquisição Fazenda — validar que existe modal de confirmação antes de excluir um contrato de arrendamento.

---

## 12. ANEXO DE IMAGENS

| Arquivo | Conteúdo |
|---|---|
| `screenshot-1787238754806-b4ae2b27.jpg` | Visão geral da tela — 3 dos 4 cards de KPI + início da lista de contratos |
| `screenshot-1787239020505-26731455.jpg` | Card "Fazenda Matagal" com ícones de ação visíveis (chevron, editar, deletar) + KPI "Contratos Ativos: 2" |

> **Nota sobre cobertura de imagens:** devido a instabilidades recorrentes da ferramenta de captura de tela durante esta sessão (timeouts do protocolo de renderização), a maior parte da documentação desta tela foi validada via extração estrutural de conteúdo (accessibility tree) complementada por capturas pontuais (`zoom`) nos momentos em que a ferramenta respondeu. Os dados numéricos e de texto têm alta confiabilidade (extraídos diretamente do DOM), mas **recomenda-se uma sessão de recaptura visual dedicada** para obter o conjunto completo de screenshots equivalente ao produzido para a tela "Aquisição Fazenda", especialmente para:
> - Tabela expandida do contrato "Fazenda Pedra II" (não capturada)
> - Gráfico 3 "% da Produção Comprometida com Arrendamento por Safra" (captura parcial)
> - Cores/estados visuais das 3 faixas de risco na aba "Análise de Impacto"

---

## RESUMO EXECUTIVO PARA O AGENTE DE EXECUÇÃO (Claude Code)

Ao trabalhar nesta tela, priorizar nesta ordem:

1. **Investigar e corrigir BUG #1** (contrato sem preço de referência quebra cálculos em 5 pontos diferentes da tela) — é o problema mais crítico e mais abrangente encontrado. Começar pela investigação do card "Endividamento" do Resumo (seção 9) para entender se existe uma fonte de preço alternativa que deveria estar sendo usada.
2. **Padronizar a exibição de dado ausente** (BUG #2) — decidir um padrão único ("—", "N/D" etc.) e aplicar em todas as abas afetadas.
3. Avaliar os pontos de atenção #3 a #7 como itens de consistência/UX entre os módulos Aquisição e Arrendamento — decidir com o time de produto quais diferenças são propositais e quais devem ser padronizadas.
4. Validar em teste manual os pontos #8, #9 e #10, que não puderam ser 100% confirmados nesta sessão automatizada.

Todos os campos, fórmulas e estruturas de dados necessários para implementar essas correções estão detalhados nas seções 3 a 8 deste documento. A seção 10 oferece um comparativo direto com a tela "Aquisição Fazenda" (já documentada em `SPEC_TELA_AQUISICAO_FAZENDA.md`), útil para decisões de padronização entre os dois módulos.
