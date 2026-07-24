import { Supplier, BankAccount, CropSeason, LandLease, CommodityContract, CommodityQuote } from '../types';

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
    comprovanteUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80'
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
    imageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80'
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
    imageUrl: 'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?auto=format&fit=crop&w=600&q=80'
  }
];

export const initialBankAccounts: BankAccount[] = [
  {
    id: 'bank-1',
    banco: 'Banco do Brasil',
    agencia: '0432-1',
    conta: '19482-0',
    saldo: 8450000,
    limiteCredito: 25000000,
    taxaJuros: 'CDI + 1.8% a.a.',
    moeda: 'BRL'
  },
  {
    id: 'bank-2',
    banco: 'Itaú BBA Agro',
    agencia: '3810-0',
    conta: '09124-7',
    saldo: 14200000,
    limiteCredito: 40000000,
    taxaJuros: 'CDI + 1.5% a.a.',
    moeda: 'BRL'
  },
  {
    id: 'bank-3',
    banco: 'Rabobank',
    agencia: '0001-9',
    conta: '88301-2',
    saldo: 3100000,
    limiteCredito: 15000000,
    taxaJuros: 'SOFR + 2.1% a.a.',
    moeda: 'USD'
  },
  {
    id: 'bank-4',
    banco: 'Bradesco Agronegócios',
    agencia: '1205-3',
    conta: '45210-9',
    saldo: 6150000,
    limiteCredito: 20000000,
    taxaJuros: 'CDI + 1.9% a.a.',
    moeda: 'BRL'
  }
];

export const initialCropSeasons: CropSeason[] = [
  {
    id: 'crop-1',
    fazenda: 'Fazenda Santa Maria (Sede)',
    cultura: 'Soja',
    safra: '24/25',
    areaHectares: 4500,
    produtividadeEsperada: 68,
    custoTotal: 22500000,
    status: 'COLHEITA'
  },
  {
    id: 'crop-2',
    fazenda: 'Fazenda Boa Esperança',
    cultura: 'Milho Safrinha',
    safra: '24/25',
    areaHectares: 3200,
    produtividadeEsperada: 110,
    custoTotal: 14400000,
    status: 'DESENVOLVIMENTO'
  },
  {
    id: 'crop-3',
    fazenda: 'Fazenda Alvorada',
    cultura: 'Algodão',
    safra: '24/25',
    areaHectares: 1800,
    produtividadeEsperada: 310,
    custoTotal: 28800000,
    status: 'EM_PLANTIO'
  }
];

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
    precoSaca: 132.50,
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
    precoSaca: 64.00,
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
    precoSaca: 135.00,
    valorTotal: 13500000,
    dataEntrega: '2026-04-30',
    status: 'ENTREGUE'
  }
];

export const initialQuotes: CommodityQuote[] = [
  {
    produto: 'Soja (Saca 60kg)',
    praca: 'Rondonópolis - MT',
    precoAtual: 134.80,
    variacao: 1.25,
    unidade: 'R$/sc',
    atualizacao: 'Ao vivo'
  },
  {
    produto: 'Milho (Saca 60kg)',
    praca: 'Campinas - SP (B3)',
    precoAtual: 68.20,
    variacao: -0.45,
    unidade: 'R$/sc',
    atualizacao: 'Ao vivo'
  },
  {
    produto: 'Algodão em Pluma',
    praca: 'Barreiras - BA',
    precoAtual: 142.50,
    variacao: 0.80,
    unidade: 'R$/arroba',
    atualizacao: 'Ao vivo'
  },
  {
    produto: 'Boi Gordo',
    praca: 'Araçatuba - SP (B3)',
    precoAtual: 248.00,
    variacao: 0.30,
    unidade: 'R$/@',
    atualizacao: 'Ao vivo'
  },
  {
    produto: 'Dólar Comercial',
    praca: 'PTAX / Banco Central',
    precoAtual: 5.4820,
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
