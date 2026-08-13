# Bancos — aba "Fluxo Detalhado"

> **Status: implementado em 13/08/2026.** 59 testes verdes (`npm test`), `tsc --noEmit` e `next build` limpos, conferência aritmética manual em `scripts/verificar-fluxo-detalhado.ts`. Divergências entre o plano e o que foi entregue estão na seção "Ajustes durante a execução", no fim.

## Context

É a última aba de Bancos em construção. Hoje `BancosView.tsx` devolve um placeholder ("Em construção — aguardando especificação detalhada desta aba"). O print do AgroFlow fotografado pelo usuário em 13/08/2026 fechou a spec: **um bloco por contrato**, com a evolução período a período — `Período | Data | Saldo Inicial | Juros | Amortização | Parcela | Saldo Final` — e uma linha de Total por contrato.

Enquanto a aba **Cronograma** responde "quanto o grupo paga em cada ano" (consolidado, todos os contratos somados), o **Fluxo Detalhado** responde "como cada contrato se comporta ao longo da vida" — é a visão de auditoria de um contrato individual.

### Análise do print — dois achados

**1. O AgroFlow erra o cálculo de juros indexados, e vamos divergir dele de propósito.** No card Sicoob o rótulo diz `Taxa: 4,00% a.a. (CDI + spread)` e os juros do período 1 são R$ 38.703 — exatamente `967.569 × 4%`. Ou seja, **o indexador é ignorado e só o spread é aplicado**. É o mesmo defeito que já corrigimos na aba Cronograma (`src/lib/taxa-efetiva.ts`, 13/08/2026). Nosso número usará a taxa efetiva (CDI 13,90% + 4% = 17,90%), então os valores **não vão bater com o print** — e isso é o comportamento correto, não uma regressão.

O resto do print confere com nosso motor: SAC com `967.569 / 3 = 322.523` constante, juros sobre saldo decrescente, saldo final zerando, e `Parcela = Juros + Amortização` em toda linha.

**2. O AgroFlow não calcula BULLET** — o card Bradesco mostra "Sem fluxo calculado. Verifique as datas do contrato." Nosso motor gera BULLET normalmente, então essa tela fica melhor que a original.

### Decisões fechadas com o usuário

1. **BULLET ganha linhas por período**, com o saldo capitalizando e parcela zero até o vencimento — como descreve a especificação enviada (`SDₜ = PV×(1+i)ᵗ`). Exige mudar o motor de amortização.
2. **Cards recolhíveis**, um por contrato, primeiro expandido — fiel ao print, mas escalável para uma carteira grande.
3. **Agrupamento por ano com expansão** quando a periodicidade não for anual, para um contrato mensal de 10 anos não despejar 120 linhas.

---

## Os 4 sistemas — o que já está pronto e o que muda

O motor (`src/lib/amortizacao.ts`) já implementa os quatro corretamente, e os 55 testes existentes travam os invariantes (soma dos principais = contratado, saldo final zero, `valorTotal = valorPrincipal + valorJuros`).

| Sistema | Estado | Ação |
|---|---|---|
| **SAC** | `gerarSac` — amortização constante, juros sobre saldo decrescente | nenhuma |
| **PRICE** | `gerarPrice` — parcela constante via fator de recuperação de capital | nenhuma |
| **JUROS_PERIODICOS** | `gerarJurosPeriodicos` — `Aₜ = 0`, `SDₜ = PV`, principal na última | nenhuma |
| **BULLET** | `gerarCronograma` L110-129 — **uma única linha** no vencimento | **mudar**: emitir períodos intermediários |

### A mudança no BULLET, e a tensão que ela cria

Duas identidades disputam a linha final e **não dá para manter as duas**:

- `Parcela = Juros + Amortização` (invariante persistido em `Parcela`, travado por teste, e somado pela aba Cronograma)
- `Saldo Final = Saldo Inicial + Juros − Amortização` (leitura natural das colunas do print)

**A primeira vence** — quebrá-la corromperia a aba Cronograma, que soma `valorJuros` e `valorPrincipal` separadamente. Então o formato das linhas fica:

