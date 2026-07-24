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

export interface CompraFornecedor {
  id: string;
  data: string; // YYYY-MM-DD
  valor: number;
  descricao: string;
  culturaReferencia?: string;
}

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
  cnpjCpf?: string;
  contatoNome?: string;
  contatoTelefone?: string;
  contatoEmail?: string;
  compras?: CompraFornecedor[];
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

// ---- Cadastro Mestre: Sócios ----

export type EstadoCivil = 'Solteiro' | 'Casado' | 'Viúvo' | 'Divorciado' | 'Separado';

export interface Socio {
  id: string;
  nome: string;
  cpf: string;
  participacao: number; // 0-100
  estadoCivil?: EstadoCivil;
  telefone?: string;
  email?: string;
  nacionalidade?: string;
  dataNascimento?: string; // YYYY-MM-DD
}

// ---- Quadro de Safra / Resumo: Cultura x Ano-Safra ----

export interface CulturaSafraAno {
  id: string;
  cultura: string;
  anoSafra: string; // "2026/2027"
  hectares: number;
  haPropria: number;
  haArrendada: number;
  rendimento: number; // unidade/ha (sc, kg, @ conforme a cultura)
  unidadeProducao: string; // "sc", "kg", "@", "ton"
  precoMedio: number; // R$ por unidade de produção
  despesa: number; // R$
  producaoFixadaPercent?: number; // % da produção já fixada em contrato
}

// ---- Bancos e Financiamentos: Contrato Bancário ----

export type TipoContratoBancario = 'CUSTEO' | 'CPR' | 'FINANCIAMENTO' | 'CREDIARIO';
export type TipoTaxaBancaria = 'CDI' | 'PRIME' | 'PRÉ' | 'FLUTUANTE';
export type SistemaAmortizacao = 'SAC' | 'PRICE' | 'BULLET';
export type PeriodicidadePagamento = 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual';
export type FinalidadeContrato = 'CUSTEIO' | 'INVESTIMENTO' | 'CAPITAL_GIRO';

export interface ContratoBancario {
  id: string;
  banco: string;
  tipoContrato: TipoContratoBancario;
  saldoInicial: number;
  saldoAtual: number;
  taxaJuros: number; // % a.a.
  tipoTaxa: TipoTaxaBancaria;
  taxaAdicional?: number; // % a.a., só relevante quando tipoTaxa === 'CDI'
  dataContratacao: string; // YYYY-MM-DD
  dataVencimento: string; // YYYY-MM-DD
  sistemaAmortizacao: SistemaAmortizacao;
  periodicidade: PeriodicidadePagamento;
  finalidade: FinalidadeContrato;
  moeda: Currency;
  observacoes?: string;
}

// ---- Análise Financeira ----

export interface BalancoPatrimonial {
  safra: string; // "2026/2027"
  ativoCirculante: number;
  ativoNaoCirculante: number;
  passivoCirculante: number;
  passivoNaoCirculante: number;
  capitalReservas: number;
  resultadoSafra: number;
}

export type StatusIndicador = 'Excelente' | 'Bom' | 'Atenção' | 'Crítico';

export interface IndicadorFinanceiro {
  id: string;
  grupo: 'Liquidez' | 'Estrutura de Capital';
  nome: string;
  valor: number;
  unidade: string; // "", "%", "x"
  status: StatusIndicador;
  formula: string;
  referencia: string;
}

export interface IndicadorSaudeFinanceira {
  dimensao: string; // Liquidez, Solvência, Eficiência, Rentabilidade, Endividamento, Cobertura
  valor: number; // 0-100
}

// ---- Demais módulos (mocks já existentes) ----

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
