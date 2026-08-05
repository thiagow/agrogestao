/*
  Warnings:

  - You are about to drop the column `categoria` on the `capex` table. All the data in the column will be lost.
  - You are about to drop the column `dataInvestimento` on the `capex` table. All the data in the column will be lost.
  - You are about to drop the column `safra` on the `capex` table. All the data in the column will be lost.
  - You are about to drop the column `valor` on the `capex` table. All the data in the column will be lost.
  - You are about to drop the column `contratoBancarioId` on the `garantias` table. All the data in the column will be lost.
  - You are about to drop the column `tipo` on the `garantias` table. All the data in the column will be lost.
  - You are about to drop the `empresas_grupo` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `ano` to the `capex` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipo` to the `capex` table without a default value. This is not possible if the table is not empty.
  - Added the required column `valorPlanejado` to the `capex` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipoAtivo` to the `garantias` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipoGarantia` to the `garantias` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "empresas_grupo" DROP CONSTRAINT "empresas_grupo_contaId_fkey";

-- DropForeignKey
ALTER TABLE "garantias" DROP CONSTRAINT "garantias_contratoBancarioId_fkey";

-- AlterTable
ALTER TABLE "capex" DROP COLUMN "categoria",
DROP COLUMN "dataInvestimento",
DROP COLUMN "safra",
DROP COLUMN "valor",
ADD COLUMN     "ano" INTEGER NOT NULL,
ADD COLUMN     "percentualFinanciamento" DECIMAL(5,2),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Planejado',
ADD COLUMN     "tipo" TEXT NOT NULL,
ADD COLUMN     "valorExecutado" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "valorPlanejado" DECIMAL(18,2) NOT NULL;

-- AlterTable
ALTER TABLE "garantias" DROP COLUMN "contratoBancarioId",
DROP COLUMN "tipo",
ADD COLUMN     "bancoVinculado" TEXT,
ADD COLUMN     "moeda" "Currency" NOT NULL DEFAULT 'BRL',
ADD COLUMN     "numeroOperacao" TEXT,
ADD COLUMN     "tipoAtivo" TEXT NOT NULL,
ADD COLUMN     "tipoGarantia" TEXT NOT NULL;

-- DropTable
DROP TABLE "empresas_grupo";

-- DropEnum
DROP TYPE "CapexCategoria";

-- DropEnum
DROP TYPE "GarantiaTipo";

-- DropEnum
DROP TYPE "TipoRelacaoEmpresa";

-- CreateTable
CREATE TABLE "perfil_grupo_economico" (
    "id" TEXT NOT NULL,
    "contaId" TEXT NOT NULL,
    "nome" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "atividadePrincipal" TEXT,
    "fundacao" TIMESTAMP(3),
    "sede" TEXT,
    "consultorResponsavel" TEXT,
    "historico" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "perfil_grupo_economico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "perfil_grupo_economico_contaId_key" ON "perfil_grupo_economico"("contaId");

-- CreateIndex
CREATE INDEX "capex_contaId_ano_idx" ON "capex"("contaId", "ano");

-- AddForeignKey
ALTER TABLE "perfil_grupo_economico" ADD CONSTRAINT "perfil_grupo_economico_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "contas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
