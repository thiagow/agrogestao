-- CreateEnum
CREATE TYPE "CategoriaLancamentoMensal" AS ENUM ('CUSTEIO_AGRICOLA', 'INSUMOS', 'MAO_DE_OBRA', 'ARRENDAMENTO_PAGO', 'PARCELA_BANCARIA', 'AQUISICAO_MAQUINAS', 'AQUISICAO_FAZENDA', 'DESPESAS_ADMINISTRATIVAS', 'IMPOSTOS_TAXAS', 'FRETE_LOGISTICA', 'OUTRAS_DESPESAS', 'VENDA_GRAOS', 'VENDA_GADO', 'VENDA_ALGODAO', 'RECEBIMENTO_CPR', 'ARRENDAMENTO_RECEBIDO', 'DIVIDENDOS_DISTRIBUICAO', 'SUBVENCAO_PREMIO_SEGURO', 'OUTRAS_RECEITAS');

-- CreateTable
CREATE TABLE "lancamentos_manuais_mensais" (
    "id" TEXT NOT NULL,
    "propriedadeId" TEXT NOT NULL,
    "mes" INTEGER NOT NULL,
    "ano" INTEGER NOT NULL,
    "categoria" "CategoriaLancamentoMensal" NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(18,2) NOT NULL,
    "culturaId" TEXT,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "lancamentos_manuais_mensais_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lancamentos_manuais_mensais_propriedadeId_ano_mes_ativo_idx" ON "lancamentos_manuais_mensais"("propriedadeId", "ano", "mes", "ativo");

-- AddForeignKey
ALTER TABLE "lancamentos_manuais_mensais" ADD CONSTRAINT "lancamentos_manuais_mensais_propriedadeId_fkey" FOREIGN KEY ("propriedadeId") REFERENCES "propriedades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lancamentos_manuais_mensais" ADD CONSTRAINT "lancamentos_manuais_mensais_culturaId_fkey" FOREIGN KEY ("culturaId") REFERENCES "culturas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
