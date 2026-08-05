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
  descricao: z.string().trim().min(2, 'Informe a descrição'),
  tipo: z.enum(['Imóvel', 'Veículo', 'Equipamento', 'Outros']),
  valorContabil: z.coerce.number().nonnegative('Valor não pode ser negativo'),
  dataAquisicao: z.string().min(1, 'Informe a data de aquisição'),
  depreciacaoAcumulada: z.coerce.number().nonnegative('Depreciação não pode ser negativa').default(0),
  observacoes: z.string().trim().optional().or(z.literal(''))
});

export const garantiaSchema = z.object({
  descricao: z.string().trim().min(2, 'Informe a descrição'),
  tipo: z.enum(['Imóvel', 'Aval', 'Penhor', 'Alienação Fiduciária', 'Outros']),
  valor: z.coerce.number().positive('Valor deve ser maior que zero'),
  contratoBancarioId: z.string().trim().optional().or(z.literal('')),
  observacoes: z.string().trim().optional().or(z.literal(''))
});

export const capexSchema = z.object({
  descricao: z.string().trim().min(2, 'Informe a descrição'),
  categoria: z.enum(['Maquinário', 'Benfeitoria', 'Tecnologia', 'Infraestrutura', 'Outros']),
  valor: z.coerce.number().positive('Valor deve ser maior que zero'),
  dataInvestimento: z.string().min(1, 'Informe a data do investimento'),
  safra: z.string().trim().optional().or(z.literal('')),
  observacoes: z.string().trim().optional().or(z.literal(''))
});

export const empresaGrupoSchema = z.object({
  nome: z.string().trim().min(2, 'Informe o nome da empresa'),
  cnpj: z.string().trim().optional().or(z.literal('')),
  tipoRelacao: z.enum(['Controladora', 'Controlada', 'Coligada', 'Outras']),
  participacaoPercentual: z.coerce.number().min(0).max(100).optional(),
  observacoes: z.string().trim().optional().or(z.literal(''))
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
  imageUrl: z.string().trim().optional().or(z.literal('')),
  comprovanteUrl: z.string().trim().optional().or(z.literal('')),
  cnpjCpf: z.string().trim().optional().or(z.literal('')),
  contatoNome: z.string().trim().optional().or(z.literal('')),
  contatoTelefone: z.string().trim().optional().or(z.literal('')),
  contatoEmail: z.string().trim().optional().or(z.literal('')),
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
export type EmpresaGrupoInput = z.infer<typeof empresaGrupoSchema>;
