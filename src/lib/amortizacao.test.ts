import { describe, it, expect } from 'vitest';
import { gerarCronograma, type ParcelaCalculada } from './amortizacao';

const BASE = {
  saldoInicial: 1_000_000,
  taxaJurosAnual: 12,
  periodicidade: 'Anual' as const,
  baseCalculo: '360 dias corridos' as const,
  capitalizacao: 'Composta' as const,
  dataContratacao: '2026-01-01',
  dataVencimento: '2031-01-01',
  possuiCarencia: false
};

const somaPrincipal = (p: ParcelaCalculada[]) => p.reduce((s, x) => s + x.valorPrincipal, 0);
const somaJuros = (p: ParcelaCalculada[]) => p.reduce((s, x) => s + x.valorJuros, 0);

describe('gerarCronograma — invariantes comuns a todos os sistemas', () => {
  const sistemas = ['SAC', 'PRICE', 'BULLET', 'JUROS_PERIODICOS'] as const;

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

describe('BULLET', () => {
  it('emite uma linha por período, com parcela zero até o vencimento', () => {
    const parcelas = gerarCronograma({ ...BASE, sistemaAmortizacao: 'BULLET' });

    // BASE é Anual, 5 anos — 5 linhas: 4 intermediárias + a liquidação final.
    expect(parcelas).toHaveLength(5);
    for (const p of parcelas.slice(0, -1)) {
      expect(p.valorPrincipal).toBe(0);
      expect(p.valorJuros).toBe(0);
      expect(p.valorTotal).toBe(0);
    }
  });

  it('concentra principal e todos os juros na última parcela, na data de vencimento', () => {
    const parcelas = gerarCronograma({ ...BASE, sistemaAmortizacao: 'BULLET' });
    const ultima = parcelas[parcelas.length - 1];

    expect(ultima.dataPagamento).toBe(BASE.dataVencimento);
    expect(ultima.valorPrincipal).toBeCloseTo(BASE.saldoInicial, 2);
    expect(ultima.valorJuros).toBeGreaterThan(0);
  });

  it('capitaliza o saldo devedor geometricamente entre os períodos intermediários', () => {
    const parcelas = gerarCronograma({ ...BASE, sistemaAmortizacao: 'BULLET' });
    const saldos = parcelas.slice(0, -1).map((p) => p.saldoDevedor);

    // Cada saldo cresce em relação ao anterior (o primeiro, em relação ao principal).
    let anterior = BASE.saldoInicial;
    for (const saldo of saldos) {
      expect(saldo).toBeGreaterThan(anterior);
      anterior = saldo;
    }

    // A razão de crescimento é constante — capitalização geométrica, não linear.
    const razoes = saldos.map((s, i) => s / (i === 0 ? BASE.saldoInicial : saldos[i - 1]));
    for (const r of razoes.slice(1)) {
      expect(r).toBeCloseTo(razoes[0], 3);
    }
  });

  it('com Simples em vez de Composta, cobra menos juros totais no mesmo prazo', () => {
    // Mesma relação de amortizacao.ts: para f > 1 (períodos anuais, base 360),
    // Composta > Simples — ver describe('capitalização') abaixo.
    const composta = gerarCronograma({ ...BASE, sistemaAmortizacao: 'BULLET', capitalizacao: 'Composta' });
    const simples = gerarCronograma({ ...BASE, sistemaAmortizacao: 'BULLET', capitalizacao: 'Simples' });

    expect(somaJuros(simples)).toBeLessThan(somaJuros(composta));
  });

  it('gera uma única linha quando o prazo cabe num só período', () => {
    const parcelas = gerarCronograma({
      ...BASE,
      sistemaAmortizacao: 'BULLET',
      dataVencimento: '2026-06-01'
    });

    expect(parcelas).toHaveLength(1);
    expect(parcelas[0].valorPrincipal).toBeCloseTo(BASE.saldoInicial, 2);
    expect(parcelas[0].saldoDevedor).toBe(0);
  });
});

describe('JUROS_PERIODICOS', () => {
  it('paga só juros até a última parcela, que carrega o principal inteiro', () => {
    const parcelas = gerarCronograma({ ...BASE, sistemaAmortizacao: 'JUROS_PERIODICOS' });
    const ultima = parcelas[parcelas.length - 1];

    for (const p of parcelas.slice(0, -1)) {
      expect(p.valorPrincipal).toBe(0);
      expect(p.valorJuros).toBeGreaterThan(0);
    }
    expect(ultima.valorPrincipal).toBeCloseTo(BASE.saldoInicial, 2);
  });

  it('cobra juros iguais em todo período — o saldo nunca diminui', () => {
    const parcelas = gerarCronograma({ ...BASE, sistemaAmortizacao: 'JUROS_PERIODICOS' });

    for (const p of parcelas) {
      expect(p.valorJuros).toBeCloseTo(parcelas[0].valorJuros, 2);
    }
  });
});

describe('carência', () => {
  it('gera parcelas só de juros antes do início do pagamento, sem tocar no principal', () => {
    const parcelas = gerarCronograma({
      ...BASE,
      sistemaAmortizacao: 'SAC',
      possuiCarencia: true,
      inicioPagamento: '2028-01-01'
    });

    const carencia = parcelas.filter((p) => p.valorPrincipal === 0);
    expect(carencia.length).toBeGreaterThan(0);
    for (const p of carencia) {
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
    const comum = { ...BASE, sistemaAmortizacao: 'SAC' as const, periodicidade: 'Mensal' as const };
    const simples = gerarCronograma({ ...comum, capitalizacao: 'Simples' });
    const composta = gerarCronograma({ ...comum, capitalizacao: 'Composta' });

    expect(somaJuros(simples)).toBeGreaterThan(somaJuros(composta));
  });

  it('em períodos anuais sobre base 360 (f > 1), Composta cobra mais que Simples', () => {
    const comum = { ...BASE, sistemaAmortizacao: 'SAC' as const, periodicidade: 'Anual' as const };
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

describe('periodicidade', () => {
  it.each([
    ['Mensal', 60],
    ['Trimestral', 20],
    ['Semestral', 10],
    ['Anual', 5]
  ] as const)('%s gera aproximadamente %i parcelas em 5 anos', (periodicidade, esperado) => {
    const parcelas = gerarCronograma({ ...BASE, sistemaAmortizacao: 'SAC', periodicidade });

    expect(parcelas.length).toBe(esperado);
  });
});
