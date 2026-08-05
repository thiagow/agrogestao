-- CreateEnum
CREATE TYPE "Bolsa" AS ENUM ('CBOT', 'CME', 'ICE', 'B3', 'PTAX');

-- CreateTable
CREATE TABLE "empresas_pj" (
    "id" TEXT NOT NULL,
    "contaId" TEXT NOT NULL,
    "empresa" TEXT NOT NULL,
    "safra" TEXT NOT NULL,
    "ativoCirculante" DECIMAL(18,2) NOT NULL,
    "ativoNaoCirculante" DECIMAL(18,2) NOT NULL,
    "passivoCirculante" DECIMAL(18,2) NOT NULL,
    "passivoNaoCirculante" DECIMAL(18,2) NOT NULL,
    "capitalReservas" DECIMAL(18,2) NOT NULL,
    "receitaBruta" DECIMAL(18,2) NOT NULL,
    "custos" DECIMAL(18,2) NOT NULL,
    "despesasOperacionais" DECIMAL(18,2) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "empresas_pj_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "balancos_patrimoniais" (
    "id" TEXT NOT NULL,
    "contaId" TEXT NOT NULL,
    "safra" TEXT NOT NULL,
    "ativoCirculante" DECIMAL(18,2) NOT NULL,
    "ativoNaoCirculante" DECIMAL(18,2) NOT NULL,
    "passivoCirculante" DECIMAL(18,2) NOT NULL,
    "passivoNaoCirculante" DECIMAL(18,2) NOT NULL,
    "capitalReservas" DECIMAL(18,2) NOT NULL,
    "resultadoSafra" DECIMAL(18,2) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "balancos_patrimoniais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cotacoes" (
    "id" TEXT NOT NULL,
    "commodity" TEXT NOT NULL,
    "bolsa" "Bolsa" NOT NULL,
    "ticker" TEXT NOT NULL,
    "precoUsd" DECIMAL(18,4),
    "precoBrl" DECIMAL(18,4) NOT NULL,
    "unidade" TEXT NOT NULL,
    "variacaoPercentual" DECIMAL(8,4) NOT NULL,
    "maxima" DECIMAL(18,4) NOT NULL,
    "minima" DECIMAL(18,4) NOT NULL,
    "volume" BIGINT NOT NULL DEFAULT 0,
    "precoDefinidoSafra" DECIMAL(18,4),
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cotacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "empresas_pj_contaId_ativo_idx" ON "empresas_pj"("contaId", "ativo");

-- CreateIndex
CREATE INDEX "balancos_patrimoniais_contaId_ativo_idx" ON "balancos_patrimoniais"("contaId", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "balancos_patrimoniais_contaId_safra_key" ON "balancos_patrimoniais"("contaId", "safra");

-- CreateIndex
CREATE UNIQUE INDEX "cotacoes_commodity_key" ON "cotacoes"("commodity");

-- AddForeignKey
ALTER TABLE "empresas_pj" ADD CONSTRAINT "empresas_pj_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "contas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balancos_patrimoniais" ADD CONSTRAINT "balancos_patrimoniais_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "contas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