```
t < n:  juros = 0, principal = 0, parcela = 0, saldoDevedor = round2(PV × (1+i)^t)
t = n:  principal = PV, juros = PV × [(1+i)^n − 1], parcela = PV × (1+i)^n, saldoDevedor = 0
```

Os juros aparecem no saldo (capitalizados) durante o contrato e são reconhecidos como despesa de uma vez no vencimento. Para o leitor não estranhar, a UI mostra em contratos BULLET a nota **"Juros capitalizados no saldo, liquidados integralmente no vencimento"**.

Consequência a tratar: linhas de valor zero criam anos vazios no consolidado. `listCronogramaConsolidado` passa a **descartar anos em que juros e amortização são ambos zero** — senão a aba Cronograma ganha linhas de R$ 0.

---

## Implementação

### 1. `src/lib/amortizacao.ts` — BULLET com evolução

Substituir o bloco `if (params.sistemaAmortizacao === 'BULLET')` (L110-129) por uma função `gerarBullet(...)` no mesmo estilo das outras três: calcula `numParcelas` a partir de `mesesRestantes / mesesPorPeriodo` (mesma conta já usada por SAC/PRICE/JUROS_PERIODICOS), emite `numParcelas − 1` linhas zeradas com o saldo capitalizado por `taxaPeriodo`, e a linha final liquidando tudo.

Os juros totais devem continuar sendo calculados sobre o prazo real (`diasEntre(inicioPagto, fim)` com `taxaDoPeriodo`), não pela composição das aproximações de período — assim o valor final não muda em relação ao que já está em produção.

### 2. `src/lib/amortizacao.test.ts` — atualizar e ampliar

O teste `BULLET > gera uma única parcela no vencimento` (L101-110) afirma `toHaveLength(1)` e passa a ser falso — reescrever. Novos casos:

- linhas intermediárias com parcela zero e principal zero;
- saldo crescendo geometricamente (`SDₜ / SDₜ₋₁` constante);
- saldo final exatamente zero e soma dos principais = contratado (já cobertos pelos testes universais, que continuam valendo);
- juros totais do BULLET com capitalização Composta iguais a `PV × [(1+i)ⁿ − 1]`.

### 3. `src/server/contratos-bancarios.ts` — novo server action

```ts
export interface ParcelaFluxo {
  numero: number; data: string;
  saldoInicial: number; juros: number; amortizacao: number; parcela: number; saldoFinal: number;
}
export interface AnoFluxo {
  ano: number; saldoInicial: number; juros: number; amortizacao: number;
  parcela: number; saldoFinal: number; parcelas: ParcelaFluxo[];
}
export interface FluxoContrato {
  contratoId: string; banco: string; tipoOperacao: string;
  sistemaAmortizacao: string; periodicidade: string; moeda: string;
  saldoContratado: number; saldoAtual: number; dataVencimento: string;
  tipoTaxa: string; taxaCadastrada: number; taxaEfetiva: number | null;
  memoriaTaxa: string;           // "CDI 13,90% + 4,00% = 17,90% a.a."
  agrupadoPorAno: boolean;       // true quando algum ano tem mais de uma parcela
  anos: AnoFluxo[];
  totalJuros: number; totalAmortizacao: number; totalParcelas: number;
}
export async function listFluxoDetalhado(): Promise<{ contratos: FluxoContrato[]; totalJuros: number; totalAmortizacao: number; totalParcelas: number }>
```

Uma query só, escopada por `requireContext()` — mesmo padrão de `listCronogramaConsolidado` (L86-105): `db.parcela.findMany({ where: { contrato: { propriedadeId, ativo: true } }, orderBy: { numero: 'asc' }, include: { contrato: true } })`, agrupado em memória.

