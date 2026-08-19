-- IndiceMercado deixa de ser snapshot único (1 linha por tipo, sempre
-- sobrescrita) e vira série temporal: 1 linha por (tipo, origem,
-- dataReferencia), nunca sobrescrita. Necessário pra aplicar o índice
-- REALIZADO em parcelas passadas e a PROJEÇÃO (BCB Focus) em parcelas
-- futuras, em vez de uma taxa única pro cronograma inteiro.

CREATE TYPE "OrigemIndice" AS ENUM ('REALIZADO', 'PROJETADO');

ALTER TABLE "indices_mercado" ADD COLUMN "origem" "OrigemIndice" NOT NULL DEFAULT 'REALIZADO';

-- As 3 linhas existentes (snapshot único por tipo) já nascem corretas como
-- REALIZADO via DEFAULT acima — nenhum backfill de dado necessário.

DROP INDEX "indices_mercado_tipo_key";
CREATE UNIQUE INDEX "indices_mercado_tipo_origem_dataReferencia_key" ON "indices_mercado"("tipo", "origem", "dataReferencia");
CREATE INDEX "indices_mercado_tipo_origem_idx" ON "indices_mercado"("tipo", "origem");
