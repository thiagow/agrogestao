'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireContext } from '@/lib/session';
import { quadroPecuariaBovinaSchema } from '@/lib/validation';
import type { PecuariaBovinaAno } from '@/types';

export async function listQuadroPecuariaBovina(): Promise<PecuariaBovinaAno[]> {
  const ctx = await requireContext();
  if (!ctx.propriedade) return [];

  const rows = await db.quadroPecuariaBovina.findMany({
    where: { propriedadeId: ctx.propriedade.id, ativo: true },
    orderBy: { anoCivil: 'asc' }
  });

  return rows.map(toPecuariaBovinaDTO);
}

interface SaveQuadroPecuariaBovinaInput {
  id?: string;
  anoCivil: number;
  femeas0a12: number;
  femeas12a24: number;
  femeas24a36: number;
  femeasAcima36: number;
  machos0a12: number;
  machos12a24: number;
  machos24a36: number;
  machosAcima36: number;
  cicloProdutivo: string;
  areaPastagemPropria: number;
  areaPastagemArrendada: number;
  tipoTerminacao: string;
  custoAquisicaoPorCabeca: number;
  custoPastagemPorHectare: number;
  diariaConfinamento: number;
  diasConfinamento: number;
  qtdAnimaisConfinados: number;
  qtdMachosComercializados: number;
  pesoMedioMachos: number;
  precoMedioMachos: number;
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

export async function saveQuadroPecuariaBovina(input: SaveQuadroPecuariaBovinaInput): Promise<PecuariaBovinaAno> {
  const ctx = await requireContext();
  if (!ctx.propriedade) throw new Error('Nenhuma propriedade selecionada.');

  const parsed = quadroPecuariaBovinaSchema.parse(input);

  const duplicado = await db.quadroPecuariaBovina.findFirst({
    where: {
      propriedadeId: ctx.propriedade.id,
      anoCivil: parsed.anoCivil,
      ativo: true,
      ...(input.id ? { id: { not: input.id } } : {})
    }
  });
  if (duplicado) throw new Error(`Já existe um registro de Pecuária Bovina para o ano ${parsed.anoCivil}.`);

  const row = input.id
    ? await db.quadroPecuariaBovina.update({
        where: { id: input.id, propriedadeId: ctx.propriedade.id },
        data: { ...parsed, updatedById: ctx.user.id }
      })
    : await db.quadroPecuariaBovina.create({
        data: { ...parsed, propriedadeId: ctx.propriedade.id, createdById: ctx.user.id }
      });

  revalidatePath('/quadro_safra');
  revalidatePath('/fluxo_safra');
  revalidatePath('/fluxo_mensal');
  revalidatePath('/analise_financeira');
  return toPecuariaBovinaDTO(row);
}

export async function deleteQuadroPecuariaBovina(id: string) {
  const ctx = await requireContext();
  if (!ctx.propriedade) throw new Error('Nenhuma propriedade selecionada.');

  await db.quadroPecuariaBovina.updateMany({
    where: { id, propriedadeId: ctx.propriedade.id },
    data: { ativo: false, updatedById: ctx.user.id }
  });

  revalidatePath('/quadro_safra');
  revalidatePath('/fluxo_safra');
  revalidatePath('/fluxo_mensal');
  revalidatePath('/analise_financeira');
}

type QuadroPecuariaBovinaRow = {
  id: string;
  anoCivil: number;
  femeas0a12: number;
  femeas12a24: number;
  femeas24a36: number;
  femeasAcima36: number;
  machos0a12: number;
  machos12a24: number;
  machos24a36: number;
  machosAcima36: number;
  cicloProdutivo: string;
  areaPastagemPropria: unknown;
  areaPastagemArrendada: unknown;
  tipoTerminacao: string;
  custoAquisicaoPorCabeca: unknown;
  custoPastagemPorHectare: unknown;
  diariaConfinamento: unknown;
  diasConfinamento: number;
  qtdAnimaisConfinados: number;
  qtdMachosComercializados: number;
  pesoMedioMachos: unknown;
  precoMedioMachos: unknown;
  qtdFemeasComercializadas: number;
  pesoMedioFemeas: unknown;
  precoMedioFemeas: unknown;
  qtdOutrasComercializadas: number;
  pesoMedioOutras: unknown;
  precoMedioOutras: unknown;
  capacidadeLotacaoConfinamento: number;
  ganhoPesoMedioDiarioKg: unknown;
  diasConfinamentoPorLote: number;
};

function toPecuariaBovinaDTO(row: QuadroPecuariaBovinaRow): PecuariaBovinaAno {
  return {
    id: row.id,
    anoCivil: row.anoCivil,
    femeas0a12: row.femeas0a12,
    femeas12a24: row.femeas12a24,
    femeas24a36: row.femeas24a36,
    femeasAcima36: row.femeasAcima36,
    machos0a12: row.machos0a12,
    machos12a24: row.machos12a24,
    machos24a36: row.machos24a36,
    machosAcima36: row.machosAcima36,
    cicloProdutivo: row.cicloProdutivo,
    areaPastagemPropria: Number(row.areaPastagemPropria),
    areaPastagemArrendada: Number(row.areaPastagemArrendada),
    tipoTerminacao: row.tipoTerminacao,
    custoAquisicaoPorCabeca: Number(row.custoAquisicaoPorCabeca),
    custoPastagemPorHectare: Number(row.custoPastagemPorHectare),
    diariaConfinamento: Number(row.diariaConfinamento),
    diasConfinamento: row.diasConfinamento,
    qtdAnimaisConfinados: row.qtdAnimaisConfinados,
    qtdMachosComercializados: row.qtdMachosComercializados,
    pesoMedioMachos: Number(row.pesoMedioMachos),
    precoMedioMachos: Number(row.precoMedioMachos),
    qtdFemeasComercializadas: row.qtdFemeasComercializadas,
    pesoMedioFemeas: Number(row.pesoMedioFemeas),
    precoMedioFemeas: Number(row.precoMedioFemeas),
    qtdOutrasComercializadas: row.qtdOutrasComercializadas,
    pesoMedioOutras: Number(row.pesoMedioOutras),
    precoMedioOutras: Number(row.precoMedioOutras),
    capacidadeLotacaoConfinamento: row.capacidadeLotacaoConfinamento,
    ganhoPesoMedioDiarioKg: Number(row.ganhoPesoMedioDiarioKg),
    diasConfinamentoPorLote: row.diasConfinamentoPorLote
  };
}
