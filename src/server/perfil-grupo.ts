'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireContext } from '@/lib/session';
import { perfilGrupoSchema } from '@/lib/validation';
import type { PerfilGrupoEconomico } from '@/types';

export async function getPerfilGrupo(): Promise<PerfilGrupoEconomico | null> {
  const ctx = await requireContext();
  const row = await db.perfilGrupoEconomico.findUnique({ where: { contaId: ctx.conta.id } });
  return row ? toPerfilGrupoDTO(row) : null;
}

// Upsert parcial — usado tanto pelo Drawer de edição do perfil (email/telefone/...)
// quanto pelo Salvar de cada bloco do Histórico do Grupo, por isso todo campo é
// opcional e um `undefined` não sobrescreve o que já está salvo. Nome/razaoSocial/cnpj do
// grupo não entram aqui — são de Conta, geridos só pelo Admin Master (src/server/contas.ts).
const CAMPOS_TEXTO = [
  'email',
  'telefone',
  'atividadePrincipal',
  'sede',
  'consultorResponsavel',
  'historicoInicio',
  'historicoHerancaOrigem',
  'historicoEvolucaoNegocio',
  'historicoGestaoCrises',
  'gestaoAdministracao',
  'gestaoParceriasSocios',
  'gestaoDivisaoCustosFaturamento',
  'gestaoPlanoSucessorioHerdeiros',
  'agriculturaCustos',
  'agriculturaCronogramaPlantioColheita',
  'agriculturaCapacidadeArmazenamento',
  'agriculturaFornecedoresClientes',
  'agriculturaModalidadesCompra',
  'agriculturaExportacao',
  'pecuariaCicloProducao',
  'pecuariaConfinamento',
  'pecuariaCustosCronogramaCompraAbate',
  'financeiroFinanciamentos',
  'financeiroPoliticaHedge',
  'financeiroPosicaoComercializadaSafraAtual',
  'empresasColigadas',
  'missao',
  'visao',
  'valores'
] as const;

export async function savePerfilGrupo(input: Partial<PerfilGrupoEconomico>): Promise<PerfilGrupoEconomico> {
  const ctx = await requireContext();
  const parsed = perfilGrupoSchema.parse(input);

  const data: Record<string, unknown> = { updatedById: ctx.user.id };
  for (const campo of CAMPOS_TEXTO) {
    const valor = parsed[campo];
    if (valor !== undefined) data[campo] = valor || null;
  }
  if (parsed.fundacao !== undefined) data.fundacao = parsed.fundacao ? new Date(parsed.fundacao) : null;
  if (parsed.pecuariaTaxaDesfrutePercent !== undefined) {
    data.pecuariaTaxaDesfrutePercent = parsed.pecuariaTaxaDesfrutePercent ?? null;
  }

  const row = await db.perfilGrupoEconomico.upsert({
    where: { contaId: ctx.conta.id },
    update: data,
    create: { ...data, contaId: ctx.conta.id }
  });

  revalidatePath('/cadastro_mestre');
  return toPerfilGrupoDTO(row);
}

function toPerfilGrupoDTO(row: {
  email: string | null;
  telefone: string | null;
  atividadePrincipal: string | null;
  fundacao: Date | null;
  sede: string | null;
  consultorResponsavel: string | null;
  historicoInicio: string | null;
  historicoHerancaOrigem: string | null;
  historicoEvolucaoNegocio: string | null;
  historicoGestaoCrises: string | null;
  gestaoAdministracao: string | null;
  gestaoParceriasSocios: string | null;
  gestaoDivisaoCustosFaturamento: string | null;
  gestaoPlanoSucessorioHerdeiros: string | null;
  agriculturaCustos: string | null;
  agriculturaCronogramaPlantioColheita: string | null;
  agriculturaCapacidadeArmazenamento: string | null;
  agriculturaFornecedoresClientes: string | null;
  agriculturaModalidadesCompra: string | null;
  agriculturaExportacao: string | null;
  pecuariaCicloProducao: string | null;
  pecuariaConfinamento: string | null;
  pecuariaTaxaDesfrutePercent: unknown;
  pecuariaCustosCronogramaCompraAbate: string | null;
  financeiroFinanciamentos: string | null;
  financeiroPoliticaHedge: string | null;
  financeiroPosicaoComercializadaSafraAtual: string | null;
  empresasColigadas: string | null;
  missao: string | null;
  visao: string | null;
  valores: string | null;
}): PerfilGrupoEconomico {
  return {
    email: row.email ?? undefined,
    telefone: row.telefone ?? undefined,
    atividadePrincipal: row.atividadePrincipal ?? undefined,
    fundacao: row.fundacao ? row.fundacao.toISOString().slice(0, 10) : undefined,
    sede: row.sede ?? undefined,
    consultorResponsavel: row.consultorResponsavel ?? undefined,
    historicoInicio: row.historicoInicio ?? undefined,
    historicoHerancaOrigem: row.historicoHerancaOrigem ?? undefined,
    historicoEvolucaoNegocio: row.historicoEvolucaoNegocio ?? undefined,
    historicoGestaoCrises: row.historicoGestaoCrises ?? undefined,
    gestaoAdministracao: row.gestaoAdministracao ?? undefined,
    gestaoParceriasSocios: row.gestaoParceriasSocios ?? undefined,
    gestaoDivisaoCustosFaturamento: row.gestaoDivisaoCustosFaturamento ?? undefined,
    gestaoPlanoSucessorioHerdeiros: row.gestaoPlanoSucessorioHerdeiros ?? undefined,
    agriculturaCustos: row.agriculturaCustos ?? undefined,
    agriculturaCronogramaPlantioColheita: row.agriculturaCronogramaPlantioColheita ?? undefined,
    agriculturaCapacidadeArmazenamento: row.agriculturaCapacidadeArmazenamento ?? undefined,
    agriculturaFornecedoresClientes: row.agriculturaFornecedoresClientes ?? undefined,
    agriculturaModalidadesCompra: row.agriculturaModalidadesCompra ?? undefined,
    agriculturaExportacao: row.agriculturaExportacao ?? undefined,
    pecuariaCicloProducao: row.pecuariaCicloProducao ?? undefined,
    pecuariaConfinamento: row.pecuariaConfinamento ?? undefined,
    pecuariaTaxaDesfrutePercent: row.pecuariaTaxaDesfrutePercent != null ? Number(row.pecuariaTaxaDesfrutePercent) : undefined,
    pecuariaCustosCronogramaCompraAbate: row.pecuariaCustosCronogramaCompraAbate ?? undefined,
    financeiroFinanciamentos: row.financeiroFinanciamentos ?? undefined,
    financeiroPoliticaHedge: row.financeiroPoliticaHedge ?? undefined,
    financeiroPosicaoComercializadaSafraAtual: row.financeiroPosicaoComercializadaSafraAtual ?? undefined,
    empresasColigadas: row.empresasColigadas ?? undefined,
    missao: row.missao ?? undefined,
    visao: row.visao ?? undefined,
    valores: row.valores ?? undefined
  };
}
