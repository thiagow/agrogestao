-- CreateTable
CREATE TABLE "quadro_safra" (
    "id" TEXT NOT NULL,
    "propriedadeId" TEXT NOT NULL,
    "cultura" TEXT NOT NULL,
    "anoSafra" TEXT NOT NULL,
    "hectares" DOUBLE PRECISION NOT NULL,
    "haPropria" DOUBLE PRECISION NOT NULL,
    "haArrendada" DOUBLE PRECISION NOT NULL,
    "rendimento" DECIMAL(12,4) NOT NULL,
    "unidadeProducao" TEXT NOT NULL,
    "precoMedio" DECIMAL(18,2) NOT NULL,
    "despesa" DECIMAL(18,2) NOT NULL,
    "producaoFixadaPercent" DECIMAL(5,2),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "quadro_safra_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quadro_safra_propriedadeId_ativo_idx" ON "quadro_safra"("propriedadeId", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "quadro_safra_propriedadeId_cultura_anoSafra_key" ON "quadro_safra"("propriedadeId", "cultura", "anoSafra");

-- AddForeignKey
ALTER TABLE "quadro_safra" ADD CONSTRAINT "quadro_safra_propriedadeId_fkey" FOREIGN KEY ("propriedadeId") REFERENCES "propriedades"("id") ON DELETE CASCADE ON UPDATE CASCADE;
