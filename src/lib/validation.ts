import { z } from 'zod';

// Schemas zod usados apenas no boundary de servidor (server actions / rotas).
// Os forms de client continuam com useState + `required` HTML nativo — este
// arquivo não introduz nenhuma lib de formulário no client.

export const culturaSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome da cultura'),
  unidadeMedida: z.enum(['sc', '@', 'kg', 't', 'm³']).default('sc')
});

export const contaSchema = z.object({
  nome: z.string().trim().min(2, 'Informe o nome da conta'),
  razaoSocial: z.string().trim().optional().or(z.literal('')),
  cnpj: z.string().trim().optional().or(z.literal(''))
});

export const usuarioOwnerSchema = z.object({
  nome: z.string().trim().min(2, 'Informe o nome do usuário'),
  email: z.string().trim().toLowerCase().email('E-mail inválido')
});

export const usuarioSchema = usuarioOwnerSchema.extend({
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'])
});

export const propriedadeSchema = z.object({
  nome: z.string().trim().min(2, 'Informe o nome da propriedade'),
  cidade: z.string().trim().optional().or(z.literal('')),
  estado: z.string().trim().max(2).optional().or(z.literal('')),
  areaTotalHectares: z.coerce.number().nonnegative().optional()
});

const participacaoSocietariaSchema = z.object({
  socioPfId: z.string().trim().min(1, 'Selecione o integrante'),
  percentual: z.coerce.number().min(0, 'Percentual não pode ser negativo').max(100, 'Percentual não pode passar de 100%')
});

// Sócios e Empresas: PF exige CPF, PJ exige CNPJ + cap table (participacoes) cuja
// soma não pode passar de 100% — validação de negócio, feita com .refine porque
// depende de mais de um campo. A checagem de que cada socioPfId aponta pra um
// Socio tipoPessoa=PF da mesma conta é feita no server (não dá pra validar I/O
// dentro do Zod puro).
export const socioSchema = z
  .object({
    tipoPessoa: z.enum(['PF', 'PJ']).default('PF'),
    nome: z.string().trim().min(2, 'Informe o nome'),
    cpf: z.string().trim().optional().or(z.literal('')),
    cnpj: z.string().trim().optional().or(z.literal('')),
    cargoOuAtividade: z.string().trim().optional().or(z.literal('')),
    participacao: z.coerce.number().min(0).max(100),
    estadoCivil: z.enum(['Solteiro', 'Casado', 'Viúvo', 'Divorciado', 'Separado']).optional(),
    telefone: z.string().trim().optional().or(z.literal('')),
    email: z.string().trim().email('E-mail inválido').optional().or(z.literal('')),
    nacionalidade: z.string().trim().optional().or(z.literal('')),
    dataNascimento: z.string().trim().optional().or(z.literal('')),
    participacoes: z.array(participacaoSocietariaSchema).optional()
  })
  .refine((data) => data.tipoPessoa !== 'PF' || (data.cpf && data.cpf.trim().length >= 11), {
    message: 'CPF inválido',
    path: ['cpf']
  })
  .refine((data) => data.tipoPessoa !== 'PJ' || (data.cnpj && data.cnpj.trim().length >= 14), {
    message: 'CNPJ inválido',
    path: ['cnpj']
  })
  .refine(
    (data) =>
      data.tipoPessoa !== 'PJ' ||
      (data.participacoes ?? []).reduce((sum, p) => sum + p.percentual, 0) <= 100,
    { message: 'Soma da participação societária excede 100%', path: ['participacoes'] }
  );

const detalheImovelRuralSchema = z.object({
  denominacaoImovel: z.string().trim().min(1, 'Informe a denominação do imóvel'),
  municipioUf: z.string().trim().min(1, 'Informe o município/UF'),
  matricula: z.string().trim().optional().or(z.literal('')),
  areaHa: z.coerce.number().positive('Área deve ser maior que zero'),
  areaPropriaPlantadaHa: z.coerce.number().nonnegative().optional(),
  areaReservasPastagensOutrosHa: z.coerce.number().nonnegative().optional(),
  valorMercadoHa: z.coerce.number().nonnegative().optional(),
  situacaoCredor: z.string().trim().optional().or(z.literal(''))
});

