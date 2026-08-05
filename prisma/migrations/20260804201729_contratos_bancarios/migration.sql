-- CreateEnum
CREATE TYPE "TipoContratoBancario" AS ENUM ('CUSTEO', 'CPR', 'FINANCIAMENTO', 'CREDIARIO');

-- CreateEnum
CREATE TYPE "TipoTaxaBancaria" AS ENUM ('CDI', 'PRIME', 'PRÉ', 'FLUTUANTE');

-- CreateEnum
CREATE TYPE "SistemaAmortizacao" AS ENUM ('SAC', 'PRICE', 'BULLET');

-- CreateEnum
CREATE TYPE "PeriodicidadePagamento" AS ENUM ('Mensal', 'Trimestral', 'Semestral', 'Anual');

-- CreateEnum
CREATE TYPE "FinalidadeContrato" AS ENUM ('CUSTEIO', 'INVESTIMENTO', 'CAPITAL_GIRO');

-- CreateTable
CREATE TABLE "contratos_bancarios" (
    "id" TEXT NOT NULL,
    "propriedadeId" TEXT NOT NULL,
    "banco" TEXT NOT NULL,
    "tipoContrato" "TipoContratoBancario" NOT NULL,
    "saldoInicial" DECIMAL(18,2) NOT NULL,
    "saldoAtual" DECIMAL(18,2) NOT NULL,
    "taxaJuros" DECIMAL(8,4) NOT NULL,
    "tipoTaxa" "TipoTaxaBancaria" NOT NULL,
    "taxaAdicional" DECIMAL(8,4),
    "dataContratacao" TIMESTAMP(3) NOT NULL,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "sistemaAmortizacao" "SistemaAmortizacao" NOT NULL,
    "periodicidade" "PeriodicidadePagamento" NOT NULL,
    "finalidade" "FinalidadeContrato" NOT NULL,
    "moeda" "Currency" NOT NULL,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "contratos_bancarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcelas" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "dataPagamento" TIMESTAMP(3) NOT NULL,
    "valorPrincipal" DECIMAL(18,2) NOT NULL,
    "valorJuros" DECIMAL(18,2) NOT NULL,
    "valorTotal" DECIMAL(18,2) NOT NULL,
    "saldoDevedor" DECIMAL(18,2) NOT NULL,
    "pago" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "parcelas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contratos_bancarios_propriedadeId_ativo_idx" ON "contratos_bancarios"("propriedadeId", "ativo");

-- CreateIndex
CREATE INDEX "parcelas_contratoId_idx" ON "parcelas"("contratoId");

-- CreateIndex
CREATE UNIQUE INDEX "parcelas_contratoId_numero_key" ON "parcelas"("contratoId", "numero");

-- AddForeignKey
ALTER TABLE "contratos_bancarios" ADD CONSTRAINT "contratos_bancarios_propriedadeId_fkey" FOREIGN KEY ("propriedadeId") REFERENCES "propriedades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcelas" ADD CONSTRAINT "parcelas_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contratos_bancarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
