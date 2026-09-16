import { describe, it, expect } from 'vitest';
import {
  calcularFluxoMensal,
  gerarLancamentosCusteioSafraProjecao,
  gerarLancamentosManuais,
  gerarLancamentosVinculados,
  horizonteMeses
} from './fluxo-mensal-calc';
import type {
  Aquisicao,
  ContratoArrendamento,
  CulturaSafraAno,
  ItemLancamentoManualMensal,
  PecuariaBovinaAno,
  Supplier
} from '@/types';

const SAFRA = '2026/2027';

function registroSoja(overrides: Partial<CulturaSafraAno> = {}): CulturaSafraAno {
  return {
    id: 'r1',
    cultura: 'Soja',
    anoSafra: SAFRA,
    hectares: 100,
    haPropria: 100,
    haArrendada: 0,
    rendimento: 60,
    unidadeProducao: 'sc',
    precoMedio: 100,
    custoProducao: 3000, // R$/ha -> despesa total 300.000
    ...overrides
  };
}

// SAFRA "2026/2027" -> ano civil 2027 (2º ano da safra, safraDoAnoCivil).
function registroPecuariaBovina(overrides: Partial<PecuariaBovinaAno> = {}): PecuariaBovinaAno {
  return {
    id: 'p1',
    anoCivil: 2027,
    femeas0a12: 0,
    femeas12a24: 0,
    femeas24a36: 0,
    femeasAcima36: 0,
    machos0a12: 0,
    machos12a24: 0,
    machos24a36: 0,
    machosAcima36: 0,
    cicloProdutivo: 'Ciclo Completo',
    areaPastagemPropria: 50,
    areaPastagemArrendada: 0,
    tipoTerminacao: 'A Pasto',
    custoAquisicaoPorCabeca: 1200,
    custoPastagemPorHectare: 0,
    diariaConfinamento: 0,
    diasConfinamento: 0,
    qtdAnimaisConfinados: 0,
    qtdMachosComercializados: 50,
    pesoMedioMachos: 10,
    precoMedioMachos: 300,
    qtdFemeasComercializadas: 0,
    pesoMedioFemeas: 0,
    precoMedioFemeas: 0,
    qtdOutrasComercializadas: 0,
    pesoMedioOutras: 0,
    precoMedioOutras: 0,
    capacidadeLotacaoConfinamento: 0,
    ganhoPesoMedioDiarioKg: 0,
    diasConfinamentoPorLote: 0,
    ...overrides
  };
}

describe('horizonteMeses', () => {
  it('cobre 18 meses de Jan do ano de início da safra a Jun do ano seguinte', () => {
    const horizonte = horizonteMeses(SAFRA);
    expect(horizonte).toHaveLength(18);
    expect(horizonte[0]).toEqual({ mes: 1, ano: 2026 });
    expect(horizonte[11]).toEqual({ mes: 12, ano: 2026 });
    expect(horizonte[12]).toEqual({ mes: 1, ano: 2027 });
    expect(horizonte[17]).toEqual({ mes: 6, ano: 2027 });
  });
});

