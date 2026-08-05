/*
  Warnings:

  - You are about to drop the `empresas_pj` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "empresas_pj" DROP CONSTRAINT "empresas_pj_contaId_fkey";

-- DropTable
DROP TABLE "empresas_pj";
