-- CreateEnum
CREATE TYPE "BemTipo" AS ENUM ('Imóvel', 'Veículo', 'Equipamento', 'Outros');

-- CreateEnum
CREATE TYPE "GarantiaTipo" AS ENUM ('Imóvel', 'Aval', 'Penhor', 'Alienação Fiduciária', 'Outros');

-- CreateEnum
CREATE TYPE "CapexCategoria" AS ENUM ('Maquinário', 'Benfeitoria', 'Tecnologia', 'Infraestrutura', 'Outros');

-- CreateEnum
CREATE TYPE "TipoRelacaoEmpresa" AS ENUM ('Controladora', 'Controlada', 'Coligada', 'Outras');

-- CreateTable
CREATE TABLE "bens_direitos" (
    "id" TEXT NOT NULL,
    "contaId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo" "BemTipo" NOT NULL,
    "valorContabil" DECIMAL(18,2) NOT NULL,
    "dataAquisicao" TIMESTAMP(3) NOT NULL,
    "depreciacaoAcumulada" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "bens_direitos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "garantias" (
    "id" TEXT NOT NULL,
    "contaId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo" "GarantiaTipo" NOT NULL,
    "valor" DECIMAL(18,2) NOT NULL,
    "contratoBancarioId" TEXT,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "garantias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capex" (
    "id" TEXT NOT NULL,
    "contaId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" "CapexCategoria" NOT NULL,
    "valor" DECIMAL(18,2) NOT NULL,
    "dataInvestimento" TIMESTAMP(3) NOT NULL,
    "safra" TEXT,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "capex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empresas_grupo" (
    "id" TEXT NOT NULL,
    "contaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "tipoRelacao" "TipoRelacaoEmpresa" NOT NULL,
    "participacaoPercentual" DECIMAL(5,2),
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "empresas_grupo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bens_direitos_contaId_ativo_idx" ON "bens_direitos"("contaId", "ativo");

-- CreateIndex
CREATE INDEX "garantias_contaId_ativo_idx" ON "garantias"("contaId", "ativo");

-- CreateIndex
CREATE INDEX "capex_contaId_ativo_idx" ON "capex"("contaId", "ativo");

-- CreateIndex
CREATE INDEX "empresas_grupo_contaId_ativo_idx" ON "empresas_grupo"("contaId", "ativo");

-- AddForeignKey
ALTER TABLE "bens_direitos" ADD CONSTRAINT "bens_direitos_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "contas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garantias" ADD CONSTRAINT "garantias_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "contas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garantias" ADD CONSTRAINT "garantias_contratoBancarioId_fkey" FOREIGN KEY ("contratoBancarioId") REFERENCES "contratos_bancarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capex" ADD CONSTRAINT "capex_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "contas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresas_grupo" ADD CONSTRAINT "empresas_grupo_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "contas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
