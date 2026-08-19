-- Custo de Produção passa a ser o input do usuário (R$/Há); Despesa (R$ absoluto)
-- deixa de ser persistida e passa a ser sempre derivada: despesa = custoProducao * hectares.
-- Mesmo critério já usado para receitaBruta/receitaLiquida/margem (nunca persistidos).

-- AlterTable: adiciona a coluna nullable para permitir backfill
ALTER TABLE "quadro_safra" ADD COLUMN "custoProducao" DECIMAL(12,2);

-- Backfill: custoProducao = despesa / hectares.
-- hectares é double precision (Float) — cast pra numeric é obrigatório porque
-- ROUND(double precision, int) não existe no Postgres, só ROUND(numeric, int).
UPDATE "quadro_safra"
SET "custoProducao" = ROUND(("despesa" / NULLIF("hectares", 0))::numeric, 2)
WHERE "hectares" > 0;

-- Registros com hectares = 0 (ou nulos após o UPDATE acima) recebem custo 0 —
-- não há base pra derivar um R$/ha significativo.
UPDATE "quadro_safra" SET "custoProducao" = 0 WHERE "custoProducao" IS NULL;

ALTER TABLE "quadro_safra" ALTER COLUMN "custoProducao" SET NOT NULL;

-- DropColumn
ALTER TABLE "quadro_safra" DROP COLUMN "despesa";
