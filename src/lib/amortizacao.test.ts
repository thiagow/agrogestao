import { describe, it, expect } from 'vitest';
import { gerarCronograma, type ParcelaCalculada } from './amortizacao';

const BASE = {
  saldoInicial: 1_000_000,
  taxaJurosAnual: 12,
  periodicidadePrincipal: 'Anual' as const,
  periodicidadeJuros: 'Anual' as const,
  baseCalculo: '360 dias corridos' as const,
  capitalizacao: 'Composta' as const,
  dataContratacao: '2026-01-01',
  dataVencimento: '2031-01-01',
  possuiCarencia: false
};

const somaPrincipal = (p: ParcelaCalculada[]) => p.reduce((s, x) => s + x.valorPrincipal, 0);
const somaJuros = (p: ParcelaCalculada[]) => p.reduce((s, x) => s + x.valorJuros, 0);

describe('gerarCronograma — invariantes comuns a SAC e PRICE, periodicidades coincidentes', () => {
  const sistemas = ['SAC', 'PRICE'] as const;

  it.each(sistemas)('%s amortiza exatamente o principal contratado', (sistemaAmortizacao) => {
    const parcelas = gerarCronograma({ ...BASE, sistemaAmortizacao });

    expect(somaPrincipal(parcelas)).toBeCloseTo(BASE.saldoInicial, 2);
  });

  it.each(sistemas)('%s zera o saldo devedor na última parcela', (sistemaAmortizacao) => {
    const parcelas = gerarCronograma({ ...BASE, sistemaAmortizacao });

    expect(parcelas[parcelas.length - 1].saldoDevedor).toBe(0);
  });

  it.each(sistemas)('%s fecha valorTotal = principal + juros em toda parcela', (sistemaAmortizacao) => {
    const parcelas = gerarCronograma({ ...BASE, sistemaAmortizacao });

    for (const p of parcelas) {
      expect(p.valorTotal).toBeCloseTo(p.valorPrincipal + p.valorJuros, 2);
    }
  });

  it.each(sistemas)('%s numera as parcelas em sequência a partir de 1', (sistemaAmortizacao) => {
    const parcelas = gerarCronograma({ ...BASE, sistemaAmortizacao });

    expect(parcelas.map((p) => p.numero)).toEqual(parcelas.map((_, i) => i + 1));
  });

  it.each(sistemas)('%s emite datas de pagamento em ordem crescente', (sistemaAmortizacao) => {
    const parcelas = gerarCronograma({ ...BASE, sistemaAmortizacao });
    const datas = parcelas.map((p) => p.dataPagamento);

    expect(datas).toEqual([...datas].sort());
  });

  it.each(sistemas)('%s: última parcela cai exatamente na data de vencimento', (sistemaAmortizacao) => {
    const parcelas = gerarCronograma({ ...BASE, sistemaAmortizacao });

    expect(parcelas[parcelas.length - 1].dataPagamento).toBe(BASE.dataVencimento);
  });
});

describe('SAC', () => {
  it('amortiza o principal em parcelas constantes', () => {
    const parcelas = gerarCronograma({ ...BASE, sistemaAmortizacao: 'SAC' });
    const esperado = BASE.saldoInicial / parcelas.length;

    for (const p of parcelas) {
      expect(p.valorPrincipal).toBeCloseTo(esperado, 2);
    }
  });

  it('tem parcela total decrescente — juros caem com o saldo', () => {
    const parcelas = gerarCronograma({ ...BASE, sistemaAmortizacao: 'SAC' });

    for (let i = 1; i < parcelas.length; i++) {
      expect(parcelas[i].valorTotal).toBeLessThan(parcelas[i - 1].valorTotal);
    }
  });
});

