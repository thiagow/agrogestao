// Painel Consolidado do Grupo (aba "Grupo Econômico") — computado ao vivo a partir dos
// Bens e Direitos e dos Sócios já persistidos, nunca armazenado como número solto (mesmo
// critério de src/lib/indicadores.ts).
//
// Mudança (09/10/2026, validação do cliente): a % de participação "no grupo" deixou de
// existir, então o ponderamento por sócio perdeu a base. Todo bem entra 100% — o
// "ponderado" é igual ao bruto; os campos continuam no resumo pra não quebrar a UI.
// "Patrimônio por Sócio" segue agrupando pelo sócio titular vinculado ao bem.
//
// Fix (20/08/2026): bruto/ponderado usam o mesmo fallback já usado pela aba Bens e
// Direitos pra somar o subtotal por categoria (valorMercadoEstimado ?? valorDeclaradoIrpf
// ?? 0, ver CadastroMestreView.tsx) — antes só olhava valorMercadoEstimado, então um bem
// com só o valor de IRPF preenchido somava na aba mas desaparecia do Painel Consolidado.
// A garantia continua só sobre valorMercadoEstimado: LTV sobre um valor autodeclarado de
// IRPF não é uma base de empréstimo razoável.

import type { BemDireito, Socio } from '@/types';

export interface PatrimonioSocioResumo {
  socioId: string | null; // null = "Grupo" (bens sem sócio vinculado)
  nome: string;
  patrimonioBruto: number;
  patrimonioPonderado: number;
}

export interface PatrimonioGrupoResumo {
  patrimonioTotalBruto: number;
  patrimonioPonderado: number;
  garantiaPonderadaTotal: number;
  porSocio: PatrimonioSocioResumo[];
}

function valorGarantiaEstimado(bem: BemDireito): number {
  if (!bem.elegivelGarantia || bem.valorMercadoEstimado == null || bem.ltv == null) return 0;
  return bem.valorMercadoEstimado * (bem.ltv / 100);
}

export function calcularPatrimonioGrupo(bens: BemDireito[], socios: Socio[]): PatrimonioGrupoResumo {
  let patrimonioTotalBruto = 0;
  let patrimonioPonderado = 0;
  let garantiaPonderadaTotal = 0;

  const brutoPorSocio = new Map<string | null, number>();
  const garantiaPorSocio = new Map<string | null, number>();

  for (const bem of bens) {
    const bruto = bem.valorMercadoEstimado ?? bem.valorDeclaradoIrpf ?? 0;
    const garantia = valorGarantiaEstimado(bem);
    const chave = bem.socioId ?? null;

    patrimonioTotalBruto += bruto;
    patrimonioPonderado += bruto;
    garantiaPonderadaTotal += garantia;

    brutoPorSocio.set(chave, (brutoPorSocio.get(chave) ?? 0) + bruto);
    garantiaPorSocio.set(chave, (garantiaPorSocio.get(chave) ?? 0) + garantia);
  }

  const porSocio: PatrimonioSocioResumo[] = socios
    .filter((s) => brutoPorSocio.has(s.id))
    .map((s) => {
      const bruto = brutoPorSocio.get(s.id) ?? 0;
      return {
        socioId: s.id,
        nome: s.nome,
        patrimonioBruto: bruto,
        patrimonioPonderado: bruto
      };
    });

  const brutoGrupo = brutoPorSocio.get(null) ?? 0;
  if (brutoGrupo > 0) {
    porSocio.push({
      socioId: null,
      nome: 'Grupo (sem sócio específico)',
      patrimonioBruto: brutoGrupo,
      patrimonioPonderado: brutoGrupo
    });
  }

  return { patrimonioTotalBruto, patrimonioPonderado, garantiaPonderadaTotal, porSocio };
}
