# Especificação Técnica — Tela "Cotações"

**Sistema:** AgroFlow — Análise de Produtor Rural
**Nome interno na tela (H1):** "Cotações de Mercado"
**URL:** `https://agroflow-rkqdvzdd.manus.space/dashboard/1050001/cotacoes`
**Menu lateral:** `Cotações` (entre "Fluxo de Safra" e "Análise Financeira")
**Cliente/Propriedade analisada:** Grupo Pereira (id 1050001)
**Safra selecionada durante a análise:** 2026/2027
**Data/hora da análise:** 25-26/08/2026, última atualização do sistema exibida: 21:45:19
**Documento destinado a:** agente de execução (Claude Code) — ajustes desta tela

> Segue o mesmo padrão das specs anteriores (`SPEC_TELA_AQUISICAO_FAZENDA.md`, `SPEC_TELA_ARRENDAMENTO_RURAL.md`, `SPEC_TELA_COMERCIALIZACAO.md`, `SPEC_TELA_FLUXO_DE_SAFRA.md`): mapeamento completo, com de-para de campos, indicadores dinâmicos e cruzamentos confirmados com outras telas.

---

## 1. Visão Geral

A tela "Cotações" (rota interna `/cotacoes`, H1 "Cotações de Mercado") é o módulo responsável por **consultar preços de mercado em tempo (quase) real via API externa (Yahoo Finance)** e permitir que o usuário "trave"/salve um preço de referência específico para cada commodity, por safra — esse preço salvo é então consumido por outras telas do sistema (Quadro de Safra, Arrendamentos, Fluxo de Caixa/Fluxo de Safra, e indiretamente Comercialização e Aquisição Fazenda, conforme documentado nas specs anteriores).

O subtítulo da própria tela já declara a fonte de dados: **"Preços em tempo real via Yahoo Finance — CBOT, CME e ICE New York"**. Isso confirma diretamente, sem necessidade de inferência, que os indicadores desta tela vêm de uma **API externa de mercado financeiro** (Yahoo Finance), refletindo cotações das bolsas de commodities de Chicago (CBOT), Chicago Mercantile Exchange (CME) e ICE Futures New York.

A tela possui **2 abas**, conforme solicitado:

1. **Cotações** (aba padrão/ativa ao carregar)
2. **Histórico por Safra**

---

## 2. Cabeçalho (comum às duas abas)

| Elemento | Conteúdo |
|---|---|
| Título | "Cotações de Mercado" |
| Subtítulo | "Preços em tempo real via Yahoo Finance — CBOT, CME e ICE New York · Safra atual: 2026/2027" |
| Seletor de Safra | Combobox "2026/2027 ★" (mesmo seletor global do sistema; o ícone ★ ao lado do valor provavelmente indica a safra marcada como "atual/padrão" do sistema — não confirmado como interativo isoladamente, é parte do rótulo do próprio combobox) |
| Botão "Atualizar" | Ícone de refresh + texto "Atualizar" — dispara nova consulta à API do Yahoo Finance |
| Botão "Aplicar Mercado" | Ícone de tendência (📈) + texto "Aplicar Mercado" — ação em lote, provavelmente copia o preço de mercado atual para o campo "Preço Definido" de todas as commodities de uma vez (equivalente a clicar "Aplicar preço de mercado" em cada card individualmente) |
| Botão "Salvar Todas" | Ícone de disquete + texto "Salvar Todas" (verde, cor de destaque/ação primária) — salva os preços definidos de todas as commodities de uma vez |
| Indicador "Última atualização" | "🕐 Última atualização: 21:45:19" — timestamp da última consulta à API |

**Observação de UX:** os 3 botões de ação em lote (Atualizar / Aplicar Mercado / Salvar Todas) ficam no cabeçalho, fora do escopo de cada aba — ou seja, presumivelmente atuam sobre a aba "Cotações" independentemente de qual aba está ativa no momento do clique. Não testado diretamente (ação de escrita/salvamento estava fora do escopo de exploração somente-leitura desta sessão).

---

## 3. Aba "Cotações" (aba padrão)

### 3.1 Card "Dólar Americano — USD/BRL"

Card de destaque (cor azul, distinto visualmente dos cards de commodities agrícolas), no topo da lista.

