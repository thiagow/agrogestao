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

// ---- Aquisição de Fazendas ----

export interface Aquisicao {
  id: string;
  nomeFazenda: string;
  localizacao: string;
  areaHectares: number;
  valorTotal: number;
  dataAquisicao: string; // YYYY-MM-DD
  dataOcupacao?: string;
  culturaPrincipal?: string;
  safraInicio: string; // "2026/2027"
  safraFim: string; // "2029/2030"
  valorTotalFluxo: number; // fluxo de pagamento total previsto
  totalSacas: number; // produção estimada total no período
}

// ---- Arrendamentos ----

export type PeriodicidadeArrendamento = 'Anual' | 'Mensal' | 'Por Safra';
export type StatusArrendamento = 'ATIVO' | 'ENCERRADO';

export interface ContratoArrendamento {
  id: string;
  nomePropriedade: string;
  localizacao: string;
  proprietarioNome: string;
  proprietarioCpfCnpj: string;
  areaHectares: number;
  culturaPrincipal: string;
  custoAnualHectare: number; // R$/ha/ano (ou sacas/ha convertido)
  sacasPorHectare?: number;
  dataInicio: string;
  dataFim: string;
  periodicidade: PeriodicidadeArrendamento;
  renovavel: boolean;
  status: StatusArrendamento;
  safraInicio: string;
  safraFim: string;
  observacoes?: string;
}

// ---- Comercialização (Futuros/Hedge) ----

export type TipoContratoComercial = 'FUTURO' | 'VENDA_A_TERMO' | 'HEDGE_CALL' | 'HEDGE_PUT';
export type StatusContratoComercial = 'ATIVO' | 'LIQUIDADO' | 'CANCELADO';

export interface ContratoComercial {
  id: string;
  cultura: string;
  safra: string;
  quantidadeSc: number;
  precoFixado: number;
  tipoContrato: TipoContratoComercial;
  dataContrato: string;
  dataVencimento: string;
  status: StatusContratoComercial;
  compradorNome?: string;
  observacoes?: string;
}

export interface PosicaoComercializacao {
  cultura: string;
  producaoTotalSc: number;
  cotacaoAtual: number; // R$/sc
}

// ---- Balanço PJ ----

export interface EmpresaBalanco {
  id: string;
  empresa: string;
  safra: string;
  ativoCirculante: number;
  ativoNaoCirculante: number;
  passivoCirculante: number;
  passivoNaoCirculante: number;
  capitalReservas: number;
  receitaBruta: number;
  custos: number;
  despesasOperacionais: number;
}

// ---- Fluxo de Safra Projetado ----

export interface FluxoSafraItem {
  id: string;
  tipo: 'ENTRADA' | 'SAIDA';
  categoria: string;
  descricao: string;
  valor: number;
}

// ---- Cotações de Mercado ----

export type Bolsa = 'CBOT' | 'CME' | 'ICE' | 'B3' | 'PTAX';

export interface Cotacao {
  id: string;
  commodity: string;
  bolsa: Bolsa;
  ticker: string;
  precoUsd?: number;
  precoBrl: number;
  unidade: string;
  variacaoPercentual: number;
  maxima: number;
  minima: number;
  volume: number;
  precoDefinidoSafra?: number;
  atualizadoEm: string; // HH:MM:SS
}

// ---- Fluxo de Caixa Mensal ----

export type TipoLancamentoMensal = 'ENTRADA' | 'SAIDA' | 'ESTIMADO';

export interface LancamentoMensal {
  id: string;
  cultura: string;
  mes: number; // 1-12
  tipo: TipoLancamentoMensal;
  categoria: string;
  valor: number;
  descricao?: string;
}

export interface CalendarioAgricolaEtapa {
  cultura: string;
  mesesPlantioColheita: number[]; // 1-12, etapa de plantio/colheita
  mesesDesenvolvimento: number[]; // 1-12, etapa de desenvolvimento/crescimento
}
