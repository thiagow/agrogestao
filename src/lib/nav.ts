import {
  LayoutDashboard,
  Database,
  Sprout,
  Building2,
  Users,
  MapPin,
  FileText,
  TrendingUp,
  Scale,
  GitBranch,
  DollarSign,
  BarChart3,
  Calendar,
  Presentation
} from 'lucide-react';
import { ActiveTab } from '../types';

export interface NavEntry {
  id: ActiveTab;
  label: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
}

export const navEntries: NavEntry[] = [
  {
    id: 'resumo',
    label: 'Resumo',
    icon: LayoutDashboard,
    title: 'Resumo Executivo',
    subtitle: 'Visão consolidada do passivo financeiro, fluxo de caixa e compromissos agrícolas'
  },
  {
    id: 'cadastro_mestre',
    label: 'Cadastro Mestre',
    icon: Database,
    title: 'Cadastro Mestre',
    subtitle: 'Gestão de fazendas, safras, culturas e índices econômicos'
  },
  {
    id: 'quadro_safra',
    label: 'Quadro Safra',
    icon: Sprout,
    title: 'Quadro de Safra',
    subtitle: 'Acompanhamento do plantio, área por cultura e projeção de colheita'
  },
  {
    id: 'bancos',
    label: 'Bancos',
    icon: Building2,
    title: 'Bancos e Linhas de Crédito',
    subtitle: 'Saldos bancários, limites rotativos e taxas de custeio'
  },
  {
    id: 'fornecedores',
    label: 'Fornecedores',
    icon: Users,
    title: 'Fornecedores',
    subtitle: 'Controle de dívidas com fornecedores — classificação automática CP/LP por vencimento'
  },
  {
    id: 'aquisicao_fazenda',
    label: 'Aquisição Fazenda',
    icon: MapPin,
    title: 'Aquisição de Fazendas',
    subtitle: 'Controle imobiliário rural, parcelas de terra e investimentos em solo'
  },
  {
    id: 'arrendamentos',
    label: 'Arrendamentos',
    icon: FileText,
    title: 'Contratos de Arrendamento',
    subtitle: 'Gestão de áreas arrendadas e pagamento em sacas de grãos'
  },
  {
    id: 'comercializacao',
    label: 'Comercialização',
    icon: TrendingUp,
    title: 'Comercialização Agrícola',
    subtitle: 'Contratos futuros de soja, milho e algodão com travamento de preços'
  },
  {
    id: 'balanco_pj',
    label: 'Balanço PJ',
    icon: Scale,
    title: 'Balanço Patrimonial PJ',
    subtitle: 'Demonstrativo contábil de ativos rurais, máquinas e endividamento'
  },
  {
    id: 'fluxo_safra',
    label: 'Fluxo de Safra',
    icon: GitBranch,
    title: 'Fluxo por Safra',
    subtitle: 'Acompanhamento de desembolso por etapa do ciclo produtivo'
  },
  {
    id: 'cotacoes',
    label: 'Cotações',
    icon: DollarSign,
    title: 'Cotações de Commodities',
    subtitle: 'Preços em tempo real das principais praças e moedas do agronegócio'
  },
  {
    id: 'analise_financeira',
    label: 'Análise Financeira',
    icon: BarChart3,
    title: 'Análise Financeira e DSCR',
    subtitle: 'Indicadores de endividamento, EBITDA e cobertura do serviço da dívida'
  },
  {
    id: 'fluxo_mensal',
    label: 'Fluxo Mensal',
    icon: Calendar,
    title: 'Fluxo de Caixa Mensal',
    subtitle: 'Projeção de entradas e saídas operacionais para 12 meses'
  },
  {
    id: 'apresentacao_grupo',
    label: 'Apresentação do Grupo',
    icon: Presentation,
    title: 'Apresentação do Grupo Agro',
    subtitle: 'Relatório executivo para bancos, investidores e conselho de administração'
  }
];

export const navEntriesById = new Map(navEntries.map((entry) => [entry.id, entry]));

export const defaultTab: ActiveTab = 'fornecedores';

export function isActiveTab(value: string): value is ActiveTab {
  return navEntriesById.has(value as ActiveTab);
}
