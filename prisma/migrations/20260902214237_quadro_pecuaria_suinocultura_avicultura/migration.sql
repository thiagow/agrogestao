-- CreateEnum
CREATE TYPE "TipoProducaoAnimal" AS ENUM ('Avicultura', 'Suinocultura');

-- CreateTable
CREATE TABLE "quadro_pecuaria_bovina" (
    "id" TEXT NOT NULL,
    "propriedadeId" TEXT NOT NULL,
    "anoCivil" INTEGER NOT NULL,
    "femeas0a12" INTEGER NOT NULL DEFAULT 0,
    "femeas12a24" INTEGER NOT NULL DEFAULT 0,
    "femeas24a36" INTEGER NOT NULL DEFAULT 0,
    "femeasAcima36" INTEGER NOT NULL DEFAULT 0,
    "machos0a12" INTEGER NOT NULL DEFAULT 0,
    "machos12a24" INTEGER NOT NULL DEFAULT 0,
    "machos24a36" INTEGER NOT NULL DEFAULT 0,
    "machosAcima36" INTEGER NOT NULL DEFAULT 0,
    "cicloProdutivo" TEXT NOT NULL,
    "areaPastagemPropria" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "areaPastagemArrendada" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tipoTerminacao" TEXT NOT NULL,
    "custoAquisicaoPorCabeca" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "custoPastagemPorHectare" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "diariaConfinamento" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "diasConfinamento" INTEGER NOT NULL DEFAULT 0,
    "qtdAnimaisConfinados" INTEGER NOT NULL DEFAULT 0,
    "qtdMachosComercializados" INTEGER NOT NULL DEFAULT 0,
    "pesoMedioMachos" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "precoMedioMachos" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "qtdFemeasComercializadas" INTEGER NOT NULL DEFAULT 0,
    "pesoMedioFemeas" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "precoMedioFemeas" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "qtdOutrasComercializadas" INTEGER NOT NULL DEFAULT 0,
    "pesoMedioOutras" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "precoMedioOutras" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "capacidadeLotacaoConfinamento" INTEGER NOT NULL DEFAULT 0,
    "ganhoPesoMedioDiarioKg" DECIMAL(6,3) NOT NULL DEFAULT 0,
    "diasConfinamentoPorLote" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "quadro_pecuaria_bovina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quadro_producao_animal" (
    "id" TEXT NOT NULL,
    "propriedadeId" TEXT NOT NULL,
    "tipo" "TipoProducaoAnimal" NOT NULL,
    "anoCivil" INTEGER NOT NULL,
    "producaoCabecas" INTEGER NOT NULL DEFAULT 0,
    "precoMedioPorCabeca" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "custoMedioPorCabeca" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "quadro_producao_animal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quadro_pecuaria_bovina_propriedadeId_ativo_idx" ON "quadro_pecuaria_bovina"("propriedadeId", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "quadro_pecuaria_bovina_propriedadeId_anoCivil_key" ON "quadro_pecuaria_bovina"("propriedadeId", "anoCivil");

-- CreateIndex
CREATE INDEX "quadro_producao_animal_propriedadeId_ativo_idx" ON "quadro_producao_animal"("propriedadeId", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "quadro_producao_animal_propriedadeId_tipo_anoCivil_key" ON "quadro_producao_animal"("propriedadeId", "tipo", "anoCivil");

-- AddForeignKey
ALTER TABLE "quadro_pecuaria_bovina" ADD CONSTRAINT "quadro_pecuaria_bovina_propriedadeId_fkey" FOREIGN KEY ("propriedadeId") REFERENCES "propriedades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quadro_producao_animal" ADD CONSTRAINT "quadro_producao_animal_propriedadeId_fkey" FOREIGN KEY ("propriedadeId") REFERENCES "propriedades"("id") ON DELETE CASCADE ON UPDATE CASCADE;
