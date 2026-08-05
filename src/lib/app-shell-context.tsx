'use client';

import { createContext, useContext } from 'react';

interface AppShellContextValue {
  openMobileSidebar: () => void;
  openImageModal: () => void;
}

export const AppShellContext = createContext<AppShellContextValue | null>(null);

export function useAppShell(): AppShellContextValue {
  const ctx = useContext(AppShellContext);
  if (!ctx) {
    throw new Error('useAppShell must be used within <AppShell>');
  }
  return ctx;
}
