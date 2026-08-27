/*
  Warnings:

  - You are about to drop the `balancos_patrimoniais` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "balancos_patrimoniais" DROP CONSTRAINT "balancos_patrimoniais_contaId_fkey";

-- DropTable
DROP TABLE "balancos_patrimoniais";

-- CreateTable
CREATE TABLE "dados_complementares_financeiro" (
    "id" TEXT NOT NULL,
    "propriedadeId" TEXT NOT NULL,
    "safra" TEXT NOT NULL,
    "caixaEquivalentes" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "estoqueGraos" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "estoqueInsumos" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "outrosCreditosCp" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "contasReceberLp" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "outrosCreditosLp" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "investimentos" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "maquinasEquipamentos" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "benfeitorias" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "depreciacaoAcumulada" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "obrigTrabalhistasCp" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "obrigFiscaisCp" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "outrasObrigCp" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "obrigFiscaisLp" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "outrasObrigLp" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "partesRelacionadas" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "capitalSocial" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "reservasLucrosAcumulados" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "deducoesReceitaPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "despesasOperacionais" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "despesasAdministrativas" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "despesaComercialFallback" DECIMAL(18,2),
    "despesaComercialScHa" DECIMAL(6,2) NOT NULL DEFAULT 3,
    "dividendos" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "depreciacaoPeriodo" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "aliquotaIrCsllPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "capex" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "servicoDividaManual" DECIMAL(18,2),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "dados_complementares_financeiro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dados_complementares_financeiro_propriedadeId_ativo_idx" ON "dados_complementares_financeiro"("propriedadeId", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "dados_complementares_financeiro_propriedadeId_safra_key" ON "dados_complementares_financeiro"("propriedadeId", "safra");

-- AddForeignKey
ALTER TABLE "dados_complementares_financeiro" ADD CONSTRAINT "dados_complementares_financeiro_propriedadeId_fkey" FOREIGN KEY ("propriedadeId") REFERENCES "propriedades"("id") ON DELETE CASCADE ON UPDATE CASCADE;
