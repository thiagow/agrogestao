-- CreateEnum
CREATE TYPE "DirecaoArrendamento" AS ENUM ('A_PAGAR', 'A_RECEBER');

-- AlterTable
ALTER TABLE "contratos_arrendamento" ADD COLUMN     "direcao" "DirecaoArrendamento" NOT NULL DEFAULT 'A_PAGAR';
