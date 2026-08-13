-- Juros indexados (CDI / IPCA / Dólar) nos contratos bancários.
--
-- 1. Índices de mercado passam a ser persistidos (snapshot global, sem tenant).
-- 2. O campo "taxaAdicional" (spread) é removido: passa a existir um único campo
--    de taxa — taxa cheia no pré-fixado, spread nos indexados. O valor que
--    estivesse em taxaAdicional é SOMADO a taxaJuros antes do DROP, para não
--    perder número digitado por ninguém.
-- 3. O contrato passa a registrar a memória de cálculo do último cronograma
--    gerado (taxa efetiva, índice aplicado e a data de referência dele).

-- CreateEnum
CREATE TYPE "TipoIndice" AS ENUM ('CDI', 'IPCA', 'USD');

-- Preserva o spread cadastrado antes de descartar a coluna.
UPDATE "contratos_bancarios"
SET "taxaJuros" = "taxaJuros" + "taxaAdicional"
WHERE "taxaAdicional" IS NOT NULL AND "taxaAdicional" > 0;

-- AlterTable
ALTER TABLE "contratos_bancarios" DROP COLUMN "taxaAdicional",
ADD COLUMN     "indiceAtualizadoEm" TIMESTAMP(3),
ADD COLUMN     "indiceReferencia" DECIMAL(10,4),
ADD COLUMN     "taxaEfetivaAplicada" DECIMAL(8,4);

-- CreateTable
CREATE TABLE "indices_mercado" (
    "id" TEXT NOT NULL,
    "tipo" "TipoIndice" NOT NULL,
    "valor" DECIMAL(10,4) NOT NULL,
    "unidade" TEXT NOT NULL,
    "fonte" TEXT NOT NULL,
    "dataReferencia" TIMESTAMP(3) NOT NULL,
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "indices_mercado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "indices_mercado_tipo_key" ON "indices_mercado"("tipo");
