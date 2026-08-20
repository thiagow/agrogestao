import React from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
  text: string;
  className?: string;
}

/**
 * Ícone "ⓘ" com popover de origem — mesmo papel dos tooltips de ajuda do
 * AgroFlow original no Demonstrativo de Fluxo de Safra (cada linha explica de
 * qual tela veio o valor). Popover em CSS puro (hover + focus, acessível via
 * teclado), sem lib de terceiros — primeiro uso no design system, reutilizável
 * por outras telas.
 */
export const Tooltip: React.FC<TooltipProps> = ({ text, className = '' }) => {
  return (
    <span className={`group relative inline-flex ${className}`}>
      <button
        type="button"
        aria-label={text}
        className="text-slate-400 transition hover:text-slate-600 focus:text-slate-600 focus:outline-none"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-[11px] font-medium leading-snug text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
      </span>
    </span>
  );
};
