'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sprout } from 'lucide-react';
import { Input, Button } from '@/components/ui';
import { defaultTab } from '@/lib/nav';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/${defaultTab}`);
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

            <div className="flex justify-end">
              <a href="#" className="text-xs font-medium text-emerald-700 hover:text-emerald-900">
                Esqueci minha senha
              </a>
            </div>

            <Button type="submit" variant="primary" className="w-full">
              Entrar
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
