import { describe, it, expect } from 'vitest';
import {
  calcularTaxaEfetiva,
  converterParcelasParaBrl,
  ehIndexado,
  INDICES_VAZIOS,
  type IndicesVigentes
} from './taxa-efetiva';
import { gerarCronograma } from './amortizacao';

const INDICES: IndicesVigentes = {
  cdiAA: 13.9,
  ipcaAA: 4.44,
  usdBrl: 5.42,
  atualizadoEm: '2026-08-12'
};

describe('calcularTaxaEfetiva', () => {
  it('pré-fixado usa a taxa cheia, sem indexador', () => {
    const r = calcularTaxaEfetiva('Pré-fixado (% a.a.)', 12.5, INDICES);

    expect(r.taxaAnual).toBe(12.5);
    expect(r.indiceUsado).toBeNull();
    expect(r.moedaCalculo).toBe('BRL');
    expect(r.indisponivel).toBe(false);
    expect(r.memoria).toBe('12,50% a.a. (pré-fixado)');
  });

  it('pré-fixado ignora índices ausentes — não depende de fonte externa', () => {
    const r = calcularTaxaEfetiva('Pré-fixado (% a.a.)', 12.5, INDICES_VAZIOS);

    expect(r.taxaAnual).toBe(12.5);
    expect(r.indisponivel).toBe(false);
  });

  it('CDI + spread soma o CDI vigente ao spread', () => {
    const r = calcularTaxaEfetiva('CDI + spread', 4, INDICES);

    expect(r.taxaAnual).toBeCloseTo(17.9, 10);
    expect(r.indiceUsado).toBe(13.9);
    expect(r.indisponivel).toBe(false);
    expect(r.memoria).toBe('CDI 13,90% + 4,00% = 17,90% a.a.');
  });

  it('IPCA + spread soma o IPCA acumulado ao spread', () => {
    const r = calcularTaxaEfetiva('IPCA + spread', 4, INDICES);

    expect(r.taxaAnual).toBeCloseTo(8.44, 10);
    expect(r.indiceUsado).toBe(4.44);
    expect(r.memoria).toBe('IPCA 4,44% + 4,00% = 8,44% a.a.');
  });

  it('Dólar + juros projeta em USD e registra a cotação da conversão', () => {
    const r = calcularTaxaEfetiva('Dólar + juros', 4, INDICES);

    // Os 4% são juros nominais sobre o saldo em USD — não valorização cambial.
    expect(r.taxaAnual).toBe(4);
    expect(r.moedaCalculo).toBe('USD');
    expect(r.cotacaoAplicada).toBe(5.42);
    expect(r.indisponivel).toBe(false);
    expect(r.memoria).toContain('5,42');
  });

  describe('índice indisponível', () => {
    it('CDI ausente cai para o spread puro e sinaliza — nunca inventa o índice', () => {
      const r = calcularTaxaEfetiva('CDI + spread', 4, INDICES_VAZIOS);

      expect(r.taxaAnual).toBe(4);
      expect(r.indiceUsado).toBeNull();
      expect(r.indisponivel).toBe(true);
      expect(r.memoria).toContain('indisponível');
    });

    it('IPCA ausente cai para o spread puro e sinaliza', () => {
      const r = calcularTaxaEfetiva('IPCA + spread', 3.5, { ...INDICES, ipcaAA: null });

      expect(r.taxaAnual).toBe(3.5);
      expect(r.indisponivel).toBe(true);
    });

    it('sem cotação do dólar não converte e sinaliza, mantendo os juros', () => {
      const r = calcularTaxaEfetiva('Dólar + juros', 4, { ...INDICES, usdBrl: null });

      expect(r.taxaAnual).toBe(4);
      expect(r.moedaCalculo).toBe('BRL');
      expect(r.cotacaoAplicada).toBeNull();
      expect(r.indisponivel).toBe(true);
    });

    it('cotação zerada é tratada como ausente, não como câmbio válido', () => {
      const r = calcularTaxaEfetiva('Dólar + juros', 4, { ...INDICES, usdBrl: 0 });

      expect(r.indisponivel).toBe(true);
      expect(r.cotacaoAplicada).toBeNull();
    });
  });

  it('spread zero num contrato CDI resulta no CDI puro', () => {
    const r = calcularTaxaEfetiva('CDI + spread', 0, INDICES);

    expect(r.taxaAnual).toBeCloseTo(13.9, 10);
  });
});

