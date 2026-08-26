// Calendário Agrícola do Centro-Oeste (MT/GO/MS/TO) — referência estática,
// conhecimento agronômico genérico e não editável por conta (mesmo critério
// já registrado em CLAUDE.md para este bloco da tela Fluxo Mensal). Réplica
// confirmada de docs/demandas/SPEC_TELA_FLUXO_MENSAL.md, seção 3 — os meses
// citados explicitamente no print (Soja colheita Mar/Abr; Milho 1ª Safra
// colheita Mar/Abr/Mai; Milho Safrinha plantio Jan/Fev e colheita Jun/Jul/Ago;
// Algodão colheita Ago/Set; Pecuária Bovina contínua) foram mantidos tal qual;
// os meses que a sessão de mapeamento não conseguiu capturar (ex.: plantio de
// Soja, plantio de Milho 1ª Safra/Algodão) foram completados com o calendário
// agronômico padrão da região — nunca inventados sem base, mas também não
// confirmados por print.
//
// `fasesPorMes` é indexado 0=Janeiro..11=Dezembro.

export type FaseCalendarioAgricola = 'PLANTIO_CUSTEIO' | 'CRESCIMENTO' | 'COLHEITA_RECEITA';

export type CategoriaCalendarioAgricola =
  | 'SOJA'
  | 'MILHO_1_SAFRA'
  | 'MILHO_SAFRINHA'
  | 'ALGODAO'
  | 'PECUARIA_BOVINA'
  | 'OUTRAS_CULTURAS';

export interface EtapaCalendarioAgricola {
  categoria: CategoriaCalendarioAgricola;
  label: string;
  fasesPorMes: (FaseCalendarioAgricola | null)[];
  /**
   * Pecuária não tem ciclo de plantio/colheita — custeio e receita são
   * recorrentes em todos os meses do horizonte (spec: "Custeio Pecuária
   * Bovina"/"Receita Pecuária Bovina" aparecem todo mês). Nesse caso
   * `fasesPorMes` só descreve a cor do heatmap; a distribuição de valores em
   * fluxo-mensal-calc.ts ignora as fases e usa 1/12 por mês.
   */
  distribuicaoContinua?: boolean;
}

const P: FaseCalendarioAgricola = 'PLANTIO_CUSTEIO';
const C: FaseCalendarioAgricola = 'CRESCIMENTO';
const R: FaseCalendarioAgricola = 'COLHEITA_RECEITA';
const N = null;

export const CALENDARIO_AGRICOLA_CENTRO_OESTE: EtapaCalendarioAgricola[] = [
  {
    categoria: 'SOJA',
    label: 'Soja',
    // Jan/Fev crescimento, Mar/Abr colheita (confirmado), Mai-Ago pousio,
    // Set-Nov plantio/custeio, Dez crescimento.
    fasesPorMes: [C, C, R, R, N, N, N, N, P, P, P, C]
  },
  {
    categoria: 'MILHO_1_SAFRA',
    label: 'Milho 1ª Safra',
    // Colheita Mar/Abr/Mai confirmada; plantio/custeio Set-Nov (mesma janela
    // da Soja, cultura em rotação); Dez-Fev crescimento.
    fasesPorMes: [N, N, R, R, R, N, N, N, P, P, P, C]
  },
  {
    categoria: 'MILHO_SAFRINHA',
    label: 'Milho Safrinha',
    // Plantio/custeio Jan/Fev e colheita Jun/Jul/Ago confirmados; Mar-Mai crescimento.
    fasesPorMes: [P, P, C, C, C, R, R, R, N, N, N, N]
  },
  {
    categoria: 'ALGODAO',
    label: 'Algodão Safra',
    // Colheita Ago/Set confirmada; plantio/custeio Dez/Jan; Fev-Jul crescimento.
    fasesPorMes: [P, C, C, C, C, C, C, R, R, N, N, P]
  },
  {
    categoria: 'PECUARIA_BOVINA',
    label: 'Pecuária Bovina',
    // Atividade contínua, sem fase de plantio — spec mostra verde em todos os
    // meses observados (Jan-Set).
    fasesPorMes: Array(12).fill(C) as (FaseCalendarioAgricola | null)[],
    distribuicaoContinua: true
  },
  {
    categoria: 'OUTRAS_CULTURAS',
    label: 'Outras Culturas',
    // Sem linha própria na spec — o "Custeio Outras Culturas" observado
    // concentra-se em Out-Dez (mesmo pico de plantio de Milho 1ª Safra),
    // usado aqui como calendário padrão para qualquer cultura não mapeada.
    fasesPorMes: [N, N, R, R, R, N, N, N, P, P, P, C]
  }
];

const CALENDARIO_POR_CATEGORIA = new Map(CALENDARIO_AGRICOLA_CENTRO_OESTE.map((e) => [e.categoria, e]));

/** Nomes de Cultura já usados em Cadastro Mestre/Quadro de Safra (ver cultura-commodity.ts) mapeados para uma categoria de calendário. */
const CULTURA_CATEGORIA_MAP: Record<string, CategoriaCalendarioAgricola> = {
  Soja: 'SOJA',
  Milho: 'MILHO_1_SAFRA',
  'Milho Safrinha': 'MILHO_SAFRINHA',
  'Algodão Safra': 'ALGODAO',
  'Algodão Safrinha': 'ALGODAO',
  Bovino: 'PECUARIA_BOVINA'
};

/** Cultura sem correspondência mapeada cai em OUTRAS_CULTURAS — nunca lança erro (mesmo critério de commodityDaCultura). */
export function categoriaCalendarioDaCultura(culturaNome: string): CategoriaCalendarioAgricola {
  const alvo = culturaNome.trim().toLowerCase();
  const match = Object.entries(CULTURA_CATEGORIA_MAP).find(([nome]) => nome.toLowerCase() === alvo);
  return match ? match[1] : 'OUTRAS_CULTURAS';
}

export function etapaCalendarioDaCategoria(categoria: CategoriaCalendarioAgricola): EtapaCalendarioAgricola {
  return CALENDARIO_POR_CATEGORIA.get(categoria)!;
}
