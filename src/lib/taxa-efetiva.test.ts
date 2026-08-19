import { describe, it, expect } from 'vitest';
import {
  calcularTaxaEfetiva,
  converterParcelasParaBrl,
  ehIndexado,
  ptaxVigenteNoCiclo,
  resolverIndiceNaData,
  criarTaxaPorData,
  INDICES_VAZIOS,
  type IndicesVigentes,
  type SerieIndice,
  type IndicesSerieTemporal
} from './taxa-efetiva';
import { gerarCronograma } from './amortizacao';

const INDICES: IndicesVigentes = {
  cdiAA: 13.9,
  ipcaAA: 4.44,
  usdBrl: 5.42,
  atualizadoEm: '2026-08-12'
};

describe('calcularTaxaEfetiva', () => {
  it('pré-fixado (moeda BRL) usa a taxa cheia, sem indexador', () => {
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
  });

  it('spread zero num contrato CDI resulta no CDI puro', () => {
    const r = calcularTaxaEfetiva('CDI + spread', 0, INDICES);

    expect(r.taxaAnual).toBeCloseTo(13.9, 10);
  });
});

describe('Cenário Dólar Puro — moeda USD + Pré-fixado', () => {
  const contexto = { moeda: 'USD' as const, ptaxInicial: 5.2, dataContratacao: '2026-01-01', hoje: '2026-06-01' };

  it('projeta em USD, com os juros nominais cheios (sem indexador)', () => {
    const r = calcularTaxaEfetiva('Pré-fixado (% a.a.)', 12, INDICES, contexto);

    expect(r.taxaAnual).toBe(12);
    expect(r.moedaCalculo).toBe('USD');
    expect(r.indisponivel).toBe(false);
  });

  it('dentro do 1º ano do contrato, usa a PTAX Inicial cadastrada', () => {
    const r = calcularTaxaEfetiva('Pré-fixado (% a.a.)', 12, INDICES, contexto);

    expect(r.cotacaoAplicada).toBe(5.2);
  });

  it('depois do 1º aniversário, passa a usar a cotação de mercado corrente', () => {
    const r = calcularTaxaEfetiva('Pré-fixado (% a.a.)', 12, INDICES, { ...contexto, hoje: '2027-06-01' });

    expect(r.cotacaoAplicada).toBe(INDICES.usdBrl);
  });

  it('sem PTAX Inicial cadastrada, sinaliza indisponível e não converte', () => {
    const r = calcularTaxaEfetiva('Pré-fixado (% a.a.)', 12, INDICES, { moeda: 'USD' });

    expect(r.indisponivel).toBe(true);
    expect(r.moedaCalculo).toBe('BRL');
    expect(r.cotacaoAplicada).toBeNull();
  });
});

describe('Cenário Variação Cambial (VC) — tipoTaxa "Dólar + juros", moeda BRL', () => {
  // hoje pós-1º aniversário, pra comparar a PTAX Inicial com a cotação de mercado corrente.
  const contexto = { ptaxInicial: 5.0, dataContratacao: '2026-01-01', hoje: '2027-06-01' };

  it('soma a variação percentual positiva do dólar ao spread — nunca converte parcela (já é BRL)', () => {
    const r = calcularTaxaEfetiva('Dólar + juros', 4, { ...INDICES, usdBrl: 5.5 }, contexto);

    // Variação: (5.5 - 5.0) / 5.0 * 100 = 10%
    expect(r.indiceUsado).toBeCloseTo(10, 8);
    expect(r.taxaAnual).toBeCloseTo(14, 8);
    expect(r.moedaCalculo).toBe('BRL');
    expect(r.cotacaoAplicada).toBeNull();
  });

  it('piso em zero — dólar em queda não reduz o spread cadastrado', () => {
    const r = calcularTaxaEfetiva('Dólar + juros', 4, { ...INDICES, usdBrl: 4.5 }, contexto);

    expect(r.indiceUsado).toBe(0);
    expect(r.taxaAnual).toBe(4);
    expect(r.memoria).toContain('não valorizou');
  });

  it('sem PTAX Inicial ou sem cotação corrente, cai para o spread puro e sinaliza', () => {
    const semPtax = calcularTaxaEfetiva('Dólar + juros', 4, INDICES, {});
    const semCotacao = calcularTaxaEfetiva('Dólar + juros', 4, { ...INDICES, usdBrl: null }, contexto);

    expect(semPtax.indisponivel).toBe(true);
    expect(semPtax.taxaAnual).toBe(4);
    expect(semCotacao.indisponivel).toBe(true);
    expect(semCotacao.taxaAnual).toBe(4);
  });
});