describe('ehIndexado', () => {
  it('só o pré-fixado dispensa fonte externa', () => {
    expect(ehIndexado('Pré-fixado (% a.a.)')).toBe(false);
    expect(ehIndexado('CDI + spread')).toBe(true);
    expect(ehIndexado('IPCA + spread')).toBe(true);
    expect(ehIndexado('Dólar + juros')).toBe(true);
  });
});

describe('converterParcelasParaBrl', () => {
  const emUsd = gerarCronograma({
    saldoInicial: 1_000_000,
    taxaJurosAnual: 4,
    sistemaAmortizacao: 'SAC',
    periodicidade: 'Anual',
    baseCalculo: '360 dias corridos',
    capitalizacao: 'Composta',
    dataContratacao: '2026-01-01',
    dataVencimento: '2030-01-01',
    possuiCarencia: false
  });

  it('multiplica todos os valores monetários pela cotação', () => {
    const emBrl = converterParcelasParaBrl(emUsd, 5.42);

    expect(emBrl).toHaveLength(emUsd.length);
    emBrl.forEach((p, i) => {
      expect(p.valorPrincipal).toBeCloseTo(emUsd[i].valorPrincipal * 5.42, 2);
      expect(p.valorJuros).toBeCloseTo(emUsd[i].valorJuros * 5.42, 2);
      expect(p.saldoDevedor).toBeCloseTo(emUsd[i].saldoDevedor * 5.42, 2);
    });
  });

  it('preserva número e data das parcelas — só a moeda muda', () => {
    const emBrl = converterParcelasParaBrl(emUsd, 5.42);

    expect(emBrl.map((p) => p.numero)).toEqual(emUsd.map((p) => p.numero));
    expect(emBrl.map((p) => p.dataPagamento)).toEqual(emUsd.map((p) => p.dataPagamento));
  });

  it('mantém o cronograma intacto sem cotação confiável', () => {
    expect(converterParcelasParaBrl(emUsd, null)).toEqual(emUsd);
    expect(converterParcelasParaBrl(emUsd, 0)).toEqual(emUsd);
    expect(converterParcelasParaBrl(emUsd, -1)).toEqual(emUsd);
  });
});

describe('composição taxa efetiva → cronograma', () => {
  const contrato = {
    saldoInicial: 10_000_000,
    sistemaAmortizacao: 'SAC' as const,
    periodicidade: 'Anual' as const,
    baseCalculo: '360 dias corridos' as const,
    capitalizacao: 'Composta' as const,
    dataContratacao: '2026-01-01',
    dataVencimento: '2031-01-01',
    possuiCarencia: false
  };

  it('contrato CDI + 4% projeta com 17,90%, não com 4% — o bug que motivou esta fase', () => {
    const efetiva = calcularTaxaEfetiva('CDI + spread', 4, INDICES);
    const comIndexador = gerarCronograma({ ...contrato, taxaJurosAnual: efetiva.taxaAnual });
    const soComSpread = gerarCronograma({ ...contrato, taxaJurosAnual: 4 });

    const juros = (p: typeof comIndexador) => p.reduce((s, x) => s + x.valorJuros, 0);

    // Ignorar o indexador subestimava os juros em mais de 4x neste contrato.
    expect(juros(comIndexador)).toBeGreaterThan(juros(soComSpread) * 4);
  });

  it('índice indisponível projeta com o spread puro, sem inventar número', () => {
    const efetiva = calcularTaxaEfetiva('CDI + spread', 4, INDICES_VAZIOS);
    const parcelas = gerarCronograma({ ...contrato, taxaJurosAnual: efetiva.taxaAnual });
    const referencia = gerarCronograma({ ...contrato, taxaJurosAnual: 4 });

    expect(efetiva.indisponivel).toBe(true);
    expect(parcelas).toEqual(referencia);
  });

  it('contrato dolarizado converte a parcela pela cotação registrada', () => {
    const efetiva = calcularTaxaEfetiva('Dólar + juros', 4, INDICES);
    const emUsd = gerarCronograma({ ...contrato, taxaJurosAnual: efetiva.taxaAnual });
    const emBrl = converterParcelasParaBrl(emUsd, efetiva.cotacaoAplicada);

    expect(efetiva.moedaCalculo).toBe('USD');
    expect(emBrl[0].valorTotal).toBeCloseTo(emUsd[0].valorTotal * 5.42, 2);
  });
});
