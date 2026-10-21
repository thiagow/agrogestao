import { describe, it, expect } from 'vitest';
import { montarBalanco, complementaresVazio, splitBancosCpLp, splitAquisicaoCpLp, calcularScoreRadar, fracaoRampa } from './balanco-calc';
import type {
  Aquisicao,
  BemDireito,
  ContratoArrendamento,
  CulturaSafraAno,
  PecuariaBovinaAno,
  PrecoDefinidoSafra,
  ProducaoAnimalAno,
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
    custoProducao: 3000, // despesa total 300.000
    ...overrides
  };
}

function bem(overrides: Partial<BemDireito> = {}): BemDireito {
  return {
    id: 'b1',
    grupoIrpf: 'Direitos e bens diversos',
    descricao: 'Bem genérico',
    liquidez: 'Baixa',
    elegivelGarantia: false,
    geraFluxoCaixa: false,
    valorMercadoEstimado: 0,
    ...overrides
  };
}

function inputBase() {
  return {
    safra: SAFRA,
    quadroSafra: [registroSoja()],
    pecuariaBovina: [] as PecuariaBovinaAno[],
    producaoAnimal: [] as ProducaoAnimalAno[],
    suppliers: [] as Supplier[],
    fluxoDetalhadoBancos: [] as { anos: any[] }[],
    anosCronograma: [] as { ano: number; juros: number; amortizacao: number }[],
    arrendamentos: [] as ContratoArrendamento[],
    aquisicoes: [] as Aquisicao[],
    bensDireitos: [] as BemDireito[],
    precosDefinidos: [] as PrecoDefinidoSafra[],
    complementares: complementaresVazio(SAFRA)
  };
}

describe('montarBalanco — fechamento contábil', () => {
  it('Ativo Total = Passivo Total + PL Total sempre, mesmo com bens IRPF/dívidas/fornecedores diversos', () => {
    const input = inputBase();
    input.bensDireitos = [
      bem({ id: 'b1', grupoIrpf: 'Imóveis Rurais - ANEXO A', valorMercadoEstimado: 2_000_000 }),
      bem({ id: 'b2', grupoIrpf: 'Máquinas Agrícolas', valorMercadoEstimado: 80_000 }),
      bem({ id: 'b3', grupoIrpf: 'Disponibilidade e aplicações', valorMercadoEstimado: 5_000 })
    ];
    input.suppliers = [
      { id: 's1', nome: 'Fornecedor A', categoria: 'INSUMOS' as any, cultura: 'Soja', safra: SAFRA, dividaTotal: 10_000, moeda: 'BRL', vencimento: '2026-10-01', status: 'PENDENTE' }
    ];
    input.complementares = { ...complementaresVazio(SAFRA), caixaEquivalentes: 1000, capitalSocial: 500 };

    const balanco = montarBalanco(input);

    expect(balanco.ativo.total).toBeCloseTo(balanco.passivo.total + balanco.pl.total, 2);
  });

  it('CCL = Ativo Circulante - Passivo Circulante', () => {
    const balanco = montarBalanco(inputBase());
    expect(balanco.ccl).toBeCloseTo(balanco.ativo.totalCirculante - balanco.passivo.totalCirculante, 2);
  });

  it('linha "Bens IRPF" aparece explicitamente nos dois lados do balanço (resolve o BUG #1 da spec)', () => {
    const input = inputBase();
    input.quadroSafra = []; // isola a checagem: sem DRE, Ativo/Passivo não têm nenhum outro movimento
    input.bensDireitos = [bem({ grupoIrpf: 'Imóveis Rurais - ANEXO A', valorMercadoEstimado: 1_000_000 })];
    const balanco = montarBalanco(input);
    expect(balanco.ativo.bensIrpf).toBe(1_000_000);
    // Sem custos/receitas de safra gerando descasamento entre Custos (Quadro
    // Safra) e Passivo (Fornecedores/Bancos), as duas linhas "Bens IRPF"
    // batem — quando há descasamento (ver teste de fechamento contábil
    // acima), o PL.bensIrpf absorve a diferença, mesmo comportamento do
    // AgroFlow original entre suas abas Balanço/Consolidado Grupo.
    expect(balanco.pl.bensIrpf).toBe(1_000_000);
  });

  it('"Aplicações Financeiras" do Ativo Circulante vem de BemDireito, não duplica em Bens IRPF do Não Circulante', () => {
    const input = inputBase();
    input.bensDireitos = [bem({ grupoIrpf: 'Disponibilidade e aplicações', valorMercadoEstimado: 5_000_000, descricao: 'CDB Santander' })];
    const balanco = montarBalanco(input);
    expect(balanco.ativo.aplicacoesFinanceiras).toBe(5_000_000);
    expect(balanco.ativo.bensIrpf).toBe(0); // já contabilizado no Circulante, não repete no Não Circulante
  });
});