const detalheImovelUrbanoSchema = z.object({
  descricao: z.string().trim().min(1, 'Informe a descrição'),
  matricula: z.string().trim().optional().or(z.literal('')),
  cidade: z.string().trim().min(1, 'Informe a cidade')
});

export const bemDireitoSchema = z.object({
  socioId: z.string().trim().optional().or(z.literal('')),
  grupoIrpf: z.enum([
    'Bens Imóveis',
    'Bens Móveis',
    'Participações Societárias',
    'Aplicações e Investimentos',
    'Depósitos à Vista e Poupança',
    'Créditos e Outros Direitos',
    'Criptoativos',
    'Outros Bens e Direitos',
    'Imóveis Rurais - ANEXO A',
    'Imóveis Urbanos - ANEXO B'
  ]),
  codigoTipo: z.string().trim().min(1, 'Informe o código/tipo'),
  descricao: z.string().trim().min(2, 'Informe a descrição'),
  valorDeclaradoIrpf: z.coerce.number().nonnegative('Valor não pode ser negativo').optional(),
  valorMercadoEstimado: z.coerce.number().nonnegative('Valor não pode ser negativo').optional(),
  dataAquisicao: z.string().trim().optional().or(z.literal('')),
  valorAquisicao: z.coerce.number().nonnegative('Valor não pode ser negativo').optional(),
  liquidez: z.enum(['Alta', 'Média', 'Baixa']).default('Baixa'),
  ltv: z.coerce.number().min(0, 'LTV não pode ser negativo').max(100, 'LTV não pode passar de 100%').optional(),
  elegivelGarantia: z.coerce.boolean().default(false),
  geraFluxoCaixa: z.coerce.boolean().default(false),
  observacoes: z.string().trim().optional().or(z.literal('')),
  detalheImovelRural: detalheImovelRuralSchema.optional(),
  detalheImovelUrbano: detalheImovelUrbanoSchema.optional()
});

export const garantiaSchema = z.object({
  tipoAtivo: z.string().trim().min(1, 'Informe o tipo de ativo'),
  tipoGarantia: z.string().trim().min(1, 'Informe o tipo de garantia'),
  descricao: z.string().trim().min(2, 'Informe a descrição'),
  bancoVinculado: z.string().trim().optional().or(z.literal('')),
  numeroOperacao: z.string().trim().optional().or(z.literal('')),
  valor: z.coerce.number().positive('Valor deve ser maior que zero'),
  moeda: z.enum(['BRL', 'USD']).default('BRL'),
  observacoes: z.string().trim().optional().or(z.literal(''))
});

export const dividaPfSchema = z.object({
  tipoDivida: z.string().trim().min(1, 'Informe o tipo de dívida'),
  credor: z.string().trim().optional().or(z.literal('')),
  saldoDevedor: z.coerce.number().nonnegative('Valor não pode ser negativo'),
  parcelaMensal: z.coerce.number().nonnegative('Valor não pode ser negativo').optional(),
  vencimentoFinal: z.string().trim().optional().or(z.literal('')),
  observacoes: z.string().trim().optional().or(z.literal(''))
});

export const capexSchema = z.object({
  descricao: z.string().trim().min(2, 'Informe a descrição'),
  tipo: z.string().trim().min(1, 'Informe o tipo'),
  ano: z.coerce.number().int('Ano inválido').min(2000).max(2100),
  valorPlanejado: z.coerce.number().nonnegative('Valor não pode ser negativo'),
  valorExecutado: z.coerce.number().nonnegative('Valor não pode ser negativo').default(0),
  percentualFinanciamento: z.coerce.number().min(0).max(100).optional(),
  status: z.string().trim().min(1).default('Planejado'),
  observacoes: z.string().trim().optional().or(z.literal(''))
});

const textoLivreOpcional = z.string().trim().optional().or(z.literal(''));

