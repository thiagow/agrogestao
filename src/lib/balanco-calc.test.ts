import { describe, it, expect } from 'vitest';
import { montarBalanco, complementaresVazio, splitBancosCpLp, splitAquisicaoCpLp } from './balanco-calc';
import type { Aquisicao, BemDireito, ContratoArrendamento, CulturaSafraAno, PrecoDefinidoSafra, Supplier } from '@/types';

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
    grupoIrpf: 'Outros Bens e Direitos',
    codigoTipo: '99',
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
    suppliers: [] as Supplier[],
    fluxoDetalhadoBancos: [],
    anosCronograma: [],
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
      bem({ id: 'b2', grupoIrpf: 'Bens Móveis', valorMercadoEstimado: 80_000 }),
      bem({ id: 'b3', grupoIrpf: 'Aplicações e Investimentos', valorMercadoEstimado: 5_000 })
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
    input.bensDireitos = [bem({ grupoIrpf: 'Aplicações e Investimentos', valorMercadoEstimado: 5_000_000, descricao: 'CDB Santander' })];
    const balanco = montarBalanco(input);
    expect(balanco.ativo.aplicacoesFinanceiras).toBe(5_000_000);
    expect(balanco.ativo.bensIrpf).toBe(0); // já contabilizado no Circulante, não repete no Não Circulante
  });
});

describe('calcularPatrimonioIrpf — resolve BUGs #2/#3 da spec', () => {
  it('cards-resumo batem com a soma real da listagem detalhada (BUG #2 não se reproduz)', () => {
    const input = inputBase();
    input.bensDireitos = [
      bem({ id: 'f1', grupoIrpf: 'Imóveis Rurais - ANEXO A', valorMercadoEstimado: 2_030_673_990, descricao: 'Fazenda X' }),
      bem({ id: 'm1', grupoIrpf: 'Bens Móveis', valorMercadoEstimado: 82_521_000, descricao: 'Maquinário' })
    ];
    const balanco = montarBalanco(input);
    expect(balanco.patrimonioIrpf.fazendasProprias.valor).toBe(2_030_673_990);
    expect(balanco.patrimonioIrpf.fazendasProprias.itens).toBe(1);
    expect(balanco.patrimonioIrpf.maquinasEquipamentos.valor).toBe(82_521_000);
  });

  it('"Máquinas e Equipamentos" nunca cai na categoria de Imóveis Urbanos (BUG #3 não se reproduz)', () => {
    const input = inputBase();
    input.bensDireitos = [bem({ grupoIrpf: 'Bens Móveis', valorMercadoEstimado: 82_521_000, descricao: 'Maquinário' })];
    const balanco = montarBalanco(input);
    const categoriaUrbana = balanco.patrimonioIrpf.categorias.find((c) => c.categoria === 'Imóveis Urbanos (IRPF)');
    expect(categoriaUrbana).toBeUndefined();
    const categoriaMaquinas = balanco.patrimonioIrpf.categorias.find((c) => c.categoria === 'Máquinas e Equipamentos (IRPF)');
    expect(categoriaMaquinas?.subtotal).toBe(82_521_000);
  });
});

describe('splitBancosCpLp / splitAquisicaoCpLp', () => {
  it('CP + LP fecha exatamente com a soma de todas as parcelas', () => {
    const hoje = new Date();
    const daqui6Meses = new Date(hoje.getTime() + 180 * 86400000).toISOString().slice(0, 10);
    const daqui3Anos = new Date(hoje.getTime() + 3 * 365 * 86400000).toISOString().slice(0, 10);

    const { cp, lp } = splitBancosCpLp([
      { anos: [{ parcelas: [{ data: daqui6Meses, amortizacao: 1000 } as any, { data: daqui3Anos, amortizacao: 5000 } as any] } as any] }
    ]);
    expect(cp).toBe(1000);
    expect(lp).toBe(5000);
    expect(cp + lp).toBe(6000);
  });

  it('Aquisição de Fazenda: parcela vencida cai em Curto Prazo (nunca vira "Longo Prazo esquecido")', () => {
    const passado = '2020-01-01';
    const { cp, lp } = splitAquisicaoCpLp([
      { parcelas: [{ dataPagamento: passado, valorTotal: 10_000 } as any] }
    ]);
    expect(cp).toBe(10_000);
    expect(lp).toBe(0);
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
