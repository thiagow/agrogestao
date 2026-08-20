import {
  Supplier,
  Socio,
  CulturaSafraAno,
  ContratoBancario,
  BalancoPatrimonial,
  IndicadorFinanceiro,
  IndicadorSaudeFinanceira,
  ContratoArrendamento,
  ContratoComercial,
  PosicaoComercializacao,
  FluxoSafraItem,
  Cotacao,
  LancamentoMensal,
  CalendarioAgricolaEtapa
} from '../types';

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

// ---- Cadastro Mestre: Sócios ----

export const initialSocios: Socio[] = [
  {
    id: 'socio-1',
    nome: 'Roberto Pereira',
    cpf: '123.456.789-01',
    participacao: 40,
    estadoCivil: 'Casado',
    telefone: '(62) 99123-4567',
    email: 'roberto.pereira@grupopereira.com.br',
    nacionalidade: 'Brasileira',
    dataNascimento: '1968-04-12'
  },
  {
    id: 'socio-2',
    nome: 'Roger Machado Pereira',
    cpf: '234.567.890-12',
    participacao: 35,
    estadoCivil: 'Casado',
    telefone: '(62) 99234-5678',
    email: 'roger.pereira@grupopereira.com.br',
    nacionalidade: 'Brasileira',
    dataNascimento: '1972-09-03'
  },
  {
    id: 'socio-3',
    nome: 'Augusto Pereira',
    cpf: '345.678.901-23',
    participacao: 25,
    estadoCivil: 'Solteiro',
    telefone: '(62) 99345-6789',
    email: 'augusto.pereira@grupopereira.com.br',
    nacionalidade: 'Brasileira',
    dataNascimento: '1995-11-27'
  }
];

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
  { cultura: 'Arroz', hectares2627: 1701, rendimento: 130, unidadeProducao: 'sc', precoMedio: 78, despesaPorHa: 6200, producaoFixadaPercent: 40 },
  { cultura: 'Bovino', hectares2627: 20637, rendimento: 1.2, unidadeProducao: '@', precoMedio: 310, despesaPorHa: 350, producaoFixadaPercent: 10 }
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

export function calcularSafra(registro: CulturaSafraAno) {
  const totalProducao = Math.round(registro.hectares * registro.rendimento);
  const receitaBruta = Math.round(totalProducao * registro.precoMedio);
  const despesa = Math.round(registro.hectares * registro.custoProducao);
  const receitaLiquida = receitaBruta - despesa;
  const margem = receitaBruta > 0 ? (receitaLiquida / receitaBruta) * 100 : 0;

  return { totalProducao, receitaBruta, despesa, receitaLiquida, margem };
}

// ---- Análise Financeira ----
// (Bancos e Financiamentos migrou pra Prisma na Fase 3 — o mock de
// ContratoBancario que existia aqui foi removido; a fonte real é
// src/server/contratos-bancarios.ts.)

export const initialBalanco: BalancoPatrimonial = {
  safra: '2026/2027',
  ativoCirculante: 443003709,
  ativoNaoCirculante: 2228194990,
  passivoCirculante: 64800239,
  passivoNaoCirculante: 261548518,
  capitalReservas: 0,
  resultadoSafra: 2244901902
};

