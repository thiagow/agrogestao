'use client';

import React, { useState } from 'react';
import { Upload, Printer, RefreshCw, Plus, Edit2, Trash2 } from 'lucide-react';
import { Socio } from '../../types';
import { initialSocios } from '../../data/initialData';
import { Card, Tabs, Button } from '../ui';
import { SocioDrawer } from '../SocioDrawer';

const TABS_SEM_SPEC = [
  { id: 'bens', label: 'Bens e Direitos' },
  { id: 'garantias', label: 'Garantias' },
  { id: 'capex', label: 'CAPEX' },
  { id: 'grupo_economico', label: 'Grupo Econômico' },
  { id: 'historico', label: 'Histórico do Grupo' }
];

const EmConstrucao: React.FC<{ label: string }> = ({ label }) => (
  <div className="py-16 text-center text-slate-400">
    <p className="text-sm font-semibold">{label}</p>
    <p className="text-xs mt-1">Em construção — aguardando especificação detalhada desta aba.</p>
  </div>
);

export const CadastroMestreView: React.FC = () => {
  const [socios, setSocios] = useState<Socio[]>(initialSocios);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingSocio, setEditingSocio] = useState<Socio | null>(null);

  const handleSaveSocio = (data: Partial<Socio>) => {
    if (data.id) {
      setSocios((prev) => prev.map((s) => (s.id === data.id ? ({ ...s, ...data } as Socio) : s)));
    } else {
      const novo: Socio = {
        id: `socio-${Date.now()}`,
        nome: data.nome || 'Novo Sócio',
        cpf: data.cpf || '',
        participacao: data.participacao || 0,
        estadoCivil: data.estadoCivil,
        telefone: data.telefone,
        email: data.email,
        nacionalidade: data.nacionalidade,
        dataNascimento: data.dataNascimento
      };
      setSocios((prev) => [novo, ...prev]);
    }
  };

  const handleDeleteSocio = (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este sócio?')) {
      setSocios((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleOpenEdit = (socio: Socio) => {
    setEditingSocio(socio);
    setIsDrawerOpen(true);
  };

  const handleOpenNew = () => {
    setEditingSocio(null);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2.5">
        <Button variant="secondary" className="w-auto flex items-center gap-2 px-3.5 py-2 text-xs">
          <Printer className="w-3.5 h-3.5" /> Imprimir Cadastro
        </Button>
        <Button variant="secondary" className="w-auto flex items-center gap-2 px-3.5 py-2 text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> Sincronizar Ativos
        </Button>
        <Button variant="secondary" className="w-auto flex items-center gap-2 px-3.5 py-2 text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> Sincronizar Dívidas
        </Button>
        <Button variant="primary" className="w-auto flex items-center gap-2 px-3.5 py-2 text-xs">
          <Upload className="w-3.5 h-3.5" /> Importar Cadastro
        </Button>
      </div>

      <Card className="p-5">
        <Tabs
          items={[{ id: 'socios', label: 'Sócios', badge: socios.length }, ...TABS_SEM_SPEC]}
          defaultTabId="socios"
        >
          {(activeTabId) => {
            if (activeTabId !== 'socios') {
              const tab = TABS_SEM_SPEC.find((t) => t.id === activeTabId);
              return <EmConstrucao label={tab?.label ?? ''} />;
            }

            return (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900">Sócios e Representantes</h3>
                  <Button
                    variant="primary"
                    onClick={handleOpenNew}
                    className="w-auto flex items-center gap-1.5 px-3.5 py-2 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-600 font-bold">
                        <th className="py-3 px-4">Nome</th>
                        <th className="py-3 px-4">CPF</th>
                        <th className="py-3 px-4">Participação</th>
                        <th className="py-3 px-4">Estado Civil</th>
                        <th className="py-3 px-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {socios.map((socio) => (
                        <tr key={socio.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">{socio.nome}</td>
                          <td className="py-3 px-4 font-mono text-slate-600">{socio.cpf}</td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{socio.participacao}%</td>
                          <td className="py-3 px-4 text-slate-600">{socio.estadoCivil ?? '—'}</td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEdit(socio)}
                                title="Editar sócio"
                                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSocio(socio.id)}
                                title="Remover sócio"
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          }}
        </Tabs>
      </Card>

      <SocioDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={handleSaveSocio}
        editingSocio={editingSocio}
        outrosSocios={socios.filter((s) => s.id !== editingSocio?.id)}
      />
    </div>
  );
};
