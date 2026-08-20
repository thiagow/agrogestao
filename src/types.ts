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

export type UnidadeMedida = 'sc' | '@' | 'kg' | 't' | 'm³';

export interface Cultura {
  id: string;
  nome: string;
  unidadeMedida: UnidadeMedida;
  contaId: string | null; // null = padrão (global, não editável)
}

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

// ---- Cadastro: Sócios e Empresas ----

export type EstadoCivil = 'Solteiro' | 'Casado' | 'Viúvo' | 'Divorciado' | 'Separado';
export type TipoPessoa = 'PF' | 'PJ';

// Cap table de uma empresa (Socio tipoPessoa=PJ) — cada linha é "este PF possui X%
// desta PJ". Concepto separado de Socio.participacao (que é a % no GRUPO
// ECONÔMICO como um todo, usada em src/lib/patrimonio.ts) — os dois nunca se
// somam nem se substituem (decisão registrada em 20/08/2026).
export interface ParticipacaoSocietaria {
  id?: string; // ausente numa linha ainda não salva no formulário
  socioPfId: string;
  socioPfNome?: string; // só leitura, resolvido no server
  percentual: number; // 0-100
}

export interface Socio {
  id: string;
  tipoPessoa: TipoPessoa;
  nome: string; // "Nome Completo" (PF) / "Razão Social" (PJ)
  cpf?: string; // só PF
  cnpj?: string; // só PJ
  cargoOuAtividade?: string; // "Cargo" (PF) / "Atividade Principal" (PJ)
  participacao: number; // 0-100, % no grupo econômico
  estadoCivil?: EstadoCivil; // só PF
  telefone?: string;
  email?: string;
  nacionalidade?: string; // "Nacionalidade" (PF) / "Cidade/UF" (PJ)
  dataNascimento?: string; // YYYY-MM-DD — "Data de Nascimento" (PF) / "Data de Fundação" (PJ)
  participacoes?: ParticipacaoSocietaria[]; // só PJ — cap table da empresa
}

// ---- Cadastro: Bens e Direitos, Garantias, CAPEX, Grupo Econômico ----
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
  | 'Outros Bens e Direitos'
  | 'Imóveis Rurais - ANEXO A'
  | 'Imóveis Urbanos - ANEXO B';

export type LiquidezBem = 'Alta' | 'Média' | 'Baixa';

// Detalhe do ANEXO A (grupoIrpf='Imóveis Rurais - ANEXO A'). "Valor de Mercado
// Total (R$)" da spec é BemDireito.valorMercadoEstimado (=areaHa × valorMercadoHa,
// calculado ao vivo no formulário) — não duplicado aqui.
export interface DetalheImovelRural {
  denominacaoImovel: string;
  municipioUf: string;
  matricula?: string;
  areaHa: number;
  areaPropriaPlantadaHa?: number;
  areaReservasPastagensOutrosHa?: number;
  valorMercadoHa?: number;
  situacaoCredor?: string;
}

// Detalhe do ANEXO B (grupoIrpf='Imóveis Urbanos - ANEXO B'). "Valor Atual (R$)"
// da spec é BemDireito.valorMercadoEstimado.
export interface DetalheImovelUrbano {
  descricao: string;
  matricula?: string;
  cidade: string;
}

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
  detalheImovelRural?: DetalheImovelRural; // só quando grupoIrpf = ANEXO A
  detalheImovelUrbano?: DetalheImovelUrbano; // só quando grupoIrpf = ANEXO B
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

// "Histórico do Grupo" reestruturado (20/08/2026) de 5 campos-blob soltos para 7
// blocos de questionário, um campo por sub-pergunta — ver comentário em
// schema.prisma. Bloco 6 reaproveita empresasColigadas (já existia).
export interface PerfilGrupoEconomico {
  email?: string;
  telefone?: string;
  atividadePrincipal?: string;
  fundacao?: string; // YYYY-MM-DD
  sede?: string;
  consultorResponsavel?: string;

  // Bloco 1 — Histórico
  historicoInicio?: string;
  historicoHerancaOrigem?: string;
  historicoEvolucaoNegocio?: string;
  historicoGestaoCrises?: string;

  // Bloco 2 — Gestão-Sucessão
  gestaoAdministracao?: string;
  gestaoParceriasSocios?: string;
  gestaoDivisaoCustosFaturamento?: string;
  gestaoPlanoSucessorioHerdeiros?: string;

  // Bloco 3 — Modus Operandi (Agricultura)
  agriculturaCustos?: string;
  agriculturaCronogramaPlantioColheita?: string;
  agriculturaCapacidadeArmazenamento?: string;
  agriculturaFornecedoresClientes?: string;
  agriculturaModalidadesCompra?: string;
  agriculturaExportacao?: string;

