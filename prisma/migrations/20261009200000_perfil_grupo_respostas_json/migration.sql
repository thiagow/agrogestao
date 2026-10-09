-- Perguntas do Grupo Econômico (09/10/2026): uma coluna de texto por pergunta vira um
-- JSON de respostas por chave estável. Os textos já preenchidos são copiados pra chave
-- equivalente antes das colunas serem removidas (nenhuma resposta se perde).
-- Fica de fora (continua em coluna própria): pecuariaTaxaDesfrutePercent, missao, visao, valores.

ALTER TABLE "perfil_grupo_economico" ADD COLUMN "respostas" JSONB;

UPDATE "perfil_grupo_economico" SET "respostas" = jsonb_strip_nulls(jsonb_build_object(
    'historico_inicio', "historicoInicio",
    'historico_heranca', "historicoHerancaOrigem",
    'historico_evolucao', "historicoEvolucaoNegocio",
    'historico_crises', "historicoGestaoCrises",
    'gestao_conducao', "gestaoAdministracao",
    'gestao_parceria', "gestaoParceriasSocios",
    'gestao_custos_faturamento', "gestaoDivisaoCustosFaturamento",
    'gestao_sucessao', "gestaoPlanoSucessorioHerdeiros",
    'agricultura_custos', "agriculturaCustos",
    'agricultura_cronograma', "agriculturaCronogramaPlantioColheita",
    'agricultura_armazenagem', "agriculturaCapacidadeArmazenamento",
    'agricultura_fornecedores_clientes', "agriculturaFornecedoresClientes",
    'agricultura_compras', "agriculturaModalidadesCompra",
    'agricultura_exportacao', "agriculturaExportacao",
    'pecuaria_ciclo', "pecuariaCicloProducao",
    'pecuaria_confinamento', "pecuariaConfinamento",
    'pecuaria_custos', "pecuariaCustosCronogramaCompraAbate",
    'financeiro_financiamento', "financeiroFinanciamentos",
    'financeiro_hedge', "financeiroPoliticaHedge",
    'financeiro_posicao', "financeiroPosicaoComercializadaSafraAtual",
    'coligadas_participacoes', "empresasColigadas"
));

ALTER TABLE "perfil_grupo_economico"
DROP COLUMN "historicoInicio",
DROP COLUMN "historicoHerancaOrigem",
DROP COLUMN "historicoEvolucaoNegocio",
DROP COLUMN "historicoGestaoCrises",
DROP COLUMN "gestaoAdministracao",
DROP COLUMN "gestaoParceriasSocios",
DROP COLUMN "gestaoDivisaoCustosFaturamento",
DROP COLUMN "gestaoPlanoSucessorioHerdeiros",
DROP COLUMN "agriculturaCustos",
DROP COLUMN "agriculturaCronogramaPlantioColheita",
DROP COLUMN "agriculturaCapacidadeArmazenamento",
DROP COLUMN "agriculturaFornecedoresClientes",
DROP COLUMN "agriculturaModalidadesCompra",
DROP COLUMN "agriculturaExportacao",
DROP COLUMN "pecuariaCicloProducao",
DROP COLUMN "pecuariaConfinamento",
DROP COLUMN "pecuariaCustosCronogramaCompraAbate",
DROP COLUMN "financeiroFinanciamentos",
DROP COLUMN "financeiroPoliticaHedge",
DROP COLUMN "financeiroPosicaoComercializadaSafraAtual",
DROP COLUMN "empresasColigadas";
