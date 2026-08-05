import { LayoutDashboard, Building2 } from 'lucide-react';

export interface AdminNavEntry {
  id: string;
  href: string;
  label: string;
  icon: React.ElementType;
}

// Menu próprio do painel interno — deliberadamente separado de src/lib/nav.ts
// (o menu do produto do cliente). Nunca misturar os dois.
export const adminNavEntries: AdminNavEntry[] = [
  { id: 'dashboard', href: '/admin', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'contas', href: '/admin/contas', label: 'Contas', icon: Building2 }
];
