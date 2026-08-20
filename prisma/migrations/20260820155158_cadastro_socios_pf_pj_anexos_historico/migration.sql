-- CreateEnum
CREATE TYPE "TipoPessoa" AS ENUM ('PF', 'PJ');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "GrupoIrpfBem" ADD VALUE 'Imóveis Rurais - ANEXO A';
ALTER TYPE "GrupoIrpfBem" ADD VALUE 'Imóveis Urbanos - ANEXO B';

-- AlterTable
ALTER TABLE "perfil_grupo_economico" DROP COLUMN "historico",
DROP COLUMN "modusOperandiAgricultura",
DROP COLUMN "modusOperandiPecuaria",
DROP COLUMN "sucessao",
ADD COLUMN     "agriculturaCapacidadeArmazenamento" TEXT,
ADD COLUMN     "agriculturaCronogramaPlantioColheita" TEXT,
ADD COLUMN     "agriculturaCustos" TEXT,
ADD COLUMN     "agriculturaExportacao" TEXT,
ADD COLUMN     "agriculturaFornecedoresClientes" TEXT,
ADD COLUMN     "agriculturaModalidadesCompra" TEXT,
ADD COLUMN     "financeiroFinanciamentos" TEXT,
ADD COLUMN     "financeiroPoliticaHedge" TEXT,
ADD COLUMN     "financeiroPosicaoComercializadaSafraAtual" TEXT,
ADD COLUMN     "gestaoAdministracao" TEXT,
ADD COLUMN     "gestaoDivisaoCustosFaturamento" TEXT,
ADD COLUMN     "gestaoParceriasSocios" TEXT,
ADD COLUMN     "gestaoPlanoSucessorioHerdeiros" TEXT,
ADD COLUMN     "historicoEvolucaoNegocio" TEXT,
ADD COLUMN     "historicoGestaoCrises" TEXT,
ADD COLUMN     "historicoHerancaOrigem" TEXT,
ADD COLUMN     "historicoInicio" TEXT,
ADD COLUMN     "missao" TEXT,
ADD COLUMN     "pecuariaCicloProducao" TEXT,
ADD COLUMN     "pecuariaConfinamento" TEXT,
ADD COLUMN     "pecuariaCustosCronogramaCompraAbate" TEXT,
ADD COLUMN     "pecuariaTaxaDesfrutePercent" DECIMAL(5,2),
ADD COLUMN     "valores" TEXT,
ADD COLUMN     "visao" TEXT;

-- AlterTable
ALTER TABLE "socios" ADD COLUMN     "cargoOuAtividade" TEXT,
ADD COLUMN     "cnpj" TEXT,
ADD COLUMN     "tipoPessoa" "TipoPessoa" NOT NULL DEFAULT 'PF',
ALTER COLUMN "cpf" DROP NOT NULL;

-- CreateTable
CREATE TABLE "participacoes_societarias" (
    "id" TEXT NOT NULL,
    "socioPjId" TEXT NOT NULL,
    "socioPfId" TEXT NOT NULL,
    "percentual" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participacoes_societarias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalhes_imovel_rural" (
    "id" TEXT NOT NULL,
    "bemDireitoId" TEXT NOT NULL,
    "denominacaoImovel" TEXT NOT NULL,
    "municipioUf" TEXT NOT NULL,
    "matricula" TEXT,
    "areaHa" DOUBLE PRECISION NOT NULL,
    "areaPropriaPlantadaHa" DOUBLE PRECISION,
    "areaReservasPastagensOutrosHa" DOUBLE PRECISION,
    "valorMercadoHa" DECIMAL(18,2),
    "situacaoCredor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "detalhes_imovel_rural_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalhes_imovel_urbano" (
    "id" TEXT NOT NULL,
    "bemDireitoId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "matricula" TEXT,
    "cidade" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "detalhes_imovel_urbano_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "participacoes_societarias_socioPjId_idx" ON "participacoes_societarias"("socioPjId");

-- CreateIndex
CREATE INDEX "participacoes_societarias_socioPfId_idx" ON "participacoes_societarias"("socioPfId");

-- CreateIndex
CREATE UNIQUE INDEX "participacoes_societarias_socioPjId_socioPfId_key" ON "participacoes_societarias"("socioPjId", "socioPfId");

-- CreateIndex
CREATE UNIQUE INDEX "detalhes_imovel_rural_bemDireitoId_key" ON "detalhes_imovel_rural"("bemDireitoId");

-- CreateIndex
CREATE UNIQUE INDEX "detalhes_imovel_urbano_bemDireitoId_key" ON "detalhes_imovel_urbano"("bemDireitoId");

-- CreateIndex
CREATE UNIQUE INDEX "socios_contaId_cnpj_key" ON "socios"("contaId", "cnpj");

-- AddForeignKey
ALTER TABLE "participacoes_societarias" ADD CONSTRAINT "participacoes_societarias_socioPjId_fkey" FOREIGN KEY ("socioPjId") REFERENCES "socios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participacoes_societarias" ADD CONSTRAINT "participacoes_societarias_socioPfId_fkey" FOREIGN KEY ("socioPfId") REFERENCES "socios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalhes_imovel_rural" ADD CONSTRAINT "detalhes_imovel_rural_bemDireitoId_fkey" FOREIGN KEY ("bemDireitoId") REFERENCES "bens_direitos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalhes_imovel_urbano" ADD CONSTRAINT "detalhes_imovel_urbano_bemDireitoId_fkey" FOREIGN KEY ("bemDireitoId") REFERENCES "bens_direitos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

