'use client';

import React, { useState } from 'react';

export interface TabItem {
  id: string;
  label: string;
  badge?: number;
}

interface TabsProps {
  items: TabItem[];
  defaultTabId?: string;
  children: (activeTabId: string) => React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({ items, defaultTabId, children }) => {
  const [activeTabId, setActiveTabId] = useState(defaultTabId ?? items[0]?.id);

  return (
    <div>
      <div className="flex items-center gap-1 border-b border-slate-200/80 overflow-x-auto">
        {items.map((item) => {
          const isActive = item.id === activeTabId;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTabId(item.id)}
              className={`shrink-0 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                isActive
                  ? 'border-[#4a6700] text-[#0b2310]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {item.label}
              {typeof item.badge === 'number' && (
                <span
                  className={`ml-1.5 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-[#a3e635] text-[#0b2310]' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="pt-5">{children(activeTabId)}</div>
    </div>
  );
};
