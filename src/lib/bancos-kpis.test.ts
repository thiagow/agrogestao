import { describe, it, expect } from 'vitest';
import { calcularKpisBancos, limiteCurtoPrazo } from './bancos-kpis';

const HOJE = '2026-10-21';

describe('limiteCurtoPrazo', () => {
  it('é hoje + 12 meses', () => {
    expect(limiteCurtoPrazo('2026-10-21')).toBe('2027-10-21');
  });
});

describe('calcularKpisBancos — USD convertido, CP + LP = Total', () => {
  const brl = { id: 'a', moeda: 'BRL', saldoAtual: 1000, dataVencimento: '2030-01-01', taxaJuros: 10 };
  const usd = { id: 'b', moeda: 'USD', saldoAtual: 100, dataVencimento: '2030-01-01', taxaJuros: 6, ptaxInicial: 5 };

  it('usa a amortização das parcelas (já em BRL) — o saldo digitado em USD nunca soma cru com o real', () => {
    const parcelas = new Map([
      ['a', [{ data: '2027-01-01', amortizacao: 400 }, { data: '2029-01-01', amortizacao: 600 }]],
      // 100 US$ × 5,5 = 550 em BRL, já persistido assim em Parcela
      ['b', [{ data: '2027-06-01', amortizacao: 150 }, { data: '2029-06-01', amortizacao: 400 }]]
    ]);
    const k = calcularKpisBancos([brl, usd], parcelas, new Map(), 5.5, HOJE);
    expect(k.saldoTotal).toBe(1550); // e não 1000 + 100
    expect(k.curtoPrazo).toBe(550);
    expect(k.longoPrazo).toBe(1000);
    expect(k.curtoPrazo + k.longoPrazo).toBe(k.saldoTotal);
  });

  it('contrato USD sem parcelas converte pela cotação vigente; sem cotação usa a PTAX Inicial', () => {
    const sem = new Map();
    expect(calcularKpisBancos([usd], sem, new Map(), 5.5, HOJE).saldoTotal).toBe(550);
    expect(calcularKpisBancos([usd], sem, new Map(), null, HOJE).saldoTotal).toBe(500);
  });

  it('USD sem parcelas, sem cotação e sem PTAX Inicial entra sem conversão e é sinalizado', () => {
    const k = calcularKpisBancos([{ ...usd, ptaxInicial: null }], new Map(), new Map(), null, HOJE);
    expect(k.saldoTotal).toBe(100);
    expect(k.contratosSemConversao).toBe(1);
  });

  it('parcela vencida (antes de hoje) fica em Curto Prazo', () => {
    const k = calcularKpisBancos([brl], new Map([['a', [{ data: '2020-01-01', amortizacao: 300 }]]]), new Map(), null, HOJE);
    expect(k.curtoPrazo).toBe(300);
    expect(k.longoPrazo).toBe(0);
  });

  it('custo médio pondera pelo saldo em BRL, usando a taxa efetiva quando existe', () => {
    const parcelas = new Map([
      ['a', [{ data: '2029-01-01', amortizacao: 1000 }]],
      ['b', [{ data: '2029-01-01', amortizacao: 3000 }]]
    ]);
    const k = calcularKpisBancos(
      [brl, { ...usd, taxaEfetivaAplicada: 8 }],
      parcelas,
      new Map([['a', 'Pré-fixado'], ['b', 'Pré-fixado']]),
      5.5,
      HOJE
    );
    // (1000×10 + 3000×8) / 4000 = 8,5
    expect(k.custoMedioPonderado).toBeCloseTo(8.5, 8);
    expect(k.gruposPorTaxa.get('Pré-fixado')?.saldo).toBe(4000);
  });
});