  // Bloco 4 — Modus Operandi (Pecuária)
  pecuariaCicloProducao?: string;
  pecuariaConfinamento?: string;
  pecuariaTaxaDesfrutePercent?: number; // 0-100
  pecuariaCustosCronogramaCompraAbate?: string;

  // Bloco 5 — Gestão Financeira
  financeiroFinanciamentos?: string;
  financeiroPoliticaHedge?: string;
  financeiroPosicaoComercializadaSafraAtual?: string;

  // Bloco 6 — Outras Atividades / Empresas Coligadas
  empresasColigadas?: string;

  // Bloco 7 — Missão, Visão e Valores
  missao?: string;
  visao?: string;
  valores?: string;
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
  custoProducao: number; // R$ por hectare — Despesa total é derivada (custoProducao * hectares)
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

// 'Dólar + juros' é o rótulo interno (chave do enum no banco); a UI mostra
// "Variação Cambial (VC)" — ver LABEL_TIPO_TAXA em ContratoBancarioDrawer.tsx.
export type TipoTaxaBancaria = 'Pré-fixado (% a.a.)' | 'CDI + spread' | 'IPCA + spread' | 'Dólar + juros';

// BULLET e JUROS_PERIODICOS saíram do sistema — o mesmo comportamento (tudo no
// vencimento, ou juros periódicos + principal no final) agora se obtém via
// periodicidadePrincipal/periodicidadeJuros = 'Final', com SAC ou PRICE.
export type SistemaAmortizacao = 'SAC' | 'PRICE';

// Periodicidade de liquidação — usada separadamente para Principal e Juros
// (desacoplamento pedido pelo cliente em 19/08/2026). 'Final' = pagamento
// único na data de "Vencimento Final" do contrato, sem nenhum evento
// intermediário (substitui o antigo BULLET quando usado em ambas as pernas).
export type PeriodicidadeLiquidacao = 'Mensal' | 'Bimestral' | 'Trimestral' | 'Quadrimestral' | 'Semestral' | 'Anual' | 'Final';

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
  periodicidadePrincipal: PeriodicidadeLiquidacao;
  periodicidadeJuros: PeriodicidadeLiquidacao;
  possuiCarencia: boolean;
  dataContratacao: string; // YYYY-MM-DD
  inicioPagamento?: string; // YYYY-MM-DD
  dataVencimento: string; // YYYY-MM-DD
  tipoGarantia?: string;
  valorGarantia?: number;
  moeda: Currency;
  // Cenário USD Puro (moeda=USD) e Cenário VC (tipoTaxa='Dólar + juros'):
  // cotação R$/US$ na data de contratação, referência pra medir variação
  // cambial. Obrigatório nesses dois cenários (validação em src/lib/validation.ts).
  ptaxInicial?: number;
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

export type TipoPagamentoAquisicao = 'SACAS' | 'REAIS';
export type TipoLancamentoAquisicao = 'ENTRADA' | 'PARCELA';

export interface ParcelaAquisicao {
  id: string;
  safra: string; // "2026/2027"
  tipo: TipoLancamentoAquisicao;
  sacas: number;
  precoSc?: number;
  usaPrecoReferencia: boolean;
  valorTotal: number;
  dataPagamento: string; // YYYY-MM-DD
}

export interface Aquisicao {
  id: string;
  nomeFazenda: string;
  vendedor?: string;
  denominacaoImovel?: string;
  comarca?: string;
  numeroMatricula?: string;
  estado: string; // UF
  municipio: string;
  areaTotalHa: number;
  areaAgricolaHa: number;
  dataAquisicao: string; // YYYY-MM-DD
  dataInicioPagamento: string;
  dataVencimento: string;
  prazoFinanciamentoMeses?: number;
  tipoPagamento: TipoPagamentoAquisicao;
  periodicidade: string; // só "Anual" confirmado

  // Modo SACAS
  culturaReferenciaId?: string;
  culturaNome?: string; // nome da cultura de referência, para exibição (badge do card)
  sacasHa?: number;
  precoReferencia?: number; // R$/sc

  // Modo REAIS
  precoHa?: number;
  valorTotalManual?: number;
  valorFinanciado?: number;
  taxaJurosAA?: number; // % a.a.

  // Entrada (Sinal)
  valorEntrada?: number;
  safraEntrada?: string;

  // Derivados — soma das parcelas geradas no server
  valorTotalFluxo: number;
  totalSacas: number;

