'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireContext } from '@/lib/session';
import { safraDoAno, anoInicioSafra } from '@/lib/safra-periodo';

/** Safras da conta atual — usado no select "Safra Vinculada" de Contrato Bancário. */
export async function listSafras() {
  const ctx = await requireContext();
  return db.safra.findMany({
    where: { contaId: ctx.conta.id, ativo: true },
    orderBy: { anoSafra: 'desc' }
  });
}

/**
 * Safra vigente da conta — fonte única de verdade para os badges
 * Realizado/Atual/Previsão e para as opções de "Ano Safra" no Quadro de
 * Produção (10/09/2026). Reaproveita o model `Safra`/campo `atual`, existente
 * desde a Fase 3 mas nunca lido/escrito até aqui.
 *
 * Sem nenhuma safra marcada como `atual` (conta nova, ou nenhuma tela de
 * gestão usada ainda), cai para a maior `anoSafra` ativa como fallback
 * determinístico — nunca lança erro por falta de configuração.
 */
export async function getSafraAtual(): Promise<string | null> {
  const ctx = await requireContext();
  const marcada = await db.safra.findFirst({
    where: { contaId: ctx.conta.id, ativo: true, atual: true }
  });
  if (marcada) return marcada.anoSafra;

  const maisRecente = await db.safra.findFirst({
    where: { contaId: ctx.conta.id, ativo: true },
    orderBy: { anoSafra: 'desc' }
  });
  return maisRecente?.anoSafra ?? null;
}

/**
 * Marca uma safra como vigente, desmarcando qualquer outra da mesma conta —
 * transação evita ficar com 2 (ou 0) safras `atual: true` num crash a meio
 * caminho.
 */
export async function setSafraAtual(safraId: string): Promise<void> {
  const ctx = await requireContext();

  await db.$transaction(async (tx) => {
    const alvo = await tx.safra.findFirst({ where: { id: safraId, contaId: ctx.conta.id } });
    if (!alvo) throw new Error('Safra não encontrada');

    await tx.safra.updateMany({ where: { contaId: ctx.conta.id, atual: true }, data: { atual: false } });
    await tx.safra.update({ where: { id: safraId }, data: { atual: true } });
  });

  revalidatePath('/quadro_safra');
}

/**
 * Cadastra uma nova safra na conta — usado pela UI mínima de gestão de safra
 * vigente dentro do Quadro de Produção. `marcarComoAtual` já resolve o caso
 * comum (cadastrar a próxima safra e virar o ano de referência do sistema
 * numa ação só). Devolve o registro criado/atualizado para o client atualizar
 * seu estado local sem precisar de um round-trip extra.
 */
export async function createSafra(anoSafra: string, marcarComoAtual = false) {
  const ctx = await requireContext();
  if (!/^\d{4}\/\d{4}$/.test(anoSafra)) throw new Error('Formato esperado: AAAA/AAAA');

  const safra = await db.$transaction(async (tx) => {
    const registro = await tx.safra.upsert({
      where: { contaId_anoSafra: { contaId: ctx.conta.id, anoSafra } },
      update: { ativo: true },
      create: { contaId: ctx.conta.id, anoSafra }
    });

    if (marcarComoAtual) {
      await tx.safra.updateMany({ where: { contaId: ctx.conta.id, atual: true }, data: { atual: false } });
      return tx.safra.update({ where: { id: registro.id }, data: { atual: true } });
    }
    return registro;
  });

  revalidatePath('/quadro_safra');
  return safra;
}

/**
 * Lista dinâmica de opções de "Ano Safra" para o Quadro de Produção: todas as
 * safras já cadastradas (ativas) na conta, garantindo que a safra atual e a
 * próxima também apareçam mesmo que ainda não tenham nenhum lançamento no
 * Quadro Safra — nunca um ano arbitrário digitado (10/09/2026).
 */
export async function listOpcoesAnoSafra(): Promise<string[]> {
  const ctx = await requireContext();
  const safras = await db.safra.findMany({ where: { contaId: ctx.conta.id, ativo: true }, select: { anoSafra: true } });
  const atual = await getSafraAtual();

  const anos = new Set(safras.map((s) => s.anoSafra));
  if (atual) {
    anos.add(atual);
    anos.add(safraDoAno(anoInicioSafra(atual) + 1)); // próxima safra
  }
  return Array.from(anos).sort((a, b) => anoInicioSafra(a) - anoInicioSafra(b));
}
