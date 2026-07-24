export type Category = 
  | 'FERTILIZANTES'
  | 'DEFENSIVOS'
  | 'SEMENTES'
  | 'MAQUINÁRIOS'
  | 'COMBUSTÍVEL'
  | 'SERVIÇOS'
  | 'OUTROS';

export type Currency = 'BRL' | 'USD';

export type Status = 'PENDENTE' | 'PAGO' | 'VENCIDO';

export type TermClassification = 'CP' | 'LP';

export interface Supplier {
  id: string;
  nome: string;
  categoria: Category;
  cultura: string;
  safra: string;
  dividaTotal: number;
  moeda: Currency;
  vencimento: string; // YYYY-MM-DD
  observacoes?: string;
  status: Status;
  imageUrl?: string;
  comprovanteUrl?: string;
}

export type ActiveTab =
  | 'resumo'
  | 'cadastro_mestre'
  | 'quadro_safra'
  | 'bancos'
  | 'fornecedores'
  | 'aquisicao_fazenda'
  | 'arrendamentos'
  | 'comercializacao'
  | 'balanco_pj'
  | 'fluxo_safra'
  | 'cotacoes'
  | 'analise_financeira'
  | 'fluxo_mensal'
  | 'apresentacao_grupo';

export interface BankAccount {
  id: string;
  banco: string;
  agencia: string;
  conta: string;
  saldo: number;
  limiteCredito: number;
  taxaJuros: string;
  moeda: Currency;
}

export interface CropSeason {
  id: string;
  fazenda: string;
  cultura: string;
  safra: string;
  areaHectares: number;
  produtividadeEsperada: number; // sacas/ha
  custoTotal: number;
  status: 'EM_PLANTIO' | 'DESENVOLVIMENTO' | 'COLHEITA' | 'FINALIZADO';
}

export interface LandLease {
  id: string;
  proprietario: string;
  fazenda: string;
  areaHa: number;
  valorSacasHa: number;
  vencimento: string;
  status: 'EM_DIA' | 'PENDENTE';
}

export interface CommodityContract {
  id: string;
  comprador: string;
  produto: string;
  safra: string;
  quantidadeSacas: number;
  precoSaca: number;
  valorTotal: number;
  dataEntrega: string;
  status: 'ABERTO' | 'ENTREGUE' | 'PARCIAL';
}

export interface CommodityQuote {
  produto: string;
  praca: string;
  precoAtual: number;
  variacao: number;
  unidade: string;
  atualizacao: string;
}
