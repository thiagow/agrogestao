'use client';

import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { selecionarPropriedade } from '../server/propriedades';

interface PropriedadeOption {
  id: string;
  nome: string;
}

interface PropriedadeSelectorProps {
  propriedade: PropriedadeOption | null;
  propriedades: PropriedadeOption[];
}

export const PropriedadeSelector: React.FC<PropriedadeSelectorProps> = ({ propriedade, propriedades }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (propriedades.length === 0) return null;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    startTransition(async () => {
      await selecionarPropriedade(id);
      router.refresh();
    });
  };

  if (propriedades.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3.5 py-2 text-xs text-emerald-100/70">
        <MapPin className="w-3.5 h-3.5 text-emerald-400/70 shrink-0" />
        <span className="truncate">{propriedades[0].nome}</span>
      </div>
    );
  }

  return (
    <div className="px-3 py-2">
      <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-emerald-300/60 font-bold mb-1 px-0.5">
        <MapPin className="w-3 h-3" /> Propriedade
      </label>
      <select
        value={propriedade?.id ?? ''}
        onChange={handleChange}
        disabled={isPending}
        className="w-full bg-emerald-900/40 border border-emerald-800/50 text-white text-xs font-medium rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#a3e635]/40"
      >
        {propriedades.map((p) => (
          <option key={p.id} value={p.id} className="text-slate-900">
            {p.nome}
          </option>
        ))}
      </select>
    </div>
  );
};
