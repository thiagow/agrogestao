// Prisma exige identificadores de enum em ASCII (ver prisma/schema.prisma);
// os rótulos acentuados de src/types.ts, usados pela UI, ficam preservados
// via @map como o valor gravado no banco — mas o *client* do Prisma sempre
// fala com o identificador ASCII, nunca com o rótulo. Este arquivo traduz
// nos dois sentidos, no boundary de servidor.

import type {
  Category,
  EstadoCivil,
  TipoEmpresa,
  TipoTaxaBancaria,
  PeriodicidadeLiquidacao,
  PeriodicidadeArrendamento,
  GrupoIrpfBem,
  LiquidezBem,
  TipoOperacaoBancaria,
  BaseCalculoJuros,
  TipoCapitalizacao
} from '@/types';
import {
  Category as PrismaCategory,
  EstadoCivil as PrismaEstadoCivil,
  TipoEmpresa as PrismaTipoEmpresa,
  TipoTaxaBancaria as PrismaTipoTaxaBancaria,
  PeriodicidadeLiquidacao as PrismaPeriodicidadeLiquidacao,
  PeriodicidadeArrendamento as PrismaPeriodicidadeArrendamento,
  GrupoIrpfBem as PrismaGrupoIrpfBem,
  LiquidezBem as PrismaLiquidezBem,
  TipoOperacaoBancaria as PrismaTipoOperacaoBancaria,
  BaseCalculoJuros as PrismaBaseCalculoJuros,
  TipoCapitalizacao as PrismaTipoCapitalizacao
} from '@prisma/client';

export const CATEGORY_TO_DB: Record<Category, PrismaCategory> = {
  FERTILIZANTES: PrismaCategory.FERTILIZANTES,
  DEFENSIVOS: PrismaCategory.DEFENSIVOS,
  SEMENTES: PrismaCategory.SEMENTES,
  MAQUINÁRIOS: PrismaCategory.MAQUINARIOS,
  COMBUSTÍVEL: PrismaCategory.COMBUSTIVEL,
  SERVIÇOS: PrismaCategory.SERVICOS,
  OUTROS: PrismaCategory.OUTROS
};

export const CATEGORY_FROM_DB: Record<PrismaCategory, Category> = {
  FERTILIZANTES: 'FERTILIZANTES',
  DEFENSIVOS: 'DEFENSIVOS',
  SEMENTES: 'SEMENTES',
  MAQUINARIOS: 'MAQUINÁRIOS',
  COMBUSTIVEL: 'COMBUSTÍVEL',
  SERVICOS: 'SERVIÇOS',
  OUTROS: 'OUTROS'
};

export const ESTADO_CIVIL_TO_DB: Record<EstadoCivil, PrismaEstadoCivil> = {
  Solteiro: PrismaEstadoCivil.SOLTEIRO,
  Casado: PrismaEstadoCivil.CASADO,
  Viúvo: PrismaEstadoCivil.VIUVO,
  Divorciado: PrismaEstadoCivil.DIVORCIADO,
  Separado: PrismaEstadoCivil.SEPARADO
};

export const ESTADO_CIVIL_FROM_DB: Record<PrismaEstadoCivil, EstadoCivil> = {
  SOLTEIRO: 'Solteiro',
  CASADO: 'Casado',
  VIUVO: 'Viúvo',
  DIVORCIADO: 'Divorciado',
  SEPARADO: 'Separado'
};

export const TIPO_EMPRESA_TO_DB: Record<TipoEmpresa, PrismaTipoEmpresa> = {
  Holding: PrismaTipoEmpresa.HOLDING,
  'Empresa Operacional': PrismaTipoEmpresa.OPERACIONAL
};

export const TIPO_EMPRESA_FROM_DB: Record<PrismaTipoEmpresa, TipoEmpresa> = {
  HOLDING: 'Holding',
  OPERACIONAL: 'Empresa Operacional'
};

export const TIPO_TAXA_TO_DB: Record<TipoTaxaBancaria, PrismaTipoTaxaBancaria> = {
  'Pré-fixado (% a.a.)': PrismaTipoTaxaBancaria.PRE_FIXADO,
  'CDI + spread': PrismaTipoTaxaBancaria.CDI_SPREAD,
  'IPCA + spread': PrismaTipoTaxaBancaria.IPCA_SPREAD,
  'Dólar + juros': PrismaTipoTaxaBancaria.DOLAR_JUROS
};

