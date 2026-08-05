// Regras de negócio agrícolas puras — extraídas de src/data/initialData.ts.

/** CP se o vencimento estiver a até 360 dias de hoje; senão LP. Regra da engenharia reversa do AgroFlow. */
export function isCurtoPrazo(vencimentoDateStr: string): boolean {
  if (!vencimentoDateStr) return true;
  const today = new Date();
  const venc = new Date(vencimentoDateStr);
  const diffTime = venc.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 360;
}

const MESES_LABEL = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function mesLabel(mes: number): string {
  return MESES_LABEL[mes - 1] ?? String(mes);
}

export interface CulturaSafraCalculavel {
  hectares: number;
  rendimento: number;
  precoMedio: number;
  despesa: number;
}

export function calcularSafra(registro: CulturaSafraCalculavel) {
  const totalProducao = Math.round(registro.hectares * registro.rendimento);
  const receitaBruta = Math.round(totalProducao * registro.precoMedio);
  const receitaLiquida = receitaBruta - registro.despesa;
  const margem = receitaBruta > 0 ? (receitaLiquida / receitaBruta) * 100 : 0;

  return { totalProducao, receitaBruta, receitaLiquida, margem };
}
