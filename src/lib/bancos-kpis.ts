// KPIs do topo de Bancos (Saldo Devedor Total, CP, LP, Custo Médio Ponderado)
// — retorno do cliente (21/10/2026): o valor somava dólar junto com real. O
// certo é converter, "conforme o fluxo detalhado, na parte da amortização":
// `Parcela` já é persistida em BRL (src/server/cronograma-engine.ts), então o
// saldo devedor de cada contrato é a soma da AMORTIZAÇÃO das parcelas futuras
// (mesma fonte do Fluxo Detalhado e de splitBancosCpLp, do Balanço), e CP + LP
// fecha sempre com o Total. Função pura, sem I/O.

export interface ContratoParaKpi {
  id: string;
  moeda: 'BRL' | 'USD' | string;
  saldoAtual: number;
  dataVencimento: string; // YYYY-MM-DD
  taxaJuros: number;
  taxaEfetivaAplicada?: number | null;
  ptaxInicial?: number | null;
}

export interface ParcelaParaKpi {
  data: string; // YYYY-MM-DD
  amortizacao: number; // BRL
}

export interface ContratoKpi {
  id: string;
  saldoBrl: number;
  cpBrl: number;
  lpBrl: number;
  /** true quando o contrato é USD, não tem parcelas e não há cotação nenhuma pra converter — o valor entra sem conversão. */
  semConversao: boolean;
}

export interface KpisBancos {
  porContrato: Map<string, ContratoKpi>;
  saldoTotal: number;
  curtoPrazo: number;
  longoPrazo: number;
  custoMedioPonderado: number;
  /** Saldo e soma ponderada por tipo de taxa, na ordem em que aparecem. */
  gruposPorTaxa: Map<string, { saldo: number; somaPonderada: number }>;
  contratosSemConversao: number;
}

/** Limite de Curto Prazo: hoje + 12 meses, em YYYY-MM-DD. */
export function limiteCurtoPrazo(hojeISO: string): string {
  const [a, m, d] = hojeISO.slice(0, 10).split('-').map(Number);
  const dt = new Date(Date.UTC(a + 1, m - 1, d));
  return dt.toISOString().slice(0, 10);
}

export function calcularKpisBancos(
  contratos: ContratoParaKpi[],
  parcelasPorContrato: Map<string, ParcelaParaKpi[]>,
  tipoTaxaPorContrato: Map<string, string>,
  usdBrl: number | null,
  hojeISO: string = new Date().toISOString().slice(0, 10)
): KpisBancos {
  const limite = limiteCurtoPrazo(hojeISO);
  const porContrato = new Map<string, ContratoKpi>();

  for (const c of contratos) {
    const parcelas = parcelasPorContrato.get(c.id) ?? [];
    if (parcelas.length > 0) {
      let cp = 0;
      let lp = 0;
      for (const p of parcelas) {
        if (p.data <= limite) cp += p.amortizacao;
        else lp += p.amortizacao;
      }
      porContrato.set(c.id, { id: c.id, saldoBrl: cp + lp, cpBrl: cp, lpBrl: lp, semConversao: false });
      continue;
    }

    // Sem parcelas geradas (contrato novo/sem cronograma): usa o saldo cadastrado,
    // convertendo USD pela cotação vigente (ou, na falta dela, pela PTAX Inicial).
    let saldo = c.saldoAtual;
    let semConversao = false;
    if (c.moeda === 'USD') {
      const cambio = usdBrl && usdBrl > 0 ? usdBrl : c.ptaxInicial && c.ptaxInicial > 0 ? c.ptaxInicial : null;
      if (cambio) saldo = c.saldoAtual * cambio;
      else semConversao = true;
    }
    const curto = !c.dataVencimento || c.dataVencimento <= limite;
    porContrato.set(c.id, { id: c.id, saldoBrl: saldo, cpBrl: curto ? saldo : 0, lpBrl: curto ? 0 : saldo, semConversao });
  }

  const lista = Array.from(porContrato.values());
  const saldoTotal = lista.reduce((s, k) => s + k.saldoBrl, 0);
  const curtoPrazo = lista.reduce((s, k) => s + k.cpBrl, 0);
  const longoPrazo = lista.reduce((s, k) => s + k.lpBrl, 0);

  // Custo = taxa EFETIVA (indexador + spread), cai na cadastrada só enquanto o cronograma nunca foi gerado.
  const custoDe = (c: ContratoParaKpi) => c.taxaEfetivaAplicada ?? c.taxaJuros;
  const somaPonderadaTotal = contratos.reduce((s, c) => s + (porContrato.get(c.id)?.saldoBrl ?? 0) * custoDe(c), 0);

  const gruposPorTaxa = new Map<string, { saldo: number; somaPonderada: number }>();
  for (const c of contratos) {
    const tipo = tipoTaxaPorContrato.get(c.id) ?? '—';
    const saldo = porContrato.get(c.id)?.saldoBrl ?? 0;
    const grupo = gruposPorTaxa.get(tipo) ?? { saldo: 0, somaPonderada: 0 };
    grupo.saldo += saldo;
    grupo.somaPonderada += saldo * custoDe(c);
    gruposPorTaxa.set(tipo, grupo);
  }

  return {
    porContrato,
    saldoTotal,
    curtoPrazo,
    longoPrazo,
    custoMedioPonderado: saldoTotal > 0 ? somaPonderadaTotal / saldoTotal : 0,
    gruposPorTaxa,
    contratosSemConversao: lista.filter((k) => k.semConversao).length
  };
}