describe('PRICE', () => {
  it('mantém a parcela total constante (a menos do centavo de arredondamento)', () => {
    const parcelas = gerarCronograma({ ...BASE, sistemaAmortizacao: 'PRICE' });

    // A última parcela é excluída de propósito: ela liquida o saldo remanescente
    // e absorve o resíduo de arredondamento de todo o cronograma.
    for (const p of parcelas.slice(0, -1)) {
      expect(Math.abs(p.valorTotal - parcelas[0].valorTotal)).toBeLessThanOrEqual(0.01);
    }
  });

  it('com taxa zero, divide o principal igualmente e não cobra juros', () => {
    const parcelas = gerarCronograma({ ...BASE, sistemaAmortizacao: 'PRICE', taxaJurosAnual: 0 });

    expect(somaJuros(parcelas)).toBe(0);
    expect(somaPrincipal(parcelas)).toBeCloseTo(BASE.saldoInicial, 2);
  });

  it('cobra mais juros totais que o SAC no mesmo prazo', () => {
    const price = gerarCronograma({ ...BASE, sistemaAmortizacao: 'PRICE' });
    const sac = gerarCronograma({ ...BASE, sistemaAmortizacao: 'SAC' });

    // PRICE amortiza mais devagar no início, então o saldo rende juros por mais tempo.
    expect(somaJuros(price)).toBeGreaterThan(somaJuros(sac));
  });
});

describe('periodicidade Final (substitui o antigo BULLET — principal e juros no vencimento)', () => {
  it('emite uma única parcela, na data de vencimento, com principal e todos os juros', () => {
    const parcelas = gerarCronograma({
      ...BASE,
      sistemaAmortizacao: 'PRICE',
      periodicidadePrincipal: 'Final',
      periodicidadeJuros: 'Final'
    });

    expect(parcelas).toHaveLength(1);
    expect(parcelas[0].dataPagamento).toBe(BASE.dataVencimento);
    expect(parcelas[0].valorPrincipal).toBeCloseTo(BASE.saldoInicial, 2);
    expect(parcelas[0].valorJuros).toBeGreaterThan(0);
    expect(parcelas[0].saldoDevedor).toBe(0);
  });

  it('SAC ou PRICE dão o mesmo resultado quando as duas pernas são Final (n=1, a distinção não se aplica)', () => {
    const sac = gerarCronograma({ ...BASE, sistemaAmortizacao: 'SAC', periodicidadePrincipal: 'Final', periodicidadeJuros: 'Final' });
    const price = gerarCronograma({ ...BASE, sistemaAmortizacao: 'PRICE', periodicidadePrincipal: 'Final', periodicidadeJuros: 'Final' });

    expect(sac[0].valorPrincipal).toBeCloseTo(price[0].valorPrincipal, 2);
    expect(sac[0].valorJuros).toBeCloseTo(price[0].valorJuros, 2);
  });
});

