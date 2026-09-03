import { describe, expect, it } from 'vitest';
import { calcularFluxoSafra, classificarCobertura, tipoDaCategoria, montarFluxoSafraDTO } from './fluxo-safra-calc';
import type { FluxoSafraDTO, Supplier, CulturaSafraAno, PecuariaBovinaAno, ProducaoAnimalAno } from '@/types';

// Caso de regressão: números exatos da spec (Grupo Pereira, safra 2026/2027,
// docs/demandas/SPEC_TELA_FLUXO_DE_SAFRA.md seção 2.2/3).
const DTO_SPEC: FluxoSafraDTO = {
  safra: '2026/2027',
  receitaProjetada: 438_003_709,
  receitaRealizada: 0,
  custoProducao: 170_958_647,
  fornecedores: 0,
  amortizacaoBancos: 47_200_158,
  jurosBancos: 6_819_828,
  arrendamentos: 2_014_656,
  arrendamentosReceber: 0,
  despesaComercial: 1_908_000,
  parcelasAquisicao: 115_000_000,
  saldoDevedorBancos: 181_490_133,
  fornecedoresProximaSafra: 0,
  itensManuais: []
};

describe('calcularFluxoSafra', () => {
  it('reproduz os totais exatos da spec do AgroFlow', () => {
    const r = calcularFluxoSafra(DTO_SPEC);

    expect(r.totalSaidas).toBe(343_901_289);
    expect(r.fluxoLiquido).toBe(94_102_420);
    expect(r.indiceCobertura).toBeCloseTo(1.2737, 3);
    expect(r.statusCobertura).toBe('Saudável');
    expect(r.totalRecursosEstruturar).toBe(181_490_133);
    expect(r.custoProximaSafra).toBe(170_958_647);
    // A spec documenta -76.856.228 (fluxoLiquido 94.102.420 - custo 170.958.647);
    // a diferença de R$1 vem do arredondamento da própria spec ao chegar em 94.102.420.
    expect(r.deficitSuperavitProximaSafra).toBe(-76_856_227);
  });

  it('soma itens manuais nas seções corretas', () => {
    const r = calcularFluxoSafra({
      ...DTO_SPEC,
      itensManuais: [
        { id: '1', safra: '2026/2027', categoria: 'OUTRAS_ENTRADAS', tipo: 'ENTRADA', descricao: 'Venda de sucata', valor: 100_000 },
        { id: '2', safra: '2026/2027', categoria: 'DIVIDENDOS_RETIRADAS', tipo: 'SAIDA', descricao: 'Retirada sócio', valor: 50_000 }
      ]
    });

    expect(r.totalEntradas).toBe(DTO_SPEC.receitaProjetada + 100_000);
    expect(r.totalSaidas).toBe(343_901_289 + 50_000);
  });

  it('trata despesa comercial indisponível (sem cotação de soja) como 0 na soma, nunca inventa', () => {
    const r = calcularFluxoSafra({ ...DTO_SPEC, despesaComercial: null });
    const linha = r.saidas.find((s) => s.id === 'despesa_comercial');

    expect(linha?.valor).toBeNull();
    expect(r.totalSaidas).toBe(343_901_289 - 1_908_000);
  });
});

