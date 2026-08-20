'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireContext } from '@/lib/session';
import { bemDireitoSchema } from '@/lib/validation';
import { GRUPO_IRPF_TO_DB, GRUPO_IRPF_FROM_DB, LIQUIDEZ_BEM_TO_DB, LIQUIDEZ_BEM_FROM_DB } from '@/lib/enum-maps';
import type { BemDireito } from '@/types';

const INCLUDE_BEM = {
  socio: { select: { nome: true } },
  detalheImovelRural: true,
  detalheImovelUrbano: true
} as const;

export async function listBensDireitos(): Promise<BemDireito[]> {
  const ctx = await requireContext();
  const rows = await db.bemDireito.findMany({
    where: { contaId: ctx.conta.id, ativo: true },
    include: INCLUDE_BEM,
    orderBy: { createdAt: 'desc' }
  });
  return rows.map(toBemDireitoDTO);
}

interface SaveDetalheImovelRuralInput {
  denominacaoImovel: string;
  municipioUf: string;
  matricula?: string;
  areaHa: number;
  areaPropriaPlantadaHa?: number;
  areaReservasPastagensOutrosHa?: number;
  valorMercadoHa?: number;
  situacaoCredor?: string;
}

interface SaveDetalheImovelUrbanoInput {
  descricao: string;
  matricula?: string;
  cidade: string;
}

interface SaveBemDireitoInput {
  id?: string;
  socioId?: string;
  grupoIrpf: string;
  codigoTipo: string;
  descricao: string;
  valorDeclaradoIrpf?: number;
  valorMercadoEstimado?: number;
  dataAquisicao?: string;
  valorAquisicao?: number;
  liquidez?: string;
  ltv?: number;
  elegivelGarantia?: boolean;
  geraFluxoCaixa?: boolean;
  observacoes?: string;
  detalheImovelRural?: SaveDetalheImovelRuralInput;
  detalheImovelUrbano?: SaveDetalheImovelUrbanoInput;
}

export async function saveBemDireito(input: SaveBemDireitoInput): Promise<BemDireito> {
  const ctx = await requireContext();
  const parsed = bemDireitoSchema.parse(input);

  const socioId = parsed.socioId || null;
  if (socioId) {
    const socio = await db.socio.findFirst({ where: { id: socioId, contaId: ctx.conta.id, ativo: true } });
    if (!socio) throw new Error('Sócio titular inválido.');
  }

  const data = {
    socioId,
    grupoIrpf: GRUPO_IRPF_TO_DB[parsed.grupoIrpf],
    codigoTipo: parsed.codigoTipo,
    descricao: parsed.descricao,
    valorDeclaradoIrpf: parsed.valorDeclaradoIrpf ?? null,
    valorMercadoEstimado: parsed.valorMercadoEstimado ?? null,
    dataAquisicao: parsed.dataAquisicao ? new Date(parsed.dataAquisicao) : null,
    valorAquisicao: parsed.valorAquisicao ?? null,
    liquidez: LIQUIDEZ_BEM_TO_DB[parsed.liquidez],
    ltv: parsed.ltv ?? null,
    elegivelGarantia: parsed.elegivelGarantia,
    geraFluxoCaixa: parsed.geraFluxoCaixa,
    observacoes: parsed.observacoes || null
  };

  const bemId = await db.$transaction(async (tx) => {
    const row = input.id
      ? await tx.bemDireito.update({ where: { id: input.id }, data: { ...data, updatedById: ctx.user.id } })
      : await tx.bemDireito.create({ data: { ...data, contaId: ctx.conta.id, createdById: ctx.user.id } });

    // Detalhe 1:1 do ANEXO A/B — sempre substituído por completo (upsert), e removido
    // se a categoria mudou pra algo que não é mais ANEXO A/B.
    if (parsed.detalheImovelRural) {
      await tx.detalheImovelRural.upsert({
        where: { bemDireitoId: row.id },
        update: parsed.detalheImovelRural,
        create: { ...parsed.detalheImovelRural, bemDireitoId: row.id }
      });
    } else {
      await tx.detalheImovelRural.deleteMany({ where: { bemDireitoId: row.id } });
    }

    if (parsed.detalheImovelUrbano) {
      await tx.detalheImovelUrbano.upsert({
        where: { bemDireitoId: row.id },
        update: parsed.detalheImovelUrbano,
        create: { ...parsed.detalheImovelUrbano, bemDireitoId: row.id }
      });
    } else {
      await tx.detalheImovelUrbano.deleteMany({ where: { bemDireitoId: row.id } });
    }

    return row.id;
  });

  revalidatePath('/cadastro_mestre');

  const saved = await db.bemDireito.findUniqueOrThrow({ where: { id: bemId }, include: INCLUDE_BEM });
  return toBemDireitoDTO(saved);
}

