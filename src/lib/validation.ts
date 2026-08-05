import { z } from 'zod';

// Schemas zod usados apenas no boundary de servidor (server actions / rotas).
// Os forms de client continuam com useState + `required` HTML nativo — este
// arquivo não introduz nenhuma lib de formulário no client.

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

export const socioSchema = z.object({
  nome: z.string().trim().min(2, 'Informe o nome'),
  cpf: z.string().trim().min(11, 'CPF inválido'),
  participacao: z.coerce.number().min(0).max(100),
  estadoCivil: z.enum(['Solteiro', 'Casado', 'Viúvo', 'Divorciado', 'Separado']).optional(),
  telefone: z.string().trim().optional().or(z.literal('')),
  email: z.string().trim().email('E-mail inválido').optional().or(z.literal('')),
  nacionalidade: z.string().trim().optional().or(z.literal('')),
  dataNascimento: z.string().trim().optional().or(z.literal(''))
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
    'Outros Bens e Direitos'
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
  observacoes: z.string().trim().optional().or(z.literal(''))
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

export const perfilGrupoSchema = z.object({
  email: z.string().trim().optional().or(z.literal('')),
  telefone: z.string().trim().optional().or(z.literal('')),
  atividadePrincipal: z.string().trim().optional().or(z.literal('')),
  fundacao: z.string().trim().optional().or(z.literal('')),
  sede: z.string().trim().optional().or(z.literal('')),
  consultorResponsavel: z.string().trim().optional().or(z.literal('')),
  historico: z.string().trim().optional().or(z.literal(''))
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
  despesa: z.coerce.number().nonnegative(),
  producaoFixadaPercent: z.coerce.number().min(0).max(100).optional()
});

export const contratoBancarioSchema = z.object({
  banco: z.string().trim().min(1, 'Informe o banco/credor'),
  tipoContrato: z.enum(['CUSTEO', 'CPR', 'FINANCIAMENTO', 'CREDIARIO']),
  saldoInicial: z.coerce.number().nonnegative(),
  saldoAtual: z.coerce.number().nonnegative(),
  taxaJuros: z.coerce.number().nonnegative(),
  tipoTaxa: z.enum(['CDI', 'PRIME', 'PRÉ', 'FLUTUANTE']),
  taxaAdicional: z.coerce.number().nonnegative().optional(),
  dataContratacao: z.string().min(1, 'Informe a data de contratação'),
  dataVencimento: z.string().min(1, 'Informe o vencimento'),
  sistemaAmortizacao: z.enum(['SAC', 'PRICE', 'BULLET']),
  periodicidade: z.enum(['Mensal', 'Trimestral', 'Semestral', 'Anual']),
  finalidade: z.enum(['CUSTEIO', 'INVESTIMENTO', 'CAPITAL_GIRO']),
  moeda: z.enum(['BRL', 'USD']),
  observacoes: z.string().trim().optional().or(z.literal(''))
});

export const aquisicaoSchema = z.object({
  nomeFazenda: z.string().trim().min(1, 'Informe o nome da fazenda'),
  localizacao: z.string().trim().min(1, 'Informe a localização'),
  areaHectares: z.coerce.number().nonnegative(),
  valorTotal: z.coerce.number().nonnegative(),
  dataAquisicao: z.string().min(1, 'Informe a data de aquisição'),
  dataOcupacao: z.string().optional().or(z.literal('')),
  culturaPrincipal: z.string().trim().optional().or(z.literal('')),
  safraInicio: z.string().trim().min(1, 'Informe a safra de início'),
  safraFim: z.string().trim().min(1, 'Informe a safra de fim'),
  valorTotalFluxo: z.coerce.number().nonnegative(),
  totalSacas: z.coerce.number().nonnegative()
});

export const arrendamentoSchema = z.object({
  nomePropriedade: z.string().trim().min(1, 'Informe o nome da propriedade'),
  localizacao: z.string().trim().min(1, 'Informe a localização'),
  proprietarioNome: z.string().trim().min(1, 'Informe o proprietário'),
  proprietarioCpfCnpj: z.string().trim().min(1, 'Informe o CPF/CNPJ'),
  areaHectares: z.coerce.number().nonnegative(),
  culturaPrincipal: z.string().trim().min(1, 'Informe a cultura'),
  custoAnualHectare: z.coerce.number().nonnegative(),
  sacasPorHectare: z.coerce.number().nonnegative().optional(),
  dataInicio: z.string().min(1, 'Informe a data de início'),
  dataFim: z.string().min(1, 'Informe a data de fim'),
  periodicidade: z.enum(['Anual', 'Mensal', 'Por Safra']),
  renovavel: z.boolean(),
  status: z.enum(['ATIVO', 'ENCERRADO']),
  safraInicio: z.string().trim().min(1),
  safraFim: z.string().trim().min(1),
  observacoes: z.string().trim().optional().or(z.literal(''))
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
export type CapexInput = z.infer<typeof capexSchema>;
export type PerfilGrupoInput = z.infer<typeof perfilGrupoSchema>;