describe('periodicidades desacopladas (Principal ≠ Juros)', () => {
  it('substitui o antigo JUROS_PERIODICOS: juros pagos periodicamente, principal só no final', () => {
    const parcelas = gerarCronograma({
      ...BASE,
      sistemaAmortizacao: 'SAC',
      periodicidadePrincipal: 'Final',
      periodicidadeJuros: 'Anual'
    });
    const ultima = parcelas[parcelas.length - 1];

    for (const p of parcelas.slice(0, -1)) {
      expect(p.valorPrincipal).toBe(0);
      expect(p.valorJuros).toBeGreaterThan(0);
    }
    expect(ultima.valorPrincipal).toBeCloseTo(BASE.saldoInicial, 2);
    // Juros são iguais em todo período — o saldo de principal nunca diminui antes do final.
    for (const p of parcelas) {
      expect(p.valorJuros).toBeCloseTo(parcelas[0].valorJuros, 2);
    }
  });

  it('Principal Anual + Juros Semestral: 5 datas de principal e 10 de juros, mescladas numa timeline única', () => {
    const parcelas = gerarCronograma({
      ...BASE,
      sistemaAmortizacao: 'SAC',
      periodicidadePrincipal: 'Anual',
      periodicidadeJuros: 'Semestral'
    });

    const comPrincipal = parcelas.filter((p) => p.valorPrincipal > 0);
    const comJuros = parcelas.filter((p) => p.valorJuros > 0);
    expect(comPrincipal).toHaveLength(5);
    expect(comJuros).toHaveLength(10);
    // Datas de juros e principal se misturam na mesma timeline (10 eventos de juros,
    // 5 dos quais coincidem com uma data de principal) — no total, 10 parcelas únicas.
    expect(parcelas.length).toBe(10);
    expect(somaPrincipal(parcelas)).toBeCloseTo(BASE.saldoInicial, 2);
  });

  it('juros continuam incorrendo sobre o saldo real, mesmo quando pagos numa cadência mais espaçada que o principal', () => {
    // Principal Mensal (saldo cai rápido) + Juros Anual (só desembolsa 1x/ano) —
    // os juros acumulados no desembolso anual devem refletir o saldo já
    // reduzido pelos pagamentos mensais de principal, não o saldo inicial fixo.
    const decoupled = gerarCronograma({
      ...BASE,
      sistemaAmortizacao: 'SAC',
      periodicidadePrincipal: 'Mensal',
      periodicidadeJuros: 'Anual'
    });
    const coupled = gerarCronograma({
      ...BASE,
      sistemaAmortizacao: 'SAC',
      periodicidadePrincipal: 'Anual',
      periodicidadeJuros: 'Anual'
    });

    // Com o principal amortizando mensalmente, o saldo médio ao longo do ano é
    // menor do que quando o principal só cai uma vez por ano — logo, menos juros
    // acumulados no total.
    expect(somaJuros(decoupled)).toBeLessThan(somaJuros(coupled));
    expect(somaPrincipal(decoupled)).toBeCloseTo(BASE.saldoInicial, 2);
  });
});

describe('taxaJurosAnualPorData (Fase 5 — taxa por período)', () => {
  it('sem a função informada, usa taxaJurosAnual uniformemente (comportamento anterior preservado)', () => {
    const semFuncao = gerarCronograma({ ...BASE, sistemaAmortizacao: 'SAC' });
    const comFuncaoConstante = gerarCronograma({
      ...BASE,
      sistemaAmortizacao: 'SAC',
      taxaJurosAnualPorData: () => BASE.taxaJurosAnual
    });

    expect(comFuncaoConstante).toEqual(semFuncao);
  });

  it('aplica uma taxa diferente por sub-período — juros refletem a taxa vigente em cada data', () => {
    // Taxa baixa nos 2 primeiros anos, alta nos 3 últimos — simula "realizado
    // baixo, projeção futura mais alta".
    const parcelas = gerarCronograma({
      ...BASE,
      sistemaAmortizacao: 'SAC',
      taxaJurosAnualPorData: (data) => (data <= '2028-01-01' ? 5 : 20)
    });

    // 5 parcelas anuais: 2026, 2027, 2028 (baixa) / 2029, 2030 (alta, taxa 4x maior).
    expect(parcelas[0].valorJuros).toBeLessThan(parcelas[3].valorJuros);
  });

  it('a curva de Principal (SAC/PRICE) não muda com taxaJurosAnualPorData — só os Juros', () => {
    const semPorData = gerarCronograma({ ...BASE, sistemaAmortizacao: 'PRICE' });
    const comPorData = gerarCronograma({
      ...BASE,
      sistemaAmortizacao: 'PRICE',
      taxaJurosAnualPorData: (data) => (data <= '2028-01-01' ? 5 : 20)
    });

    expect(comPorData.map((p) => p.valorPrincipal)).toEqual(semPorData.map((p) => p.valorPrincipal));
  });
});

