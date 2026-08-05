import { AppShell } from '@/components/AppShell';
import { requireContext } from '@/lib/session';
import { PrimeiraPropriedadeForm } from './PrimeiraPropriedadeForm';

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireContext();

  if (!ctx.propriedade) {
    return <PrimeiraPropriedadeForm contaNome={ctx.conta.nome} />;
  }

  return (
    <AppShell
      user={{ name: ctx.user.name, email: ctx.user.email }}
      propriedade={{ id: ctx.propriedade.id, nome: ctx.propriedade.nome }}
      propriedades={ctx.propriedades.map((p) => ({ id: p.id, nome: p.nome }))}
    >
      {children}
    </AppShell>
  );
}
