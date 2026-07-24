import {
  Supplier,
  LandLease,
  CommodityContract,
  CommodityQuote,
  Socio,
  CulturaSafraAno,
  ContratoBancario,
  BalancoPatrimonial,
  IndicadorFinanceiro,
  IndicadorSaudeFinanceira
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
    imageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=600&q=80',
    comprovanteUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
    cnpjCpf: '60.860.087/0001-70',
    contatoNome: 'Marcos Vinícius Andrade',
    contatoTelefone: '(65) 3411-2200',
    contatoEmail: 'comercial@cargill.com.br',
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
    imageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80',
    cnpjCpf: '84.046.101/0001-06',
    contatoNome: 'Fernanda Ribeiro Lima',
    contatoTelefone: '(11) 3984-1500',
    contatoEmail: 'atendimento@bunge.com',
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
    imageUrl: 'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?auto=format&fit=crop&w=600&q=80',
    cnpjCpf: '60.744.463/0001-90',
    contatoNome: 'Paulo Henrique Souza',
    contatoTelefone: '(19) 3765-8000',
    contatoEmail: 'vendas@syngenta.com',
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
        despesa: Math.round(hectares * base.despesaPorHa),
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
  const receitaLiquida = receitaBruta - registro.despesa;
  const margem = receitaBruta > 0 ? (receitaLiquida / receitaBruta) * 100 : 0;

  return { totalProducao, receitaBruta, receitaLiquida, margem };
}

// ---- Bancos e Financiamentos ----

export const initialContratosBancarios: ContratoBancario[] = [
  {
    id: 'contrato-1',
    banco: 'Sicoob',
    tipoContrato: 'CUSTEO',
    saldoInicial: 1200000,
    saldoAtual: 967569,
    taxaJuros: 4.0,
    tipoTaxa: 'CDI',
    dataContratacao: '2025-06-01',
    dataVencimento: '2028-12-31',
    sistemaAmortizacao: 'SAC',
    periodicidade: 'Anual',
    finalidade: 'CUSTEIO',
    moeda: 'BRL'
  },
  {
    id: 'contrato-2',
    banco: 'Bradesco',
    tipoContrato: 'CUSTEO',
    saldoInicial: 350000,
    saldoAtual: 284597,
    taxaJuros: 4.96,
    tipoTaxa: 'CDI',
    dataContratacao: '2025-11-30',
    dataVencimento: '2026-11-30',
    sistemaAmortizacao: 'BULLET',
    periodicidade: 'Anual',
    finalidade: 'CUSTEIO',
    moeda: 'BRL'
  },
  {
    id: 'contrato-3',
    banco: 'Banco do Brasil',
    tipoContrato: 'CUSTEO',
    saldoInicial: 35000000,
    saldoAtual: 31042681,
    taxaJuros: 4.0,
    tipoTaxa: 'CDI',
    dataContratacao: '2025-01-15',
    dataVencimento: '2028-12-31',
    sistemaAmortizacao: 'SAC',
    periodicidade: 'Anual',
    finalidade: 'CUSTEIO',
    moeda: 'BRL'
  },
  {
    id: 'contrato-4',
    banco: 'BRB',
    tipoContrato: 'CPR',
    saldoInicial: 40000000,
    saldoAtual: 37905125,
    taxaJuros: 4.0,
    tipoTaxa: 'CDI',
    dataContratacao: '2025-03-10',
    dataVencimento: '2029-12-31',
    sistemaAmortizacao: 'PRICE',
    periodicidade: 'Anual',
    finalidade: 'INVESTIMENTO',
    moeda: 'BRL'
  },
  {
    id: 'contrato-5',
    banco: 'Banco do Nordeste',
    tipoContrato: 'CPR',
    saldoInicial: 7200000,
    saldoAtual: 6790161,
    taxaJuros: 8.0,
    tipoTaxa: 'PRÉ',
    dataContratacao: '2025-02-20',
    dataVencimento: '2029-12-31',
    sistemaAmortizacao: 'PRICE',
    periodicidade: 'Anual',
    finalidade: 'CAPITAL_GIRO',
    moeda: 'BRL'
  },
  {
    id: 'contrato-6',
    banco: 'Rabobank',
    tipoContrato: 'FINANCIAMENTO',
    saldoInicial: 52000000,
    saldoAtual: 50000000,
    taxaJuros: 4.1,
    tipoTaxa: 'CDI',
    dataContratacao: '2024-08-01',
    dataVencimento: '2030-08-01',
    sistemaAmortizacao: 'SAC',
    periodicidade: 'Semestral',
    finalidade: 'INVESTIMENTO',
    moeda: 'BRL'
  },
  {
    id: 'contrato-7',
    banco: 'Santander Agro',
    tipoContrato: 'CUSTEO',
    saldoInicial: 46000000,
    saldoAtual: 44500000,
    taxaJuros: 4.2,
    tipoTaxa: 'CDI',
    dataContratacao: '2025-05-01',
    dataVencimento: '2028-05-01',
    sistemaAmortizacao: 'SAC',
    periodicidade: 'Trimestral',
    finalidade: 'CUSTEIO',
    moeda: 'BRL'
  }
];

