-- Remove imageUrl de Supplier: não existe no formulário real "Cadastrar Fornecedor" do
-- AgroFlow (print de 05/08/2026). Os 3 fornecedores existentes só tinham dado de
-- demo/seed nesse campo. O "Gerador de Links de Imagem HTML" continua existindo na
-- Sidebar, mas como utilitário standalone, sem vínculo com Fornecedor.
ALTER TABLE "suppliers" DROP COLUMN "imageUrl";