// Histórico do Grupo reestruturado em 7 blocos (20/08/2026) — ver comentário em
// schema.prisma. Todos os campos são texto livre opcional, exceto o único campo
// numérico do bloco 4 (taxa de desfrute).
export const perfilGrupoSchema = z.object({
  email: textoLivreOpcional,
  telefone: textoLivreOpcional,
  atividadePrincipal: textoLivreOpcional,
  fundacao: textoLivreOpcional,
  sede: textoLivreOpcional,
  consultorResponsavel: textoLivreOpcional,

  // Bloco 1 — Histórico
  historicoInicio: textoLivreOpcional,
  historicoHerancaOrigem: textoLivreOpcional,
  historicoEvolucaoNegocio: textoLivreOpcional,
  historicoGestaoCrises: textoLivreOpcional,

  // Bloco 2 — Gestão-Sucessão
  gestaoAdministracao: textoLivreOpcional,
  gestaoParceriasSocios: textoLivreOpcional,
  gestaoDivisaoCustosFaturamento: textoLivreOpcional,
  gestaoPlanoSucessorioHerdeiros: textoLivreOpcional,

  // Bloco 3 — Modus Operandi (Agricultura)
  agriculturaCustos: textoLivreOpcional,
  agriculturaCronogramaPlantioColheita: textoLivreOpcional,
  agriculturaCapacidadeArmazenamento: textoLivreOpcional,
  agriculturaFornecedoresClientes: textoLivreOpcional,
  agriculturaModalidadesCompra: textoLivreOpcional,
  agriculturaExportacao: textoLivreOpcional,

  // Bloco 4 — Modus Operandi (Pecuária)
  pecuariaCicloProducao: textoLivreOpcional,
  pecuariaConfinamento: textoLivreOpcional,
  pecuariaTaxaDesfrutePercent: z.coerce.number().min(0).max(100).optional(),
  pecuariaCustosCronogramaCompraAbate: textoLivreOpcional,

  // Bloco 5 — Gestão Financeira
  financeiroFinanciamentos: textoLivreOpcional,
  financeiroPoliticaHedge: textoLivreOpcional,
  financeiroPosicaoComercializadaSafraAtual: textoLivreOpcional,

  // Bloco 6 — Outras Atividades / Empresas Coligadas
  empresasColigadas: textoLivreOpcional,

  // Bloco 7 — Missão, Visão e Valores
  missao: textoLivreOpcional,
  visao: textoLivreOpcional,
  valores: textoLivreOpcional
});

export const compraFornecedorSchema = z.object({
  data: z.string().min(1, 'Informe a data'),
  valor: z.coerce.number().positive('Valor deve ser maior que zero'),
  descricao: z.string().trim().min(1, 'Informe a descrição'),
  culturaReferencia: z.string().trim().optional().or(z.literal(''))
});

export const supplierSchema = z.object({
  nome: z.string().trim().min(2, 'Informe o nome do fornecedor'),
  categoria: z.enum(['FERTILIZANTES', 'DEFENSIVOS', 'SEMENTES', 'MAQUINÁRIOS', 'COMBUSTÍVEL', 'SERVIÇOS', 'OUTROS']),
  cultura: z.string().trim().min(1),
  safra: z.string().trim().min(1),
  dividaTotal: z.coerce.number().nonnegative(),
  moeda: z.enum(['BRL', 'USD']),
  vencimento: z.string().min(1, 'Informe o vencimento'),
  observacoes: z.string().trim().optional().or(z.literal('')),
  comprovanteUrl: z.string().trim().optional().or(z.literal('')),
  status: z.enum(['PENDENTE', 'PAGO', 'VENCIDO']).optional(),
  compras: z.array(compraFornecedorSchema).optional()
});

