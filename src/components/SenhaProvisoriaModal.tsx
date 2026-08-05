'use client';

import React, { useState } from 'react';
import { KeyRound, Copy, Check, AlertTriangle } from 'lucide-react';
import { Modal, Button } from './ui';

interface SenhaProvisoriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  senha: string;
}

export const SenhaProvisoriaModal: React.FC<SenhaProvisoriaModalProps> = ({ isOpen, onClose, email, senha }) => {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    await navigator.clipboard.writeText(senha);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={<KeyRound className="w-5 h-5" />}
      title="Senha provisória gerada"
      subtitle={email}
      maxWidthClassName="max-w-md"
      footer={
        <Button variant="primary" onClick={onClose} className="w-auto">
          Já copiei, fechar
        </Button>
      }
    >
      <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
        <code className="text-base font-mono font-bold text-slate-900 tracking-wide">{senha}</code>
        <button
          onClick={copiar}
          className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition shrink-0"
          title="Copiar senha"
        >
          {copiado ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex items-start gap-2.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          Esta senha é exibida <strong>uma única vez</strong> e não fica salva em nenhum lugar. Repasse-a ao
          usuário por um canal seguro — ele será obrigado a trocá-la no primeiro login.
        </p>
      </div>
    </Modal>
  );
};