describe('montarBalanco — nova lista Bem / Direito (09/10/2026)', () => {
  it('Máquinas Agrícolas, Implementos e Veículos somam juntos em Máquinas e Equipamentos', () => {
    const input = inputBase();
    input.bensDireitos = [
      bem({ id: 'a', grupoIrpf: 'Máquinas Agrícolas', valorMercadoEstimado: 100 }),
      bem({ id: 'b', grupoIrpf: 'Implementos', valorMercadoEstimado: 20 }),
      bem({ id: 'c', grupoIrpf: 'Veículos', valorMercadoEstimado: 3 })
    ];
    const balanco = montarBalanco(input);
    expect(balanco.patrimonioIrpf.maquinasEquipamentos).toEqual({ valor: 123, itens: 3 });
  });

  it('Estoque e Contas a receber entram no Ativo Circulante, não em Bens IRPF do Não Circulante', () => {
    const base = montarBalanco(inputBase());
    const input = inputBase();
    input.bensDireitos = [
      bem({ id: 'e', grupoIrpf: 'Estoque (Insumos e Grãos)', valorMercadoEstimado: 500 }),
      bem({ id: 'r', grupoIrpf: 'Contas a receber', valorMercadoEstimado: 70 })
    ];
    const balanco = montarBalanco(input);
    expect(balanco.ativo.estoqueInsumos - base.ativo.estoqueInsumos).toBe(500);
    expect(balanco.ativo.outrosCreditosCp - base.ativo.outrosCreditosCp).toBe(70);
    expect(balanco.ativo.bensIrpf).toBe(0);
    expect(balanco.ativo.totalCirculante - base.ativo.totalCirculante).toBe(570);
  });

  it('Imóvel Urbano, Benfeitorias, Participações e Direitos diversos ficam em Bens IRPF do Não Circulante', () => {
    const input = inputBase();
    input.bensDireitos = [
      bem({ id: 'u', grupoIrpf: 'Imóveis Urbanos - ANEXO B', valorMercadoEstimado: 10 }),
      bem({ id: 'f', grupoIrpf: 'Benfeitorias e Instalações', valorMercadoEstimado: 20 }),
      bem({ id: 'p', grupoIrpf: 'Participações Societárias', valorMercadoEstimado: 30 }),
      bem({ id: 'd', grupoIrpf: 'Direitos e bens diversos', valorMercadoEstimado: 40 })
    ];
    expect(montarBalanco(input).ativo.bensIrpf).toBe(100);
  });
});

describe('montarBalanco — Serviço da Dívida (16/09/2026: manual soma ao automático, nunca substitui)', () => {
  it('sem valor manual, Serviço da Dívida é só o automático do cronograma bancário', () => {
    const input = inputBase();
    input.anosCronograma = [{ ano: 2027, juros: 40_000, amortizacao: 60_000 }];
    const balanco = montarBalanco(input);
    expect(balanco.servicoDividaDetalhe.automatico).toBe(100_000);
    expect(balanco.servicoDividaDetalhe.manual).toBe(0);
    expect(balanco.servicoDividaDetalhe.total).toBe(100_000);
    expect(balanco.servicoDivida).toBe(100_000);
  });

  it('com valor manual, soma ao automático — nunca o descarta', () => {
    const input = inputBase();
    input.anosCronograma = [{ ano: 2027, juros: 40_000, amortizacao: 60_000 }];
    input.complementares = { ...complementaresVazio(SAFRA), servicoDividaManual: 25_000 };
    const balanco = montarBalanco(input);
    expect(balanco.servicoDividaDetalhe.automatico).toBe(100_000);
    expect(balanco.servicoDividaDetalhe.manual).toBe(25_000);
    expect(balanco.servicoDividaDetalhe.total).toBe(125_000);
    expect(balanco.servicoDivida).toBe(125_000);
  });
});

