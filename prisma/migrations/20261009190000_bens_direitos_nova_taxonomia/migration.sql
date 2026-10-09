-- Validação do cliente (09/10/2026): a lista "Bem / Direito" substitui a taxonomia IRPF.
-- Troca o enum por um novo tipo, convertendo as linhas existentes via USING (um valor
-- novo de enum não pode ser usado na mesma transação em que é adicionado, então não dá
-- pra fazer ADD VALUE + UPDATE).
--
-- De-para dos valores antigos:
--   Imóveis Rurais/Urbanos (ANEXO A/B)         -> iguais
--   Bens Imóveis (genérico, sem detalhe A/B)    -> Benfeitorias e Instalações
--   Bens Móveis                                 -> Máquinas Agrícolas
--   Participações Societárias                   -> igual
--   Aplicações e Investimentos / Depósitos à Vista e Poupança / Criptoativos
--                                               -> Disponibilidade e aplicações
--   Créditos e Outros Direitos                  -> Contas a receber
--   Outros Bens e Direitos                      -> Direitos e bens diversos

CREATE TYPE "GrupoIrpfBem_novo" AS ENUM (
  'Imóveis Rurais - ANEXO A',
  'Imóveis Urbanos - ANEXO B',
  'Benfeitorias e Instalações',
  'Máquinas Agrícolas',
  'Implementos',
  'Veículos',
  'Estoque (Insumos e Grãos)',
  'Participações Societárias',
  'Disponibilidade e aplicações',
  'Contas a receber',
  'Direitos e bens diversos'
);

ALTER TABLE "bens_direitos" ALTER COLUMN "grupoIrpf" TYPE "GrupoIrpfBem_novo"
USING (
  CASE "grupoIrpf"::text
    WHEN 'Imóveis Rurais - ANEXO A' THEN 'Imóveis Rurais - ANEXO A'
    WHEN 'Imóveis Urbanos - ANEXO B' THEN 'Imóveis Urbanos - ANEXO B'
    WHEN 'Bens Imóveis' THEN 'Benfeitorias e Instalações'
    WHEN 'Bens Móveis' THEN 'Máquinas Agrícolas'
    WHEN 'Participações Societárias' THEN 'Participações Societárias'
    WHEN 'Aplicações e Investimentos' THEN 'Disponibilidade e aplicações'
    WHEN 'Depósitos à Vista e Poupança' THEN 'Disponibilidade e aplicações'
    WHEN 'Criptoativos' THEN 'Disponibilidade e aplicações'
    WHEN 'Créditos e Outros Direitos' THEN 'Contas a receber'
    ELSE 'Direitos e bens diversos'
  END
)::"GrupoIrpfBem_novo";

DROP TYPE "GrupoIrpfBem";
ALTER TYPE "GrupoIrpfBem_novo" RENAME TO "GrupoIrpfBem";

ALTER TABLE "bens_direitos" ALTER COLUMN "codigoTipo" DROP NOT NULL;
