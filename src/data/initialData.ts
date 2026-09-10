import { Supplier, CulturaSafraAno, ContratoBancario } from '../types';

export const initialSuppliers: Supplier[] = [
  {
    id: 'supp-1',
    nome: 'Cargill',
    categoria: 'FERTILIZANTES',
    cultura: '—',
    safra: '—',
    dividaTotal: 5600000,
    moeda: 'BRL',
    vencimento: '2026-10-11',
    status: 'PENDENTE',
    observacoes: 'Fornecimento NPK 04-14-08 para a safra 26/27. Pagamento em parcela única.',
    comprovanteUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
    compras: [
      { id: 'compra-1-1', data: '2026-03-12', valor: 2100000, descricao: 'NPK 04-14-08 — 1ª remessa', culturaReferencia: 'Soja' },
      { id: 'compra-1-2', data: '2026-05-02', valor: 3500000, descricao: 'NPK 04-14-08 — 2ª remessa', culturaReferencia: 'Soja' }
    ]
  },
  {
    id: 'supp-2',
    nome: 'Bunge',
    categoria: 'DEFENSIVOS',
    cultura: '—',
    safra: '—',
    dividaTotal: 15200000,
    moeda: 'BRL',
    vencimento: '2027-01-04',
    status: 'PENDENTE',
    observacoes: 'Lote de fungicidas sistêmicos e inseticidas. Barter atrelado à soja.',
    compras: [
      { id: 'compra-2-1', data: '2026-02-20', valor: 15200000, descricao: 'Fungicidas e inseticidas — barter soja', culturaReferencia: 'Soja' }
    ]
  },
  {
    id: 'supp-3',
    nome: 'Syngenta',
    categoria: 'SEMENTES',
    cultura: '—',
    safra: '—',
    dividaTotal: 21000000,
    moeda: 'BRL',
    vencimento: '2026-12-13',
    status: 'PENDENTE',
    observacoes: 'Sementes tratadas com biotecnologia de alta produtividade.',
    compras: [
      { id: 'compra-3-1', data: '2026-01-15', valor: 21000000, descricao: 'Sementes tratadas — safra 26/27', culturaReferencia: 'Soja' }
    ]
  }
];

// Sócios (agora "Sócios e Empresas") migrou para persistência real
// (src/server/socios.ts, Fase 1) — sem mock aqui, mesmo critério de Quadro
// Safra, Contratos Bancários e Aquisição de Fazendas.

// ---- Quadro de Safra / Resumo: Cultura x Ano-Safra ----

interface CulturaBase {
  cultura: string;
  hectares2627: number;
  rendimento: number;
  unidadeProducao: string;
  precoMedio: number;
  despesaPorHa: number;
  producaoFixadaPercent: number;
}

const CULTURA_BASES: CulturaBase[] = [
  { cultura: 'Soja', hectares2627: 4301, rendimento: 65, unidadeProducao: 'sc', precoMedio: 132, despesaPorHa: 5800, producaoFixadaPercent: 62 },
  { cultura: 'Milho', hectares2627: 1300, rendimento: 110, unidadeProducao: 'sc', precoMedio: 64, despesaPorHa: 4500, producaoFixadaPercent: 48 },
  { cultura: 'Seringueira', hectares2627: 401, rendimento: 1800, unidadeProducao: 'kg', precoMedio: 8, despesaPorHa: 6000, producaoFixadaPercent: 20 },
  { cultura: 'Cana de Açúcar', hectares2627: 2355, rendimento: 80, unidadeProducao: 'ton', precoMedio: 120, despesaPorHa: 5200, producaoFixadaPercent: 35 },
  { cultura: 'Café Irrigado', hectares2627: 1801, rendimento: 40, unidadeProducao: 'sc', precoMedio: 950, despesaPorHa: 12000, producaoFixadaPercent: 55 },
  { cultura: 'Eucalipto', hectares2627: 1801, rendimento: 25, unidadeProducao: 'm³', precoMedio: 140, despesaPorHa: 3000, producaoFixadaPercent: 15 },
  { cultura: 'Arroz', hectares2627: 1701, rendimento: 130, unidadeProducao: 'sc', precoMedio: 78, despesaPorHa: 6200, producaoFixadaPercent: 40 }
  // "Bovino" saiu daqui em 02/09/2026 — virou QuadroPecuariaBovina (módulo dedicado).
];

