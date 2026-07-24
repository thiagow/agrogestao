'use client';

import React from 'react';
import { Menu, Image as ImageIcon } from 'lucide-react';
import { ActiveTab } from '../types';
import { navEntriesById } from '../lib/nav';
import { useAppShell } from '../lib/app-shell-context';

interface HeaderProps {
  tab: ActiveTab;
  actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ tab, actions }) => {
  const { openMobileSidebar, openImageModal } = useAppShell();
  const entry = navEntriesById.get(tab);
  const Icon = entry?.icon ?? Menu;

  return (
    <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Title & Subtitle */}
      <div className="flex items-start gap-3">
        <button
          onClick={openMobileSidebar}
          className="lg:hidden p-2 text-slate-700 bg-white border border-slate-200 rounded-lg shadow-xs hover:bg-slate-50 mt-0.5"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-slate-700" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
              {entry?.title ?? 'AgroGestão'}
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1 font-normal">
            {entry?.subtitle ?? ''}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
        {/* HTML Image Links Generator Trigger */}
        <button
          onClick={() => openImageModal()}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs md:text-sm font-medium shadow-xs transition hover:border-slate-400"
          title="Gerar e copiar links diretos de imagens para HTML"
        >
          <ImageIcon className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline">Links de Imagens HTML</span>
          <span className="sm:hidden">Links HTML</span>
        </button>

        {actions}
      </div>
    </header>
  );
};