Pontos de atenção:
- **`saldoInicial` não existe em `Parcela`** e não precisa existir: é derivado — `SI(1) = contrato.saldoInicial`, `SI(t) = saldoDevedor(t−1)`. Nada de mudança de schema.
- Ano via `getUTCFullYear()`, como já é feito em `listCronogramaConsolidado` (as datas são gravadas à meia-noite UTC).
- `memoriaTaxa` reaproveita `calcularTaxaEfetiva()` (`src/lib/taxa-efetiva.ts`) com `carregarIndicesVigentes()` (`src/server/cronograma-engine.ts`) — nada reimplementado.
- Contrato sem parcelas devolve `anos: []`; a UI mostra o estado vazio (nunca o "Verifique as datas do contrato" do original, que era um erro deles).

No mesmo arquivo, ajustar `listCronogramaConsolidado` para descartar anos com `juros === 0 && amortizacao === 0`.

### 4. `src/app/(app)/[tab]/page.tsx` + `TabView.tsx`

`listFluxoDetalhado()` entra no `Promise.all` já condicionado a `tab === 'bancos'`, ao lado de `listCronogramaConsolidado()` e `listIndices()`, e desce por prop até `BancosView` — mesmo caminho de `cronograma` e `indices`.

### 5. `src/components/views/BancosView.tsx` — a aba

Substituir o placeholder `Fluxo Detalhado` (o `if (activeTabId !== 'contratos')`) por um `FluxoDetalhadoTab`, composto de:

- **`CardContratoFluxo`** — cabeçalho sempre visível (`Landmark` + banco, `Badge` do Tipo de Operação, `Badge` de `SISTEMA / PERIODICIDADE`, e a linha `Saldo · Taxa · Venc.` como no print), com chevron para expandir. Primeiro card aberto por padrão (`useState`).
  - A taxa no cabeçalho mostra a **efetiva** com a memória de cálculo: `17,90% a.a. (CDI 13,90% + 4,00%)`, não o `4,00% a.a. (CDI + spread)` enganoso do print.
  - Resumo de juros totais no cabeçalho, para comparar contratos sem expandir.
- **Tabela** com as 7 colunas do print. Paleta já usada na aba Cronograma: Juros âmbar, Amortização azul, Parcela slate-900 bold, Saldo Final rose. Linha `Total` com fundo `slate-50` (sem total para Saldo Inicial/Final, que não somam).
- **Agrupamento**: quando `agrupadoPorAno`, as linhas são anos expansíveis (`Ano` no lugar de `Período | Data`); quando cada ano tem uma parcela só, renderiza direto como o print.
- **Nota do BULLET** quando `sistemaAmortizacao === 'BULLET'`.
- Rodapé com o **total geral da carteira** (juros, amortização, desembolso) — não existe no print e é barato.

Tudo com os primitivos de `src/components/ui/` (`Card`, `Badge`, `Button`), sem lib nova.

### 6. Regeneração dos cronogramas existentes

Contratos BULLET já salvos têm uma linha só. Criar `scripts/regerar-cronogramas.ts` (padrão de `scripts/verificar-juros-indexados.ts`, rodado com `npx tsx`) que percorre os contratos ativos e chama `regerarCronograma` (`src/server/cronograma-engine.ts`) com os índices vigentes. Rodar uma vez após o deploy.

---

## Arquivos

**Novos:** `scripts/regerar-cronogramas.ts` (nada de arquivo novo em `src/server` — o action entra em `contratos-bancarios.ts`).

**Modificados:** `src/lib/amortizacao.ts`, `src/lib/amortizacao.test.ts`, `src/server/contratos-bancarios.ts`, `src/components/views/BancosView.tsx`, `src/components/TabView.tsx`, `src/app/(app)/[tab]/page.tsx`, `CLAUDE.md`, `docs/PLANO_BANCOS_JUROS_INDEXADOS.md`.

## Verificação

