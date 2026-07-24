import React from 'react';
import { Menu, Plus, Users, Image as ImageIcon, Sparkles, Search } from 'lucide-react';
import { ActiveTab } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  onOpenMobileSidebar: () => void;
  onOpenNewSupplierDrawer: () => void;
  onOpenImageModal: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const tabTitles: Record<ActiveTab, { title: string; subtitle: string; icon: React.ElementType }> = {
  fornecedores: {
    title: 'Fornecedores',
    subtitle: 'Controle de dívidas com fornecedores — classificação automática CP/LP por vencimento',
    icon: Users
  },
  resumo: {
    title: 'Resumo Executivo',
    subtitle: 'Visão consolidada do passivo financeiro, fluxo de caixa e compromissos agrícolas',
    icon: Users
  },
  cadastro_mestre: {
    title: 'Cadastro Mestre',
    subtitle: 'Gestão de fazendas, safras, culturas e índices econômicos',
    icon: Users
  },
  quadro_safra: {
    title: 'Quadro de Safra',
    subtitle: 'Acompanhamento do plantio, área por cultura e projeção de colheita',
    icon: Users
  },
  bancos: {
    title: 'Bancos e Linhas de Crédito',
    subtitle: 'Saldos bancários, limites rotativos e taxas de custeio',
    icon: Users
  },
  aquisicao_fazenda: {
    title: 'Aquisição de Fazendas',
    subtitle: 'Controle imobiliário rural, parcelas de terra e investimentos em solo',
    icon: Users
  },
  arrendamentos: {
    title: 'Contratos de Arrendamento',
    subtitle: 'Gestão de áreas arrendadas e pagamento em sacas de grãos',
    icon: Users
  },
  comercializacao: {
    title: 'Comercialização Agrícola',
    subtitle: 'Contratos futuros de soja, milho e algodão com travamento de preços',
    icon: Users
  },
  balanco_pj: {
    title: 'Balanço Patrimonial PJ',
    subtitle: 'Demonstrativo contábil de ativos rurais, máquinas e endividamento',
    icon: Users
  },
  fluxo_safra: {
    title: 'Fluxo por Safra',
    subtitle: 'Acompanhamento de desembolso por etapa do ciclo produtivo',
    icon: Users
  },
  cotacoes: {
    title: 'Cotações de Commodities',
    subtitle: 'Preços em tempo real das principais praças e moedas do agronegócio',
    icon: Users
  },
  analise_financeira: {
    title: 'Análise Financeira e DSCR',
    subtitle: 'Indicadores de endividamento, EBITDA e cobertura do serviço da dívida',
    icon: Users
  },
  fluxo_mensal: {
    title: 'Fluxo de Caixa Mensal',
    subtitle: 'Projeção de entradas e saídas operacionais para 12 meses',
    icon: Users
  },
  apresentacao_grupo: {
    title: 'Apresentação do Grupo Agro',
    subtitle: 'Relatório executivo para bancos, investidores e conselho de administração',
    icon: Users
  }
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenMobileSidebar,
  onOpenNewSupplierDrawer,
  onOpenImageModal,
  searchTerm,
  setSearchTerm
}) => {
  const info = tabTitles[activeTab] || tabTitles.fornecedores;

  return (
    <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Title & Subtitle */}
      <div className="flex items-start gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 text-slate-700 bg-white border border-slate-200 rounded-lg shadow-xs hover:bg-slate-50 mt-0.5"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-700" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
              {info.title}
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1 font-normal">
            {info.subtitle}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
        {/* HTML Image Links Generator Trigger */}
        <button
          onClick={onOpenImageModal}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs md:text-sm font-medium shadow-xs transition hover:border-slate-400"
          title="Gerar e copiar links diretos de imagens para HTML"
        >
          <ImageIcon className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline">Links de Imagens HTML</span>
          <span className="sm:hidden">Links HTML</span>
        </button>

        {/* Novo Fornecedor Button (Matching Screenshot) */}
        {activeTab === 'fornecedores' && (
          <button
            onClick={onOpenNewSupplierDrawer}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#a3e635] hover:bg-[#8cc627] text-[#0b2310] font-semibold text-xs md:text-sm rounded-xl shadow-sm transition hover:shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Novo Fornecedor</span>
          </button>
        )}
      </div>
    </header>
  );
};