| Campo | Valor observado | Fonte declarada |
|---|---|---|
| Título | "Dólar Americano — USD/BRL" | — |
| Fonte(s) | "Yahoo Finance · Banco Central do Brasil (PTAX)" | **2 fontes combinadas, confirmadas pelo próprio sistema** |
| Ticker | `USDBRL=X` | Símbolo Yahoo Finance |
| Cotação Venda | R$ 5,1470 | Yahoo Finance |
| Variação (dia) | -0.57% (seta vermelha, ↘) | Calculado (dia atual vs. dia anterior) |
| Cotação Compra | R$ 5,1370 | Yahoo Finance |
| Data | 25/08/2026 | Data de referência da cotação |
| Fonte específica do valor de câmbio | "Yahoo Finance (USD/BRL)" | — |
| Campo "Dólar Definido (R$)" | Input numérico, editável | Valor a ser travado/salvo pelo usuário |
| Botão "Aplicar cotação atual" | Ícone de seta ascendente | Copia a Cotação Venda atual para o campo "Dólar Definido" |
| Botão "Salvar Dólar" | Ícone de disquete | Persiste o valor de "Dólar Definido" para a safra selecionada |

**Observação de comportamento (não confirmada como bug):** em uma das capturas desta sessão, o campo "Dólar Definido (R$)" apareceu pré-preenchido com o valor "5,1470" (idêntico à Cotação Venda) e com fundo amarelo/destacado — diferente do estado inicial (vazio, placeholder "0,0000") observado na primeira leitura da árvore de acessibilidade. Não há certeza se isso é: (a) comportamento intencional de "sugestão automática" do valor de mercado ao entrar na aba, ou (b) resultado de uma ação indireta da automação (ex.: clique em coordenada que acertou por engano o botão "Aplicar cotação atual" durante a navegação entre abas). **Recomenda-se ao agente de execução confirmar esse comportamento manualmente antes de tratá-lo como funcionalidade ou como bug.**

### 3.2 Cards de "Commodities Agrícolas — Safra 2026/2027" (6 cards)

Cada commodity é exibida em um card colorido (cor de destaque por cultura), com a mesma estrutura de campos. **Todos os 6 indicadores confirmados** (dados coletados ao vivo em 25-26/08/2026 — os valores numéricos mudarão a cada consulta, pois são cotações reais de mercado; o que importa documentar é a **estrutura de campos**, não os valores pontuais):

| Campo | Descrição |
|---|---|
| Emoji + Nome da cultura | Ex.: 🌱 Soja, 🌽 Milho, 🌿 Algodão, 🐄 Boi Gordo, 🌾 Trigo, ☕ Café Arábica |
| Subtítulo com contrato/bolsa | Ex.: "Soja Grão — CBOT Chicago", "Algodão Pluma — ICE New York", "Boi Gordo — CME Chicago" |
| Ticker (badge) | Símbolo do contrato futuro Yahoo Finance, ex.: `ZS=F`, `ZC=F`, `CT=F`, `GF=F`, `ZW=F`, `KC=F` |
| **Preço em R$ (convertido)** | Valor já convertido para Reais na unidade de referência da cultura (R$/sc ou R$/@) — **campo calculado**, ver fórmula na seção 3.3 |
| **Variação dia** | Percentual, com seta de tendência (↗ verde / ↘ vermelho) |
| **Original** | Preço bruto na unidade de cotação original da bolsa (ex.: "1.233,50 USX/bu", "88.04 USX/lb", "313.65 USX/cwt") |
| **USD** | Preço convertido apenas para USD na unidade de referência agrícola, antes da conversão cambial (ex.: "US$ 27.19/sc") — passo intermediário do cálculo |
| Máxima / Mínima (dia) | Valores em unidade original da bolsa |
| Volume | Volume negociado no dia (campo "Volume" da Café Arábica apareceu vazio "—" no momento da consulta — possivelmente atraso/indisponibilidade momentânea do dado de volume para esse ticker específico) |
| Fonte + data | Ex.: "Yahoo Finance (CBOT) · 26/08/2026" |
| **Preço Definido para Safra [XXXX/YYYY]** | Input numérico (R$) editável — preço que o usuário trava manualmente para a safra |
| Botão "Aplicar preço de mercado" | Ícone de seta ascendente — copia o "Preço em R$ (convertido)" atual para o campo "Preço Definido" |
| Botão salvar (ícone de disquete, sem texto) | Persiste o "Preço Definido" para a cultura + safra |
| Mensagem de estado | "Nenhum preço salvo para esta safra" (ícone de alerta ⓘ) quando não há preço definido ainda |