export const initialIndicadores: IndicadorFinanceiro[] = [
  { id: 'ind-1', grupo: 'Liquidez', nome: 'Liquidez Corrente', valor: 6.84, unidade: 'x', status: 'Excelente', formula: 'Ativo Circulante / Passivo Circulante', referencia: 'Agro: 1,5 (bom)' },
  { id: 'ind-2', grupo: 'Liquidez', nome: 'Liquidez Seca', valor: 6.84, unidade: 'x', status: 'Excelente', formula: '(Ativo Circulante - Estoques) / Passivo Circulante', referencia: 'Agro: 1,0 (bom)' },
  { id: 'ind-3', grupo: 'Liquidez', nome: 'Liquidez Imediata', valor: 0.0, unidade: 'x', status: 'Crítico', formula: 'Caixa / Passivo Circulante', referencia: '0,3 (bom)' },
  { id: 'ind-4', grupo: 'Liquidez', nome: 'Liquidez Geral', valor: 1.36, unidade: 'x', status: 'Bom', formula: '(AC + Ativo Realizável LP) / (PC + Exigível LP)', referencia: '1,0 (bom)' },
  { id: 'ind-5', grupo: 'Estrutura de Capital', nome: 'Endividamento Geral', valor: 12.22, unidade: '%', status: 'Excelente', formula: 'Passivo Total / Ativo Total', referencia: '< 30% (bom)' },
  { id: 'ind-6', grupo: 'Estrutura de Capital', nome: 'Composição CP/LP', valor: 19.86, unidade: '%', status: 'Excelente', formula: 'Passivo Circulante / Passivo Total', referencia: '< 40% (bom)' },
  { id: 'ind-7', grupo: 'Estrutura de Capital', nome: 'Dívida / EBITDA', valor: 1.29, unidade: 'x', status: 'Excelente', formula: 'Passivo Total / EBITDA', referencia: '< 3,0x (bom)' },
  { id: 'ind-8', grupo: 'Estrutura de Capital', nome: 'Imobilização do PL', valor: 95.03, unidade: '%', status: 'Atenção', formula: 'Ativo Não Circulante / Patrimônio Líquido', referencia: '< 90% (bom)' },
  { id: 'ind-9', grupo: 'Estrutura de Capital', nome: 'Grau de Endividamento', valor: 0.14, unidade: 'x', status: 'Excelente', formula: 'Passivo Total / Patrimônio Líquido', referencia: '< 1,0x (bom)' },
  { id: 'ind-10', grupo: 'Estrutura de Capital', nome: 'Alavancagem Financeira', valor: 1.14, unidade: 'x', status: 'Excelente', formula: 'Ativo Total / Patrimônio Líquido', referencia: '< 2,0x (bom)' },
  { id: 'ind-11', grupo: 'Estrutura de Capital', nome: 'Cobertura de Juros', valor: 35.33, unidade: 'x', status: 'Excelente', formula: 'EBIT / Despesas Financeiras', referencia: '> 3,0x (bom)' },
  { id: 'ind-12', grupo: 'Estrutura de Capital', nome: 'Endividamento CP', valor: 19.86, unidade: '%', status: 'Excelente', formula: 'Passivo Circulante / Passivo Total', referencia: '< 40% (bom)' }
];

export const initialSaudeFinanceira: IndicadorSaudeFinanceira[] = [
  { dimensao: 'Liquidez', valor: 85 },
  { dimensao: 'Solvência', valor: 90 },
  { dimensao: 'Eficiência', valor: 70 },
  { dimensao: 'Rentabilidade', valor: 75 },
  { dimensao: 'Endividamento', valor: 88 },
  { dimensao: 'Cobertura', valor: 95 }
];

// Aquisição de Fazendas migrou para persistência real (src/server/aquisicoes.ts,
// Fase 4) — sem mock aqui, mesmo critério de Quadro Safra e Contratos Bancários.

// ---- Arrendamentos ----

export const initialArrendamentos: ContratoArrendamento[] = [
  {
    id: 'arrendamento-1',
    nomePropriedade: 'Fazenda Matagal',
    localizacao: 'Centro-Oeste',
    proprietarioNome: 'Família Silveira',
    proprietarioCpfCnpj: '123.456.789-01',
    areaHectares: 1499,
    culturaPrincipal: 'Soja',
    custoAnualHectare: Math.round((2014656 / 1499) * 100) / 100,
    sacasPorHectare: 12.0,
    dataInicio: '2026-07-01',
    dataFim: '2030-06-30',
    periodicidade: 'Anual',
    renovavel: true,
    status: 'ATIVO',
    safraInicio: '2026/2027',
    safraFim: '2029/2030'
  },
  {
    id: 'arrendamento-2',
    nomePropriedade: 'Fazenda Pedra II',
    localizacao: 'Cruzília - MG',
    proprietarioNome: 'Agropecuária Primavera Ltda',
    proprietarioCpfCnpj: '12.345.678/0001-90',
    areaHectares: 800,
    culturaPrincipal: 'Soja',
    custoAnualHectare: 1200,
    sacasPorHectare: 10.5,
    dataInicio: '2025-07-01',
    dataFim: '2032-06-30',
    periodicidade: 'Anual',
    renovavel: true,
    status: 'ATIVO',
    safraInicio: '2025/2026',
    safraFim: '2031/2032'
  }
];

