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

/**
 * Registro do model `Safra` (src/server/safras.ts) — fonte única da "safra
 * vigente" do sistema (10/09/2026). `atual` nunca é true para mais de um
 * registro da mesma conta.
 */
export interface SafraCadastrada {
  id: string;
  anoSafra: string;
  atual: boolean;
}

// ---- Quadro de Safra: Pecuária (Bovinocultura) / Suinocultura / Avicultura ----
// Réplica confirmada da planilha real do cliente
// (docs/demandas/Template Agro_Banco_PECUARIA.xlsx). Organizado por ANO CIVIL
// (não safra) — ver src/lib/pecuaria-calc.ts e src/lib/safra-periodo.ts
// (safraDoAnoCivil/anoCivilDaSafra) para a ponte com os módulos por safra.

export interface PecuariaBovinaAno {
  id: string;
  anoCivil: number;

  // Estoque de rebanho (cabeças)
  femeas0a12: number;
  femeas12a24: number;
  femeas24a36: number;
  femeasAcima36: number;
  machos0a12: number;
  machos12a24: number;
  machos24a36: number;
  machosAcima36: number;

  cicloProdutivo: string; // texto livre — ex. "Ciclo Completo"
  areaPastagemPropria: number;
  areaPastagemArrendada: number;
  tipoTerminacao: string; // texto livre — ex. "A Pasto"

  custoAquisicaoPorCabeca: number;
  custoPastagemPorHectare: number;
  diariaConfinamento: number;
  diasConfinamento: number;
  qtdAnimaisConfinados: number;

  qtdMachosComercializados: number;
  pesoMedioMachos: number; // @
  precoMedioMachos: number; // R$/@
  qtdFemeasComercializadas: number;
  pesoMedioFemeas: number;
  precoMedioFemeas: number;
  qtdOutrasComercializadas: number;
  pesoMedioOutras: number;
  precoMedioOutras: number;

  capacidadeLotacaoConfinamento: number;
  ganhoPesoMedioDiarioKg: number;
  diasConfinamentoPorLote: number;
}

export type TipoProducaoAnimal = 'Avicultura' | 'Suinocultura';

export interface ProducaoAnimalAno {
  id: string;
  tipo: TipoProducaoAnimal;
  anoCivil: number;
  producaoCabecas: number;
  precoMedioPorCabeca: number;
  custoMedioPorCabeca: number;
  /** Entrada manual (10/09/2026) — Suíno/Ave não têm estoque por categoria como Bovino, só o total informado pelo cliente. Informativo, não entra em calcularProducaoAnimal(). */
  plantel: number;
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
// Réplica confirmada de docs/demandas/SPEC_TELA_ANALISE_FINANCEIRA.md — Ativo/
// Passivo/DRE/32 indicadores são SEMPRE computados ao vivo (src/lib/balanco-calc.ts)
// a partir de Bancos/Fornecedores/Arrendamentos/Aquisição de Fazenda/Quadro de
// Safra/Bens e Direitos, nunca persistidos como número solto. O único model
// próprio é `DadosComplementaresFinanceiro`, abaixo — os campos que nenhum
// módulo de origem cobre (spec seção 5.1).

/** Único registro de escrita própria desta tela (aba "Dados Complementares") — um por (propriedade, safra). */
export interface DadosComplementaresFinanceiro {
  safra: string; // "2026/2027"
  caixaEquivalentes: number;
  estoqueGraos: number;
  estoqueInsumos: number;
  outrosCreditosCp: number;
  contasReceberLp: number;
  outrosCreditosLp: number;
  investimentos: number;
  maquinasEquipamentos: number;
  benfeitorias: number;
  depreciacaoAcumulada: number;
  obrigTrabalhistasCp: number;
  obrigFiscaisCp: number;
  outrasObrigCp: number;
  obrigFiscaisLp: number;
  outrasObrigLp: number;
  partesRelacionadas: number;
  capitalSocial: number;
  reservasLucrosAcumulados: number;
  deducoesReceitaPercent: number;
  despesasOperacionais: number;
  despesasAdministrativas: number;
  despesaComercialFallback?: number;
  despesaComercialScHa: number;
  dividendos: number;
  depreciacaoPeriodo: number;
  aliquotaIrCsllPercent: number;
  capex: number;
  servicoDividaManual?: number;
}

/**
 * 5 níveis (spec) + 'Sem dados' — usado quando o denominador de um indicador é
 * zero por ausência de operação (ex.: Cobertura Arrendamento sem arrendamento
 * cadastrado), nunca 'Crítico' nesse caso (corrige o BUG #4 da spec: um "—"
 * não é uma situação financeira ruim, é a ausência de uma operação).
 */
export type StatusIndicador = 'Excelente' | 'Bom' | 'Adequado' | 'Atenção' | 'Crítico' | 'Sem dados';

export type GrupoIndicador =
  | 'Liquidez'
  | 'Estrutura de Capital'
  | 'Rentabilidade'
  | 'Cobertura'
  | 'Eficiência'
  | 'Agronegócio';

export interface IndicadorCalculado {
  id: string;
  grupo: GrupoIndicador;
  nome: string;
  valor: number | null; // null = "—" (ver StatusIndicador acima)
  unidade: string; // "", "%", "x", "dias", "R$"
  status: StatusIndicador;
  formula: string;
  referencia: string;
}

export interface DreCalculada {
  receitaBruta: number;
  deducoes: number;
  receitaLiquida: number;
  custos: number;
  /** Só arrendamentos com `direcao='A_PAGAR'` (custo). 23/08/2026: os "A_RECEBER" saíram daqui, ver `arrendamentosReceber`. */
  arrendamentos: number;
  /** Arrendamentos com `direcao='A_RECEBER'` — receita, soma no lucro bruto em vez de subtrair (23/08/2026). */
  arrendamentosReceber: number;
  lucroBruto: number;
  despesasOperacionais: number;
  despesasAdministrativas: number;
  /** null = sem preço de Soja em Cotações e sem fallback manual definido — nunca um 0 que mente. */
  despesaComercial: number | null;
  resultadoOperacional: number;
  dividendos: number;
  ebitda: number;
  custoFinanceiro: number;
  depreciacao: number;
  ebit: number;
  lair: number;
  irCsll: number;
  resultadoLiquido: number;
}

export interface AtivoCalculado {
  caixaEquivalentes: number;
  aplicacoesFinanceiras: number; // BemDireito grupoIrpf='Aplicações e Investimentos'
  contasReceberSafra: number; // = Receita Bruta da safra (Quadro de Safra)
  estoqueGraos: number;
  estoqueInsumos: number;
  estoqueRebanhoBovino: number; // Quadro Pecuária — cabeças em estoque x custo médio de aquisição (02/09/2026); Suínos/Aves não têm estoque
  outrosCreditosCp: number;
  totalCirculante: number;