export const TIPO_TAXA_FROM_DB: Record<PrismaTipoTaxaBancaria, TipoTaxaBancaria> = {
  PRE_FIXADO: 'Pré-fixado (% a.a.)',
  CDI_SPREAD: 'CDI + spread',
  IPCA_SPREAD: 'IPCA + spread',
  DOLAR_JUROS: 'Dólar + juros'
};

export const TIPO_OPERACAO_TO_DB: Record<TipoOperacaoBancaria, PrismaTipoOperacaoBancaria> = {
  'CUSTEIO AGRICOLA': PrismaTipoOperacaoBancaria.CUSTEIO_AGRICOLA,
  'CUSTEIO PECUARIO': PrismaTipoOperacaoBancaria.CUSTEIO_PECUARIO,
  INVESTIMENTO: PrismaTipoOperacaoBancaria.INVESTIMENTO,
  'CAPITAL DE GIRO': PrismaTipoOperacaoBancaria.CAPITAL_DE_GIRO,
  CPR: PrismaTipoOperacaoBancaria.CPR,
  BARTER: PrismaTipoOperacaoBancaria.BARTER,
  PRONAF: PrismaTipoOperacaoBancaria.PRONAF,
  PRONAMP: PrismaTipoOperacaoBancaria.PRONAMP,
  FCO: PrismaTipoOperacaoBancaria.FCO,
  FNO: PrismaTipoOperacaoBancaria.FNO,
  FINAME: PrismaTipoOperacaoBancaria.FINAME,
  OUTROS: PrismaTipoOperacaoBancaria.OUTROS
};

export const TIPO_OPERACAO_FROM_DB: Record<PrismaTipoOperacaoBancaria, TipoOperacaoBancaria> = {
  CUSTEIO_AGRICOLA: 'CUSTEIO AGRICOLA',
  CUSTEIO_PECUARIO: 'CUSTEIO PECUARIO',
  INVESTIMENTO: 'INVESTIMENTO',
  CAPITAL_DE_GIRO: 'CAPITAL DE GIRO',
  CPR: 'CPR',
  BARTER: 'BARTER',
  PRONAF: 'PRONAF',
  PRONAMP: 'PRONAMP',
  FCO: 'FCO',
  FNO: 'FNO',
  FINAME: 'FINAME',
  OUTROS: 'OUTROS'
};

export const BASE_CALCULO_TO_DB: Record<BaseCalculoJuros, PrismaBaseCalculoJuros> = {
  '252 dias úteis': PrismaBaseCalculoJuros.DIAS_UTEIS_252,
  '360 dias corridos': PrismaBaseCalculoJuros.DIAS_CORRIDOS_360,
  '365 dias corridos': PrismaBaseCalculoJuros.DIAS_CORRIDOS_365
};

export const BASE_CALCULO_FROM_DB: Record<PrismaBaseCalculoJuros, BaseCalculoJuros> = {
  DIAS_UTEIS_252: '252 dias úteis',
  DIAS_CORRIDOS_360: '360 dias corridos',
  DIAS_CORRIDOS_365: '365 dias corridos'
};

export const TIPO_CAPITALIZACAO_TO_DB: Record<TipoCapitalizacao, PrismaTipoCapitalizacao> = {
  Simples: PrismaTipoCapitalizacao.SIMPLES,
  Composta: PrismaTipoCapitalizacao.COMPOSTA
};

export const TIPO_CAPITALIZACAO_FROM_DB: Record<PrismaTipoCapitalizacao, TipoCapitalizacao> = {
  SIMPLES: 'Simples',
  COMPOSTA: 'Composta'
};

export const PERIODICIDADE_LIQUIDACAO_TO_DB: Record<PeriodicidadeLiquidacao, PrismaPeriodicidadeLiquidacao> = {
  Mensal: PrismaPeriodicidadeLiquidacao.MENSAL,
  Bimestral: PrismaPeriodicidadeLiquidacao.BIMESTRAL,
  Trimestral: PrismaPeriodicidadeLiquidacao.TRIMESTRAL,
  Quadrimestral: PrismaPeriodicidadeLiquidacao.QUADRIMESTRAL,
  Semestral: PrismaPeriodicidadeLiquidacao.SEMESTRAL,
  Anual: PrismaPeriodicidadeLiquidacao.ANUAL,
  Final: PrismaPeriodicidadeLiquidacao.FINAL
};

