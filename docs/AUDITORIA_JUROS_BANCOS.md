# Auditoria de Juros — Bancos & Financiamentos

**Data:** 19/08/2026
**Motivo:** o cliente pediu revisão das fórmulas de juros de SAC e PRICE (pré-fixado, CDI + spread, IPCA + spread) usadas no módulo Bancos, após testar a tela.
**Versão publicada (com formatação, para envio ao cliente):** https://claude.ai/code/artifact/7259f57c-09f3-4043-b5de-653cc9dd82a5

## Veredito

**Nenhum erro encontrado.** As fórmulas foram reconferidas de fora pra dentro, com uma calculadora independente do código do sistema, e os dois bateram. Detalhe abaixo, e no Artifact publicado (linguagem não-técnica, pronta para o cliente).

## 1. Por que a parcela não é "12% ÷ 12 meses"

Com taxa de 12% a.a. e parcelas mensais, existem duas convenções igualmente corretas — as duas já disponíveis no sistema, campo "Capitalização":

- **Simples**: divide a taxa proporcionalmente (12% ÷ 12 = 1% ao mês, sempre igual).
- **Composta** (padrão do mercado bancário e padrão do sistema): calcula a taxa mensal que, capitalizada 12 vezes, resulta exatamente nos 12% do ano.

Exemplo verificado — R$ 100.000,00, 12% a.a., 12 parcelas mensais, PRICE, Composta:

```
Taxa mensal equivalente = (1 + 0,12)^(1/12) − 1 = 0,9489%
Parcela = P × i ÷ (1 − (1+i)⁻ⁿ) = 100.000 × i ÷ (1 − (1+i)⁻¹²) = R$ 8.856,21
```

Essa é a fórmula-padrão de financiamento bancário (Tabela Price). Implementação em `src/lib/amortizacao.ts`, função `taxaDoPeriodo()` (linha ~86) e `gerarPrice()`/`calcularFatiasPrincipal()`.

## 2. CDI + spread e IPCA + spread: o índice entra antes da conta

Num contrato "CDI + 4% a.a.", o sistema soma o CDI vigente ao spread cadastrado, e só então usa esse total como taxa efetiva no cronograma (`src/lib/taxa-efetiva.ts`, função `calcularTaxaEfetiva()`).

| Tipo de taxa | Índice vigente | Spread cadastrado | Taxa efetiva usada |
|---|---|---|---|
| CDI + spread | 13,90% | 4,00% | **17,90%** |
| IPCA + spread | 4,44% | 4,00% | **8,44%** |

Se o índice não estiver disponível (fonte do BACEN fora do ar), o sistema nunca inventa um número: projeta só com o spread e marca o contrato como pendente de atualização.

## 3. Composto × Simples: as duas contas existem e ambas estão certas

A relação entre Simples e Composta depende do tamanho do período (fração do ano `f`):

- `f < 1` (período menor que um ano, ex: mensal): **Simples cobra mais**.
- `f > 1` (período maior que um ano, ex: anual): **Composta cobra mais**.

Não existe uma direção única — é a matemática das duas convenções (documentado também em `src/lib/amortizacao.test.ts`, describe `'capitalização'`, para impedir que alguém "corrija" uma delas achando que é bug).

## Convite

Essa auditoria testou a fórmula em exemplos controlados. Se um contrato real da operação apresentar valor fora do esperado, anexar: banco, valor contratado, taxa cadastrada, tipo de amortização, periodicidade, datas de contratação/vencimento, e o valor que apareceu × o valor esperado — para investigação pontual.