**Dados completos observados (snapshot de 25-26/08/2026, apenas para referência — sujeitos a variação a cada consulta):**

| Cultura | Ticker | Preço R$ (convertido) | Variação dia | Unidade |
|---|---|---|---|---|
| Soja | ZS=F | R$ 139,97 | +1.04% | R$/sc |
| Milho | ZC=F | R$ 63,52 | +9.14% | R$/sc |
| Algodão | CT=F | R$ 2.247,76 | +1.17% | R$/sc (pluma) |
| Boi Gordo | GF=F | R$ 5,34 | -6.46% | R$/@ |
| Trigo | ZW=F | R$ 79,60 | +2.75% | R$/sc |
| Café Arábica | KC=F | R$ 2.279,76 | -7.91% | R$/sc |

### 3.3 Seção "Sobre as cotações e conversões" (rodapé da aba)

Bloco explicativo, texto integral do próprio sistema (fonte primária confiável para a lógica de conversão):

| Cultura | Ticker | Regra de conversão declarada |
|---|---|---|
| Soja | ZS=F | CBOT · USX/bu → R$/sc (60kg) |
| Milho | ZC=F | CBOT · USX/bu → R$/sc (60kg) |
| Algodão | CT=F | ICE NY · USX/lb → R$/sc (pluma) |
| Boi Gordo | GF=F | CME · USX/cwt → R$/@ (15kg) |
| Trigo | ZW=F | CBOT · USX/bu → R$/sc (60kg) |
| Café | KC=F | ICE NY · USX/lb → R$/sc (60kg) |

**Fórmula de conversão inferida (2 etapas, confirmada estruturalmente pelos campos "Original" → "USD" → "Preço em R$"):**

```
1) Preço_USD_por_unidade_agricola = Preço_Original_USX / fator_unidade_bolsa   (ex.: USX/bu -> US$/sc)
2) Preço_R$ = Preço_USD_por_unidade_agricola × Cotação_Dólar_Venda (USD/BRL)
```

**Texto de aviso do sistema (rodapé, cross-module — extremamente relevante):**
> "Os preços salvos são usados no **Quadro de Safra**, **Arrendamentos** e **Fluxo de Caixa**. Alertas de [ícone] indicam divergência >10% entre preço salvo e mercado atual."

> "Dados via Yahoo Finance com atraso de até 15 min. Não constituem recomendação de investimento."

Esses dois avisos são **confirmações diretas e explícitas do próprio sistema**, sem necessidade de inferência:
1. Cruzamento confirmado com 3 telas (Quadro de Safra, Arrendamentos, Fluxo de Caixa).
2. Existe uma regra de alerta de divergência (>10%) entre o preço salvo (travado pelo usuário) e o preço de mercado atual — **não foi possível observar visualmente esse alerta em ação**, pois nenhuma cultura tinha preço salvo no ambiente analisado (todas exibiam "Nenhum preço salvo para esta safra"). Ponto de atenção para validação futura (ver seção 6).
3. Confirmação oficial de que os dados têm **atraso de até 15 minutos** (não são "tempo real" no sentido estrito, apesar do texto do subtítulo dizer "tempo real") — pequena inconsistência de comunicação entre o subtítulo do cabeçalho ("tempo real") e o aviso do rodapé ("atraso de até 15 min"), ver seção 6.

---

## 4. Aba "Histórico por Safra"

### 4.1 Estrutura

| Elemento | Conteúdo |
|---|---|
| Título do bloco | "Evolução do Preço por Safra" (com ícone de relógio/histórico) |
| Filtro "Exibir:" | 6 botões-chip, um por cultura, com toggle visual (ativo = colorido preenchido; inativo = contorno/outline) |
| Chips confirmados | 🌱 Soja (ativo por padrão) · 🌽 Milho (ativo por padrão) · 🌿 Algodão (inativo) · 🐄 Boi Gordo (inativo) · 🌾 Trigo (inativo) · ☕ Café Arábica (inativo) |
| Estado vazio (gráfico) | Ícone de histórico + "Nenhum histórico disponível" + subtexto "Salve cotações em diferentes safras para visualizar a evolução" |

### 4.2 Comportamento inferido