describe('calcularPatrimonioIrpf — resolve BUGs #2/#3 da spec', () => {
  it('cards-resumo batem com a soma real da listagem detalhada (BUG #2 não se reproduz)', () => {
    const input = inputBase();
    input.bensDireitos = [
      bem({ id: 'f1', grupoIrpf: 'Imóveis Rurais - ANEXO A', valorMercadoEstimado: 2_030_673_990, descricao: 'Fazenda X' }),
      bem({ id: 'm1', grupoIrpf: 'Máquinas Agrícolas', valorMercadoEstimado: 82_521_000, descricao: 'Maquinário' })
    ];
    const balanco = montarBalanco(input);
    expect(balanco.patrimonioIrpf.fazendasProprias.valor).toBe(2_030_673_990);
    expect(balanco.patrimonioIrpf.fazendasProprias.itens).toBe(1);
    expect(balanco.patrimonioIrpf.maquinasEquipamentos.valor).toBe(82_521_000);
  });

  it('"Máquinas e Equipamentos" nunca cai na categoria de Imóveis Urbanos (BUG #3 não se reproduz)', () => {
    const input = inputBase();
    input.bensDireitos = [bem({ grupoIrpf: 'Máquinas Agrícolas', valorMercadoEstimado: 82_521_000, descricao: 'Maquinário' })];
    const balanco = montarBalanco(input);
    const categoriaUrbana = balanco.patrimonioIrpf.categorias.find((c) => c.categoria === 'Imóveis Urbanos');
    expect(categoriaUrbana).toBeUndefined();
    const categoriaMaquinas = balanco.patrimonioIrpf.categorias.find((c) => c.categoria === 'Máquinas, Implementos e Veículos');
    expect(categoriaMaquinas?.subtotal).toBe(82_521_000);
  });
});

describe('splitBancosCpLp / splitAquisicaoCpLp — circulante = até o fim da safra (30/06/2027)', () => {
  it('CP + LP fecha exatamente com a soma de todas as parcelas; 30/06 ainda é circulante, 01/07 já não é', () => {
    const { cp, lp } = splitBancosCpLp(
      [
        {
          anos: [
            {
              parcelas: [
                { data: '2027-03-01', amortizacao: 1000 } as any,
                { data: '2027-06-30', amortizacao: 200 } as any,
                { data: '2027-07-01', amortizacao: 5000 } as any
              ]
            } as any
          ]
        }
      ],
      SAFRA
    );
    expect(cp).toBe(1200);
    expect(lp).toBe(5000);
    expect(cp + lp).toBe(6200);
  });

  it('parcela que vence antes do início da safra (01/07/2026) já foi paga e sai do balanço', () => {
    const { cp, lp } = splitAquisicaoCpLp(
      [{ parcelas: [{ dataPagamento: '2026-06-30', valorTotal: 10_000 } as any, { dataPagamento: '2026-07-01', valorTotal: 3_000 } as any] }],
      SAFRA
    );
    expect(cp).toBe(3_000);
    expect(lp).toBe(0);
  });

  it('Bancos: parcela anterior à safra sai; o que era LP vira CP ao avançar a safra', () => {
    const contratos = [
      {
        anos: [
          {
            parcelas: [
              { data: '2026-03-01', amortizacao: 700 } as any,
              { data: '2027-03-01', amortizacao: 1000 } as any,
              { data: '2028-03-01', amortizacao: 2000 } as any
            ]
          } as any
        ]
      }
    ];
    expect(splitBancosCpLp(contratos, '2026/2027')).toEqual({ cp: 1000, lp: 2000 });
    expect(splitBancosCpLp(contratos, '2027/2028')).toEqual({ cp: 2000, lp: 0 });
  });
});

