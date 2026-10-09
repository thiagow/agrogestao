import { describe, it, expect } from 'vitest';
import { calcularPatrimonioGrupo } from './patrimonio';
import type { BemDireito, Socio } from '@/types';

function bem(overrides: Partial<BemDireito> = {}): BemDireito {
  return {
    id: overrides.id ?? 'bem-1',
    grupoIrpf: 'Benfeitorias e Instalações',
    descricao: 'Fazenda X',
    liquidez: 'Baixa',
    elegivelGarantia: false,
    geraFluxoCaixa: false,
    ...overrides
  };
}

function socio(overrides: Partial<Socio> = {}): Socio {
  return {
    id: overrides.id ?? 'socio-1',
    tipoPessoa: 'PF',
    nome: 'Sócio X',
    ...overrides
  };
}

describe('calcularPatrimonioGrupo', () => {
  it('soma bruto/ponderado usando valorMercadoEstimado quando presente (ponderado = bruto, sem % no grupo)', () => {
    const socios = [socio({ id: 's1' })];
    const bens = [bem({ socioId: 's1', valorMercadoEstimado: 1000 })];
    const resumo = calcularPatrimonioGrupo(bens, socios);

    expect(resumo.patrimonioTotalBruto).toBe(1000);
    expect(resumo.patrimonioPonderado).toBe(1000);
  });

  it('cai para valorDeclaradoIrpf quando valorMercadoEstimado está ausente (fix do BUG do Painel Consolidado)', () => {
    const socios = [socio({ id: 's1' })];
    const bens = [bem({ socioId: 's1', valorDeclaradoIrpf: 500 })];
    const resumo = calcularPatrimonioGrupo(bens, socios);

    // Antes do fix isso dava 0 — a aba Bens e Direitos já contava esse bem no
    // subtotal por categoria, mas o Painel Consolidado ignorava.
    expect(resumo.patrimonioTotalBruto).toBe(500);
    expect(resumo.patrimonioPonderado).toBe(500);
  });

  it('prefere valorMercadoEstimado sobre valorDeclaradoIrpf quando os dois existem', () => {
    const bens = [bem({ valorMercadoEstimado: 1000, valorDeclaradoIrpf: 300 })];
    const resumo = calcularPatrimonioGrupo(bens, []);

    expect(resumo.patrimonioTotalBruto).toBe(1000);
  });

  it('bem sem sócio vinculado entra 100% ponderado ("Grupo")', () => {
    const bens = [bem({ valorMercadoEstimado: 1000 })];
    const resumo = calcularPatrimonioGrupo(bens, []);

    expect(resumo.patrimonioPonderado).toBe(1000);
    expect(resumo.porSocio).toEqual([
      { socioId: null, nome: 'Grupo (sem sócio específico)', patrimonioBruto: 1000, patrimonioPonderado: 1000 }
    ]);
  });

  it('garantia ponderada só considera valorMercadoEstimado, nunca o valor declarado de IRPF', () => {
    const socios = [socio({ id: 's1' })];
    const bens = [
      bem({ socioId: 's1', valorDeclaradoIrpf: 500, elegivelGarantia: true, ltv: 60 }) // sem valorMercadoEstimado
    ];
    const resumo = calcularPatrimonioGrupo(bens, socios);

    expect(resumo.garantiaPonderadaTotal).toBe(0);
  });

  it('calcula garantia total = valorMercadoEstimado × ltv', () => {
    const socios = [socio({ id: 's1' })];
    const bens = [bem({ socioId: 's1', valorMercadoEstimado: 1000, elegivelGarantia: true, ltv: 60 })];
    const resumo = calcularPatrimonioGrupo(bens, socios);

    // 1000 * 0.6 (ltv) = 600
    expect(resumo.garantiaPonderadaTotal).toBe(600);
  });
});
