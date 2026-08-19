-- Bancos: regra de negócio pedida pelo cliente em 19/08/2026 —
-- (1) Tipo de Amortização limitado a SAC/PRICE (BULLET e JUROS_PERIODICOS saem
--     do enum; contratos legados são migrados preservando o formato do fluxo
--     de caixa via periodicidade FINAL);
-- (2) periodicidade única vira duas pernas independentes (Principal x Juros);
-- (3) novo campo ptaxInicial para os cenários Dólar Puro (USD) e Variação
--     Cambial (VC).

-- ── 1) ptaxInicial (nullable — só obrigatório via validação de aplicação
--       quando moeda=USD ou tipoTaxa=DOLAR_JUROS) ──────────────────────────
ALTER TABLE "contratos_bancarios" ADD COLUMN "ptaxInicial" DECIMAL(10,4);

-- ── 2) Novo enum PeriodicidadeLiquidacao (superset de PeriodicidadePagamento
--       + Bimestral/Quadrimestral/Final) ───────────────────────────────────
CREATE TYPE "PeriodicidadeLiquidacao" AS ENUM ('Mensal', 'Bimestral', 'Trimestral', 'Quadrimestral', 'Semestral', 'Anual', 'Final');

ALTER TABLE "contratos_bancarios" ADD COLUMN "periodicidadePrincipal" "PeriodicidadeLiquidacao";
ALTER TABLE "contratos_bancarios" ADD COLUMN "periodicidadeJuros" "PeriodicidadeLiquidacao";

-- Caso geral: contratos SAC/PRICE existentes tinham uma única periodicidade
-- para as duas pernas — os rótulos batem 1:1 (Mensal/Trimestral/Semestral/
-- Anual existem nos dois enums), então é uma cópia direta via cast de texto.
UPDATE "contratos_bancarios"
SET "periodicidadePrincipal" = "periodicidade"::text::"PeriodicidadeLiquidacao",
    "periodicidadeJuros" = "periodicidade"::text::"PeriodicidadeLiquidacao"
WHERE "sistemaAmortizacao" IN ('SAC', 'PRICE');

-- BULLET: tudo pago de uma vez no vencimento — replica-se com as duas pernas
-- em FINAL (principal + juros acumulados, um único evento).
UPDATE "contratos_bancarios"
SET "periodicidadePrincipal" = 'Final', "periodicidadeJuros" = 'Final'
WHERE "sistemaAmortizacao" = 'BULLET';

-- JUROS_PERIODICOS: juros pagos na periodicidade cadastrada, principal
-- integral só no vencimento — replica-se com Principal=Final e
-- Juros=periodicidade antiga.
UPDATE "contratos_bancarios"
SET "periodicidadePrincipal" = 'Final', "periodicidadeJuros" = "periodicidade"::text::"PeriodicidadeLiquidacao"
WHERE "sistemaAmortizacao" = 'JUROS_PERIODICOS';

ALTER TABLE "contratos_bancarios" ALTER COLUMN "periodicidadePrincipal" SET NOT NULL;
ALTER TABLE "contratos_bancarios" ALTER COLUMN "periodicidadeJuros" SET NOT NULL;

ALTER TABLE "contratos_bancarios" DROP COLUMN "periodicidade";
DROP TYPE "PeriodicidadePagamento";

-- ── 3) SistemaAmortizacao: converte os dados de BULLET/JUROS_PERIODICOS para
--       SAC/PRICE (a distinção deixa de existir matematicamente quando as
--       duas pernas são FINAL/perna de principal é FINAL) ANTES de restringir
--       o enum — não dá pra restringir o tipo com dado fora do domínio novo. ──
UPDATE "contratos_bancarios" SET "sistemaAmortizacao" = 'PRICE' WHERE "sistemaAmortizacao" = 'BULLET';
UPDATE "contratos_bancarios" SET "sistemaAmortizacao" = 'SAC' WHERE "sistemaAmortizacao" = 'JUROS_PERIODICOS';

CREATE TYPE "SistemaAmortizacao_new" AS ENUM ('SAC', 'PRICE');
ALTER TABLE "contratos_bancarios" ALTER COLUMN "sistemaAmortizacao" TYPE "SistemaAmortizacao_new" USING ("sistemaAmortizacao"::text::"SistemaAmortizacao_new");
DROP TYPE "SistemaAmortizacao";
ALTER TYPE "SistemaAmortizacao_new" RENAME TO "SistemaAmortizacao";
