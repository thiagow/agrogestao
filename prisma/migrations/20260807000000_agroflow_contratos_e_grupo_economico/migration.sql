-- CATCH-UP DE DRIFT — reconstrói no histórico alterações que foram aplicadas
-- diretamente no banco de produção (provavelmente via `prisma db push`) sem
-- gerar migration, entre 07/08/2026 e 13/08/2026:
--
--   * reformulação do formulário "Cadastrar Contrato Bancário" do AgroFlow
--     (tipoContrato + finalidade → tipoOperacao; base de cálculo, capitalização,
--     carência, vínculo com safra/cultura, garantias, JUROS_PERIODICOS);
--   * campos extras de PerfilGrupoEconomico (modus operandi, sucessão,
--     empresas coligadas).
--
-- Em PRODUÇÃO esta migration NÃO é executada — o estado já está lá, e ela foi
-- registrada com `prisma migrate resolve --applied`. Ela existe para que um
-- banco novo (dev, staging, recuperação de desastre) reproduza produção ao
-- rodar `prisma migrate deploy`. Antes dela, replicar o histórico gerava um
-- `contratos_bancarios` sem tipoOperacao/baseCalculo/capitalizacao — um schema
-- que a aplicação não consegue usar.
--
-- SQL gerado por `prisma migrate diff --from-migrations --to-url <produção>`,
-- com uma correção manual documentada abaixo (tipoOperacao).

-- CreateEnum
CREATE TYPE "public"."BaseCalculoJuros" AS ENUM ('252_DIAS_UTEIS', '360_DIAS_CORRIDOS', '365_DIAS_CORRIDOS');

-- CreateEnum
CREATE TYPE "public"."TipoCapitalizacao" AS ENUM ('SIMPLES', 'COMPOSTA');

-- CreateEnum
CREATE TYPE "public"."TipoOperacaoBancaria" AS ENUM ('CUSTEIO_AGRICOLA', 'CUSTEIO_PECUARIO', 'INVESTIMENTO', 'CAPITAL_DE_GIRO', 'CPR', 'BARTER', 'PRONAF', 'PRONAMP', 'FCO', 'FNO', 'FINAME', 'OUTROS');

-- AlterEnum
ALTER TYPE "public"."SistemaAmortizacao" ADD VALUE 'JUROS_PERIODICOS';

-- AlterEnum
-- Troca completa do enum: os valores antigos (CDI, PRIME, PRÉ, FLUTUANTE) não
-- têm correspondência 1:1 com os novos. O cast via ::text só é avaliado se
-- houver linhas — num banco novo a tabela ainda está vazia neste ponto.
BEGIN;
CREATE TYPE "public"."TipoTaxaBancaria_new" AS ENUM ('PRÉ_FIXADO', 'CDI_SPREAD', 'IPCA_SPREAD', 'DÓLAR_JUROS');
ALTER TABLE "public"."contratos_bancarios" ALTER COLUMN "tipoTaxa" TYPE "public"."TipoTaxaBancaria_new" USING ("tipoTaxa"::text::"public"."TipoTaxaBancaria_new");
ALTER TYPE "public"."TipoTaxaBancaria" RENAME TO "TipoTaxaBancaria_old";
ALTER TYPE "public"."TipoTaxaBancaria_new" RENAME TO "TipoTaxaBancaria";
DROP TYPE "public"."TipoTaxaBancaria_old";
COMMIT;

-- AlterTable
ALTER TABLE "public"."contratos_bancarios" DROP COLUMN "finalidade",
DROP COLUMN "tipoContrato",
ADD COLUMN     "baseCalculo" "public"."BaseCalculoJuros" NOT NULL DEFAULT '360_DIAS_CORRIDOS',
ADD COLUMN     "capitalizacao" "public"."TipoCapitalizacao" NOT NULL DEFAULT 'COMPOSTA',
ADD COLUMN     "culturaVinculadaId" TEXT,
ADD COLUMN     "inicioPagamento" TIMESTAMP(3),
ADD COLUMN     "nomeTomador" TEXT,
ADD COLUMN     "numeroContrato" TEXT,
ADD COLUMN     "possuiCarencia" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "safraVinculadaId" TEXT,
ADD COLUMN     "tipoGarantia" TEXT,
ADD COLUMN     "valorGarantia" DECIMAL(18,2);

-- CORREÇÃO MANUAL sobre o SQL gerado: `tipoOperacao` é NOT NULL e o schema não
-- lhe dá @default, então o diff emitia um ADD COLUMN NOT NULL sem default, que
-- falha se a tabela tiver qualquer linha. Adicionamos com default e o
-- removemos em seguida: a coluna fica preenchida em linhas preexistentes e o
-- schema final é idêntico ao de produção (sem default).
ALTER TABLE "public"."contratos_bancarios"
ADD COLUMN     "tipoOperacao" "public"."TipoOperacaoBancaria" NOT NULL DEFAULT 'CUSTEIO_AGRICOLA';
ALTER TABLE "public"."contratos_bancarios" ALTER COLUMN "tipoOperacao" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."perfil_grupo_economico" ADD COLUMN     "empresasColigadas" TEXT,
ADD COLUMN     "modusOperandiAgricultura" TEXT,
ADD COLUMN     "modusOperandiPecuaria" TEXT,
ADD COLUMN     "sucessao" TEXT;

-- DropEnum
DROP TYPE "public"."FinalidadeContrato";

-- DropEnum
DROP TYPE "public"."TipoContratoBancario";

-- CreateIndex
CREATE INDEX "contratos_bancarios_culturaVinculadaId_idx" ON "public"."contratos_bancarios"("culturaVinculadaId" ASC);

-- CreateIndex
CREATE INDEX "contratos_bancarios_safraVinculadaId_idx" ON "public"."contratos_bancarios"("safraVinculadaId" ASC);

-- AddForeignKey
ALTER TABLE "public"."contratos_bancarios" ADD CONSTRAINT "contratos_bancarios_culturaVinculadaId_fkey" FOREIGN KEY ("culturaVinculadaId") REFERENCES "public"."culturas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contratos_bancarios" ADD CONSTRAINT "contratos_bancarios_safraVinculadaId_fkey" FOREIGN KEY ("safraVinculadaId") REFERENCES "public"."safras"("id") ON DELETE SET NULL ON UPDATE CASCADE;