export const quadroSafraSchema = z.object({
  cultura: z.string().trim().min(1, 'Informe a cultura'),
  anoSafra: z.string().trim().regex(/^\d{4}\/\d{4}$/, 'Formato esperado: AAAA/AAAA'),
  hectares: z.coerce.number().nonnegative(),
  haPropria: z.coerce.number().nonnegative(),
  haArrendada: z.coerce.number().nonnegative(),
  rendimento: z.coerce.number().nonnegative(),
  unidadeProducao: z.string().trim().min(1),
  precoMedio: z.coerce.number().nonnegative(),
  custoProducao: z.coerce.number().nonnegative(),
  producaoFixadaPercent: z.coerce.number().min(0).max(100).optional()
});

const PERIODICIDADE_LIQUIDACAO_VALUES = ['Mensal', 'Bimestral', 'Trimestral', 'Quadrimestral', 'Semestral', 'Anual', 'Final'] as const;

export const contratoBancarioSchema = z
  .object({
    banco: z.string().trim().min(1, 'Informe o banco/credor'),
    nomeTomador: z.string().trim().optional().or(z.literal('')),
    numeroContrato: z.string().trim().optional().or(z.literal('')),
    tipoOperacao: z.enum([
      'CUSTEIO AGRICOLA',
      'CUSTEIO PECUARIO',
      'INVESTIMENTO',
      'CAPITAL DE GIRO',
      'CPR',
      'BARTER',
      'PRONAF',
      'PRONAMP',
      'FCO',
      'FNO',
      'FINAME',
      'OUTROS'
    ]),
    safraVinculadaId: z.string().trim().optional().or(z.literal('')),
    culturaVinculadaId: z.string().trim().optional().or(z.literal('')),
    saldoInicial: z.coerce.number().nonnegative(),
    saldoAtual: z.coerce.number().nonnegative(),
    // Taxa cheia no pré-fixado; spread sobre o indexador nos demais tipos de taxa
    // (ver src/lib/taxa-efetiva.ts). Campo único — não há spread separado.
    taxaJuros: z.coerce.number().nonnegative(),
    // 'Dólar + juros' é o Cenário "Variação Cambial (VC)" na UI — chave interna
    // mantida para não exigir migração de dado (ver ContratoBancarioDrawer.tsx).
    tipoTaxa: z.enum(['Pré-fixado (% a.a.)', 'CDI + spread', 'IPCA + spread', 'Dólar + juros']),
    baseCalculo: z.enum(['252 dias úteis', '360 dias corridos', '365 dias corridos']).default('360 dias corridos'),
    capitalizacao: z.enum(['Composta', 'Simples']).default('Composta'),
    dataContratacao: z.string().min(1, 'Informe a data de contratação'),
    inicioPagamento: z.string().trim().optional().or(z.literal('')),
    dataVencimento: z.string().min(1, 'Informe o vencimento'),
    sistemaAmortizacao: z.enum(['SAC', 'PRICE']),
    periodicidadePrincipal: z.enum(PERIODICIDADE_LIQUIDACAO_VALUES),
    periodicidadeJuros: z.enum(PERIODICIDADE_LIQUIDACAO_VALUES),
    possuiCarencia: z.coerce.boolean().default(false),
    tipoGarantia: z.string().trim().optional().or(z.literal('')),
    valorGarantia: z.coerce.number().nonnegative('Valor não pode ser negativo').optional(),
    moeda: z.enum(['BRL', 'USD']),
    // Cenário USD Puro (moeda=USD) e Cenário VC (tipoTaxa='Dólar + juros'):
    // cotação R$/US$ na data de contratação — obrigatória nesses dois cenários
    // (ver .refine() abaixo). Ver src/lib/taxa-efetiva.ts.
    ptaxInicial: z.coerce.number().positive().optional(),
    observacoes: z.string().trim().optional().or(z.literal(''))
  })
  .refine((data) => data.moeda !== 'USD' || data.tipoTaxa === 'Pré-fixado (% a.a.)', {
    message: 'Contrato em USD (Cenário Dólar Puro) exige Tipo de Taxa Pré-fixado.',
    path: ['tipoTaxa']
  })
  .refine((data) => (data.moeda !== 'USD' && data.tipoTaxa !== 'Dólar + juros') || !!data.ptaxInicial, {
    message: 'Informe a PTAX Inicial (R$/US$) para contratos em USD ou com Variação Cambial (VC).',
    path: ['ptaxInicial']
  });

