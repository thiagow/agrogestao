-- CreateEnum
CREATE TYPE "GrupoIrpfBem" AS ENUM ('Bens Imóveis', 'Bens Móveis', 'Participações Societárias', 'Aplicações e Investimentos', 'Depósitos à Vista e Poupança', 'Créditos e Outros Direitos', 'Criptoativos', 'Outros Bens e Direitos');

-- CreateEnum
CREATE TYPE "LiquidezBem" AS ENUM ('Alta', 'Média', 'Baixa');

-- AlterTable: adiciona colunas novas (grupoIrpf/codigoTipo nullable por ora, pra backfill das linhas existentes)
ALTER TABLE "bens_direitos"
  ADD COLUMN     "codigoTipo" TEXT,
  ADD COLUMN     "elegivelGarantia" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN     "geraFluxoCaixa" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN     "grupoIrpf" "GrupoIrpfBem",
  ADD COLUMN     "liquidez" "LiquidezBem" NOT NULL DEFAULT 'Baixa',
  ADD COLUMN     "ltv" DECIMAL(5,2),
  ADD COLUMN     "socioId" TEXT,
  ADD COLUMN     "valorAquisicao" DECIMAL(18,2),
  ADD COLUMN     "valorDeclaradoIrpf" DECIMAL(18,2),
  ADD COLUMN     "valorMercadoEstimado" DECIMAL(18,2),
  ALTER COLUMN "dataAquisicao" DROP NOT NULL;

-- Backfill das linhas existentes: mapeia o antigo enum "tipo" pro Grupo IRPF
-- mais próximo, usa o próprio rótulo como código/tipo provisório (texto
-- livre, sem tabela oficial de códigos — ver comentário em schema.prisma) e
-- carrega o valor contábil como valor declarado IRPF de partida.
UPDATE "bens_direitos" SET
  "grupoIrpf" = CASE "tipo"
    WHEN 'Imóvel' THEN 'Bens Imóveis'
    WHEN 'Veículo' THEN 'Bens Móveis'
    WHEN 'Equipamento' THEN 'Bens Móveis'
    ELSE 'Outros Bens e Direitos'
  END::"GrupoIrpfBem",
  "codigoTipo" = "tipo"::text,
  "valorDeclaradoIrpf" = "valorContabil";

-- AlterTable: agora que todas as linhas têm valor, torna as colunas obrigatórias
ALTER TABLE "bens_direitos"
  ALTER COLUMN "codigoTipo" SET NOT NULL,
  ALTER COLUMN "grupoIrpf" SET NOT NULL;

-- AlterTable: remove as colunas do modelo antigo
ALTER TABLE "bens_direitos"
  DROP COLUMN "depreciacaoAcumulada",
  DROP COLUMN "tipo",
  DROP COLUMN "valorContabil";

-- DropEnum
DROP TYPE "BemTipo";

-- CreateIndex
CREATE INDEX "bens_direitos_socioId_idx" ON "bens_direitos"("socioId");

-- AddForeignKey
ALTER TABLE "bens_direitos" ADD CONSTRAINT "bens_direitos_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "socios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
