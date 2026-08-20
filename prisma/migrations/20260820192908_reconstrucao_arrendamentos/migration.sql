/*
  Warnings:

  - You are about to drop the column `areaHectares` on the `contratos_arrendamento` table. All the data in the column will be lost.
  - You are about to drop the column `culturaPrincipal` on the `contratos_arrendamento` table. All the data in the column will be lost.
  - You are about to drop the column `custoAnualHectare` on the `contratos_arrendamento` table. All the data in the column will be lost.
  - You are about to drop the column `dataFim` on the `contratos_arrendamento` table. All the data in the column will be lost.
  - You are about to drop the column `localizacao` on the `contratos_arrendamento` table. All the data in the column will be lost.
  - You are about to drop the column `nomePropriedade` on the `contratos_arrendamento` table. All the data in the column will be lost.
  - You are about to drop the column `proprietarioCpfCnpj` on the `contratos_arrendamento` table. All the data in the column will be lost.
  - You are about to drop the column `proprietarioNome` on the `contratos_arrendamento` table. All the data in the column will be lost.
  - You are about to drop the column `renovavel` on the `contratos_arrendamento` table. All the data in the column will be lost.
  - You are about to drop the column `sacasPorHectare` on the `contratos_arrendamento` table. All the data in the column will be lost.
  - You are about to drop the column `safraFim` on the `contratos_arrendamento` table. All the data in the column will be lost.
  - You are about to drop the column `safraInicio` on the `contratos_arrendamento` table. All the data in the column will be lost.
  - Added the required column `areaArrendadaHa` to the `contratos_arrendamento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dataVencimento` to the `contratos_arrendamento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nomeFazenda` to the `contratos_arrendamento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalSacas` to the `contratos_arrendamento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `valorTotalFluxo` to the `contratos_arrendamento` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OrigemPrecoArrendamento" AS ENUM ('CONTRATO', 'COTACAO');

-- AlterTable
ALTER TABLE "contratos_arrendamento" DROP COLUMN "areaHectares",
DROP COLUMN "culturaPrincipal",
DROP COLUMN "custoAnualHectare",
DROP COLUMN "dataFim",
DROP COLUMN "localizacao",
DROP COLUMN "nomePropriedade",
DROP COLUMN "proprietarioCpfCnpj",
DROP COLUMN "proprietarioNome",
DROP COLUMN "renovavel",
DROP COLUMN "sacasPorHectare",
DROP COLUMN "safraFim",
DROP COLUMN "safraInicio",
ADD COLUMN     "areaArrendadaHa" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "areaTotalHa" DOUBLE PRECISION,
ADD COLUMN     "comarca" TEXT,
ADD COLUMN     "culturaReferenciaId" TEXT,
ADD COLUMN     "dataPagamentoAntecipado" TIMESTAMP(3),
ADD COLUMN     "dataVencimento" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "denominacaoImovel" TEXT,
ADD COLUMN     "municipio" TEXT,
ADD COLUMN     "nomeFazenda" TEXT NOT NULL,
ADD COLUMN     "numeroMatricula" TEXT,
ADD COLUMN     "possuiPagamentoAntecipado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "precoHa" DECIMAL(18,4),
ADD COLUMN     "precoReferencia" DECIMAL(18,4),
ADD COLUMN     "proprietario" TEXT,
ADD COLUMN     "sacasHa" DECIMAL(12,4),
ADD COLUMN     "safraReferenciaAntecipacao" TEXT,
ADD COLUMN     "tipoPagamento" "TipoPagamentoAquisicao" NOT NULL DEFAULT 'SACAS',
ADD COLUMN     "totalSacas" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "valorAntecipado" DECIMAL(14,2),
ADD COLUMN     "valorTotalFluxo" DECIMAL(18,2) NOT NULL,
ADD COLUMN     "valorTotalManual" DECIMAL(18,2),
ALTER COLUMN "periodicidade" SET DEFAULT 'Anual';

-- CreateTable
CREATE TABLE "parcelas_arrendamento" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "safra" TEXT NOT NULL,
    "sacasBrutas" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "sacasAntecipadas" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "sacasLiquidas" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "precoSc" DECIMAL(18,4),
    "origemPreco" "OrigemPrecoArrendamento",
    "valorTotal" DECIMAL(18,2),
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "parcelas_arrendamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "parcelas_arrendamento_contratoId_idx" ON "parcelas_arrendamento"("contratoId");

-- CreateIndex
CREATE INDEX "contratos_arrendamento_culturaReferenciaId_idx" ON "contratos_arrendamento"("culturaReferenciaId");

-- AddForeignKey
ALTER TABLE "contratos_arrendamento" ADD CONSTRAINT "contratos_arrendamento_culturaReferenciaId_fkey" FOREIGN KEY ("culturaReferenciaId") REFERENCES "culturas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcelas_arrendamento" ADD CONSTRAINT "parcelas_arrendamento_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contratos_arrendamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;