describe('ptaxVigenteNoCiclo', () => {
  it('usa a PTAX Inicial dentro do primeiro ano do contrato', () => {
    expect(ptaxVigenteNoCiclo('2026-01-01', 5.2, 5.8, '2026-11-01')).toBe(5.2);
  });

  it('usa a cotação de mercado corrente depois do primeiro aniversário', () => {
    expect(ptaxVigenteNoCiclo('2026-01-01', 5.2, 5.8, '2027-02-01')).toBe(5.8);
  });

  it('sem data de contratação, usa direto a cotação de mercado', () => {
    expect(ptaxVigenteNoCiclo(undefined, 5.2, 5.8)).toBe(5.8);
  });
});

describe('resolverIndiceNaData (Fase 5 — série temporal)', () => {
  const serie: SerieIndice = {
    realizados: [
      { valor: 13.5, dataReferencia: '2026-01-10' },
      { valor: 13.9, dataReferencia: '2026-06-15' }
    ],
    projetados: [
      { valor: 12.1, dataReferencia: '2027-01-01' },
      { valor: 10.6, dataReferencia: '2028-01-01' }
    ]
  };

  it('data passada usa o realizado mais recente até ela', () => {
    expect(resolverIndiceNaData(serie, '2026-07-01', '2026-08-01')).toBe(13.9);
    expect(resolverIndiceNaData(serie, '2026-03-01', '2026-08-01')).toBe(13.5);
  });

  it('data futura usa a projeção do ano-calendário', () => {
    expect(resolverIndiceNaData(serie, '2027-06-01', '2026-08-01')).toBe(12.1);
    expect(resolverIndiceNaData(serie, '2028-03-01', '2026-08-01')).toBe(10.6);
  });

  it('futuro além do horizonte de projeção usa o último ano projetado disponível', () => {
    expect(resolverIndiceNaData(serie, '2031-01-01', '2026-08-01')).toBe(10.6);
  });

  it('sem nenhum dado, devolve null — nunca inventa', () => {
    expect(resolverIndiceNaData({ realizados: [], projetados: [] }, '2027-01-01', '2026-08-01')).toBeNull();
  });

  it('data passada anterior a todo o histórico cai pro realizado mais antigo conhecido', () => {
    expect(resolverIndiceNaData(serie, '2025-01-01', '2026-08-01')).toBe(13.5);
  });
});

describe('criarTaxaPorData (Fase 5)', () => {
  const series: IndicesSerieTemporal = {
    cdi: {
      realizados: [{ valor: 13.9, dataReferencia: '2026-08-01' }],
      projetados: [{ valor: 12.1, dataReferencia: '2027-01-01' }]
    },
    ipca: {
      realizados: [{ valor: 4.44, dataReferencia: '2026-08-01' }],
      projetados: [{ valor: 3.5, dataReferencia: '2027-01-01' }]
    }
  };

  it('CDI + spread soma o CDI da data (realizado ou projetado) ao spread', () => {
    const taxaPorData = criarTaxaPorData('CDI + spread', 4, series, '2026-09-15', 999);

    expect(taxaPorData('2026-09-01')).toBeCloseTo(17.9, 8); // já passou -> realizado + spread
    expect(taxaPorData('2027-06-01')).toBeCloseTo(16.1, 8); // futuro -> projetado + spread
  });

  it('IPCA + spread funciona da mesma forma', () => {
    const taxaPorData = criarTaxaPorData('IPCA + spread', 4, series, '2026-09-15', 999);

    expect(taxaPorData('2026-09-01')).toBeCloseTo(8.44, 8);
  });

  it('outros tipos de taxa sempre devolvem o fallback, ignorando a série', () => {
    const taxaPorData = criarTaxaPorData('Pré-fixado (% a.a.)', 12, series, '2026-08-15', 12);

    expect(taxaPorData('2030-01-01')).toBe(12);
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
    periodicidadePrincipal: 'Anual',
    periodicidadeJuros: 'Anual',
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
    periodicidadePrincipal: 'Anual' as const,
    periodicidadeJuros: 'Anual' as const,
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

  it('contrato Dólar Puro converte todo o cronograma pela PTAX vigente no ciclo', () => {
    const efetiva = calcularTaxaEfetiva('Pré-fixado (% a.a.)', 12, INDICES, {
      moeda: 'USD',
      ptaxInicial: 5.2,
      dataContratacao: contrato.dataContratacao,
      hoje: '2026-06-01'
    });
    const emUsd = gerarCronograma({ ...contrato, taxaJurosAnual: efetiva.taxaAnual });
    const emBrl = converterParcelasParaBrl(emUsd, efetiva.cotacaoAplicada);

    expect(efetiva.moedaCalculo).toBe('USD');
    expect(efetiva.cotacaoAplicada).toBe(5.2);
    expect(emBrl[0].valorTotal).toBeCloseTo(emUsd[0].valorTotal * 5.2, 2);
  });
});
