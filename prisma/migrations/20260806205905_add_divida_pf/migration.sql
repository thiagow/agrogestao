-- CreateTable
CREATE TABLE "dividas_pf" (
    "id" TEXT NOT NULL,
    "contaId" TEXT NOT NULL,
    "tipoDivida" TEXT NOT NULL,
    "credor" TEXT,
    "saldoDevedor" DECIMAL(18,2) NOT NULL,
    "parcelaMensal" DECIMAL(18,2),
    "vencimentoFinal" TIMESTAMP(3),
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "dividas_pf_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dividas_pf_contaId_ativo_idx" ON "dividas_pf"("contaId", "ativo");

-- AddForeignKey
ALTER TABLE "dividas_pf" ADD CONSTRAINT "dividas_pf_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "contas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
