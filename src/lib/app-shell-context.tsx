'use client';

import React, { createContext, useContext } from 'react';
import { Supplier } from '../types';

interface AppShellContextValue {
  openMobileSidebar: () => void;
  openImageModal: (supplier?: Supplier) => void;
}

export const AppShellContext = createContext<AppShellContextValue | null>(null);

export function useAppShell(): AppShellContextValue {
  const ctx = useContext(AppShellContext);
  if (!ctx) {
    throw new Error('useAppShell must be used within <AppShell>');
  }
  return ctx;
}