// ---- Comercialização (Futuros/Hedge) ----

export const initialContratosComerciais: ContratoComercial[] = [];

export const initialPosicaoComercializacao: PosicaoComercializacao[] = [
  { cultura: 'Soja', producaoTotalSc: 368400, cotacaoAtual: 120 },
  { cultura: 'Milho', producaoTotalSc: 154700, cotacaoAtual: 52 },
  { cultura: 'Seringueira', producaoTotalSc: 1664, cotacaoAtual: 6100 },
  { cultura: 'Cana de Açúcar', producaoTotalSc: 188400, cotacaoAtual: 129 },
  { cultura: 'Café Irrigado', producaoTotalSc: 99855, cotacaoAtual: 1800 },
  { cultura: 'Eucalipto', producaoTotalSc: 513285, cotacaoAtual: 150 },
  { cultura: 'Arroz', producaoTotalSc: 150060, cotacaoAtual: 108 },
  { cultura: 'Bovino', producaoTotalSc: 222260, cotacaoAtual: 365 }
];

// ---- Fluxo de Safra Projetado ----

export const initialFluxoSafra: FluxoSafraItem[] = [
  { id: 'fluxo-1', tipo: 'SAIDA', categoria: 'Custo de Produção', descricao: 'Custo de Produção da Safra', valor: 170958647 },
  { id: 'fluxo-2', tipo: 'SAIDA', categoria: 'Fornecedores', descricao: 'Fornecedores (insumos e serviços)', valor: 0 },
  { id: 'fluxo-3', tipo: 'SAIDA', categoria: 'Bancos', descricao: 'Amortização Programada (Bancos)', valor: 45531491 },
  { id: 'fluxo-4', tipo: 'SAIDA', categoria: 'Bancos', descricao: 'Juros Programados (Bancos)', valor: 6219828 },
  { id: 'fluxo-5', tipo: 'SAIDA', categoria: 'Arrendamentos', descricao: 'Arrendamentos', valor: 2014656 },
  { id: 'fluxo-6', tipo: 'SAIDA', categoria: 'Comercial', descricao: 'Despesa Comercial (3 sc/ha soja)', valor: 1900000 },
  { id: 'fluxo-7', tipo: 'SAIDA', categoria: 'Aquisições', descricao: 'Parcelas de Aquisição de Fazenda', valor: 115000000 }
];

export const RECEITA_PROJETADA_SAFRA = 438003709;

// ---- Cotações de Mercado ----

export const initialCotacaoDolar: Cotacao = {
  id: 'cot-usd',
  commodity: 'Dólar Americano',
  bolsa: 'PTAX',
  ticker: 'USD/BRL',
  precoBrl: 5.0735,
  unidade: 'R$',
  variacaoPercentual: -1.04,
  maxima: 5.09,
  minima: 5.0635,
  volume: 0,
  precoDefinidoSafra: 5.0735,
  atualizadoEm: '11:05:39'
};