export const PERIODICIDADE_LIQUIDACAO_FROM_DB: Record<PrismaPeriodicidadeLiquidacao, PeriodicidadeLiquidacao> = {
  MENSAL: 'Mensal',
  BIMESTRAL: 'Bimestral',
  TRIMESTRAL: 'Trimestral',
  QUADRIMESTRAL: 'Quadrimestral',
  SEMESTRAL: 'Semestral',
  ANUAL: 'Anual',
  FINAL: 'Final'
};

export const PERIODICIDADE_ARRENDAMENTO_TO_DB: Record<PeriodicidadeArrendamento, PrismaPeriodicidadeArrendamento> = {
  Anual: PrismaPeriodicidadeArrendamento.ANUAL,
  Mensal: PrismaPeriodicidadeArrendamento.MENSAL,
  'Por Safra': PrismaPeriodicidadeArrendamento.POR_SAFRA
};

export const PERIODICIDADE_ARRENDAMENTO_FROM_DB: Record<PrismaPeriodicidadeArrendamento, PeriodicidadeArrendamento> = {
  ANUAL: 'Anual',
  MENSAL: 'Mensal',
  POR_SAFRA: 'Por Safra'
};

export const GRUPO_IRPF_TO_DB: Record<GrupoIrpfBem, PrismaGrupoIrpfBem> = {
  'Imóveis Rurais - ANEXO A': PrismaGrupoIrpfBem.IMOVEIS_RURAIS_ANEXO_A,
  'Imóveis Urbanos - ANEXO B': PrismaGrupoIrpfBem.IMOVEIS_URBANOS_ANEXO_B,
  'Benfeitorias e Instalações': PrismaGrupoIrpfBem.BENFEITORIAS_INSTALACOES,
  'Máquinas Agrícolas': PrismaGrupoIrpfBem.MAQUINAS_AGRICOLAS,
  'Implementos': PrismaGrupoIrpfBem.IMPLEMENTOS,
  'Veículos': PrismaGrupoIrpfBem.VEICULOS,
  'Estoque (Insumos e Grãos)': PrismaGrupoIrpfBem.ESTOQUE,
  'Participações Societárias': PrismaGrupoIrpfBem.PARTICIPACOES_SOCIETARIAS,
  'Disponibilidade e aplicações': PrismaGrupoIrpfBem.DISPONIBILIDADE_APLICACOES,
  'Contas a receber': PrismaGrupoIrpfBem.CONTAS_A_RECEBER,
  'Direitos e bens diversos': PrismaGrupoIrpfBem.DIREITOS_BENS_DIVERSOS
};

export const GRUPO_IRPF_FROM_DB: Record<PrismaGrupoIrpfBem, GrupoIrpfBem> = {
  IMOVEIS_RURAIS_ANEXO_A: 'Imóveis Rurais - ANEXO A',
  IMOVEIS_URBANOS_ANEXO_B: 'Imóveis Urbanos - ANEXO B',
  BENFEITORIAS_INSTALACOES: 'Benfeitorias e Instalações',
  MAQUINAS_AGRICOLAS: 'Máquinas Agrícolas',
  IMPLEMENTOS: 'Implementos',
  VEICULOS: 'Veículos',
  ESTOQUE: 'Estoque (Insumos e Grãos)',
  PARTICIPACOES_SOCIETARIAS: 'Participações Societárias',
  DISPONIBILIDADE_APLICACOES: 'Disponibilidade e aplicações',
  CONTAS_A_RECEBER: 'Contas a receber',
  DIREITOS_BENS_DIVERSOS: 'Direitos e bens diversos'
};

export const LIQUIDEZ_BEM_TO_DB: Record<LiquidezBem, PrismaLiquidezBem> = {
  Alta: PrismaLiquidezBem.ALTA,
  Média: PrismaLiquidezBem.MEDIA,
  Baixa: PrismaLiquidezBem.BAIXA
};

export const LIQUIDEZ_BEM_FROM_DB: Record<PrismaLiquidezBem, LiquidezBem> = {
  ALTA: 'Alta',
  MEDIA: 'Média',
  BAIXA: 'Baixa'
};

// Garantia.tipoAtivo/tipoGarantia, Capex.tipo/status e PerfilGrupoEconomico não têm mapa
// aqui: são `String` livre no Prisma (não enum), e Garantia.moeda reaproveita o enum
// `Currency` (BRL/USD) já usado por ContratoBancario.moeda — ASCII puro, sem tradução de
// rótulo necessária. Ver comentário em schema.prisma sobre por que esses campos ficaram
// como texto livre.
