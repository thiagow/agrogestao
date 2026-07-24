'use client';

import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { CulturaSafraAno } from '../../types';
import { formatCurrency, calcularSafra } from '../../data/initialData';
import { Card, Button } from '../ui';
import { SafraDrawer } from '../SafraDrawer';

interface QuadroSafraViewProps {
  culturaSafras: CulturaSafraAno[];
  onSave: (data: Partial<CulturaSafraAno>) => void;
  onDelete: (id: string) => void;
}

const ANOS_SAFRA = ['2024/2025', '2025/2026', '2026/2027', '2027/2028'];

const LINHAS = [
  { key: 'hectares', label: 'Hectarizados (Total)' },
  { key: 'haPropria', label: 'Ha Área Própria' },
  { key: 'haArrendada', label: 'Ha Arrendado' },
  { key: 'rendimento', label: 'Rendimento p/ha' },
  { key: 'totalProducao', label: 'Total de Produção' },
  { key: 'receitaBruta', label: 'Receita Bruta' },
  { key: 'despesa', label: 'Despesa' },
  { key: 'receitaLiquida', label: 'Receita Líquida' },
  { key: 'margem', label: 'Margem (%)' }
] as const;

export const QuadroSafraView: React.FC<QuadroSafraViewProps> = ({ culturaSafras, onSave, onDelete }) => {
  const culturas = Array.from(new Set(culturaSafras.map((s) => s.cultura)));
  const [culturaFiltro, setCulturaFiltro] = useState('Todas');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<CulturaSafraAno | null>(null);

  const culturasVisiveis = culturaFiltro === 'Todas' ? culturas : [culturaFiltro];

  const handleOpenNew = () => {
    setEditing(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (registro: CulturaSafraAno) => {
    setEditing(registro);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-500 mr-1">Filtrar por cultura:</span>
        <button
          onClick={() => setCulturaFiltro('Todas')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            culturaFiltro === 'Todas'
              ? 'bg-[#a3e635] text-[#0b2310]'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Todas
        </button>
        {culturas.map((c) => (
          <button
            key={c}
            onClick={() => setCulturaFiltro(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              culturaFiltro === c
                ? 'bg-[#a3e635] text-[#0b2310]'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {c}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Data base: 21/07/2026</span>
          <Button
            variant="primary"
            onClick={handleOpenNew}
            className="w-auto flex items-center gap-1.5 px-3.5 py-2 text-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Nova Safra
          </Button>
        </div>
      </div>

      {/* Grids por cultura */}
      {culturasVisiveis.map((cultura) => {
        const registros = culturaSafras.filter((s) => s.cultura === cultura);
        const porAno = new Map(registros.map((r) => [r.anoSafra, r]));

        return (
          <Card key={cultura} className="overflow-hidden">
            <div className="p-5 border-b border-slate-200/80">
              <h3 className="text-base font-bold text-slate-900">{cultura}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-600 font-bold">
                    <th className="py-2.5 px-4">Descrição</th>
                    {ANOS_SAFRA.map((ano) => (
                      <th key={ano} className="py-2.5 px-4 text-right whitespace-nowrap">
                        {ano}
                      </th>
                    ))}
                    <th className="py-2.5 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {LINHAS.map((linha) => (
                    <tr key={linha.key} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-4 font-semibold text-slate-800">{linha.label}</td>
                      {ANOS_SAFRA.map((ano) => {
                        const registro = porAno.get(ano);
                        if (!registro) {
                          return (
                            <td key={ano} className="py-2.5 px-4 text-right text-slate-300">
                              —
                            </td>
                          );
                        }
                        const calc = calcularSafra(registro);
                        let valor: string;
                        switch (linha.key) {
                          case 'hectares':
                            valor = `${registro.hectares.toLocaleString('pt-BR')} ha`;
                            break;
                          case 'haPropria':
                            valor = `${registro.haPropria.toLocaleString('pt-BR')} ha`;
                            break;
                          case 'haArrendada':
                            valor = `${registro.haArrendada.toLocaleString('pt-BR')} ha`;
                            break;
                          case 'rendimento':
                            valor = `${registro.rendimento.toLocaleString('pt-BR')} ${registro.unidadeProducao}/ha`;
                            break;
                          case 'totalProducao':
                            valor = `${calc.totalProducao.toLocaleString('pt-BR')} ${registro.unidadeProducao}`;
                            break;
                          case 'receitaBruta':
                            valor = formatCurrency(calc.receitaBruta);
                            break;
                          case 'despesa':
                            valor = formatCurrency(registro.despesa);
                            break;
                          case 'receitaLiquida':
                            valor = formatCurrency(calc.receitaLiquida);
                            break;
                          case 'margem':
                            valor = `${calc.margem.toFixed(1)}%`;
                            break;
                        }
                        return (
                          <td key={ano} className="py-2.5 px-4 text-right font-medium text-slate-700">
                            {valor}
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-4" />
                    </tr>
                  ))}
                  <tr>
                    <td className="py-2 px-4 text-slate-400 text-[11px]" colSpan={ANOS_SAFRA.length + 1}>
                      Ações por ano-safra:
                    </td>
                    <td className="py-2 px-4" />
                  </tr>
                  <tr>
                    <td className="py-2 px-4" />
                    {ANOS_SAFRA.map((ano) => {
                      const registro = porAno.get(ano);
                      return (
                        <td key={ano} className="py-2 px-4 text-right">
                          {registro && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEdit(registro)}
                                title="Editar"
                                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDelete(registro.id)}
                                title="Deletar"
                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-2 px-4" />
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        );
      })}

      <SafraDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={onSave}
        editingSafra={editing}
        culturasDisponiveis={culturas}
        anosSafraDisponiveis={ANOS_SAFRA}
      />
    </div>
  );
};
