# Ajustes de layout — o que já foi feito e o que precisamos confirmar com você

Olá! Aplicamos os ajustes de layout que você pediu, tomando o AgroFlow como referência visual. Mexemos **somente na aparência**: nenhum cálculo, regra de negócio ou número do sistema foi alterado. Os valores continuam exatamente os mesmos de antes.

## O que já está ajustado

**Em todas as telas**
- Os números de destaque (Dívida Total, Receita, Saldo etc.) ficaram menores, em torno de 22 px, e os rótulos passaram a ser pequenos, em maiúsculas e em cinza.
- Cores com significado fixo: verde para receita e resultado positivo, vermelho para dívida e saída, laranja para curto prazo, azul para longo prazo e saldo.

**Análise Financeira**
- Os cartões de indicadores ficam coloridos conforme a situação: verde para Excelente, azul para Adequado e vermelho para Crítico.
- Aba Balanço: Ativo em azul, Passivo em vermelho e Patrimônio Líquido em verde. No DRE, resultados em verde, despesas em vermelho e EBITDA em azul. Valores negativos agora aparecem em vermelho, além dos parênteses.
- O gráfico do DRE também usa essas cores.

**Fluxo de Safra**
- Layout em duas colunas, como no AgroFlow.
- Entradas em verde, Saídas em vermelho e uma caixa de destaque para o Fluxo de Caixa Líquido.
- Os gráficos e blocos que faltavam foram adicionados: Composição do Fluxo (agora incluindo os itens adicionais), Análise da Próxima Safra e Itens Adicionais Cadastrados.

**Resumo**
- Barra de participação na coluna "% Receita" do quadro de safra por cultura.
- Gráfico Receita vs Endividamento com cores separadas (verde e vermelho).
- Novos blocos: Principais Bancos, Principais Fornecedores (com barras de participação), Perfil da Dívida Bancária (curto e longo prazo) e Fluxo de Caixa Mensal (barras de entradas e saídas com a linha de saldo).
- Os totais aparecem como "Total", sem o rótulo "mm" do AgroFlow, como combinado.

## O que precisamos confirmar com você

Para estes itens preferimos **não adivinhar**. Eles continuam como estavam até você responder.

### 1. Custo Médio Ponderado (tela Bancos): "Pré" e "CDI+"
- **O que vemos no AgroFlow:** o cartão mostra a divisão entre taxa Pré-fixada e CDI+ (por exemplo, "Pré: 11,46% · CDI+: 3,38%").
- **O que temos hoje:** o sistema separa os contratos em quatro tipos de taxa: Pré-fixado, CDI + spread, IPCA + spread e Dólar + juros. O total ponderado já existe.
- **Nossa sugestão:** exibir duas linhas, "Pré-fixado" e "Pós-fixado" (CDI, IPCA e Dólar juntos), cada uma com sua taxa média e o valor em R$.
- **Pergunta:** essa divisão em dois grupos atende, ou você prefere ver os quatro tipos separados?

### 2. Gráfico Receita vs Endividamento: divisão por safra
- **No AgroFlow:** o gráfico mostra a dívida separada por safra (curto prazo na safra atual, longo prazo na próxima).
- **Hoje no Resumo:** o gráfico compara o total de Receita Líquida com o total de Endividamento, em duas barras.
- **Pergunta:** você quer a dívida dividida por safra nesse gráfico? Se sim, precisamos combinar qual regra define "dívida desta safra" e "dívida da próxima safra".

### 3. Cor dos status "Bom" e "Atenção"
- Você definiu verde (Excelente), azul (Adequado) e vermelho (Crítico).
- Para **Bom** e **Atenção** não há cor definida. Por enquanto eles só mostram a etiqueta colorida, sem pintar o cartão inteiro.
- **Nossa sugestão:** Bom em verde-claro e Atenção em laranja.
- **Pergunta:** podemos seguir essa sugestão?

### 4. Nome do grupo e cidade no topo do Resumo
- O topo do Resumo mostra um nome fixo ("Grupo Pereira — Goiânia - GO"), que não vem do cadastro da conta.
- **Pergunta:** quer que passemos a exibir o nome e a cidade reais do cadastro do grupo? Se sim, precisamos saber de onde vem a cidade (sede informada no Grupo Econômico, por exemplo).

### 5. Dados do AgroFlow que podem não existir no AgroGestão
- Alguns números que aparecem nas telas do AgroFlow podem não ter equivalente no nosso sistema. Para evitar mostrar valor inventado, **não os preenchemos**.
- Já identificamos um deles: a mensagem de avaliação do Perfil da Dívida ("perfil equilibrado, boa distribuição entre CP e LP"). O AgroFlow não explica em qual critério ela se baseia.
- **Pergunta:** você quer essa mensagem? Se sim, precisamos que informe o critério (por exemplo, "equilibrado quando o curto prazo está entre X% e Y%").
- Se você notar qualquer outro número do AgroFlow que não encontrou aqui, nos avise e levantamos a origem do dado.

## Como responder
Basta responder com o número do item e a opção desejada (por exemplo, "1: dois grupos; 2: manter como está; 3: seguir a sugestão; 4: ainda não; 5: sim, equilibrado quando CP entre 20% e 40%").