Esta aba é claramente projetada para exibir um **gráfico de linha/série temporal** comparando o preço salvo ("Preço Definido") de cada commodity **entre diferentes safras** (não entre dias — o nome é "Evolução do Preço **por Safra**", diferente do "Variação dia" da aba Cotações). Os chips de cultura funcionam como filtro de quais séries aparecem no gráfico (Soja e Milho vêm pré-selecionadas).

**Pré-requisito de dados:** como confirmado pelo próprio texto do estado vazio, esta aba **só populará dados depois que o usuário salvar preços definidos em pelo menos 2 safras diferentes** para a mesma cultura — não foi possível observar o gráfico populado nesta sessão, pois o ambiente não possui nenhum preço salvo em nenhuma safra. **Ponto de atenção: recomenda-se ao agente de execução salvar preços de teste em 2+ safras antes de qualquer ajuste na lógica ou no layout do gráfico desta aba.**

---

## 5. Cruzamentos com Outras Telas

| Indicador desta tela | Tela de destino | Direção | Confirmação |
|---|---|---|---|
| Preço Definido (por cultura/safra) | Quadro de Safra | Cotações → **alimenta** | **Confirmado por texto explícito do próprio sistema** ("Os preços salvos são usados no Quadro de Safra...") |
| Preço Definido (por cultura/safra) | Arrendamentos | Cotações → **alimenta** | **Confirmado por texto explícito** — consistente com a coluna "Cotação" já documentada em `SPEC_TELA_ARRENDAMENTO_RURAL.md` |
| Preço Definido (por cultura/safra) | Fluxo de Caixa / Fluxo de Safra | Cotações → **alimenta** | **Confirmado por texto explícito** — consistente com a "Cotação" usada no cálculo de "Valor a Mercado" documentado em `SPEC_TELA_FLUXO_DE_SAFRA.md` |
| Coluna "Cotação" (R$/sc) | Comercialização | Cotações → **alimenta** (inferido) | Não declarado explicitamente nesta tela, mas os valores de cotação exibidos em `SPEC_TELA_COMERCIALIZACAO.md` (ex.: Soja R$ 120/sc) têm a mesma função — **fonte provável é este módulo**, ainda que a lista de 3 módulos citada no aviso do rodapé não mencione Comercialização explicitamente. Ponto de atenção: confirmar se Comercialização usa "Preço Definido" (travado) ou "Preço em R$ convertido" (mercado ao vivo) — a spec de Comercialização não permitiu essa distinção. |
| Dólar Definido (USD/BRL) | Módulos com valores em moeda estrangeira (não identificado diretamente nas specs anteriores) | Cotações → alimenta (inferido) | Nenhuma tela documentada até agora exibiu valores em USD nativamente — este cruzamento fica como ponto em aberto |
| Cotação de mercado (Yahoo Finance) | **Fonte externa** (fora do sistema) | API externa → Cotações | **Confirmado diretamente**: "via Yahoo Finance — CBOT, CME e ICE New York"; câmbio adicionalmente citando "Banco Central do Brasil (PTAX)" como segunda fonte |

**Nota importante para o agente de execução:** esta é a **única tela mapeada até agora cuja fonte primária de dados é uma API externa de terceiros**, não um cadastro interno do AgroFlow. Qualquer ajuste nesta tela deve considerar: (1) tratamento de falha/indisponibilidade da API Yahoo Finance, (2) rate limiting, (3) cache/staleness dos dados (o próprio sistema declara atraso de até 15 min), e (4) o fato de que os "preços definidos" (travados) é que efetivamente propagam para o resto do sistema — os preços de mercado ao vivo são apenas referência/sugestão até serem salvos.

---

## 6. BUGS e Pontos de Atenção

### Pontos de atenção (não confirmados como bugs — requerem validação adicional)