export const aquisicaoSchema = z
  .object({
    nomeFazenda: z.string().trim().min(1, 'Informe o nome da fazenda'),
    vendedor: z.string().trim().optional().or(z.literal('')),
    denominacaoImovel: z.string().trim().optional().or(z.literal('')),
    comarca: z.string().trim().optional().or(z.literal('')),
    numeroMatricula: z.string().trim().optional().or(z.literal('')),
    estado: z.string().trim().min(1, 'Informe o estado').max(2),
    municipio: z.string().trim().min(1, 'Informe o município'),
    areaTotalHa: z.coerce.number().nonnegative(),
    areaAgricolaHa: z.coerce.number().nonnegative(),
    dataAquisicao: z.string().min(1, 'Informe a data de aquisição'),
    dataInicioPagamento: z.string().min(1, 'Informe a data de início do pagamento'),
    dataVencimento: z.string().min(1, 'Informe a data de vencimento'),
    prazoFinanciamentoMeses: z.coerce.number().int().nonnegative().optional(),
    tipoPagamento: z.enum(['SACAS', 'REAIS']),
    periodicidade: z.string().trim().min(1).default('Anual'),
    // Modo SACAS
    culturaReferenciaId: z.string().trim().optional().or(z.literal('')),
    sacasHa: z.coerce.number().nonnegative().optional(),
    precoReferencia: z.coerce.number().nonnegative().optional(),
    // Modo REAIS
    precoHa: z.coerce.number().nonnegative().optional(),
    valorTotalManual: z.coerce.number().nonnegative().optional(),
    valorFinanciado: z.coerce.number().nonnegative().optional(),
    taxaJurosAA: z.coerce.number().nonnegative().optional(),
    // Entrada (Sinal)
    valorEntrada: z.coerce.number().nonnegative().optional(),
    safraEntrada: z.string().trim().optional().or(z.literal(''))
  })
  .refine((data) => data.tipoPagamento !== 'SACAS' || (data.sacasHa && data.precoReferencia), {
    message: 'Informe Sacas/ha e Preço de Referência no modo "Em Sacas"',
    path: ['sacasHa']
  })
  .refine((data) => data.tipoPagamento !== 'REAIS' || data.valorFinanciado !== undefined, {
    message: 'Informe o Valor Financiado no modo "Em Reais"',
    path: ['valorFinanciado']
  });

