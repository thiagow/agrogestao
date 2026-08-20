/*
  Warnings:

  - You are about to drop the column `areaHectares` on the `aquisicoes` table. All the data in the column will be lost.
  - You are about to drop the column `culturaPrincipal` on the `aquisicoes` table. All the data in the column will be lost.
  - You are about to drop the column `dataOcupacao` on the `aquisicoes` table. All the data in the column will be lost.
  - You are about to drop the column `localizacao` on the `aquisicoes` table. All the data in the column will be lost.
  - You are about to drop the column `safraFim` on the `aquisicoes` table. All the data in the column will be lost.
  - You are about to drop the column `safraInicio` on the `aquisicoes` table. All the data in the column will be lost.
  - You are about to drop the column `valorTotal` on the `aquisicoes` table. All the data in the column will be lost.
  - Added the required column `areaAgricolaHa` to the `aquisicoes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `areaTotalHa` to the `aquisicoes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dataInicioPagamento` to the `aquisicoes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dataVencimento` to the `aquisicoes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estado` to the `aquisicoes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `municipio` to the `aquisicoes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipoPagamento` to the `aquisicoes` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TipoPagamentoAquisicao" AS ENUM ('SACAS', 'REAIS');

-- CreateEnum
CREATE TYPE "TipoLancamentoAquisicao" AS ENUM ('ENTRADA', 'PARCELA');

-- AlterTable
ALTER TABLE "aquisicoes" DROP COLUMN "areaHectares",
DROP COLUMN "culturaPrincipal",
DROP COLUMN "dataOcupacao",
DROP COLUMN "localizacao",
DROP COLUMN "safraFim",
DROP COLUMN "safraInicio",
DROP COLUMN "valorTotal",
ADD COLUMN     "areaAgricolaHa" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "areaTotalHa" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "comarca" TEXT,
ADD COLUMN     "culturaReferenciaId" TEXT,
ADD COLUMN     "dataInicioPagamento" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "dataVencimento" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "denominacaoImovel" TEXT,
ADD COLUMN     "estado" TEXT NOT NULL,
ADD COLUMN     "municipio" TEXT NOT NULL,
ADD COLUMN     "numeroMatricula" TEXT,
ADD COLUMN     "periodicidade" TEXT NOT NULL DEFAULT 'Anual',
ADD COLUMN     "prazoFinanciamentoMeses" INTEGER,
ADD COLUMN     "precoHa" DECIMAL(18,4),
ADD COLUMN     "precoReferencia" DECIMAL(18,4),
ADD COLUMN     "sacasHa" DECIMAL(12,4),
ADD COLUMN     "safraEntrada" TEXT,
ADD COLUMN     "taxaJurosAA" DECIMAL(8,4),
ADD COLUMN     "tipoPagamento" "TipoPagamentoAquisicao" NOT NULL,
ADD COLUMN     "valorEntrada" DECIMAL(18,2),
ADD COLUMN     "valorFinanciado" DECIMAL(18,2),
ADD COLUMN     "valorTotalManual" DECIMAL(18,2),
ADD COLUMN     "vendedor" TEXT;

-- CreateTable
CREATE TABLE "parcelas_aquisicao" (
    "id" TEXT NOT NULL,
    "aquisicaoId" TEXT NOT NULL,
    "safra" TEXT NOT NULL,
    "tipo" "TipoLancamentoAquisicao" NOT NULL,
    "sacas" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "precoSc" DECIMAL(18,4),
    "usaPrecoReferencia" BOOLEAN NOT NULL DEFAULT false,
    "valorTotal" DECIMAL(18,2) NOT NULL,
    "dataPagamento" TIMESTAMP(3) NOT NULL,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "parcelas_aquisicao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "parcelas_aquisicao_aquisicaoId_idx" ON "parcelas_aquisicao"("aquisicaoId");

-- CreateIndex
CREATE INDEX "aquisicoes_culturaReferenciaId_idx" ON "aquisicoes"("culturaReferenciaId");

-- AddForeignKey
ALTER TABLE "aquisicoes" ADD CONSTRAINT "aquisicoes_culturaReferenciaId_fkey" FOREIGN KEY ("culturaReferenciaId") REFERENCES "culturas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcelas_aquisicao" ADD CONSTRAINT "parcelas_aquisicao_aquisicaoId_fkey" FOREIGN KEY ("aquisicaoId") REFERENCES "aquisicoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
