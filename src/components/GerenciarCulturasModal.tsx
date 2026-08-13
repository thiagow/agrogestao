'use client';

import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Modal, Input, Select, Button, Badge } from './ui';
import type { Cultura, UnidadeMedida } from '@/types';

interface GerenciarCulturasModalProps {
  isOpen: boolean;
  onClose: () => void;
  culturas: Cultura[];
  onSave: (input: { nome: string; unidadeMedida: UnidadeMedida }) => Promise<Cultura>;
  onDelete: (id: string) => Promise<void>;
  onCulturaCriada?: (cultura: Cultura) => void;
}

const UNIDADES: UnidadeMedida[] = ['sc', '@', 'kg', 't', 'm³'];

const UNIDADE_LABEL: Record<UnidadeMedida, string> = {
  sc: 'Saca (sc)',
  '@': 'Arroba (@)',
  kg: 'Quilograma (kg)',
  t: 'Tonelada (t)',
  'm³': 'Metro cúbico (m³)'
};

export const GerenciarCulturasModal: React.FC<GerenciarCulturasModalProps> = ({
  isOpen,
  onClose,
  culturas,
  onSave,
  onDelete,
  onCulturaCriada
}) => {
  const [nome, setNome] = useState('');
  const [unidadeMedida, setUnidadeMedida] = useState<UnidadeMedida>('sc');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const culturasPadrao = culturas.filter((c) => c.contaId === null);
  const culturasPersonalizadas = culturas.filter((c) => c.contaId !== null);

  const handleAddCultura = async () => {
    if (!nome.trim()) {
      setError('Informe o nome da cultura');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const novaCultura = await onSave({ nome: nome.trim(), unidadeMedida });
      setNome('');
      setUnidadeMedida('sc');
      onCulturaCriada?.(novaCultura);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar cultura');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCultura = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir essa cultura?')) return;

    setDeletingId(id);
    try {
      await onDelete(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir cultura');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gerenciar Culturas"
      subtitle="Crie e gerencie as culturas personalizadas da sua conta"
      maxWidthClassName="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Form: Adicionar nova cultura */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-4">
          <p className="text-xs font-semibold text-emerald-900 uppercase">Adicionar Nova Cultura</p>
          <div className="space-y-3">
            <Input
              label="Nome da Cultura"
              placeholder="ex: Café Arábica, Soja Safrinha"
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                setError('');
              }}
              disabled={isLoading}
            />
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Select
                  label="Unidade de Medida"
                  value={unidadeMedida}
                  onChange={(e) => setUnidadeMedida(e.target.value as UnidadeMedida)}
                  disabled={isLoading}
                >
                  {UNIDADES.map((u) => (
                    <option key={u} value={u}>
                      {UNIDADE_LABEL[u]}
                    </option>
                  ))}
                </Select>
              </div>
              <Button
                variant="primary"
                onClick={handleAddCultura}
                disabled={isLoading || !nome.trim()}
                className="px-3 py-2.5 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar</span>
              </Button>
            </div>
            {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
          </div>
        </div>

        {/* Culturas padrão */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-600 uppercase">Culturas Padrão (não editáveis)</p>
          <div className="flex flex-wrap gap-2">
            {culturasPadrao.map((c) => (
              <Badge key={c.id} tone="emerald" className="text-xs">
                {c.nome} ({UNIDADE_LABEL[c.unidadeMedida as UnidadeMedida]})
              </Badge>
            ))}
            {culturasPadrao.length === 0 && <p className="text-xs text-slate-400">Nenhuma cultura padrão</p>}
          </div>
        </div>

        {/* Culturas personalizadas */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-600 uppercase">Culturas Personalizadas</p>
          {culturasPersonalizadas.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">Nenhuma cultura personalizada ainda. Adicione uma acima!</p>
          ) : (
            <div className="space-y-2">
              {culturasPersonalizadas.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-2.5">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{c.nome}</p>
                      <p className="text-xs text-slate-500">{UNIDADE_LABEL[c.unidadeMedida as UnidadeMedida]}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteCultura(c.id)}
                    disabled={deletingId === c.id}
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition disabled:opacity-50"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer com botão de fechar */}
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="secondary" onClick={onClose} className="px-4 py-2.5 text-sm w-full">
          Fechar
        </Button>
      </div>
    </Modal>
  );
};