export const arrendamentoSchema = z
  .object({
    // 1. Identificação — só nomeFazenda é obrigatório (a spec real não confirma
    // CPF/CNPJ do proprietário nem torna os demais campos obrigatórios).
    nomeFazenda: z.string().trim().min(1, 'Informe o nome da fazenda'),
    proprietario: z.string().trim().optional().or(z.literal('')),
    denominacaoImovel: z.string().trim().optional().or(z.literal('')),
    municipio: z.string().trim().optional().or(z.literal('')),
    comarca: z.string().trim().optional().or(z.literal('')),
    numeroMatricula: z.string().trim().optional().or(z.literal('')),
    // 2. Área
    areaTotalHa: z.coerce.number().nonnegative().optional(),
    areaArrendadaHa: z.coerce.number().positive('Informe a área arrendada'),
    // 3. Contrato
    dataInicio: z.string().min(1, 'Informe a data de início'),
    dataVencimento: z.string().min(1, 'Informe a data de vencimento'),
    // 4. Condições Econômicas e Pagamento
    culturaReferenciaId: z.string().trim().optional().or(z.literal('')),
    tipoPagamento: z.enum(['SACAS', 'REAIS']),
    periodicidade: z.enum(['Anual', 'Mensal', 'Por Safra']).default('Anual'),
    sacasHa: z.coerce.number().nonnegative().optional(),
    // Preço de Referência fica opcional mesmo no modo SACAS — diferente de
    // aquisicaoSchema, que exige os dois juntos: aqui a ausência é coberta
    // pelo fallback de Cotações (resolverPrecoFallback), exatamente o
    // comportamento que corrige o BUG #1 da spec (contrato sem preço não pode
    // mais quebrar o cálculo em cascata).
    precoReferencia: z.coerce.number().nonnegative().optional(),
    precoHa: z.coerce.number().nonnegative().optional(),
    valorTotalManual: z.coerce.number().nonnegative().optional(),
    // 5. Pagamento Antecipado
    possuiPagamentoAntecipado: z.boolean().default(false),
    valorAntecipado: z.coerce.number().nonnegative().optional(),
    dataPagamentoAntecipado: z.string().trim().optional().or(z.literal('')),
    safraReferenciaAntecipacao: z.string().trim().optional().or(z.literal('')),
    observacoes: z.string().trim().optional().or(z.literal('')),
    status: z.enum(['ATIVO', 'ENCERRADO']).default('ATIVO')
  })
  .refine((data) => data.tipoPagamento !== 'SACAS' || !!data.sacasHa, {
    message: 'Informe Sacas/ha no modo "Em Sacas"',
    path: ['sacasHa']
  })
  .refine((data) => data.tipoPagamento !== 'REAIS' || !!data.precoHa || !!data.valorTotalManual, {
    message: 'Informe o Preço/ha ou o Valor Total no modo "Em Reais"',
    path: ['precoHa']
  })
  .refine((data) => !data.possuiPagamentoAntecipado || (!!data.valorAntecipado && !!data.safraReferenciaAntecipacao), {
    message: 'Informe o valor e a safra de referência do pagamento antecipado',
    path: ['valorAntecipado']
  });

export const contratoComercialSchema = z.object({
  cultura: z.string().trim().min(1, 'Informe a cultura'),
  safra: z.string().trim().min(1, 'Informe a safra'),
  quantidadeSc: z.coerce.number().positive('Quantidade deve ser maior que zero'),
  precoFixado: z.coerce.number().nonnegative(),
  tipoContrato: z.enum(['FUTURO', 'VENDA_A_TERMO', 'HEDGE_CALL', 'HEDGE_PUT']),
  dataContrato: z.string().min(1, 'Informe a data do contrato'),
  dataVencimento: z.string().min(1, 'Informe o vencimento'),
  status: z.enum(['ATIVO', 'LIQUIDADO', 'CANCELADO']),
  compradorNome: z.string().trim().optional().or(z.literal('')),
  cambioUsd: z.coerce.number().positive().optional(),
  dataLiquidacaoFinanceira: z.string().trim().optional().or(z.literal('')),
  observacoes: z.string().trim().optional().or(z.literal(''))
});

export const balancoPatrimonialSchema = z.object({
  safra: z.string().trim().regex(/^\d{4}\/\d{4}$/, 'Formato esperado: AAAA/AAAA'),
  ativoCirculante: z.coerce.number().nonnegative(),
  ativoNaoCirculante: z.coerce.number().nonnegative(),
  passivoCirculante: z.coerce.number().nonnegative(),
  passivoNaoCirculante: z.coerce.number().nonnegative(),
  capitalReservas: z.coerce.number(),
  resultadoSafra: z.coerce.number()
});

export type ContaInput = z.infer<typeof contaSchema>;
export type UsuarioOwnerInput = z.infer<typeof usuarioOwnerSchema>;
export type UsuarioInput = z.infer<typeof usuarioSchema>;
export type PropriedadeInput = z.infer<typeof propriedadeSchema>;
export type SocioInput = z.infer<typeof socioSchema>;
export type SupplierInput = z.infer<typeof supplierSchema>;
export type BemDireitoInput = z.infer<typeof bemDireitoSchema>;
export type GarantiaInput = z.infer<typeof garantiaSchema>;
export type DividaPfInput = z.infer<typeof dividaPfSchema>;
export type CapexInput = z.infer<typeof capexSchema>;
export type PerfilGrupoInput = z.infer<typeof perfilGrupoSchema>;
