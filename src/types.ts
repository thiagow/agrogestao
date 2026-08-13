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
  comprovanteUrl?: string;
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

// ---- Cadastro Mestre: Bens e Direitos, Garantias, CAPEX, Grupo Econômico ----
// Design próprio (fonte AgroFlow não especifica campos para essas abas, exceto
// Bens e Direitos, que tem "campos estimados" replicados abaixo).

export type GrupoIrpfBem =
  | 'Bens Imóveis'
  | 'Bens Móveis'
  | 'Participações Societárias'
  | 'Aplicações e Investimentos'
  | 'Depósitos à Vista e Poupança'
  | 'Créditos e Outros Direitos'
  | 'Criptoativos'
  | 'Outros Bens e Direitos';

export type LiquidezBem = 'Alta' | 'Média' | 'Baixa';

export interface BemDireito {
  id: string;
  socioId?: string; // vazio = "Grupo (sem sócio específico)"
  socioNome?: string; // só leitura, resolvido no server pro join da tabela
  grupoIrpf: GrupoIrpfBem;
  codigoTipo: string; // ex: "18 — Imóvel Rural" (texto livre — ver nota em schema.prisma)
  descricao: string;
  valorDeclaradoIrpf?: number;
  valorMercadoEstimado?: number;
  dataAquisicao?: string; // YYYY-MM-DD
  valorAquisicao?: number;
  liquidez: LiquidezBem;
  ltv?: number; // 0-100
  elegivelGarantia: boolean;
  geraFluxoCaixa: boolean;
  observacoes?: string;
}

export interface Garantia {
  id: string;
  tipoAtivo: string; // texto livre — lista de opções ainda não confirmada, ver schema.prisma
  tipoGarantia: string; // idem
  descricao: string; // "Descrição do Ativo"
  bancoVinculado?: string;
  numeroOperacao?: string;
  valor: number;
  moeda: Currency;
  observacoes?: string;
}

export interface DividaPf {
  id: string;
  tipoDivida: string; // texto livre — ver nota em schema.prisma
  credor?: string;
  saldoDevedor: number;
  parcelaMensal?: number;
  vencimentoFinal?: string; // YYYY-MM-DD
  observacoes?: string;
}

export interface Capex {
  id: string;
  descricao: string;
  tipo: string; // texto livre — idem Garantia.tipoAtivo
  ano: number;
  valorPlanejado: number;
  valorExecutado: number;
  percentualFinanciamento?: number; // 0-100
  status: string; // texto livre — default "Planejado"
  observacoes?: string;
}

export interface PerfilGrupoEconomico {
  email?: string;
  telefone?: string;
  atividadePrincipal?: string;
  fundacao?: string; // YYYY-MM-DD
  sede?: string;
  consultorResponsavel?: string;
  historico?: string;
  sucessao?: string;
  modusOperandiAgricultura?: string;
  modusOperandiPecuaria?: string;
  empresasColigadas?: string;
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
// Réplica confirmada do formulário "Cadastrar Contrato Bancário" (print fotografado
// pelo usuário em 07/08/2026). Absorve o antigo "Tipo de Contrato" + "Finalidade" num
// único "Tipo de Operação".

export type TipoOperacaoBancaria =
  | 'CUSTEIO AGRICOLA'
  | 'CUSTEIO PECUARIO'
  | 'INVESTIMENTO'
  | 'CAPITAL DE GIRO'
  | 'CPR'
  | 'BARTER'
  | 'PRONAF'
  | 'PRONAMP'
  | 'FCO'
  | 'FNO'
  | 'FINAME'
  | 'OUTROS';

export type TipoTaxaBancaria = 'Pré-fixado (% a.a.)' | 'CDI + spread' | 'IPCA + spread' | 'Dólar + juros';

export type SistemaAmortizacao = 'SAC' | 'PRICE' | 'BULLET' | 'JUROS_PERIODICOS';

export type PeriodicidadePagamento = 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual';

export type BaseCalculoJuros = '252 dias úteis' | '360 dias corridos' | '365 dias corridos';

export type TipoCapitalizacao = 'Composta' | 'Simples';

export interface ContratoBancario {
  id: string;
  banco: string;
  nomeTomador?: string;
  numeroContrato?: string;
  tipoOperacao: TipoOperacaoBancaria;
  safraVinculadaId?: string;
  culturaVinculadaId?: string;
  saldoInicial: number; // "Valor Contratado" no print
  saldoAtual: number;
  // Taxa cheia quando tipoTaxa === 'Pré-fixado (% a.a.)'; spread sobre o
  // indexador nos demais casos. Ver src/lib/taxa-efetiva.ts.
  taxaJuros: number; // % a.a.
  tipoTaxa: TipoTaxaBancaria;
  baseCalculo: BaseCalculoJuros;
  capitalizacao: TipoCapitalizacao;
  sistemaAmortizacao: SistemaAmortizacao;
  periodicidade: PeriodicidadePagamento;
  possuiCarencia: boolean;
  dataContratacao: string; // YYYY-MM-DD
  inicioPagamento?: string; // YYYY-MM-DD
  dataVencimento: string; // YYYY-MM-DD
  tipoGarantia?: string;
  valorGarantia?: number;
  moeda: Currency;
  observacoes?: string;
  // Memória de cálculo do último cronograma gerado (ver src/lib/taxa-efetiva.ts).
  taxaEfetivaAplicada?: number; // % a.a. efetivamente usada
  indiceReferencia?: number; // valor do CDI/IPCA/USD aplicado
  indiceAtualizadoEm?: string; // YYYY-MM-DD
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
