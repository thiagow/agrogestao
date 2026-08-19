-- Catch-up: `unidadeMedida` já existia em schema.prisma (Cultura) mas nunca tinha
-- sido criada de fato em produção via migration — drift pré-existente detectado
-- em 19/08/2026 durante a recuperação do incidente de perda de dados. Tabela
-- `culturas` está vazia neste momento (mesmo incidente), então não há backfill
-- necessário; o DEFAULT cobre qualquer linha futura sem valor explícito.
ALTER TABLE "culturas" ADD COLUMN "unidadeMedida" TEXT NOT NULL DEFAULT 'sc';