export async function deleteBemDireito(id: string) {
  const ctx = await requireContext();
  await db.bemDireito.updateMany({
    where: { id, contaId: ctx.conta.id },
    data: { ativo: false, updatedById: ctx.user.id }
  });
  revalidatePath('/cadastro_mestre');
}

function toBemDireitoDTO(row: {
  id: string;
  socioId: string | null;
  socio: { nome: string } | null;
  grupoIrpf: string;
  codigoTipo: string;
  descricao: string;
  valorDeclaradoIrpf: unknown;
  valorMercadoEstimado: unknown;
  dataAquisicao: Date | null;
  valorAquisicao: unknown;
  liquidez: string;
  ltv: unknown;
  elegivelGarantia: boolean;
  geraFluxoCaixa: boolean;
  observacoes: string | null;
  detalheImovelRural: {
    denominacaoImovel: string;
    municipioUf: string;
    matricula: string | null;
    areaHa: number;
    areaPropriaPlantadaHa: number | null;
    areaReservasPastagensOutrosHa: number | null;
    valorMercadoHa: unknown;
    situacaoCredor: string | null;
  } | null;
  detalheImovelUrbano: { descricao: string; matricula: string | null; cidade: string } | null;
}): BemDireito {
  return {
    id: row.id,
    socioId: row.socioId ?? undefined,
    socioNome: row.socio?.nome,
    grupoIrpf: GRUPO_IRPF_FROM_DB[row.grupoIrpf as keyof typeof GRUPO_IRPF_FROM_DB],
    codigoTipo: row.codigoTipo,
    descricao: row.descricao,
    valorDeclaradoIrpf: row.valorDeclaradoIrpf != null ? Number(row.valorDeclaradoIrpf) : undefined,
    valorMercadoEstimado: row.valorMercadoEstimado != null ? Number(row.valorMercadoEstimado) : undefined,
    dataAquisicao: row.dataAquisicao ? row.dataAquisicao.toISOString().slice(0, 10) : undefined,
    valorAquisicao: row.valorAquisicao != null ? Number(row.valorAquisicao) : undefined,
    liquidez: LIQUIDEZ_BEM_FROM_DB[row.liquidez as keyof typeof LIQUIDEZ_BEM_FROM_DB],
    ltv: row.ltv != null ? Number(row.ltv) : undefined,
    elegivelGarantia: row.elegivelGarantia,
    geraFluxoCaixa: row.geraFluxoCaixa,
    observacoes: row.observacoes ?? undefined,
    detalheImovelRural: row.detalheImovelRural
      ? {
          denominacaoImovel: row.detalheImovelRural.denominacaoImovel,
          municipioUf: row.detalheImovelRural.municipioUf,
          matricula: row.detalheImovelRural.matricula ?? undefined,
          areaHa: row.detalheImovelRural.areaHa,
          areaPropriaPlantadaHa: row.detalheImovelRural.areaPropriaPlantadaHa ?? undefined,
          areaReservasPastagensOutrosHa: row.detalheImovelRural.areaReservasPastagensOutrosHa ?? undefined,
          valorMercadoHa: row.detalheImovelRural.valorMercadoHa != null ? Number(row.detalheImovelRural.valorMercadoHa) : undefined,
          situacaoCredor: row.detalheImovelRural.situacaoCredor ?? undefined
        }
      : undefined,
    detalheImovelUrbano: row.detalheImovelUrbano
      ? {
          descricao: row.detalheImovelUrbano.descricao,
          matricula: row.detalheImovelUrbano.matricula ?? undefined,
          cidade: row.detalheImovelUrbano.cidade
        }
      : undefined
  };
}
