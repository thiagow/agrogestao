import Link from 'next/link';
import { Building2, Users, MapPin, ArrowRight } from 'lucide-react';
import { db } from '@/lib/db';
import { KpiCard, Card, Badge } from '@/components/ui';

export default async function AdminDashboardPage() {
  const [contasAtivas, contasSuspensas, usuarios, propriedades, ultimasContas] = await Promise.all([
    db.conta.count({ where: { ativo: true, status: 'ATIVA' } }),
    db.conta.count({ where: { ativo: true, status: 'SUSPENSA' } }),
    db.membership.count({ where: { ativo: true } }),
    db.propriedade.count({ where: { ativo: true } }),
    db.conta.findMany({
      where: { ativo: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { _count: { select: { memberships: true, propriedades: true } } }
    })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight font-sans">Visão Geral</h1>
        <p className="text-sm text-slate-500 mt-1">Contas, usuários e propriedades cadastrados na plataforma</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Contas Ativas" value={String(contasAtivas)} icon={<Building2 className="w-4 h-4" />} />
        <KpiCard
          title="Contas Suspensas"
          value={String(contasSuspensas)}
          icon={<Building2 className="w-4 h-4" />}
          valueClassName={contasSuspensas > 0 ? 'text-rose-600' : 'text-slate-900'}
        />
        <KpiCard title="Usuários" value={String(usuarios)} icon={<Users className="w-4 h-4" />} />
        <KpiCard title="Propriedades" value={String(propriedades)} icon={<MapPin className="w-4 h-4" />} />
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900">Últimas contas criadas</h3>
          <Link href="/admin/contas" className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
            Ver todas <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-600 font-bold">
                <th className="py-3 px-4">Conta</th>
                <th className="py-3 px-4">Usuários</th>
                <th className="py-3 px-4">Propriedades</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {ultimasContas.map((conta) => (
                <tr key={conta.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    <Link href={`/admin/contas/${conta.id}`} className="hover:underline">
                      {conta.nome}
                    </Link>
                  </td>
                  <td className="py-3 px-4">{conta._count.memberships}</td>
                  <td className="py-3 px-4">{conta._count.propriedades}</td>
                  <td className="py-3 px-4">
                    <Badge tone={conta.status === 'ATIVA' ? 'emerald' : 'rose'}>{conta.status}</Badge>
                  </td>
                </tr>
              ))}
              {ultimasContas.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    Nenhuma conta cadastrada ainda.
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