describe('Balanço dinâmico por safra (22/10/2026) — Fornecedores', () => {
  const fornecedor = (id: string, dividaTotal: number, vencimento: string) =>
    ({ id, nome: id, categoria: 'INSUMOS' as any, cultura: 'Soja', safra: SAFRA, dividaTotal, moeda: 'BRL', vencimento, status: 'PENDENTE' }) as Supplier;

  it('dívida da safra 26/27 some na 27/28; a de 27/28 migra de LP pra CP', () => {
    const input = inputBase();
    input.suppliers = [fornecedor('a', 100_000, '2027-02-10'), fornecedor('b', 10_000_000, '2027-09-10')];

    const na2627 = montarBalanco(input);
    expect(na2627.passivo.fornecedoresCp).toBe(100_000);
    expect(na2627.passivo.fornecedoresLp).toBe(10_000_000);

    const na2728 = montarBalanco({ ...input, safra: '2027/2028', complementares: complementaresVazio('2027/2028') });
    expect(na2728.passivo.fornecedoresCp).toBe(10_000_000);
    expect(na2728.passivo.fornecedoresLp).toBe(0);
  });

  it('o balanço continua fechando (Ativo = Passivo + PL) com contas que saíram', () => {
    const input = inputBase();
    input.suppliers = [fornecedor('a', 5_000, '2025-01-01'), fornecedor('b', 7_000, '2030-01-01')];
    const b = montarBalanco(input);
    expect(b.passivo.fornecedoresCp + b.passivo.fornecedoresLp).toBe(7_000);
    expect(b.ativo.total).toBeCloseTo(b.passivo.total + b.pl.total, 2);
  });
});

describe('Balanço dinâmico por safra (22/10/2026) — Arrendamentos', () => {
  const parcelas = [
    { id: 'p1', safra: '2025/2026', sacasBrutas: 0, sacasAntecipadas: 0, sacasLiquidas: 0, valorTotal: 1_000 },
    { id: 'p2', safra: SAFRA, sacasBrutas: 0, sacasAntecipadas: 0, sacasLiquidas: 0, valorTotal: 2_000 },
    { id: 'p3', safra: '2027/2028', sacasBrutas: 0, sacasAntecipadas: 0, sacasLiquidas: 0, valorTotal: 3_000 },
    { id: 'p4', safra: '2028/2029', sacasBrutas: 0, sacasAntecipadas: 0, sacasLiquidas: 0, valorTotal: 4_000 }
  ];

  it('A Pagar: passada sai, safra = Passivo Circulante, futuras = Não Circulante', () => {
    const input = inputBase();
    input.arrendamentos = [contratoArrendamento({ parcelas })];
    const b = montarBalanco(input);
    expect(b.passivo.arrendamentos).toBe(2_000);
    expect(b.passivo.arrendamentosLp).toBe(7_000);
    expect(b.dre.arrendamentos).toBe(2_000); // DRE só com a safra
  });

  it('A Receber: safra = Ativo Circulante, futuras = Ativo Não Circulante', () => {
    const input = inputBase();
    input.arrendamentos = [contratoArrendamento({ direcao: 'A_RECEBER', parcelas })];
    const b = montarBalanco(input);
    expect(b.ativo.arrendamentosReceberCp).toBe(2_000);
    expect(b.ativo.arrendamentosReceberLp).toBe(7_000);
    expect(b.passivo.arrendamentos + b.passivo.arrendamentosLp).toBe(0);
    expect(b.ativo.total).toBeCloseTo(b.passivo.total + b.pl.total, 2);
  });
});

describe('montarBalanco — Fornecedores CP/LP e DRE pela janela jul-jun da safra', () => {
  it('Fornecedor que vence depois do fim da safra vai para Passivo Não Circulante', () => {
    const input = inputBase();
    input.suppliers = [
      { id: 's1', nome: 'A', categoria: 'INSUMOS' as any, cultura: 'Soja', safra: SAFRA, dividaTotal: 1000, moeda: 'BRL', vencimento: '2027-05-10', status: 'PENDENTE' },
      { id: 's2', nome: 'B', categoria: 'INSUMOS' as any, cultura: 'Soja', safra: SAFRA, dividaTotal: 4000, moeda: 'BRL', vencimento: '2027-08-10', status: 'PENDENTE' }
    ];
    const balanco = montarBalanco(input);
    expect(balanco.passivo.fornecedoresCp).toBe(1000);
    expect(balanco.passivo.fornecedoresLp).toBe(4000);
  });

  it('juros/amortização do DRE vêm só das parcelas dentro de 01/07/2026–30/06/2027', () => {
    const input = inputBase();
    input.fluxoDetalhadoBancos = [
      {
        anos: [
          {
            parcelas: [
              { data: '2026-06-30', juros: 999, amortizacao: 999 },
              { data: '2026-12-15', juros: 100, amortizacao: 400 },
              { data: '2027-06-30', juros: 50, amortizacao: 150 },
              { data: '2027-07-01', juros: 999, amortizacao: 999 }
            ]
          }
        ]
      }
    ];
    const balanco = montarBalanco(input);
    expect(balanco.dre.custoFinanceiro).toBe(150);
    expect(balanco.servicoDividaDetalhe.automatico).toBe(700);
  });
});