describe('gerarLancamentosCusteioSafraProjecao', () => {
  it('distribui Custeio da Soja nos meses de plantio (Set-Nov do 1º ano da safra)', () => {
    const horizonte = horizonteMeses(SAFRA);
    const lancamentos = gerarLancamentosCusteioSafraProjecao({
      quadroSafra: [registroSoja()],
      pecuariaBovina: [],
      producaoAnimal: [],
      safraSelecionada: SAFRA,
      multiSafra: false,
      horizonte
    });

    const custeio = lancamentos.filter((l) => l.origem === 'CUSTEIO');
    expect(custeio).toHaveLength(3); // Set, Out, Nov
    expect(custeio.every((l) => l.ano === 2026 && [9, 10, 11].includes(l.mes))).toBe(true);
    expect(custeio.every((l) => l.tipo === 'SAIDA' && l.contaComoCaixa)).toBe(true);
    // despesa total = 100ha * 3000 = 300.000, dividida em 3 meses
    expect(custeio.reduce((s, l) => s + l.valor, 0)).toBeCloseTo(300_000, 2);
  });

  it('gera SAFRA (informativa, fora do caixa) na colheita e o espelho PROJECAO +1 mês contando como caixa', () => {
    const horizonte = horizonteMeses(SAFRA);
    const lancamentos = gerarLancamentosCusteioSafraProjecao({
      quadroSafra: [registroSoja()],
      pecuariaBovina: [],
      producaoAnimal: [],
      safraSelecionada: SAFRA,
      multiSafra: false,
      horizonte
    });

    const safra = lancamentos.filter((l) => l.origem === 'SAFRA');
    const projecao = lancamentos.filter((l) => l.origem === 'PROJECAO');

    expect(safra).toHaveLength(2); // Mar, Abr do 2º ano
    expect(safra.every((l) => l.ano === 2027 && [3, 4].includes(l.mes))).toBe(true);
    expect(safra.every((l) => l.contaComoCaixa === false)).toBe(true);

    expect(projecao).toHaveLength(2); // Abr, Mai (colheita + 1 mês)
    expect(projecao.map((l) => l.mes).sort()).toEqual([4, 5]);
    expect(projecao.every((l) => l.contaComoCaixa === true)).toBe(true);

    // receita total = 100ha * 60sc * 100 = 600.000, dividida em 2 meses de colheita
    expect(safra.reduce((s, l) => s + l.valor, 0)).toBeCloseTo(600_000, 2);
    expect(projecao.reduce((s, l) => s + l.valor, 0)).toBeCloseTo(600_000, 2);
  });

  it('Pecuária (categoria contínua) distribui custeio/receita em todos os 18 meses do horizonte', () => {
    const horizonte = horizonteMeses(SAFRA);
    const lancamentos = gerarLancamentosCusteioSafraProjecao({
      quadroSafra: [],
      pecuariaBovina: [registroPecuariaBovina()],
      producaoAnimal: [],
      safraSelecionada: SAFRA,
      multiSafra: false,
      horizonte
    });

    const custeio = lancamentos.filter((l) => l.origem === 'CUSTEIO');
    const safra = lancamentos.filter((l) => l.origem === 'SAFRA');
    expect(custeio).toHaveLength(18);
    expect(safra).toHaveLength(18);
  });

  it('com datas reais de Custeio/Colheita cadastradas, ignora o calendário agrícola genérico e usa o período informado', () => {
    const horizonte = horizonteMeses(SAFRA);
    const lancamentos = gerarLancamentosCusteioSafraProjecao({
      quadroSafra: [
        registroSoja({
          // Fora da janela padrão do calendário genérico (Set-Nov custeio / Mar-Abr colheita) —
          // prova que a data real, quando presente, tem prioridade.
          custoPlantioInicio: '2026-06-01',
          custoPlantioFim: '2026-07-31',
          colheitaInicio: '2026-12-01',
          colheitaFim: '2026-12-31'
        })
      ],
      pecuariaBovina: [],
      producaoAnimal: [],
      safraSelecionada: SAFRA,
      multiSafra: false,
      horizonte
    });

    const custeio = lancamentos.filter((l) => l.origem === 'CUSTEIO');
    const safra = lancamentos.filter((l) => l.origem === 'SAFRA');

    expect(custeio).toHaveLength(2); // Jun, Jul
    expect(custeio.every((l) => l.ano === 2026 && [6, 7].includes(l.mes))).toBe(true);
    expect(custeio.reduce((s, l) => s + l.valor, 0)).toBeCloseTo(300_000, 2);

    expect(safra).toHaveLength(1); // Dez
    expect(safra[0]).toMatchObject({ ano: 2026, mes: 12 });
    expect(safra.reduce((s, l) => s + l.valor, 0)).toBeCloseTo(600_000, 2);
  });

  it('sem Multi-Safra, ignora registros de outras safras', () => {
    const horizonte = horizonteMeses(SAFRA);
    const lancamentos = gerarLancamentosCusteioSafraProjecao({
      quadroSafra: [registroSoja({ id: 'outra', anoSafra: '2024/2025' })],
      pecuariaBovina: [],
      producaoAnimal: [],
      safraSelecionada: SAFRA,
      multiSafra: false,
      horizonte
    });
    expect(lancamentos).toHaveLength(0);
  });
});