1. **Inconsistência de comunicação "tempo real" vs. "atraso de até 15 min":** o subtítulo do cabeçalho anuncia "Preços em tempo real via Yahoo Finance", enquanto o aviso de rodapé esclarece "Dados via Yahoo Finance com atraso de até 15 min". Tecnicamente, 15 minutos de atraso não é "tempo real" no sentido estrito do termo financeiro. Não é um bug funcional, mas é uma inconsistência textual que pode gerar expectativa equivocada no usuário sobre a atualidade dos preços exibidos. **Prioridade: Baixa** — sugestão de ajuste de copy (ex.: trocar "tempo real" por "cotações atualizadas" no subtítulo).
2. **Campo "Dólar Definido" e campo "Preço Definido" (Algodão) aparentemente pré-preenchidos com o valor de mercado atual e destacados em amarelo**, sem clique explícito confirmado nesta sessão em "Aplicar cotação atual"/"Aplicar preço de mercado". Pode ser: (a) comportamento intencional da UI (sugestão automática ao focar/entrar na aba), (b) resultado de um clique acidental da automação de navegação (mais provável, dado o histórico de instabilidade de coordenadas já registrado nas specs anteriores), ou (c) um bug real de auto-preenchimento indevido. **Requer teste manual dedicado antes de qualquer ajuste** — não deve ser tratado como bug confirmado nesta documentação.
3. **Campo "Volume" vazio ("—") para Café Arábica** no momento da consulta, enquanto as demais 5 commodities exibiram valores de volume. Pode ser atraso momentâneo específico do ticker `KC=F` na API do Yahoo Finance (comportamento típico de fontes de dados externas, não necessariamente um bug do AgroFlow) ou ausência de tratamento de erro/fallback para esse campo especificamente. **Prioridade: Baixa**, mas vale adicionar um estado de "indisponível" mais explícito ao invés de traço vazio, para diferenciar "zero volume" de "dado não recebido da API".
4. **Alerta de divergência >10%** (mencionado no texto do rodapé) não pôde ser observado visualmente em nenhum card, pois nenhuma cultura possui preço salvo no ambiente analisado. **Recomenda-se ao agente de execução:** salvar um preço propositalmente divergente (>10% do mercado atual) em uma cultura de teste e recapturar a tela para documentar a aparência exata desse alerta antes de qualquer ajuste relacionado.
5. **Botões de ação em lote no cabeçalho** ("Atualizar", "Aplicar Mercado", "Salvar Todas") não foram testados nesta sessão (evitado por serem ações de escrita/side-effect fora do escopo de mapeamento somente-leitura). Comportamento exato (ex.: "Aplicar Mercado" sobrescreve valores já preenchidos manualmente pelo usuário sem confirmação?) não confirmado — ponto de atenção de UX/segurança de dados a validar antes de qualquer refatoração dessas ações.
6. **Ícone ★ ao lado da safra no seletor** — significado exato não confirmado (provavelmente indica "safra atual/padrão do sistema"), consistente com o texto do subtítulo "Safra atual: 2026/2027". Não é um elemento exclusivo desta tela (faz parte do combobox de safra global), mas nunca havia sido observado com esse indicador visual nas specs anteriores — vale confirmar se esse ícone aparece em todas as telas ou é específico de Cotações.

---

## 7. Modelo de Dados Inferido

```sql
-- Preço travado/salvo pelo usuário por cultura e safra (a única escrita própria deste módulo)
Preco_Definido_Safra (
  id                PK
  propriedade_id    FK -> Propriedade
  safra_id          FK -> Safra
  commodity         ENUM (SOJA, MILHO, ALGODAO, BOI_GORDO, TRIGO, CAFE_ARABICA, DOLAR)
  preco_definido     DECIMAL         -- valor travado pelo usuário (R$)
  data_definicao      DATE            -- quando foi salvo
  created_at / updated_at
)

-- Cache/snapshot da última consulta à API externa (não editável pelo usuário)
Cotacao_Mercado_Live (
  commodity          ENUM (SOJA, MILHO, ALGODAO, BOI_GORDO, TRIGO, CAFE_ARABICA, DOLAR)
  ticker             VARCHAR          -- ex.: "ZS=F", "USDBRL=X"
  bolsa              VARCHAR          -- ex.: "CBOT Chicago", "ICE New York", "CME Chicago"
  preco_original      DECIMAL          -- unidade nativa da bolsa (USX/bu, USX/lb, USX/cwt)
  unidade_original     VARCHAR
  preco_usd            DECIMAL          -- convertido para USD/unidade agrícola
  preco_brl            DECIMAL          -- convertido para R$/unidade agrícola final
  variacao_dia_pct      DECIMAL
  maxima_dia            DECIMAL
  minima_dia             DECIMAL
  volume_dia              DECIMAL NULLABLE
  fonte                   VARCHAR         -- "Yahoo Finance (CBOT)", etc.
  data_referencia          DATE
  timestamp_consulta        DATETIME       -- "Última atualização: HH:MM:SS"
)
```

