import React from 'react';

type BadgeTone = 'amber' | 'emerald' | 'rose' | 'blue' | 'slate';

interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}

const toneClasses: Record<BadgeTone, string> = {
  amber: 'bg-amber-100/80 text-amber-900 border-amber-300/80',
  emerald: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  rose: 'bg-rose-100 text-rose-900 border-rose-300',
  blue: 'bg-blue-100 text-blue-800 border-blue-300',
  slate: 'bg-slate-100 text-slate-700 border-slate-300'
};

export const Badge: React.FC<BadgeProps> = ({ tone = 'slate', children, className = '' }) => {
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wide border ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
};
