// Prisma exige identificadores de enum em ASCII (ver prisma/schema.prisma);
// os rótulos acentuados de src/types.ts, usados pela UI, ficam preservados
// via @map como o valor gravado no banco — mas o *client* do Prisma sempre
// fala com o identificador ASCII, nunca com o rótulo. Este arquivo traduz
// nos dois sentidos, no boundary de servidor.

import type {
  Category,
  EstadoCivil,
  TipoTaxaBancaria,
  PeriodicidadePagamento,
  PeriodicidadeArrendamento,
  GrupoIrpfBem,
  LiquidezBem,
  GarantiaTipo,
  CapexCategoria,
  TipoRelacaoEmpresa
} from '@/types';
import {
  Category as PrismaCategory,
  EstadoCivil as PrismaEstadoCivil,
  TipoTaxaBancaria as PrismaTipoTaxaBancaria,
  PeriodicidadePagamento as PrismaPeriodicidadePagamento,
  PeriodicidadeArrendamento as PrismaPeriodicidadeArrendamento,
  GrupoIrpfBem as PrismaGrupoIrpfBem,
  LiquidezBem as PrismaLiquidezBem,
  GarantiaTipo as PrismaGarantiaTipo,
  CapexCategoria as PrismaCapexCategoria,
  TipoRelacaoEmpresa as PrismaTipoRelacaoEmpresa
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

export const TIPO_TAXA_TO_DB: Record<TipoTaxaBancaria, PrismaTipoTaxaBancaria> = {
  CDI: PrismaTipoTaxaBancaria.CDI,
  PRIME: PrismaTipoTaxaBancaria.PRIME,
  PRÉ: PrismaTipoTaxaBancaria.PRE,
  FLUTUANTE: PrismaTipoTaxaBancaria.FLUTUANTE
};

export const TIPO_TAXA_FROM_DB: Record<PrismaTipoTaxaBancaria, TipoTaxaBancaria> = {
  CDI: 'CDI',
  PRIME: 'PRIME',
  PRE: 'PRÉ',
  FLUTUANTE: 'FLUTUANTE'
};

export const PERIODICIDADE_TO_DB: Record<PeriodicidadePagamento, PrismaPeriodicidadePagamento> = {
  Mensal: PrismaPeriodicidadePagamento.MENSAL,
  Trimestral: PrismaPeriodicidadePagamento.TRIMESTRAL,
  Semestral: PrismaPeriodicidadePagamento.SEMESTRAL,
  Anual: PrismaPeriodicidadePagamento.ANUAL
};

export const PERIODICIDADE_FROM_DB: Record<PrismaPeriodicidadePagamento, PeriodicidadePagamento> = {
  MENSAL: 'Mensal',
  TRIMESTRAL: 'Trimestral',
  SEMESTRAL: 'Semestral',
  ANUAL: 'Anual'
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
  'Bens Imóveis': PrismaGrupoIrpfBem.BENS_IMOVEIS,
  'Bens Móveis': PrismaGrupoIrpfBem.BENS_MOVEIS,
  'Participações Societárias': PrismaGrupoIrpfBem.PARTICIPACOES_SOCIETARIAS,
  'Aplicações e Investimentos': PrismaGrupoIrpfBem.APLICACOES_INVESTIMENTOS,
  'Depósitos à Vista e Poupança': PrismaGrupoIrpfBem.DEPOSITOS_POUPANCA,
  'Créditos e Outros Direitos': PrismaGrupoIrpfBem.CREDITOS_DIREITOS,
  Criptoativos: PrismaGrupoIrpfBem.CRIPTOATIVOS,
  'Outros Bens e Direitos': PrismaGrupoIrpfBem.OUTROS_BENS
};

export const GRUPO_IRPF_FROM_DB: Record<PrismaGrupoIrpfBem, GrupoIrpfBem> = {
  BENS_IMOVEIS: 'Bens Imóveis',
  BENS_MOVEIS: 'Bens Móveis',
  PARTICIPACOES_SOCIETARIAS: 'Participações Societárias',
  APLICACOES_INVESTIMENTOS: 'Aplicações e Investimentos',
  DEPOSITOS_POUPANCA: 'Depósitos à Vista e Poupança',
  CREDITOS_DIREITOS: 'Créditos e Outros Direitos',
  CRIPTOATIVOS: 'Criptoativos',
  OUTROS_BENS: 'Outros Bens e Direitos'
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

export const GARANTIA_TIPO_TO_DB: Record<GarantiaTipo, PrismaGarantiaTipo> = {
  Imóvel: PrismaGarantiaTipo.IMOVEL,
  Aval: PrismaGarantiaTipo.AVAL,
  Penhor: PrismaGarantiaTipo.PENHOR,
  'Alienação Fiduciária': PrismaGarantiaTipo.ALIENACAO_FIDUCIARIA,
  Outros: PrismaGarantiaTipo.OUTROS
};

export const GARANTIA_TIPO_FROM_DB: Record<PrismaGarantiaTipo, GarantiaTipo> = {
  IMOVEL: 'Imóvel',
  AVAL: 'Aval',
  PENHOR: 'Penhor',
  ALIENACAO_FIDUCIARIA: 'Alienação Fiduciária',
  OUTROS: 'Outros'
};

export const CAPEX_CATEGORIA_TO_DB: Record<CapexCategoria, PrismaCapexCategoria> = {
  Maquinário: PrismaCapexCategoria.MAQUINARIO,
  Benfeitoria: PrismaCapexCategoria.BENFEITORIA,
  Tecnologia: PrismaCapexCategoria.TECNOLOGIA,
  Infraestrutura: PrismaCapexCategoria.INFRAESTRUTURA,
  Outros: PrismaCapexCategoria.OUTROS
};

export const CAPEX_CATEGORIA_FROM_DB: Record<PrismaCapexCategoria, CapexCategoria> = {
  MAQUINARIO: 'Maquinário',
  BENFEITORIA: 'Benfeitoria',
  TECNOLOGIA: 'Tecnologia',
  INFRAESTRUTURA: 'Infraestrutura',
  OUTROS: 'Outros'
};

export const TIPO_RELACAO_EMPRESA_TO_DB: Record<TipoRelacaoEmpresa, PrismaTipoRelacaoEmpresa> = {
  Controladora: PrismaTipoRelacaoEmpresa.CONTROLADORA,
  Controlada: PrismaTipoRelacaoEmpresa.CONTROLADA,
  Coligada: PrismaTipoRelacaoEmpresa.COLIGADA,
  Outras: PrismaTipoRelacaoEmpresa.OUTRAS
};

export const TIPO_RELACAO_EMPRESA_FROM_DB: Record<PrismaTipoRelacaoEmpresa, TipoRelacaoEmpresa> = {
  CONTROLADORA: 'Controladora',
  CONTROLADA: 'Controlada',
  COLIGADA: 'Coligada',
  OUTRAS: 'Outras'
};
