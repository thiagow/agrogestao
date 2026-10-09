-- Validação do cliente (09/10/2026): Tipo de Empresa (Holding/Operacional), fim da %
-- "no grupo" e dono genérico (PF ou PJ) no cap table.
-- ATENÇÃO: o SQL auto-gerado pelo Prisma faria DROP COLUMN "socioPfId" + ADD COLUMN
-- "socioDonoId" NOT NULL, destruindo as linhas existentes. Aqui é RENAME, que preserva
-- todos os dados (o conteúdo da coluna já são ids de Socio).

-- CreateEnum
CREATE TYPE "TipoEmpresa" AS ENUM ('Holding', 'Empresa Operacional');

-- AlterTable
ALTER TABLE "socios" ADD COLUMN "tipoEmpresa" "TipoEmpresa",
ALTER COLUMN "participacao" DROP NOT NULL;

-- Rename (preserva dados) + nomes de índice/constraint alinhados ao que o Prisma espera
ALTER TABLE "participacoes_societarias" RENAME COLUMN "socioPfId" TO "socioDonoId";
ALTER TABLE "participacoes_societarias" RENAME CONSTRAINT "participacoes_societarias_socioPfId_fkey" TO "participacoes_societarias_socioDonoId_fkey";
ALTER INDEX "participacoes_societarias_socioPfId_idx" RENAME TO "participacoes_societarias_socioDonoId_idx";
ALTER INDEX "participacoes_societarias_socioPjId_socioPfId_key" RENAME TO "participacoes_societarias_socioPjId_socioDonoId_key";