1. `npm test` (os 55 atuais + os novos de BULLET) e `npm run lint` verdes; `npm run build` limpo.
2. **Conferência aritmética contra o print**, cadastrando o contrato do Sicoob (R$ 967.569, SAC, Anual, 3 períodos): a **Amortização** deve bater exatamente com as R$ 322.523 do print nos três períodos, e o Saldo Final com 645.046 / 322.523 / 0. Os **Juros** devem divergir — R$ 173.195 no período 1 em vez de R$ 38.703 — porque aplicamos CDI + spread. Se baterem com o print, é sinal de que a taxa efetiva regrediu.
3. Cadastrar um **BULLET** anual de 3 anos e conferir: 2 linhas com parcela R$ 0 e saldo crescendo à razão `(1+i)`, e a última liquidando `PV × (1+i)³` com `Juros + Amortização = Parcela`.
4. Cadastrar **PRICE mensal de 5 anos** e conferir que a tabela agrupa por ano, que expandir um ano mostra 12 parcelas, que a parcela é constante e que a soma das 12 bate com a linha do ano.
5. Cadastrar **JUROS_PERIODICOS** e conferir Amortização zero em todas as linhas menos a última, com Saldo Inicial constante.
6. Abrir a aba **Cronograma** depois de tudo e confirmar que **não apareceu nenhum ano com R$ 0** (o filtro novo) e que os totais continuam iguais aos de antes da mudança do BULLET.
7. Contrato **sem parcelas** e carteira **vazia**: os dois estados vazios renderizam sem quebrar.

---

## Ajustes durante a execução

**1. Verificação aritmética automatizada em vez de manual.** Os itens 2-5 da lista acima foram cobertos por `scripts/verificar-fluxo-detalhado.ts` (`npx tsx`), que roda as mesmas contas usando as funções puras diretamente — mais rápido de repetir a cada mudança do que recadastrar contratos pela UI. Todos os números batem com o esperado:

- Sicoob (SAC, CDI+4%): Amortização 322.523 constante, Saldo Final 645.046/322.523/0 — igual ao print. Juros do período 1 = R$ 175.953 (não R$ 38.703 do print), confirmando que a taxa efetiva (17,90% a.a.) está sendo aplicada.
- BULLET anual 3 anos: razão de crescimento do saldo constante entre os dois períodos intermediários (1,121863 nos dois), e `Juros + Principal = Parcela` na liquidação final.
- PRICE mensal 5 anos: 60 parcelas, parcela mensal constante.
- JUROS_PERIODICOS: Amortização zero nos 2 primeiros períodos, integral no último.
- Filtro do consolidado: um BULLET de 3 anos gera 3 anos brutos e só 1 após o filtro — confirma que os 2 anos de parcela zero não aparecem na aba Cronograma.

A única divergência encontrada durante a conferência (PRICE mensal: 11 parcelas em 2026, não 12) **não é bug** — o primeiro pagamento cai um período após a contratação (2026-02-01), então a 12ª parcela cai em janeiro de 2027. Mesmo comportamento nos outros 3 sistemas, consistente com o motor desde antes desta fase.

**2. Coluna "Data" sempre presente na tabela, mesmo quando agrupada por ano.** Durante a implementação, a primeira versão tinha cabeçalho com 6 colunas no modo agrupado (sem "Data") mas linhas de parcela com 7 células — um desalinhamento de colunas. Corrigido: a coluna "Data" existe sempre; na linha de Ano ela fica em branco, e nas linhas de parcela (flat ou expandidas) ela mostra a data normalmente. O rodapé "Total" usa `colSpan={2}` fixo (cobrindo Período/Ano + Data) nos dois modos.

**3. `taxaEfetiva`/`memoriaTaxa` reconstroem os índices a partir do que foi persistido no contrato, não dos índices vigentes agora.** O plano previa reusar `calcularTaxaEfetiva()` com `carregarIndicesVigentes()` (índices ao vivo). Na implementação, optei por montar um `IndicesVigentes` sintético a partir de `contrato.indiceReferencia` (o valor que foi *realmente* usado para gerar as parcelas que a tabela mostra) e passar isso para a mesma função pura — mesma reutilização de código pedida no plano, mas sem o risco de a "memória" explicar um número diferente do que está na tabela quando o usuário não clicou "Atualizar Índices" depois de o CDI/IPCA/dólar mudarem.

**4. `scripts/regerar-cronogramas.ts` roda para todos os contratos ativos de todas as contas**, não escopado a uma propriedade — é script de manutenção de deploy, sem `requireContext()`, chamado fora do boundary de servidor de propósito (arquivos `'use server'` só podem exportar server actions).