**Campo calculado:**
```
Alerta_Divergencia = ABS(Preco_Definido_Safra.preco_definido - Cotacao_Mercado_Live.preco_brl)
                       / Cotacao_Mercado_Live.preco_brl > 0.10
```

---

## 8. Anexo de Imagens

| Arquivo | Conteúdo |
|---|---|
| `screenshot-1787705191014-e28e128a.jpg` | Aba "Histórico por Safra" — cabeçalho completo (seletor de safra, botões Atualizar/Aplicar Mercado/Salvar Todas), abas, filtro "Exibir:" com chips de cultura (Soja e Milho ativos), estado vazio "Nenhum histórico disponível" |
| `screenshot-1787705200308-b9ca7aa3.jpg` | Aba "Cotações" — card "Dólar Americano — USD/BRL" completo, incluindo o campo "Dólar Definido" com valor pré-preenchido em destaque amarelo (ver ponto de atenção #2) |
| `screenshot-1787705247365-9953852e.jpg` | Cards "Algodão" e "Boi Gordo" (rolagem intermediária), mostrando a estrutura completa de um card de commodity: preço convertido, variação, original/USD, máxima/mínima/volume, fonte, campo "Preço Definido" com botões de aplicar/salvar, e mensagem "Nenhum preço salvo para esta safra" |

**Cobertura:** boa cobertura visual nesta sessão (3 capturas bem-sucedidas, sem os timeouts recorrentes de sessões anteriores). Não foram capturados visualmente: os cards de Soja, Milho, Trigo e Café Arábica isoladamente (apenas via texto/árvore de acessibilidade) e o estado do alerta de divergência >10% (nunca disparado, pois não há preços salvos no ambiente).

---

## 9. Resumo Executivo para o Agente de Execução (Claude Code)

**Tela:** Cotações (`/dashboard/{id}/cotacoes`)

**O que existe e está mapeado com alta confiança:**
- Estrutura completa das 2 abas: "Cotações" (card de Dólar + 6 cards de commodities, todos com a mesma estrutura de 12 campos) e "Histórico por Safra" (gráfico de evolução por safra, filtrável por 6 chips de cultura).
- Fonte de dados externa confirmada explicitamente pelo sistema: **Yahoo Finance** (CBOT, CME, ICE New York) para commodities, e **Yahoo Finance + Banco Central do Brasil (PTAX)** para câmbio.
- Fórmula de conversão de 2 etapas (moeda original → USD/unidade agrícola → R$/unidade agrícola) documentada para as 6 commodities, com tabela de unidades de referência confirmada pelo próprio texto do sistema.
- Cruzamento confirmado explicitamente com 3 telas: Quadro de Safra, Arrendamentos, Fluxo de Caixa — reforça achados já documentados nas specs anteriores.
- Regra de alerta de divergência (>10% entre preço salvo e mercado) declarada pelo sistema, embora não observável visualmente no ambiente atual.

**O que precisa de validação adicional antes de ajustes de código:**
1. Confirmar manualmente se o pré-preenchimento observado no campo "Dólar Definido" (e no card Algodão) é comportamento intencional da UI ou artefato da navegação automatizada (ponto de atenção #2 — mais urgente, pode indicar um bug real de auto-aplicação de preço sem ação do usuário).
2. Testar o fluxo de salvamento de preço em 2+ safras para popular e documentar visualmente o gráfico da aba "Histórico por Safra".
3. Testar/forçar um cenário de divergência >10% para documentar visualmente o alerta mencionado no rodapé.
4. Confirmar se a tela Comercialização consome o "Preço Definido" (travado) ou a cotação de mercado ao vivo desta tela — atualmente não distinguido em `SPEC_TELA_COMERCIALIZACAO.md`.
5. Validar o comportamento exato dos botões em lote "Aplicar Mercado" e "Salvar Todas" (sobrescrita sem confirmação?) antes de qualquer refatoração.
6. Investigar a ausência pontual de "Volume" no card Café Arábica — comportamento da API de origem vs. tratamento de erro do AgroFlow.

**Dependência crítica a não quebrar:** esta é a tela que efetivamente "define a verdade" de preço para todo o restante do sistema (Quadro de Safra, Arrendamentos, Fluxo de Caixa, e provavelmente Comercialização) — qualquer alteração na lógica de conversão de moeda ou no fluxo de salvamento de preço tem efeito cascata direto e amplo. Deve ser tratada com prioridade de testes de regressão mais alta que as demais telas já documentadas.