describe('gerarLancamentosVinculados', () => {
  const supplier: Supplier = {
    id: 's1',
    nome: 'Cargill',
    categoria: 'FERTILIZANTES',
    cultura: 'Soja',
    safra: SAFRA,
    dividaTotal: 50_000,
    moeda: 'BRL',
    vencimento: '2026-10-15',
    status: 'PENDENTE'
  };

  it('posiciona o fornecedor no mês/ano do vencimento', () => {
    const lancamentos = gerarLancamentosVinculados({
      suppliers: [supplier],
      contratosBancarios: [],
      arrendamentos: [],
      aquisicoes: [],
      safraSelecionada: SAFRA,
      multiSafra: false
    });
    expect(lancamentos).toHaveLength(1);
    expect(lancamentos[0]).toMatchObject({ mes: 10, ano: 2026, tipo: 'SAIDA', origem: 'VINCULADO', valor: 50_000 });
  });

  it('ignora fornecedor de outra safra quando Multi-Safra está desligado', () => {
    const lancamentos = gerarLancamentosVinculados({
      suppliers: [{ ...supplier, safra: '2024/2025' }],
      contratosBancarios: [],
      arrendamentos: [],
      aquisicoes: [],
      safraSelecionada: SAFRA,
      multiSafra: false
    });
    expect(lancamentos).toHaveLength(0);
  });

  it('nunca lança um arrendamento sem preço de referência definido (valorTotal null) como R$0', () => {
    const contrato: ContratoArrendamento = {
      id: 'a1',
      nomeFazenda: 'Fazenda Pedra II',
      areaArrendadaHa: 100,
      dataInicio: '2025-01-01',
      dataVencimento: '2026-06-01',
      direcao: 'A_PAGAR',
      tipoPagamento: 'SACAS',
      periodicidade: 'Anual',
      status: 'ATIVO',
      possuiPagamentoAntecipado: false,
      valorTotalFluxo: 0,
      totalSacas: 0,
      parcelas: [{ id: 'p1', safra: SAFRA, sacasBrutas: 0, sacasAntecipadas: 0, sacasLiquidas: 0, valorTotal: undefined }]
    };
    const lancamentos = gerarLancamentosVinculados({
      suppliers: [],
      contratosBancarios: [],
      arrendamentos: [contrato],
      aquisicoes: [],
      safraSelecionada: SAFRA,
      multiSafra: false
    });
    expect(lancamentos).toHaveLength(0);
  });

  it('arrendamento com direcao A_RECEBER lança ENTRADA/Arrendamento Recebido, não SAIDA (23/08/2026)', () => {
    const contrato: ContratoArrendamento = {
      id: 'a2',
      nomeFazenda: 'Fazenda Terceiro',
      areaArrendadaHa: 100,
      dataInicio: '2025-01-01',
      dataVencimento: '2026-06-01',
      direcao: 'A_RECEBER',
      tipoPagamento: 'SACAS',
      periodicidade: 'Anual',
      status: 'ATIVO',
      possuiPagamentoAntecipado: false,
      valorTotalFluxo: 0,
      totalSacas: 0,
      parcelas: [{ id: 'p2', safra: SAFRA, sacasBrutas: 100, sacasAntecipadas: 0, sacasLiquidas: 100, valorTotal: 12_000 }]
    };
    const lancamentos = gerarLancamentosVinculados({
      suppliers: [],
      contratosBancarios: [],
      arrendamentos: [contrato],
      aquisicoes: [],
      safraSelecionada: SAFRA,
      multiSafra: false
    });
    expect(lancamentos).toHaveLength(1);
    expect(lancamentos[0].tipo).toBe('ENTRADA');
    expect(lancamentos[0].categoriaLabel).toBe('Arrendamento Recebido');
    expect(lancamentos[0].valor).toBe(12_000);
  });

  it('lança a parcela de Aquisição de Fazenda pela data real, sempre (independente de Multi-Safra)', () => {
    const aquisicao: Aquisicao = {
      id: 'aq1',
      nomeFazenda: 'Fazenda Pedra',
      estado: 'MT',
      municipio: 'Sorriso',
      areaTotalHa: 500,
      areaAgricolaHa: 450,
      dataAquisicao: '2025-01-01',
      dataInicioPagamento: '2025-06-01',
      dataVencimento: '2031-06-01',
      tipoPagamento: 'REAIS',
      periodicidade: 'Anual',
      valorTotalFluxo: 19_170_000,
      totalSacas: 0,
      parcelas: [{ id: 'pa1', safra: SAFRA, tipo: 'PARCELA', sacas: 0, usaPrecoReferencia: false, valorTotal: 19_170_000, dataPagamento: '2027-02-10' }]
    };
    const lancamentos = gerarLancamentosVinculados({
      suppliers: [],
      contratosBancarios: [],
      arrendamentos: [],
      aquisicoes: [aquisicao],
      safraSelecionada: SAFRA,
      multiSafra: false
    });
    expect(lancamentos).toHaveLength(1);
    expect(lancamentos[0]).toMatchObject({ mes: 2, ano: 2027, valor: 19_170_000, tipo: 'SAIDA' });
  });
});

