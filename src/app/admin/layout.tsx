import React from 'react';
import { requireSuperAdmin } from '@/lib/session';
import { AdminShell } from '@/components/AdminShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSuperAdmin();

  return <AdminShell user={{ name: user.name, email: user.email }}>{children}</AdminShell>;
}
