import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { listContas } from '@/server/contas';
import { Card, Badge } from '@/components/ui';
import { NovaContaButton } from './NovaContaButton';

export default async function ContasPage() {
  const contas = await listContas();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-slate-300" />
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight font-sans">Contas</h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              Clientes cadastrados na plataforma e o acesso concedido a cada um
            </p>
          </div>
        </div>
        <NovaContaButton />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-600 font-bold">
                <th className="py-3 px-4">Conta</th>
                <th className="py-3 px-4">CNPJ</th>
                <th className="py-3 px-4">Usuários</th>
                <th className="py-3 px-4">Propriedades</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Criada em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {contas.map((conta) => (
                <tr key={conta.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    <Link href={`/admin/contas/${conta.id}`} className="hover:underline">
                      {conta.nome}
                    </Link>
                    {conta.razaoSocial && <p className="text-[11px] font-normal text-slate-400">{conta.razaoSocial}</p>}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">{conta.cnpj ?? '—'}</td>
                  <td className="py-3 px-4">{conta._count.memberships}</td>
                  <td className="py-3 px-4">{conta._count.propriedades}</td>
                  <td className="py-3 px-4">
                    <Badge tone={conta.status === 'ATIVA' ? 'emerald' : 'rose'}>{conta.status}</Badge>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {new Intl.DateTimeFormat('pt-BR').format(conta.createdAt)}
                  </td>
                </tr>
              ))}
              {contas.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Nenhuma conta cadastrada ainda. Clique em &quot;Nova Conta&quot; para começar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
