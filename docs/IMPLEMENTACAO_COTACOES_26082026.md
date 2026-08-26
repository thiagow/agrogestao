# Implementação — Tela Cotações (de-para com a spec)

**Data:** 26/08/2026
**Origem:** `docs/demandas/SPEC_TELA_COTACOES.md` (engenharia reversa do AgroFlow original)
**Plano seguido:** `C:\Users\thiag\.claude\plans\analise-o-documento-em-lazy-melody.md`
**Escopo:** só a tela Cotações e os pontos de leitura que ela alimenta (Arrendamentos, Comercialização, Fluxo de Safra) — Quadro de Safra não foi tocado (ver "Pendências" abaixo).

---

## 1. O que mudou

### 1.1 Schema (`prisma/schema.prisma`)

- **Novo model `PrecoDefinidoSafra`** (`commodity` + `anoSafra`, `@@unique([commodity, anoSafra])`) — o "preço travado" que o usuário confirma manualmente na tela. Substitui o antigo `Cotacao.precoDefinidoSafra`, que apesar do nome era um valor único **global por commodity, sem dimensão de safra nenhuma** (travar um preço sobrescrevia o de todas as safras).
  - **Decisão confirmada com o usuário:** continua **global entre contas** (não virou multi-tenant nesta rodada) — só ganhou a dimensão de safra.
- `Cotacao` (snapshot de mercado ao vivo, seguem sem tenant, como já era) ganhou `precoOriginal` + `unidadeOriginal` — guarda o valor bruto da bolsa (ex.: `1233.50 USX/bu`) separado do valor já convertido, pra exibir os 3 campos que a spec pede (Original / USD / R$).
- Migration `20260826061255_cotacoes_preco_definido_por_safra`, validada no shadow DB (`db_agrogestao_shadow`) antes de aplicar em produção, sem drift (`prisma migrate status` limpo depois).

### 1.2 Conversão de unidade — bug corrigido + feature nova

`src/lib/commodity-unidade.ts` (função pura, testada em `commodity-unidade.test.ts` com os números exatos do snapshot da spec):

- Converte o preço bruto da Yahoo Finance (USX = centavos de dólar, por bushel ou por libra-peso) em **USD e R$ por unidade agrícola de referência** (saca de 60kg ou arroba de 15kg), usando pesos de bushel padronizados pela USDA (soja/trigo = 60lb, milho = 56lb) e a arroba brasileira (15kg).
- **Bug pré-existente corrigido de quebra:** o código anterior nunca dividia por 100 (centavos → dólar) nem aplicava nenhum fator de unidade — o "Preço em R$" exibido estava **~100x mais alto** que o valor real, sem que ninguém tivesse notado (não havia rótulo de unidade que denunciasse o erro).
- **Algodão (pluma) ficou fora da conversão de saca** — decisão confirmada com o usuário: não há peso de "saca de pluma" padronizado/confirmado (ao contrário de bushel e arroba, que são constantes físicas). O card mostra USD/R$ por libra-peso (`lb`) em vez de inventar um fator.

### 1.3 `src/server/cotacoes.ts` — reescrito

- `refreshCotacoes()` agora aplica a conversão de unidade antes de gravar.
- Novas funções: `listPrecosDefinidos()`, `salvarPrecoDefinidoSafra(commodity, anoSafra, preco)`, `aplicarMercadoEmLote(anoSafra)`, `listHistoricoPrecoPorSafra()`.
- `resolverPrecoFallback(culturaNome, anoSafra)` passou a exigir a safra explicitamente (antes lia um valor global sem saber de qual safra).

### 1.4 UI (`CotacoesView.tsx`) — reescrita

- Seletor de safra no cabeçalho (mesmo padrão de Comercialização/Fluxo de Safra: safras do Quadro de Safra, filtragem no client).
- Botões de lote **"Aplicar Mercado"** e **"Salvar Todas"** — pedem confirmação antes de sobrescrever preços já travados na safra.
- Campo **"Preço Definido" editável de verdade** — antes o botão "Salvar" só copiava o preço de mercado do momento; agora o usuário digita o valor que quiser travar.
- **Alerta de divergência >10%** entre preço travado e preço de mercado atual (badge amarelo no card).
- Aba **"Histórico por Safra"** implementada — gráfico de linha (recharts) por commodity, com os 6 chips de filtro (Soja/Milho ativos por padrão), populado assim que houver preço travado em 2+ safras.

### 1.5 Cruzamentos com outras telas

- `src/server/arrendamentos.ts`: `resolverPrecoFallback` agora recebe a safra (primeira safra coberta pelo contrato, via `listarSafrasCobertas()`).
- `src/lib/comercializacao.ts`: `calcularPosicaoComercializacao` passou a receber `precosDefinidos: PrecoDefinidoSafra[]` (em vez de `cotacoes: Cotacao[]`) e filtra pela safra ativa antes de casar por commodity.
- `src/components/views/FluxoSafraView.tsx`: `precoSoja` agora é derivado de `PrecoDefinidoSafra` filtrado pela safra ativa (antes lia o campo global).
- `src/app/(app)/[tab]/page.tsx` / `TabView.tsx`: nova prop `initialPrecosDefinidos` roteada pra Cotações, Comercialização e Fluxo de Safra.

