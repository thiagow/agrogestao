-- CreateEnum
CREATE TYPE "CategoriaItemFluxoManual" AS ENUM ('RECEITA_VENDA_FAZENDA', 'ESTOQUE_GRAOS_ENTRADA', 'ESTOQUE_ALGODAO_ENTRADA', 'ESTOQUE_GADO_ENTRADA', 'OUTRAS_ENTRADAS', 'DIVIDENDOS_RETIRADAS', 'MANUTENCAO_MAQUINAS', 'CORRECAO_SOLO', 'OUTRAS_SAIDAS');

-- CreateTable
CREATE TABLE "itens_fluxo_manual" (
    "id" TEXT NOT NULL,
    "propriedadeId" TEXT NOT NULL,
    "safra" TEXT NOT NULL,
    "categoria" "CategoriaItemFluxoManual" NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(18,2) NOT NULL,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "itens_fluxo_manual_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "itens_fluxo_manual_propriedadeId_safra_ativo_idx" ON "itens_fluxo_manual"("propriedadeId", "safra", "ativo");

-- AddForeignKey
ALTER TABLE "itens_fluxo_manual" ADD CONSTRAINT "itens_fluxo_manual_propriedadeId_fkey" FOREIGN KEY ("propriedadeId") REFERENCES "propriedades"("id") ON DELETE CASCADE ON UPDATE CASCADE;