export const initialCotacoesCommodities: Cotacao[] = [
  {
    id: 'cot-soja',
    commodity: 'Soja Grão',
    bolsa: 'CBOT',
    ticker: 'ZS=F',
    precoUsd: 27.43,
    precoBrl: 139.14,
    unidade: 'R$/sc',
    variacaoPercentual: 1.47,
    maxima: 1253.0,
    minima: 1238.0,
    volume: 59556,
    precoDefinidoSafra: 139.14,
    atualizadoEm: '11:05:39'
  },
  {
    id: 'cot-milho',
    commodity: 'Milho Grão',
    bolsa: 'CBOT',
    ticker: 'ZC=F',
    precoUsd: 11.36,
    precoBrl: 57.64,
    unidade: 'R$/sc',
    variacaoPercentual: -7.01,
    maxima: 492.0,
    minima: 480.0,
    volume: 100740,
    precoDefinidoSafra: 57.64,
    atualizadoEm: '11:05:39'
  },
  {
    id: 'cot-algodao',
    commodity: 'Algodão Pluma',
    bolsa: 'ICE',
    ticker: 'CT=F',
    precoUsd: 396.83,
    precoBrl: 2013.33,
    unidade: 'R$/sc',
    variacaoPercentual: -3.4,
    maxima: 81.75,
    minima: 79.75,
    volume: 11312,
    atualizadoEm: '11:05:39'
  },
  {
    id: 'cot-boi',
    commodity: 'Boi Gordo',
    bolsa: 'CME',
    ticker: 'GF=F',
    precoBrl: 5.79,
    unidade: 'R$/@',
    variacaoPercentual: -1.97,
    maxima: 0,
    minima: 0,
    volume: 0,
    atualizadoEm: '11:05:39'
  },
  {
    id: 'cot-trigo',
    commodity: 'Trigo',
    bolsa: 'CBOT',
    ticker: 'ZW=F',
    precoBrl: 74.38,
    unidade: 'R$/sc',
    variacaoPercentual: -1.34,
    maxima: 0,
    minima: 0,
    volume: 0,
    atualizadoEm: '11:05:39'
  },
  {
    id: 'cot-cafe',
    commodity: 'Café Arábica',
    bolsa: 'ICE',
    ticker: 'KC=F',
    precoBrl: 2118.01,
    unidade: 'R$/sc',
    variacaoPercentual: -5.62,
    maxima: 0,
    minima: 0,
    volume: 0,
    atualizadoEm: '11:05:39'
  }
];

// ---- Fluxo de Caixa Mensal ----

const MESES_LABEL = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function mesLabel(mes: number): string {
  return MESES_LABEL[mes - 1] ?? String(mes);
}

function gerarLancamentosMensais(): LancamentoMensal[] {
  const lancamentos: LancamentoMensal[] = [];
  let seq = 1;

  CULTURA_BASES.forEach((base) => {
    for (let mes = 1; mes <= 12; mes++) {
      const fatorSazonal = 1 + Math.sin((mes / 12) * Math.PI * 2) * 0.6;
      const entrada = mes >= 4 && mes <= 7 ? Math.round(base.hectares2627 * base.precoMedio * base.rendimento * 0.08) : 0;
      const saida = Math.round(base.hectares2627 * base.despesaPorHa * 0.09 * Math.max(fatorSazonal, 0.3));

      if (entrada > 0) {
        lancamentos.push({
          id: `lanc-${seq++}`,
          cultura: base.cultura,
          mes,
          tipo: 'ENTRADA',
          categoria: 'Receita de Colheita',
          valor: entrada
        });
      }

      lancamentos.push({
        id: `lanc-${seq++}`,
        cultura: base.cultura,
        mes,
        tipo: 'SAIDA',
        categoria: 'Custeio Operacional',
        valor: saida
      });
    }
  });

  return lancamentos;
}

export const initialLancamentosMensais: LancamentoMensal[] = gerarLancamentosMensais();

export const initialCalendarioAgricola: CalendarioAgricolaEtapa[] = [
  { cultura: 'Soja', mesesPlantioColheita: [3, 6], mesesDesenvolvimento: [4, 5] },
  { cultura: 'Milho 1ª Safra', mesesPlantioColheita: [2, 10, 11], mesesDesenvolvimento: [3, 4, 5, 6] },
  { cultura: 'Milho Safrinha', mesesPlantioColheita: [5, 6, 7, 8], mesesDesenvolvimento: [5, 6] },
  { cultura: 'Algodão', mesesPlantioColheita: [4, 10, 11], mesesDesenvolvimento: [5, 6, 7] },
  { cultura: 'Bovino', mesesPlantioColheita: [], mesesDesenvolvimento: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] }
];

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
