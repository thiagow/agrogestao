import { describe, expect, it } from 'vitest';
import { calcularFluxoSafra, classificarCobertura, tipoDaCategoria } from './fluxo-safra-calc';
import type { FluxoSafraDTO } from '@/types';

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
