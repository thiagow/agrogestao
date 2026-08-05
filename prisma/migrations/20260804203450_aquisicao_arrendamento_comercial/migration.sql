-- CreateEnum
CREATE TYPE "PeriodicidadeArrendamento" AS ENUM ('Anual', 'Mensal', 'Por Safra');

-- CreateEnum
CREATE TYPE "StatusArrendamento" AS ENUM ('ATIVO', 'ENCERRADO');

-- CreateEnum
CREATE TYPE "TipoContratoComercial" AS ENUM ('FUTURO', 'VENDA_A_TERMO', 'HEDGE_CALL', 'HEDGE_PUT');

-- CreateEnum
CREATE TYPE "StatusContratoComercial" AS ENUM ('ATIVO', 'LIQUIDADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "aquisicoes" (
    "id" TEXT NOT NULL,
    "propriedadeId" TEXT NOT NULL,
    "nomeFazenda" TEXT NOT NULL,
    "localizacao" TEXT NOT NULL,
    "areaHectares" DOUBLE PRECISION NOT NULL,
    "valorTotal" DECIMAL(18,2) NOT NULL,
    "dataAquisicao" TIMESTAMP(3) NOT NULL,
    "dataOcupacao" TIMESTAMP(3),
    "culturaPrincipal" TEXT,
    "safraInicio" TEXT NOT NULL,
    "safraFim" TEXT NOT NULL,
    "valorTotalFluxo" DECIMAL(18,2) NOT NULL,
    "totalSacas" DOUBLE PRECISION NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "aquisicoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contratos_arrendamento" (
    "id" TEXT NOT NULL,
    "propriedadeId" TEXT NOT NULL,
    "nomePropriedade" TEXT NOT NULL,
    "localizacao" TEXT NOT NULL,
    "proprietarioNome" TEXT NOT NULL,
    "proprietarioCpfCnpj" TEXT NOT NULL,
    "areaHectares" DOUBLE PRECISION NOT NULL,
    "culturaPrincipal" TEXT NOT NULL,
    "custoAnualHectare" DECIMAL(18,2) NOT NULL,
    "sacasPorHectare" DECIMAL(12,4),
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "periodicidade" "PeriodicidadeArrendamento" NOT NULL,
    "renovavel" BOOLEAN NOT NULL DEFAULT true,
    "status" "StatusArrendamento" NOT NULL DEFAULT 'ATIVO',
    "safraInicio" TEXT NOT NULL,
    "safraFim" TEXT NOT NULL,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "contratos_arrendamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contratos_comerciais" (
    "id" TEXT NOT NULL,
    "propriedadeId" TEXT NOT NULL,
    "cultura" TEXT NOT NULL,
    "safra" TEXT NOT NULL,
    "quantidadeSc" DOUBLE PRECISION NOT NULL,
    "precoFixado" DECIMAL(18,2) NOT NULL,
    "tipoContrato" "TipoContratoComercial" NOT NULL,
    "dataContrato" TIMESTAMP(3) NOT NULL,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "status" "StatusContratoComercial" NOT NULL DEFAULT 'ATIVO',
    "compradorNome" TEXT,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "contratos_comerciais_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "aquisicoes_propriedadeId_ativo_idx" ON "aquisicoes"("propriedadeId", "ativo");

-- CreateIndex
CREATE INDEX "contratos_arrendamento_propriedadeId_ativo_idx" ON "contratos_arrendamento"("propriedadeId", "ativo");

-- CreateIndex
CREATE INDEX "contratos_comerciais_propriedadeId_ativo_idx" ON "contratos_comerciais"("propriedadeId", "ativo");

-- AddForeignKey
ALTER TABLE "aquisicoes" ADD CONSTRAINT "aquisicoes_propriedadeId_fkey" FOREIGN KEY ("propriedadeId") REFERENCES "propriedades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos_arrendamento" ADD CONSTRAINT "contratos_arrendamento_propriedadeId_fkey" FOREIGN KEY ("propriedadeId") REFERENCES "propriedades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos_comerciais" ADD CONSTRAINT "contratos_comerciais_propriedadeId_fkey" FOREIGN KEY ("propriedadeId") REFERENCES "propriedades"("id") ON DELETE CASCADE ON UPDATE CASCADE;