// ---- Análise Financeira ----

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

// ---- Demais módulos (ainda GenericView) ----

export const initialLeases: LandLease[] = [
  {
    id: 'lease-1',
    proprietario: 'Família Silveira',
    fazenda: 'Gleba Sul - Sorriso/MT',
    areaHa: 1200,
    valorSacasHa: 12,
    vencimento: '2026-08-30',
    status: 'EM_DIA'
  },
  {
    id: 'lease-2',
    proprietario: 'Agropecuária Primavera Ltda',
    fazenda: 'Fazenda Retiro',
    areaHa: 850,
    valorSacasHa: 14,
    vencimento: '2026-11-15',
    status: 'EM_DIA'
  }
];

export const initialContracts: CommodityContract[] = [
  {
    id: 'contract-1',
    comprador: 'Cargill Agrícola',
    produto: 'Soja em Grãos',
    safra: '24/25',
    quantidadeSacas: 150000,
    precoSaca: 132.5,
    valorTotal: 19875000,
    dataEntrega: '2026-05-30',
    status: 'PARCIAL'
  },
  {
    id: 'contract-2',
    comprador: 'ADM do Brasil',
    produto: 'Milho',
    safra: '24/25',
    quantidadeSacas: 200000,
    precoSaca: 64.0,
    valorTotal: 12800000,
    dataEntrega: '2026-09-15',
    status: 'ABERTO'
  },
  {
    id: 'contract-3',
    comprador: 'Amaggi',
    produto: 'Soja em Grãos',
    safra: '24/25',
    quantidadeSacas: 100000,
    precoSaca: 135.0,
    valorTotal: 13500000,
    dataEntrega: '2026-04-30',
    status: 'ENTREGUE'
  }
];

export const initialQuotes: CommodityQuote[] = [
  {
    produto: 'Soja (Saca 60kg)',
    praca: 'Rondonópolis - MT',
    precoAtual: 134.8,
    variacao: 1.25,
    unidade: 'R$/sc',
    atualizacao: 'Ao vivo'
  },
  {
    produto: 'Milho (Saca 60kg)',
    praca: 'Campinas - SP (B3)',
    precoAtual: 68.2,
    variacao: -0.45,
    unidade: 'R$/sc',
    atualizacao: 'Ao vivo'
  },
  {
    produto: 'Algodão em Pluma',
    praca: 'Barreiras - BA',
    precoAtual: 142.5,
    variacao: 0.8,
    unidade: 'R$/arroba',
    atualizacao: 'Ao vivo'
  },
  {
    produto: 'Boi Gordo',
    praca: 'Araçatuba - SP (B3)',
    precoAtual: 248.0,
    variacao: 0.3,
    unidade: 'R$/@',
    atualizacao: 'Ao vivo'
  },
  {
    produto: 'Dólar Comercial',
    praca: 'PTAX / Banco Central',
    precoAtual: 5.482,
    variacao: -0.18,
    unidade: 'R$/USD',
    atualizacao: 'Ao vivo'
  }
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