  contasReceberLp: number;
  outrosCreditosLp: number;
  investimentos: number;
  maquinasEquipamentos: number;
  benfeitorias: number;
  fazendas: number; // Aquisição de Fazenda (imobilizado da empresa, distinto do IRPF pessoal)
  depreciacaoAcumulada: number;
  bensIrpf: number; // linha explícita (resolve o BUG #1 da spec) — Fazendas Próprias + Máquinas + Outros Bens do IRPF, sem contar Aplicações (já no Circulante)
  totalNaoCirculante: number;

  total: number;
}

export interface PassivoCalculado {
  bancosCp: number;
  fornecedoresCp: number;
  arrendamentos: number; // só Circulante — spec seção 4.3
  aquisicaoFazendasCp: number;
  obrigTrabalhistasCp: number;
  obrigFiscaisCp: number;
  outrasObrigCp: number;
  totalCirculante: number;

  bancosLp: number;
  aquisicaoFazendasLp: number;
  fornecedoresLp: number;
  obrigFiscaisLp: number;
  outrasObrigLp: number;
  partesRelacionadas: number;
  totalNaoCirculante: number;

  total: number;
}

export interface PlCalculado {
  capitalSocial: number;
  reservasLucrosAcumulados: number;
  resultadoSafra: number; // = Resultado Líquido da DRE
  bensIrpf: number; // mesma linha do Ativo — resolve o BUG #1 em ambas as pontas do balanço
  total: number;
}

/** Um item de `BemDireito` agrupado por categoria, pra listagem detalhada (spec seção 4.6.2-4.6.4). */
export interface ItemPatrimonioIrpf {
  descricao: string;
  valor: number;
}

export interface CategoriaPatrimonioIrpf {
  categoria: string; // "Imóveis Rurais (IRPF)", "Imóveis Urbanos (IRPF)", "Máquinas e Equipamentos (IRPF)", "Aplicações Financeiras", "Outros Bens e Direitos (IRPF)"
  itens: ItemPatrimonioIrpf[];
  subtotal: number;
}

/**
 * Bloco "Bens e Direitos IRPF — Detalhamento por Categoria" (spec seção 4.6).
 * Os 4 cards-resumo já nascem corretos aqui — os BUGs #2/#3 da spec (cards
 * zerados, "Maquinários" categorizado como imóvel urbano) não se reproduzem
 * porque `BemDireito.grupoIrpf` já é a taxonomia certa desde a origem.
 */
export interface PatrimonioIrpfResumo {
  fazendasProprias: { valor: number; itens: number };
  maquinasEquipamentos: { valor: number; itens: number };
  aplicacoesFinanceiras: { valor: number; itens: number };
  outrosBens: { valor: number; itens: number };
  totalBensIrpf: number; // soma dos 4 grupos acima
  patrimonioTotal: number; // totalBensIrpf + Ativo.fazendas (imobilizado via Aquisição)
  categorias: CategoriaPatrimonioIrpf[];
}

export interface ReceitaPorCultura {
  cultura: string;
  receita: number;
  percentual: number;
}

export interface BalancoCalculado {
  safra: string;
  areaTotalHa: number;
  ativo: AtivoCalculado;
  passivo: PassivoCalculado;
  pl: PlCalculado;
  ccl: number; // Capital de Giro Líquido = Ativo Circulante - Passivo Circulante
  dre: DreCalculada;
  servicoDivida: number;
  indicadores: IndicadorCalculado[];
  radar: { dimensao: string; valor: number }[];
  patrimonioIrpf: PatrimonioIrpfResumo;
  receitaPorCultura: ReceitaPorCultura[];
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
/** A propriedade paga (arrenda de terceiro) ou recebe (arrenda pra terceiro)? 23/08/2026, review do cliente. */
export type DirecaoArrendamento = 'A_PAGAR' | 'A_RECEBER';
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
  direcao: DirecaoArrendamento;
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
  /** Só arrendamentos com direcao='A_PAGAR' — custo (saída). */
  arrendamentos: number;
  /** Arrendamentos com direcao='A_RECEBER' — receita (entrada). 23/08/2026. */
  arrendamentosReceber: number;
  /** null quando não há cotação de Soja disponível para estimar a despesa comercial (3 sc/ha). */
  despesaComercial: number | null;
  /**
   * De onde veio o preço de soja usado em `despesaComercial` (10/09/2026):
   * 'DEFINIDO' = PrecoDefinidoSafra travado pelo cliente para esta safra;
   * 'MERCADO' = fallback para a cotação de mercado do dia (Cotacao), quando
   * não há preço travado; null = nenhuma fonte disponível.
   */
  precoSojaFonte: 'DEFINIDO' | 'MERCADO' | null;
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
  precoOriginal: number;
  unidadeOriginal: string;
  precoUsd?: number;
  precoBrl: number;
  unidade: string;
  variacaoPercentual: number;
  maxima: number;
  minima: number;
  volume: number;
  atualizadoEm: string; // HH:MM:SS
}

/** Preço travado pelo usuário para uma commodity numa safra específica — src/server/cotacoes.ts. */
export interface PrecoDefinidoSafra {
  id: string;
  commodity: string;
  anoSafra: string;
  precoBrl: number;
  definidoEm: string;
}

// ---- Fluxo de Caixa Mensal ----
// Réplica confirmada de docs/demandas/SPEC_TELA_FLUXO_MENSAL.md. "Manual" do
// original foi renomeado para "VINCULADO" aqui (BUG #1 da spec): é o
// lançamento sincronizado ao vivo de Fornecedores/Bancos/Arrendamentos/
// Aquisição, nunca digitado pelo usuário. "MANUAL" fica só para o que
// realmente vem do modal "+ Lançamento" (LancamentoManualMensal).

export type TipoLancamentoMensal = 'ENTRADA' | 'SAIDA';

/** Origem de um lançamento no demonstrativo — determina o badge exibido e se ele conta como caixa (ver `contaComoCaixa`). */
export type TipoOrigemLancamentoMensal = 'CUSTEIO' | 'SAFRA' | 'VINCULADO' | 'PROJECAO' | 'MANUAL';

export interface LancamentoMensal {
  id: string;
  mes: number; // 1-12
  ano: number;
  tipo: TipoLancamentoMensal;
  origem: TipoOrigemLancamentoMensal;
  categoriaLabel: string;
  descricao: string;
  cultura?: string;
  valor: number;
  /**
   * false só para `origem === 'SAFRA'` — receita por competência, já
   * espelhada pelo lançamento `PROJECAO` correspondente (+1 mês). Evita
   * contar a mesma receita duas vezes nos KPIs/Curva de Caixa (decisão
   * confirmada com o usuário, ver fluxo-mensal-calc.ts).
   */
  contaComoCaixa: boolean;
}

/** As 19 categorias do modal "+ Lançamento" (11 saída + 8 entrada) — spec seção 5. */
export type CategoriaLancamentoMensal =
  | 'CUSTEIO_AGRICOLA'
  | 'INSUMOS'
  | 'MAO_DE_OBRA'
  | 'ARRENDAMENTO_PAGO'
  | 'PARCELA_BANCARIA'
  | 'AQUISICAO_MAQUINAS'
  | 'AQUISICAO_FAZENDA'
  | 'DESPESAS_ADMINISTRATIVAS'
  | 'IMPOSTOS_TAXAS'
  | 'FRETE_LOGISTICA'
  | 'OUTRAS_DESPESAS'
  | 'VENDA_GRAOS'
  | 'VENDA_GADO'
  | 'VENDA_ALGODAO'
  | 'RECEBIMENTO_CPR'
  | 'ARRENDAMENTO_RECEBIDO'
  | 'DIVIDENDOS_DISTRIBUICAO'
  | 'SUBVENCAO_PREMIO_SEGURO'
  | 'OUTRAS_RECEITAS';

/** Lançamento genuinamente manual (modal "+ Lançamento") — única escrita própria deste módulo. */
export interface ItemLancamentoManualMensal {
  id: string;
  mes: number; // 1-12
  ano: number;
  categoria: CategoriaLancamentoMensal;
  tipo: TipoLancamentoMensal; // derivado da categoria no servidor, nunca editado diretamente
  descricao: string;
  valor: number;
  culturaId?: string;
  culturaNome?: string;
  observacoes?: string;
}