  parcelas: ParcelaAquisicao[];
}

// ---- Arrendamentos ----

export type PeriodicidadeArrendamento = 'Anual' | 'Mensal' | 'Por Safra';
export type StatusArrendamento = 'ATIVO' | 'ENCERRADO';
export type OrigemPrecoArrendamento = 'CONTRATO' | 'COTACAO';

export interface ParcelaArrendamento {
  id: string;
  safra: string; // "2026/2027"
  sacasBrutas: number;
  sacasAntecipadas: number;
  sacasLiquidas: number;
  precoSc?: number;
  origemPreco?: OrigemPrecoArrendamento; // ausente = sem preço (N/D), nunca "0"
  valorTotal?: number; // ausente quando origemPreco é ausente
}

export interface ContratoArrendamento {
  id: string;
  // 1. Identificação
  nomeFazenda: string;
  proprietario?: string;
  denominacaoImovel?: string;
  municipio?: string;
  comarca?: string;
  numeroMatricula?: string;
  // 2. Área
  areaTotalHa?: number;
  areaArrendadaHa: number;
  // 3. Contrato
  dataInicio: string; // YYYY-MM-DD
  dataVencimento: string;
  // 4. Condições Econômicas e Pagamento
  tipoPagamento: TipoPagamentoAquisicao;
  periodicidade: string; // só "Anual" confirmado, mesmo critério de Aquisição

  // Modo SACAS
  culturaReferenciaId?: string;
  culturaNome?: string; // nome da cultura de referência, para exibição (badge do card)
  sacasHa?: number;
  precoReferencia?: number; // R$/sc

  // Modo REAIS
  precoHa?: number;
  valorTotalManual?: number;

  // 5. Pagamento Antecipado
  possuiPagamentoAntecipado: boolean;
  valorAntecipado?: number; // sacas (modo SACAS) ou R$ (modo REAIS)
  dataPagamentoAntecipado?: string;
  safraReferenciaAntecipacao?: string;

  observacoes?: string;
  status: StatusArrendamento;

  // Derivados — soma das ParcelaArrendamento geradas no server
  valorTotalFluxo: number;
  totalSacas: number;

  parcelas: ParcelaArrendamento[];
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
  cambioUsd?: number; // R$/USD no momento da contratação — só quando aplicável (CBOT/NDF)
  dataLiquidacaoFinanceira?: string; // status LIQUIDADO + esta data = receita "realizada" no Fluxo de Safra
  observacoes?: string;
}

// ---- Fluxo de Safra Projetado ----

/** As 9 categorias do modal "Adicionar Item ao Fluxo" — spec seção 7. */
export type CategoriaItemFluxoManual =
  | 'RECEITA_VENDA_FAZENDA'
  | 'ESTOQUE_GRAOS_ENTRADA'
  | 'ESTOQUE_ALGODAO_ENTRADA'
  | 'ESTOQUE_GADO_ENTRADA'
  | 'OUTRAS_ENTRADAS'
  | 'DIVIDENDOS_RETIRADAS'
  | 'MANUTENCAO_MAQUINAS'
  | 'CORRECAO_SOLO'
  | 'OUTRAS_SAIDAS';

/** Item manual extraordinário lançado na tela Fluxo de Safra (única escrita própria do módulo). */
export interface ItemFluxoManual {
  id: string;
  safra: string;
  categoria: CategoriaItemFluxoManual;
  tipo: 'ENTRADA' | 'SAIDA'; // derivado da categoria no servidor, nunca editado diretamente
  descricao: string;
  valor: number;
  observacoes?: string;
}

/** Uma linha do demonstrativo "(+) ENTRADAS"/"(-) SAÍDAS", com o texto de origem para o tooltip (ⓘ). */
export interface FluxoSafraLinha {
  id: string;
  label: string;
  /** null = indisponível (ex.: sem cotação de Soja cadastrada) — nunca um 0 que mente. */
  valor: number | null;
  origem: string;
}

/** Dados brutos agregados das 5+ telas de origem, para uma safra — montado por src/server/fluxo-safra.ts. */
export interface FluxoSafraDTO {
  safra: string;
  receitaProjetada: number;
  receitaRealizada: number;
  custoProducao: number;
  fornecedores: number;
  amortizacaoBancos: number;
  jurosBancos: number;
  arrendamentos: number;
  /** null quando não há cotação de Soja disponível para estimar a despesa comercial (3 sc/ha). */
  despesaComercial: number | null;
  parcelasAquisicao: number;
  saldoDevedorBancos: number;
  fornecedoresProximaSafra: number;
  itensManuais: ItemFluxoManual[];
}

export type StatusIndiceCobertura = 'Saudável' | 'Atenção' | 'Crítico';

/** Resultado da função pura calcularFluxoSafra() (src/lib/fluxo-safra-calc.ts). */
export interface FluxoSafraCalculado {
  entradas: FluxoSafraLinha[];
  saidas: FluxoSafraLinha[];
  totalEntradas: number;
  totalSaidas: number;
  fluxoLiquido: number;
  indiceCobertura: number;
  statusCobertura: StatusIndiceCobertura;
  totalRecursosEstruturar: number;
  custoProximaSafra: number;
  deficitSuperavitProximaSafra: number;
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
