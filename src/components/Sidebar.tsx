import React from 'react';
import { ActiveTab } from '../types';
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
  Presentation,
  LogOut,
  X,
  Menu,
  Image as ImageIcon
} from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  onOpenImageModal: () => void;
}

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { id: 'resumo', label: 'Resumo', icon: LayoutDashboard },
  { id: 'cadastro_mestre', label: 'Cadastro Mestre', icon: Database },
  { id: 'quadro_safra', label: 'Quadro Safra', icon: Sprout },
  { id: 'bancos', label: 'Bancos', icon: Building2 },
  { id: 'fornecedores', label: 'Fornecedores', icon: Users },
  { id: 'aquisicao_fazenda', label: 'Aquisição Fazenda', icon: MapPin },
  { id: 'arrendamentos', label: 'Arrendamentos', icon: FileText },
  { id: 'comercializacao', label: 'Comercialização', icon: TrendingUp },
  { id: 'balanco_pj', label: 'Balanço PJ', icon: Scale },
  { id: 'fluxo_safra', label: 'Fluxo de Safra', icon: GitBranch },
  { id: 'cotacoes', label: 'Cotações', icon: DollarSign },
  { id: 'analise_financeira', label: 'Análise Financeira', icon: BarChart3 },
  { id: 'fluxo_mensal', label: 'Fluxo Mensal', icon: Calendar },
  { id: 'apresentacao_grupo', label: 'Apresentação do Grupo', icon: Presentation },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpenMobile,
  setIsOpenMobile,
  onOpenImageModal
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-[240px] bg-[#0b2310] text-slate-100 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header Logo */}
        <div className="p-5 flex items-center justify-between border-b border-emerald-900/40">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#a3e635]/15 text-[#a3e635] flex items-center justify-center">
              <Sprout className="w-6 h-6 stroke-[2.5]" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-white font-sans">
              agro<span className="font-normal text-emerald-200">gestão</span>
            </span>
          </div>

          <button
            onClick={() => setIsOpenMobile(false)}
            className="lg:hidden p-1 text-slate-400 hover:text-white rounded-md"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpenMobile(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#a3e635] text-[#0b2310] shadow-md shadow-[#a3e635]/20 font-semibold'
                    : 'text-emerald-100/70 hover:text-white hover:bg-emerald-900/30'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-[#0b2310] stroke-[2.2]' : 'text-emerald-200/70'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Image / HTML Link Helper Shortcut Button */}
        <div className="px-3 py-2 border-t border-emerald-900/40">
          <button
            onClick={onOpenImageModal}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium bg-emerald-900/40 hover:bg-emerald-800/50 text-emerald-200 hover:text-white rounded-lg transition border border-emerald-800/50"
          >
            <ImageIcon className="w-3.5 h-3.5 text-[#a3e635]" />
            <span>Gerador de Links de Imagem</span>
          </button>
        </div>

        {/* Footer User Profile (Matching Screenshot) */}
        <div className="p-3 border-t border-emerald-900/50 bg-[#081a0c] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#a3e635] text-[#0b2310] font-bold text-xs flex items-center justify-center shrink-0 border border-[#a3e635]/30">
              T
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white leading-tight truncate">thiago</p>
              <p className="text-[11px] text-emerald-300/70 truncate">thiago@techhive.com.br</p>
            </div>
          </div>
          <button
            title="Sair do Sistema"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-emerald-900/40 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
};
