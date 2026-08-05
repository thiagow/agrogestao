-- Remove campos que não existem no formulário real "Cadastrar Fornecedor" do AgroFlow
-- (print de 05/08/2026) — eram uma estimativa da doc de engenharia reversa, nunca
-- confirmada. Os 3 fornecedores existentes têm esses campos preenchidos só com dados de
-- demo/seed (prisma/seed.ts), não dados reais de cliente.
ALTER TABLE "suppliers" DROP COLUMN "cnpjCpf",
DROP COLUMN "contatoEmail",
DROP COLUMN "contatoNome",
DROP COLUMN "contatoTelefone";