### 1.6 Limpeza

- Removidos os mocks mortos `initialCotacaoDolar`/`initialCotacoesCommodities` de `src/data/initialData.ts` (não eram mais importados por ninguém — `Cotacao` já era 100% real desde a Fase 5).
- Comentários que citavam `Cotacao.precoDefinidoSafra` (campo que não existe mais) atualizados em `arrendamento-engine.ts`, `fluxo-safra-calc.ts`, `schema.prisma` e `page.tsx`.
- `CLAUDE.md` atualizado com a entrada datada desta mudança.

### 1.7 Pesquisa de API (pedido explícito do usuário)

Não existe alternativa gratuita e sem chave, equivalente ao endpoint não-oficial da Yahoo Finance, pra futuros de commodities (CBOT/CME/ICE). Opções encontradas (Databento, API Ninjas, Commodities-API, CME DataMine, Nasdaq Data Link) são pagas ou exigem cadastro/chave. **Recomendação aplicada: manter Yahoo Finance**, sem trocar de fonte.

---

## 2. Verificação

| Verificação | Resultado |
|---|---|
| `npx tsc --noEmit` | limpo |
| `npm test` | **127/127 passando** (inclui os novos testes de conversão de unidade, calibrados com os números reais do snapshot da spec: Soja 1233,50 USX/bu → R$ 139,97, câmbio 5,1470) |
| `npm run build` | limpo |
| `npx prisma migrate status` | sem drift, schema em dia |
| Migration | validada no shadow DB antes de aplicar; 6 linhas de cache existentes em `cotacoes` tiveram backfill provisório (serão recalculadas no próximo "Atualizar", sem risco — é cache de mercado, não lançamento do cliente) |

Não testado manualmente na tela (fora do escopo desta sessão, que foi só implementação): salvar preço em 2+ safras pra ver o gráfico populado, forçar divergência >10% pra ver o alerta, clicar os botões de lote no navegador.

---

## 3. Pendências / fora do escopo desta rodada

1. **Quadro de Safra não consome `Cotacao`/`PrecoDefinidoSafra`.** A spec de Cotações afirma que deveria alimentá-lo; hoje `QuadroSafraView` usa um campo manual (`precoMedio`) por registro, sem nenhuma leitura de cotação. **Não mexido** — é comportamento de uma tela já entregue como réplica confirmada; precisa alinhamento explícito antes de mudar (a tela pode ter essa característica deliberadamente, ou pode ser um gap real — não dá pra saber sem perguntar).
2. **Fluxo de Safra continua só com `precoSoja`.** A "Despesa Comercial (3 sc/ha)" só usa a cotação de Soja; as outras 5 commodities não estão wireadas nesse módulo. Generalizar é possível, mas é escopo maior que o pedido original desta spec.
3. **Multi-tenancy do preço travado.** `PrecoDefinidoSafra` continua **global entre contas** (mesmo critério de `Cotacao`/`IndiceMercado`) por decisão explícita do usuário nesta sessão — travar um preço na commodity X ainda afeta todos os clientes do sistema, não só o do preço. Se algum dia isso incomodar, a correção é acrescentar `contaId` ao model e ao `@@unique`.
4. **Peso da "saca de pluma" do algodão não confirmado.** Card mostra USD/R$ por libra-peso em vez de R$/sc — fica pendente até o cliente confirmar o peso usado na prática dele.
5. **Testes manuais na tela** (ver seção 2, linha final) — recomendo rodar antes de considerar a tela pronta pra validação com o cliente:
   - Salvar preço em 2+ safras → conferir o gráfico da aba "Histórico por Safra".
   - Forçar uma divergência >10% → conferir o badge de alerta.
   - Clicar "Aplicar Mercado" com preços já travados → conferir se o confirm() de sobrescrita aparece.
6. **Ícone ★ no seletor de safra** (mencionado na spec como "possivelmente indica safra atual/padrão") — não implementado, não bloqueia nada, é só um detalhe visual do combobox de safra que já existe em outras telas.
7. **Botões de lote sem teste de UX real:** "Aplicar Mercado" e "Salvar Todas" foram implementados com a mesma ação de fundo (`aplicarMercadoEmLote`) — no navegador real, confirmar se esse comportamento (sobrescrever tudo com o preço de mercado) é o que o cliente espera de "Salvar Todas", já que a spec original não deixou claro se "Salvar Todas" deveria persistir o que já está em cada input em vez de reaplicar o mercado.

---

## 4. Arquivos tocados

```
prisma/schema.prisma
prisma/migrations/20260826061255_cotacoes_preco_definido_por_safra/migration.sql   (novo)
src/lib/commodity-unidade.ts                                                        (novo)
src/lib/commodity-unidade.test.ts                                                    (novo)
src/server/cotacoes.ts
src/server/arrendamentos.ts
src/lib/comercializacao.ts
src/lib/comercializacao.test.ts
src/components/views/CotacoesView.tsx
src/components/views/ComercializacaoView.tsx
src/components/views/FluxoSafraView.tsx
src/components/TabView.tsx
src/app/(app)/[tab]/page.tsx
src/types.ts
src/data/initialData.ts    (limpeza de mock morto)
src/lib/arrendamento-engine.ts    (só comentário)
CLAUDE.md    (entrada datada)
```
