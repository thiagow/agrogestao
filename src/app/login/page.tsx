'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sprout } from 'lucide-react';
import { Input, Button } from '@/components/ui';
import { defaultTab } from '@/lib/nav';
import { authClient } from '@/lib/auth-client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { data, error: signInError } = await authClient.signIn.email({ email, password: senha });

    if (signInError || !data?.user) {
      setError('E-mail ou senha inválidos.');
      setIsSubmitting(false);
      return;
    }

    const user = data.user as { role?: string | null; mustChangePassword?: boolean };

    if (user.role === 'superadmin') {
      router.push('/admin');
    } else if (user.mustChangePassword) {
      router.push('/trocar-senha');
    } else {
      router.push(`/${defaultTab}`);
    }
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#0b2310] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="p-1.5 rounded-lg bg-[#a3e635]/15 text-[#a3e635] flex items-center justify-center">
            <Sprout className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-2xl font-semibold tracking-tight text-white font-sans">
            agro<span className="font-normal text-emerald-200">gestão</span>
          </span>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6">
          <h1 className="text-lg font-bold text-[#0b2310] mb-1">Entrar</h1>
          <p className="text-xs text-slate-500 mb-6">Acesse o painel de gestão agrícola</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
                {error}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              required
              placeholder="voce@empresa.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            <Input
              label="Senha"
              type="password"
              required
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
            />

            <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>
        </div>

        <p className="text-center text-[11px] text-emerald-200/60 mt-6">
          © {new Date().getFullYear()} AgroGestão — Controle agrícola e financeiro
        </p>
      </div>
    </div>
  );
}
