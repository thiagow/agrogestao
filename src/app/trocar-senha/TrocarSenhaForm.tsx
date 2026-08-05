'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Sprout } from 'lucide-react';
import { Input, Button } from '@/components/ui';
import { authClient } from '@/lib/auth-client';
import { defaultTab } from '@/lib/nav';
import { clearMustChangePassword } from '@/server/usuarios';

export const TrocarSenhaForm: React.FC<{ email: string }> = ({ email }) => {
  const router = useRouter();
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (novaSenha.length < 12) {
      setError('A nova senha precisa ter pelo menos 12 caracteres.');
      return;
    }
    if (novaSenha !== confirmacao) {
      setError('A confirmação não confere com a nova senha.');
      return;
    }

    setIsSubmitting(true);
    const { error: changeError } = await authClient.changePassword({
      currentPassword: senhaAtual,
      newPassword: novaSenha,
      revokeOtherSessions: true
    });

    if (changeError) {
      setError('Senha atual incorreta.');
      setIsSubmitting(false);
      return;
    }

    await clearMustChangePassword();
    router.push(`/${defaultTab}`);
    router.refresh();
  };

  return (
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
        <div className="flex items-center gap-2 mb-1">
          <KeyRound className="w-4 h-4 text-emerald-700" />
          <h1 className="text-lg font-bold text-[#0b2310]">Defina sua senha</h1>
        </div>
        <p className="text-xs text-slate-500 mb-6">
          Primeiro acesso de <strong>{email}</strong> — troque a senha provisória antes de continuar.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
              {error}
            </div>
          )}

          <Input
            label="Senha provisória"
            type="password"
            required
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
            autoComplete="current-password"
          />
          <Input
            label="Nova senha"
            type="password"
            required
            minLength={12}
            hint="Mínimo de 12 caracteres."
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            autoComplete="new-password"
          />
          <Input
            label="Confirme a nova senha"
            type="password"
            required
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
            autoComplete="new-password"
          />

          <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando…' : 'Salvar e continuar'}
          </Button>
        </form>
      </div>
    </div>
  );
};
