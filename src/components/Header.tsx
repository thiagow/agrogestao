'use client';

import React from 'react';
import { Menu } from 'lucide-react';
import { ActiveTab } from '../types';
import { navEntriesById } from '../lib/nav';
import { useAppShell } from '../lib/app-shell-context';

interface HeaderProps {
  tab: ActiveTab;
  actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ tab, actions }) => {
  const { openMobileSidebar } = useAppShell();
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
        {actions}
      </div>
    </header>
  );
};
