'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Sprout } from 'lucide-react';
import { Input, Button } from '@/components/ui';
import { criarPropriedade } from '@/server/propriedades';

export const PrimeiraPropriedadeForm: React.FC<{ contaNome: string }> = ({ contaNome }) => {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [areaTotalHectares, setAreaTotalHectares] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await criarPropriedade({ nome, cidade, estado, areaTotalHectares: areaTotalHectares || undefined });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar propriedade.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b2310] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
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
            <MapPin className="w-4 h-4 text-emerald-700" />
            <h1 className="text-lg font-bold text-[#0b2310]">Cadastre sua primeira propriedade</h1>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            {contaNome} ainda não tem nenhuma propriedade — os módulos do sistema ficam disponíveis assim que você
            cria a primeira.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
                {error}
              </div>
            )}
            <Input
              label="Nome da Propriedade"
              required
              placeholder="Ex: Fazenda Pedra"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />
              <Input label="UF" maxLength={2} value={estado} onChange={(e) => setEstado(e.target.value.toUpperCase())} />
            </div>
            <Input
              label="Área Total (hectares)"
              type="number"
              step="0.01"
              value={areaTotalHectares}
              onChange={(e) => setAreaTotalHectares(e.target.value)}
            />

            <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Cadastrando…' : 'Cadastrar Propriedade'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
