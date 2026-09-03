# Levantamento — Pecuária, Suinocultura e Avicultura no Quadro de Safra

**Status:** aguardando validação do cliente. Não é spec — é o roteiro de perguntas a fazer antes de desenhar schema/tela.

## Origem

Comentário do cliente em review de 23/08/2026, na aba Quadro de Safra:
> "Os cálculos estão corretos, contudo há uma melhoria a ser implementada, referente a pecuária, suinocultura e avicultura."

## Situação atual do sistema

Hoje **não existe nenhuma modelagem** de pecuária/suinocultura/avicultura no AgroGestão:

- `QuadroSafra` (`prisma/schema.prisma`) é inteiramente estruturado em torno de cultura de grão: `cultura`, `hectares`, `haPropria`/`haArrendada`, `rendimento` (unidade/ha), `unidadeProducao` ("sc"/"kg"/"@"/"ton"/"m³"), `precoMedio`, `custoProducao` (R$/ha).
- `src/lib/agro.ts` (`calcularSafra()`) calcula receita/custo/margem só nesses termos de área × produtividade × preço.
- O único vestígio de pecuária em todo o código é um bloco de **4 campos de texto livre** no questionário "Perfil do Grupo Econômico" (Cadastro Mestre — `pecuariaCicloProducao`, `pecuariaConfinamento`, `pecuariaTaxaDesfrutePercent`, `pecuariaCustosCronogramaCompraAbate`), usados só como texto narrativo no Parecer Executivo, sem ligação com nenhum cálculo financeiro.

Ou seja: é funcionalidade nova a construir do zero, não uma correção de bug ou lacuna pontual. Seguindo a convenção já usada em todo o projeto (nenhuma tela/campo é modelado sem uma spec fotografada ou confirmada com o cliente), o próximo passo é levantar os requisitos abaixo antes de tocar em schema.

## Perguntas para validar com o cliente

1. **Granularidade de registro** — cada linha do quadro representa um lote/rebanho consolidado (ex.: "200 cabeças de corte, safra 2026/2027"), ou o sistema precisa acompanhar animais/lotes individualmente?

2. **Pecuária de corte/leite** —
   - Unidade de venda: arroba (@), kg vivo, ou kg de carcaça?
   - O Ganho Médio Diário (GMD) entra no cálculo de receita projetada (peso de entrada + GMD × dias = peso de saída), ou o usuário digita direto o peso final esperado?
   - Leite: produção diária/mensal por litro, preço por litro — é um fluxo à parte de corte, ou fica de fora nesta primeira fase?

3. **Suinocultura** —
   - O ciclo (creche → recria → terminação) é tratado como uma fase única no cálculo, ou cada etapa tem custo e receita própria (leitão → matriz → terminação são negócios com dinâmicas de custo bem diferentes)?
   - Unidade de venda: kg vivo ou kg carcaça?

4. **Avicultura** —
   - Registro por lote de aves (nº de cabeças, conversão alimentar, taxa de mortalidade estimada), ou só uma receita bruta estimada por ciclo de engorda?
   - Corte e postura (ovos) são negócios distintos — algum dos dois está fora de escopo?

5. **Custo** — por cabeça, por lote, ou custo total do período (equivalente ao "custo/ha" hoje usado em grãos)? Precisa abrir em categorias (ração, sanidade, mão de obra) ou um valor único basta?

6. **Onde aparece na tela** — vira linhas adicionais dentro da mesma tabela do Quadro de Safra (com um "tipo de linha" diferenciado: Cultura vs. Rebanho), ou sub-abas próprias (Pecuária / Suinocultura / Avicultura) dentro do módulo?

7. **Integração com os demais módulos** — precisa entrar automaticamente no Fluxo de Safra, Fluxo Mensal e Análise Financeira (Balanço/DRE), do mesmo jeito que grãos entram hoje, ou é só informativo nesta primeira fase (sem impacto nos demonstrativos ainda)?

## Depois de respondido

Com as respostas, o desenho técnico é: um model novo (ex. `RebanhoSafraAno`, pendurado em `Propriedade` como `QuadroSafra`) e uma função de cálculo pura análoga a `calcularSafra()` (`src/lib/agro.ts`) para o novo domínio, seguindo o mesmo padrão de migration + `src/server/<entidade>.ts` + view/drawer já usado em todos os módulos do projeto.