describe('indicador com denominador zero por ausência de operação (BUG #4 da spec)', () => {
  it('Cobertura Arrendamento vira "Sem dados" (não "Crítico") quando não há arrendamento', () => {
    const balanco = montarBalanco(inputBase());
    const indicador = balanco.indicadores.find((i) => i.id === 'cobertura-arrendamento')!;
    expect(indicador.status).toBe('Sem dados');
    expect(indicador.valor).toBeNull();
  });

  it('Giro de Estoque vira "Sem dados" quando não há estoque cadastrado', () => {
    const balanco = montarBalanco(inputBase());
    const indicador = balanco.indicadores.find((i) => i.id === 'giro-estoque')!;
    expect(indicador.status).toBe('Sem dados');
    expect(indicador.valor).toBeNull();
  });
});

describe('DRE — despesa comercial configurável (não mais "3" fixo)', () => {
  it('usa despesaComercialScHa da conta em vez de um valor fixo de 3', () => {
    const input = inputBase();
    input.precosDefinidos = [{ id: 'pd1', commodity: 'Soja Grão', anoSafra: SAFRA, precoBrl: 150, definidoEm: '2026-01-01' }];
    input.complementares = { ...complementaresVazio(SAFRA), despesaComercialScHa: 5 };

    const balanco = montarBalanco(input);
    // área de soja = 100ha, 5 sc/ha, R$150/sc = 75.000
    expect(balanco.dre.despesaComercial).toBeCloseTo(75_000, 2);
  });

  it('usa o fallback manual quando não há preço de Soja definido', () => {
    const input = inputBase();
    input.complementares = { ...complementaresVazio(SAFRA), despesaComercialFallback: 42_000 };
    const balanco = montarBalanco(input);
    expect(balanco.dre.despesaComercial).toBe(42_000);
  });

  it('fica null (nunca um 0 que mente) quando não há preço de Soja nem fallback', () => {
    const balanco = montarBalanco(inputBase());
    expect(balanco.dre.despesaComercial).toBeNull();
  });
});

function contratoArrendamento(overrides: Partial<ContratoArrendamento> = {}): ContratoArrendamento {
  return {
    id: 'arr1',
    nomeFazenda: 'Fazenda X',
    areaArrendadaHa: 50,
    dataInicio: '2025-01-01',
    dataVencimento: '2030-01-01',
    direcao: 'A_PAGAR',
    tipoPagamento: 'SACAS',
    periodicidade: 'Anual',
    status: 'ATIVO',
    possuiPagamentoAntecipado: false,
    valorTotalFluxo: 0,
    totalSacas: 0,
    parcelas: [{ id: 'pa1', safra: SAFRA, sacasBrutas: 0, sacasAntecipadas: 0, sacasLiquidas: 0, valorTotal: 20_000 }],
    ...overrides
  };
}

describe('DRE/Passivo — direção do Arrendamento (23/08/2026, review do cliente)', () => {
  it('A_PAGAR (default) continua entrando como custo, subtraindo o lucro bruto e somando no passivo', () => {
    const input = inputBase();
    input.arrendamentos = [contratoArrendamento({ direcao: 'A_PAGAR' })];

    const balanco = montarBalanco(input);

    expect(balanco.dre.arrendamentos).toBe(20_000);
    expect(balanco.dre.arrendamentosReceber).toBe(0);
    expect(balanco.passivo.arrendamentos).toBe(20_000);
  });

  it('A_RECEBER soma no lucro bruto como receita, não entra no passivo nem na Cobertura Arrendamento', () => {
    const semArrendamento = montarBalanco(inputBase());

    const input = inputBase();
    input.arrendamentos = [contratoArrendamento({ id: 'arr2', direcao: 'A_RECEBER' })];
    const comReceber = montarBalanco(input);

    expect(comReceber.dre.arrendamentosReceber).toBe(20_000);
    expect(comReceber.dre.arrendamentos).toBe(0);
    expect(comReceber.dre.lucroBruto).toBeCloseTo(semArrendamento.dre.lucroBruto + 20_000, 2);
    expect(comReceber.passivo.arrendamentos).toBe(0);

    const coberturaSem = semArrendamento.indicadores.find((i) => i.id === 'cobertura-arrendamento')!;
    const coberturaCom = comReceber.indicadores.find((i) => i.id === 'cobertura-arrendamento')!;
    // Sem nenhum arrendamento a pagar, o indicador continua "Sem dados" nos dois casos —
    // o A_RECEBER não deve "inventar" uma cobertura que não existe.
    expect(coberturaCom.status).toBe(coberturaSem.status);
  });

  it('fecha Ativo = Passivo + PL mesmo com arrendamento a receber', () => {
    const input = inputBase();
    input.arrendamentos = [contratoArrendamento({ direcao: 'A_RECEBER' })];
    const balanco = montarBalanco(input);
    expect(balanco.ativo.total).toBeCloseTo(balanco.passivo.total + balanco.pl.total, 2);
  });
});