const ANOS_SAFRA = ['2024/2025', '2025/2026', '2026/2027', '2027/2028'];

function gerarCulturaSafras(): CulturaSafraAno[] {
  const registros: CulturaSafraAno[] = [];

  CULTURA_BASES.forEach((base) => {
    ANOS_SAFRA.forEach((anoSafra, anoIndex) => {
      const fatorArea = 1 + (anoIndex - 2) * 0.012;
      const fatorRendimento = 1 + (anoIndex - 2) * 0.02;
      const hectares = Math.round(base.hectares2627 * fatorArea);
      const haArrendada = base.cultura === 'Soja' && anoSafra === '2026/2027' ? 7 : 0;

      registros.push({
        id: `safra-${base.cultura}-${anoSafra}`.replace(/\s|\//g, '-').toLowerCase(),
        cultura: base.cultura,
        anoSafra,
        hectares,
        haPropria: hectares - haArrendada,
        haArrendada,
        rendimento: Math.round(base.rendimento * fatorRendimento * 100) / 100,
        unidadeProducao: base.unidadeProducao,
        precoMedio: base.precoMedio,
        custoProducao: base.despesaPorHa,
        producaoFixadaPercent: anoSafra === '2026/2027' ? base.producaoFixadaPercent : undefined
      });
    });
  });

  return registros;
}

export const initialCulturaSafras: CulturaSafraAno[] = gerarCulturaSafras();

// Reexportado de @/lib/agro (fonte única, testada) — mantido aqui só porque
// vários módulos ainda importam calcularSafra deste arquivo junto com
// formatCurrency (10/09/2026, consolidação da Frente 1).
export { calcularSafra } from '@/lib/agro';

// ---- Análise Financeira ----
// (Bancos e Financiamentos migrou pra Prisma na Fase 3 — o mock de
// ContratoBancario que existia aqui foi removido; a fonte real é
// src/server/contratos-bancarios.ts.)

// Análise Financeira migrou para agregação ao vivo (Bancos + Fornecedores +
// Arrendamentos + Aquisição de Fazenda + Quadro de Safra + Bens e Direitos),
// montada no client a partir dos dados já carregados por page.tsx —
// src/lib/balanco-calc.ts. Sem mock aqui, mesmo critério de Fluxo de Safra.

// Aquisição de Fazendas e Arrendamentos migraram para persistência real
// (src/server/aquisicoes.ts, src/server/arrendamentos.ts) — sem mock aqui,
// mesmo critério de Quadro Safra e Contratos Bancários.

// Comercialização migrou para persistência real + cruzamento com Quadro de
// Safra/Cotações (src/server/contratos-comerciais.ts, src/lib/comercializacao.ts)
// — sem mock aqui, mesmo critério de Aquisição de Fazendas e Arrendamentos.

// Fluxo de Safra migrou para agregação ao vivo (Quadro Safra + Fornecedores +
// Bancos + Arrendamentos + Aquisição de Fazenda), montada no client a partir
// dos dados já carregados por page.tsx — src/lib/fluxo-safra-calc.ts. A única
// escrita própria (itens manuais extraordinários) persiste via
// src/server/fluxo-safra.ts — sem mock aqui, mesmo critério dos demais módulos
// já migrados.

// ---- Fluxo de Caixa Mensal ----

const MESES_LABEL = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function mesLabel(mes: number): string {
  return MESES_LABEL[mes - 1] ?? String(mes);
}

export function formatCurrency(amount: number, currency: string = 'BRL'): string {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  }).format(amount).replace(/\s/g, ' ');
}

export function formatDateBR(dateString: string): string {
  if (!dateString) return '—';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateString;
}

export function isCurtoPrazo(vencimentoDateStr: string): boolean {
  if (!vencimentoDateStr) return true;
  const today = new Date();
  const venc = new Date(vencimentoDateStr);
  const diffTime = venc.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 360;
}
