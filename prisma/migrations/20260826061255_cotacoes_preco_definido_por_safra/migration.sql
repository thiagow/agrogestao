/*
  Warnings:

  - `Cotacao.precoDefinidoSafra` deixou de existir (era global, sem dimensão de
    safra apesar do nome) — vira o novo model `PrecoDefinidoSafra`
    (commodity + anoSafra), sem migração de dado: era um cache de preço de
    mercado, não um lançamento financeiro do cliente, e nenhuma trava real
    tinha sido salva em produção até esta data (todas as commodities exibiam
    "Nenhum preço salvo para esta safra" no ambiente analisado pela spec).
  - `precoOriginal`/`unidadeOriginal` são novas colunas de `cotacoes` — para as
    6 linhas de cache já existentes, o backfill abaixo reaproveita o antigo
    `precoUsd` bruto como valor provisório (as linhas são recalculadas no
    próximo clique em "Atualizar", então o valor provisório nunca chega a ser
    lido pela UI antes de ser substituído).
*/

-- AlterTable (nullable primeiro, para permitir backfill nas 6 linhas já existentes)
ALTER TABLE "cotacoes" DROP COLUMN "precoDefinidoSafra",
ADD COLUMN     "precoOriginal" DECIMAL(18,4),
ADD COLUMN     "unidadeOriginal" TEXT;

UPDATE "cotacoes" SET
  "precoOriginal" = COALESCE("precoUsd", "precoBrl"),
  "unidadeOriginal" = CASE WHEN "bolsa" = 'PTAX' THEN 'R$' ELSE 'USX/bu' END
WHERE "precoOriginal" IS NULL;

ALTER TABLE "cotacoes"
ALTER COLUMN "precoOriginal" SET NOT NULL,
ALTER COLUMN "unidadeOriginal" SET NOT NULL;

-- CreateTable
CREATE TABLE "precos_definidos_safra" (
    "id" TEXT NOT NULL,
    "commodity" TEXT NOT NULL,
    "anoSafra" TEXT NOT NULL,
    "precoBrl" DECIMAL(18,4) NOT NULL,
    "definidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "precos_definidos_safra_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "precos_definidos_safra_commodity_idx" ON "precos_definidos_safra"("commodity");

-- CreateIndex
CREATE UNIQUE INDEX "precos_definidos_safra_commodity_anoSafra_key" ON "precos_definidos_safra"("commodity", "anoSafra");