describe('gerarLancamentosManuais', () => {
  it('mapeia item manual 1:1 preservando tipo/valor/mês', () => {
    const item: ItemLancamentoManualMensal = {
      id: 'm1',
      mes: 5,
      ano: 2027,
      categoria: 'OUTRAS_RECEITAS',
      tipo: 'ENTRADA',
      descricao: 'Venda de maquinário usado',
      valor: 20_000
    };
    const lancamentos = gerarLancamentosManuais([item]);
    expect(lancamentos).toEqual([
      expect.objectContaining({ id: 'm1', mes: 5, ano: 2027, tipo: 'ENTRADA', origem: 'MANUAL', valor: 20_000, contaComoCaixa: true })
    ]);
  });
});

describe('calcularFluxoMensal', () => {
  const horizonte = horizonteMeses(SAFRA);

  it('não soma linhas SAFRA (contaComoCaixa=false) no total de entradas — evita dupla contagem com a PROJEÇÃO', () => {
    const lancamentos = gerarLancamentosCusteioSafraProjecao({
      quadroSafra: [registroSoja()],
      pecuariaBovina: [],
      producaoAnimal: [],
      safraSelecionada: SAFRA,
      multiSafra: false,
      horizonte
    });
    const calculado = calcularFluxoMensal(lancamentos, horizonte);
    // Só a PROJEÇÃO (600.000) conta como caixa, não SAFRA+PROJEÇÃO (1.200.000)
    expect(calculado.totalEntradas).toBeCloseTo(600_000, 2);
  });

  it('conta meses com saldo ACUMULADO negativo, não meses com saldo isolado negativo (critério do badge Situação)', () => {
    const lancamentos = gerarLancamentosCusteioSafraProjecao({
      quadroSafra: [registroSoja()],
      pecuariaBovina: [],
      producaoAnimal: [],
      safraSelecionada: SAFRA,
      multiSafra: false,
      horizonte
    });
    const calculado = calcularFluxoMensal(lancamentos, horizonte);
    // Custeio concentrado em Set-Nov/2026 deixa o saldo acumulado negativo até
    // a PROJEÇÃO (caixa real) começar a entrar em Abr/2027 — 7 meses
    // acumulados negativos (Set/2026 a Mar/2027), não os 3 meses isolados de
    // custeio puro. É exatamente a diferença que o critério corrige (BUG #2
    // candidato da spec): saldo acumulado, não saldo do mês isolado.
    expect(calculado.mesesSaldoAcumuladoNegativo).toBe(7);
  });
});