describe('Pecuária/Suinocultura/Avicultura (02/09/2026)', () => {
  function pecuariaBovina(overrides: Partial<PecuariaBovinaAno> = {}): PecuariaBovinaAno {
    return {
      id: 'pb1',
      anoCivil: 2027, // SAFRA "2026/2027" -> 2º ano civil = 2027
      femeas0a12: 100,
      femeas12a24: 0,
      femeas24a36: 0,
      femeasAcima36: 0,
      machos0a12: 0,
      machos12a24: 0,
      machos24a36: 0,
      machosAcima36: 0,
      cicloProdutivo: 'Ciclo Completo',
      areaPastagemPropria: 0,
      areaPastagemArrendada: 0,
      tipoTerminacao: 'A Pasto',
      custoAquisicaoPorCabeca: 1000,
      custoPastagemPorHectare: 0,
      diariaConfinamento: 0,
      diasConfinamento: 0,
      qtdAnimaisConfinados: 0,
      valorArrobaFemea: 0,
      valorArrobaMacho: 0,
      qtdMachosComercializados: 10,
      pesoMedioMachos: 1,
      precoMedioMachos: 500,
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

  it('estoque de rebanho (sem valor da @: cabeças x custo de aquisição) soma no Ativo Circulante', () => {
    const sem = montarBalanco(inputBase());

    const input = inputBase();
    input.pecuariaBovina = [pecuariaBovina()];
    const com = montarBalanco(input);

    // 100 cabeças em estoque x R$1.000/cabeça = R$100.000
    expect(com.ativo.estoqueRebanhoBovino).toBe(100_000);
    // totalCirculante também sobe com a receita comercializada (contasReceberSafra):
    // faturamentoMachos = 10 * 1 * 500 = 5.000, e o registro (ano civil 2027) pesa 50%
    // na safra 2026/2027 (blend, igual ao Resumo do Quadro de Safra) = 2.500.
    expect(com.ativo.totalCirculante).toBeCloseTo(sem.ativo.totalCirculante + 100_000 + 2_500, 2);
  });

  it('registro de outro ano civil (fora da safra selecionada) não entra no estoque', () => {
    const input = inputBase();
    input.pecuariaBovina = [pecuariaBovina({ anoCivil: 2099, femeas0a12: 9999 })];
    const balanco = montarBalanco(input);
    expect(balanco.ativo.estoqueRebanhoBovino).toBe(0);
  });

  it('receita/custo de Bovino, Suinocultura e Avicultura somam na DRE (receitaBruta/custos)', () => {
    const sem = montarBalanco(inputBase());

    const input = inputBase();
    input.pecuariaBovina = [pecuariaBovina()];
    input.producaoAnimal = [
      { id: 'a1', tipo: 'Avicultura', anoCivil: 2027, producaoCabecas: 100, precoMedioPorCabeca: 20, custoMedioPorCabeca: 12, plantel: 0 }
    ];
    const com = montarBalanco(input);

    // Bovino: receita 10*1*500=5.000, custo 1000*10=10.000. Aves: receita 100*20=2.000, custo 100*12=1.200.
    // Cada ano civil entra com 50% na safra (blend 50/50 — mesma regra do Resumo do Quadro de Safra).
    expect(com.dre.receitaBruta).toBeCloseTo(sem.dre.receitaBruta + (5_000 + 2_000) * 0.5, 2);
    expect(com.dre.custos).toBeCloseTo(sem.dre.custos + (10_000 + 1_200) * 0.5, 2);
  });

  it('Suínos/Aves: estoque = plantel × preço médio por cabeça, média de dois anos', () => {
    const input = inputBase();
    input.producaoAnimal = [
      { id: 'a1', tipo: 'Suinocultura', anoCivil: 2026, producaoCabecas: 500, precoMedioPorCabeca: 30, custoMedioPorCabeca: 20, plantel: 100 },
      { id: 'a2', tipo: 'Suinocultura', anoCivil: 2027, producaoCabecas: 500, precoMedioPorCabeca: 30, custoMedioPorCabeca: 20, plantel: 300 }
    ];
    const balanco = montarBalanco(input);
    // 2026: 100 × 30 = 3.000; 2027: 300 × 30 = 9.000 -> média 6.000
    expect(balanco.ativo.estoqueRebanhoAnimal).toBe(6_000);
    expect(balanco.ativo.estoqueRebanhoBovino).toBe(0);
  });

  it('Bovino: arrobas (peso por idade) × valor da @ por sexo, média de dois anos', () => {
    const input = inputBase();
    input.pecuariaBovina = [
      pecuariaBovina({ anoCivil: 2026, femeas0a12: 10, machos0a12: 10, valorArrobaFemea: 300, valorArrobaMacho: 320 }),
      pecuariaBovina({ anoCivil: 2027, femeas0a12: 0, machos0a12: 0, machos24a36: 10, valorArrobaMacho: 320 })
    ];
    const balanco = montarBalanco(input);
    // 2026: 10×4,9×300 + 10×5,5×320 = 14.700 + 17.600 = 32.300; 2027: 10×14,6×320 = 46.720 -> média 39.510
    expect(balanco.ativo.estoqueRebanhoBovino).toBe(39_510);
  });
});

describe('Radar — dívida bancária = 0 usa piso de R$ 1,00 (decisão 5)', () => {
  it('sem dívida/serviço/juros, DSCR, Capacidade, Cobertura de Juros e Dívida/EBITDA continuam existindo', () => {
    const input = inputBase();
    const balanco = montarBalanco(input);
    const id = (i: string) => balanco.indicadores.find((x) => x.id === i)!;
    expect(id('dscr').valor).not.toBeNull();
    expect(id('capacidade-pagamento').valor).not.toBeNull();
    expect(id('cobertura-juros').valor).not.toBeNull();
    expect(id('divida-ebitda').valor).not.toBeNull();
    expect(id('divida-ebitda').valor).toBeCloseTo(1 / balanco.dre.ebitda, 8);
    const cobertura = balanco.radar.find((e) => e.dimensao === 'Cobertura')!.valor;
    expect(cobertura).toBeGreaterThan(0);
  });
});

describe('Radar Saúde Financeira — fórmula do cliente (13/10/2026)', () => {
  const ind = (id: string, valor: number | null) =>
    ({ id, grupo: 'Liquidez', nome: id, valor, unidade: '', status: 'Bom', formula: '', referencia: '' }) as never;
  const eixo = (r: { dimensao: string; valor: number }[], nome: string) => r.find((e) => e.dimensao === nome)!.valor;

  it('rampa linear nos dois sentidos, limitada nas pontas', () => {
    expect(fracaoRampa(2.5, 2.0, 0.5)).toBe(1);
    expect(fracaoRampa(0.2, 2.0, 0.5)).toBe(0);
    expect(fracaoRampa(1.25, 2.0, 0.5)).toBeCloseTo(0.5);
    expect(fracaoRampa(50, 30, 70)).toBeCloseTo(0.5); // invertida: 50% de endividamento
  });

  it('Solvência: PL/Ativo de 40% preenche 50% do eixo', () => {
    const r = calcularScoreRadar([ind('endividamento-geral', 60)]);
    expect(eixo(r, 'Solvência')).toBe(50);
  });

  it('Liquidez pondera 70/30', () => {
    const r = calcularScoreRadar([ind('liquidez-corrente', 2.0), ind('liquidez-geral', 0.5)]);
    expect(eixo(r, 'Liquidez')).toBe(70);
  });

  it('indicador sem valor sai da conta e redistribui o peso', () => {
    const r = calcularScoreRadar([ind('dscr', 2.0), ind('capacidade-pagamento', null)]);
    expect(eixo(r, 'Cobertura')).toBe(100);
  });

  it('eixo sem nenhum indicador disponível fica em 0', () => {
    expect(eixo(calcularScoreRadar([]), 'Eficiência')).toBe(0);
  });
});