describe('montarFluxoSafraDTO — janela jul-jun (23/08/2026, review do cliente)', () => {
  const SAFRA = '2026/2027'; // janela: 01/07/2026 .. 30/06/2027

  function inputBase() {
    return {
      safra: SAFRA,
      quadroSafra: [] as CulturaSafraAno[],
      pecuariaBovina: [] as PecuariaBovinaAno[],
      producaoAnimal: [] as ProducaoAnimalAno[],
      suppliers: [] as Supplier[],
      contratosBancarios: [],
      parcelasBancos: [] as { data: string; juros: number; amortizacao: number }[],
      linhasArrendamento: [] as { safra: string; direcao: 'A_PAGAR' | 'A_RECEBER'; valorTotal: number | null }[],
      linhasAquisicao: [],
      contratosComerciais: [],
      itensManuais: [],
      precoSoja: null
    };
  }

  it('Bancos: soma parcelas por data real dentro da janela jul-jun, não por "ano calendário == anoInicioSafra+1"', () => {
    const input = inputBase();
    input.parcelasBancos = [
      { data: '2026-08-23', juros: 100, amortizacao: 1000 }, // dentro da janela (2º semestre do 1º ano)
      { data: '2027-03-15', juros: 50, amortizacao: 500 }, // dentro da janela (1º semestre do 2º ano)
      { data: '2026-06-30', juros: 999, amortizacao: 999 }, // fora — ainda é a safra anterior
      { data: '2027-07-01', juros: 999, amortizacao: 999 } // fora — já é a próxima safra
    ];
    const dto = montarFluxoSafraDTO(input);
    expect(dto.jurosBancos).toBe(150);
    expect(dto.amortizacaoBancos).toBe(1500);
  });

  it('Fornecedores: filtra por `vencimento` dentro da janela, ignora o campo texto livre `safra`', () => {
    const input = inputBase();
    const supplierBase: Supplier = {
      id: 's1',
      nome: 'Fornecedor A',
      categoria: 'INSUMOS' as any,
      cultura: 'Soja',
      safra: '', // mal preenchido / vazio de propósito
      dividaTotal: 10_000,
      moeda: 'BRL',
      vencimento: '2026-09-01', // dentro da janela real da safra
      status: 'PENDENTE'
    };
    input.suppliers = [
      supplierBase,
      { ...supplierBase, id: 's2', safra: '2099/2100', vencimento: '2027-01-10', dividaTotal: 5_000 }, // safra digitada errado, vencimento correto -> deve entrar
      { ...supplierBase, id: 's3', safra: SAFRA, vencimento: '2027-08-01', dividaTotal: 999_999 } // safra digitada certo mas vencimento é da próxima -> não deve entrar
    ];
    const dto = montarFluxoSafraDTO(input);
    expect(dto.fornecedores).toBe(15_000);
  });

  it('Arrendamento a receber entra separado do a pagar, nunca somado junto', () => {
    const input = inputBase();
    input.linhasArrendamento = [
      { safra: SAFRA, direcao: 'A_PAGAR', valorTotal: 20_000 },
      { safra: SAFRA, direcao: 'A_RECEBER', valorTotal: 8_000 }
    ];
    const dto = montarFluxoSafraDTO(input);
    expect(dto.arrendamentos).toBe(20_000);
    expect(dto.arrendamentosReceber).toBe(8_000);

    const calculado = calcularFluxoSafra(dto);
    expect(calculado.entradas.find((e) => e.id === 'arrendamentos_receber')?.valor).toBe(8_000);
    expect(calculado.totalEntradas).toBe(dto.receitaProjetada + 8_000);
  });

  it('Pecuária/Suinocultura/Avicultura somam em receitaProjetada/custoProducao pelo ano civil correspondente (2º ano da safra)', () => {
    const input = inputBase();
    // Safra "2026/2027" -> 2º ano civil = 2027.
    input.pecuariaBovina = [
      {
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
        areaPastagemPropria: 0,
        areaPastagemArrendada: 0,
        tipoTerminacao: 'A Pasto',
        custoAquisicaoPorCabeca: 100,
        custoPastagemPorHectare: 0,
        diariaConfinamento: 0,
        diasConfinamento: 0,
        qtdAnimaisConfinados: 0,
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
        diasConfinamentoPorLote: 0
      },
      // ano civil fora da safra (2026 -> safra "2025/2026") não deve entrar
      { id: 'p2', anoCivil: 2026, femeas0a12: 0, femeas12a24: 0, femeas24a36: 0, femeasAcima36: 0, machos0a12: 0, machos12a24: 0, machos24a36: 0, machosAcima36: 0, cicloProdutivo: '', areaPastagemPropria: 0, areaPastagemArrendada: 0, tipoTerminacao: '', custoAquisicaoPorCabeca: 0, custoPastagemPorHectare: 0, diariaConfinamento: 0, diasConfinamento: 0, qtdAnimaisConfinados: 0, qtdMachosComercializados: 999, pesoMedioMachos: 999, precoMedioMachos: 999, qtdFemeasComercializadas: 0, pesoMedioFemeas: 0, precoMedioFemeas: 0, qtdOutrasComercializadas: 0, pesoMedioOutras: 0, precoMedioOutras: 0, capacidadeLotacaoConfinamento: 0, ganhoPesoMedioDiarioKg: 0, diasConfinamentoPorLote: 0 }
    ];
    input.producaoAnimal = [
      { id: 'a1', tipo: 'Avicultura', anoCivil: 2027, producaoCabecas: 1000, precoMedioPorCabeca: 10, custoMedioPorCabeca: 6 },
      { id: 'a2', tipo: 'Suinocultura', anoCivil: 2026, producaoCabecas: 9999, precoMedioPorCabeca: 999, custoMedioPorCabeca: 999 } // fora da safra
    ];

    const dto = montarFluxoSafraDTO(input);
    // Bovino: receita 10*1*500=5000, custo 100*10=1000. Aves: receita 1000*10=10000, custo 1000*6=6000.
    expect(dto.receitaProjetada).toBe(5_000 + 10_000);
    expect(dto.custoProducao).toBe(1_000 + 6_000);
  });
});

describe('classificarCobertura', () => {
  it('classifica os 3 níveis de threshold', () => {
    expect(classificarCobertura(1.27)).toBe('Saudável');
    expect(classificarCobertura(1.2)).toBe('Saudável');
    expect(classificarCobertura(1.1)).toBe('Atenção');
    expect(classificarCobertura(1.0)).toBe('Atenção');
    expect(classificarCobertura(0.8)).toBe('Crítico');
  });
});

describe('tipoDaCategoria', () => {
  it('classifica as 9 categorias do modal nos 2 grupos da spec', () => {
    expect(tipoDaCategoria('RECEITA_VENDA_FAZENDA')).toBe('ENTRADA');
    expect(tipoDaCategoria('ESTOQUE_GRAOS_ENTRADA')).toBe('ENTRADA');
    expect(tipoDaCategoria('ESTOQUE_ALGODAO_ENTRADA')).toBe('ENTRADA');
    expect(tipoDaCategoria('ESTOQUE_GADO_ENTRADA')).toBe('ENTRADA');
    expect(tipoDaCategoria('OUTRAS_ENTRADAS')).toBe('ENTRADA');
    expect(tipoDaCategoria('DIVIDENDOS_RETIRADAS')).toBe('SAIDA');
    expect(tipoDaCategoria('MANUTENCAO_MAQUINAS')).toBe('SAIDA');
    expect(tipoDaCategoria('CORRECAO_SOLO')).toBe('SAIDA');
    expect(tipoDaCategoria('OUTRAS_SAIDAS')).toBe('SAIDA');
  });
});