describe('carência', () => {
  it('atrasa só a perna de Principal — Juros continuam sendo pagos desde o início', () => {
    const parcelas = gerarCronograma({
      ...BASE,
      sistemaAmortizacao: 'SAC',
      possuiCarencia: true,
      inicioPagamento: '2028-01-01'
    });

    const semPrincipal = parcelas.filter((p) => p.valorPrincipal === 0);
    expect(semPrincipal.length).toBeGreaterThan(0);
    for (const p of semPrincipal) {
      expect(p.valorJuros).toBeGreaterThan(0);
      expect(p.saldoDevedor).toBeCloseTo(BASE.saldoInicial, 2);
    }
  });

  it('ainda amortiza o principal inteiro apesar da carência', () => {
    const parcelas = gerarCronograma({
      ...BASE,
      sistemaAmortizacao: 'SAC',
      possuiCarencia: true,
      inicioPagamento: '2028-01-01'
    });

    expect(somaPrincipal(parcelas)).toBeCloseTo(BASE.saldoInicial, 2);
  });

  it('é ignorada quando não há data de início de pagamento', () => {
    const comFlag = gerarCronograma({ ...BASE, sistemaAmortizacao: 'SAC', possuiCarencia: true });
    const semFlag = gerarCronograma({ ...BASE, sistemaAmortizacao: 'SAC' });

    expect(comFlag).toEqual(semFlag);
  });
});

describe('capitalização', () => {
  // A relação entre Simples e Composta depende da fração do ano de cada período:
  // Composta = (1+i)^f − 1, Simples = i × f. Para f < 1 (períodos menores que um
  // ano) a Simples cobra MAIS; para f > 1 ela cobra menos. Não existe uma
  // direção única — é a matemática das duas convenções, e testar as duas pontas
  // impede que alguém "corrija" uma delas achando que é bug.
  it('em períodos mensais (f < 1), Simples cobra mais juros que Composta', () => {
    const comum = {
      ...BASE,
      sistemaAmortizacao: 'SAC' as const,
      periodicidadePrincipal: 'Mensal' as const,
      periodicidadeJuros: 'Mensal' as const
    };
    const simples = gerarCronograma({ ...comum, capitalizacao: 'Simples' });
    const composta = gerarCronograma({ ...comum, capitalizacao: 'Composta' });

    expect(somaJuros(simples)).toBeGreaterThan(somaJuros(composta));
  });

  it('em períodos anuais sobre base 360 (f > 1), Composta cobra mais que Simples', () => {
    const comum = { ...BASE, sistemaAmortizacao: 'SAC' as const };
    const simples = gerarCronograma({ ...comum, capitalizacao: 'Simples' });
    const composta = gerarCronograma({ ...comum, capitalizacao: 'Composta' });

    expect(somaJuros(composta)).toBeGreaterThan(somaJuros(simples));
  });
});

describe('base de cálculo', () => {
  it('base menor concentra mais juros no mesmo prazo', () => {
    const comum = { ...BASE, sistemaAmortizacao: 'SAC' as const };
    const base360 = gerarCronograma({ ...comum, baseCalculo: '360 dias corridos' });
    const base365 = gerarCronograma({ ...comum, baseCalculo: '365 dias corridos' });

    // Mesmo período em dias corridos, dividido por uma base menor, rende fração
    // de ano maior — logo, mais juros.
    expect(somaJuros(base360)).toBeGreaterThan(somaJuros(base365));
  });
});

describe('periodicidade (Principal e Juros coincidentes)', () => {
  it.each([
    ['Mensal', 60],
    ['Bimestral', 30],
    ['Trimestral', 20],
    ['Quadrimestral', 15],
    ['Semestral', 10],
    ['Anual', 5]
  ] as const)('%s gera aproximadamente %i parcelas em 5 anos', (periodicidade, esperado) => {
    const parcelas = gerarCronograma({
      ...BASE,
      sistemaAmortizacao: 'SAC',
      periodicidadePrincipal: periodicidade,
      periodicidadeJuros: periodicidade
    });

    expect(parcelas.length).toBe(esperado);
  });
});
