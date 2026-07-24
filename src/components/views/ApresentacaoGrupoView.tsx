'use client';

import React, { useState } from 'react';
import { Upload, Sparkles, Sprout, BarChart3, ShieldCheck, FileDown, Loader2 } from 'lucide-react';
import { Card, Select, Button } from '../ui';

type EstadoApresentacao = 'idle' | 'gerando' | 'pronta';

const TEMPLATES = [
  {
    icon: Sprout,
    titulo: 'Performance Agro',
    descricao: 'Área, produtividade e benchmark (CENAD)',
    slides: 'Áreas cultivadas, Rendimentos por cultura, Comparativos'
  },
  {
    icon: BarChart3,
    titulo: 'DRE e Balanço',
    descricao: 'Demonstração financeira consolidada',
    slides: 'Receitas, Despesas, Margens, Balanço patrimonial'
  },
  {
    icon: ShieldCheck,
    titulo: 'Perspectivas',
    descricao: 'KPIs, índices e análise de crédito',
    slides: 'Liquidez, Endividamento, ROA/ROE, Recomendações'
  }
];

export const ApresentacaoGrupoView: React.FC = () => {
  const [ano, setAno] = useState('2025/26');
  const [estado, setEstado] = useState<EstadoApresentacao>('idle');

  const handleGerar = () => {
    setEstado('gerando');
    setTimeout(() => setEstado('pronta'), 1800);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Apresentação do Grupo</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-md">
              Gere automaticamente uma apresentação profissional de 12 slides no padrão de empresa aberta
            </p>
          </div>
          <Button variant="secondary" className="w-auto flex items-center gap-2 px-3.5 py-2 text-xs">
            <Upload className="w-3.5 h-3.5" /> Upload Logo
          </Button>
        </div>

        <div className="flex flex-wrap items-end gap-3 mt-5">
          <Select label="Ano" value={ano} onChange={(e) => setAno(e.target.value)} className="w-auto">
            <option value="2024/25">2024/25</option>
            <option value="2025/26">2025/26</option>
            <option value="2026/27">2026/27</option>
          </Select>
          <Select label="Grupo" value="Grupo Pereira" onChange={() => {}} className="w-auto" disabled>
            <option value="Grupo Pereira">Grupo Pereira</option>
          </Select>
          <Button
            variant="primary"
            onClick={handleGerar}
            disabled={estado === 'gerando'}
            className="w-auto flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm"
          >
            {estado === 'gerando' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {estado === 'gerando' ? 'Gerando...' : '+ Gerar Apresentação'}
          </Button>
        </div>
      </Card>

      <Card className="p-8 text-center">
        {estado === 'idle' && (
          <>
            <p className="text-sm font-semibold text-slate-700">Nenhuma apresentação gerada</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Selecione um grupo e clique em &quot;Gerar Apresentação&quot; para criar automaticamente uma
              apresentação profissional de 12 slides com os dados do grupo.
            </p>
          </>
        )}
        {estado === 'gerando' && (
          <>
            <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Gerando apresentação...</p>
            <p className="text-xs text-slate-500 mt-1">Coletando dados da safra {ano} do Grupo Pereira</p>
          </>
        )}
        {estado === 'pronta' && (
          <>
            <p className="text-sm font-semibold text-emerald-700">Apresentação pronta</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              12 slides gerados para o Grupo Pereira — safra {ano}
            </p>
            <Button variant="primary" className="w-auto mx-auto flex items-center gap-2 px-4 py-2 text-xs">
              <FileDown className="w-4 h-4" /> Baixar Apresentação (.pptx)
            </Button>
            <p className="text-[10px] text-slate-400 mt-3">
              Simulado — geração real de arquivo fica para quando houver backend conectado.
            </p>
          </>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TEMPLATES.map((t) => {
          const Icon = t.icon;
          return (
            <Card key={t.titulo} className="p-5">
              <div className="p-2.5 bg-[#a3e635]/20 text-emerald-800 rounded-xl w-fit mb-3">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">{t.titulo}</h3>
              <p className="text-xs text-slate-500 mt-1">{t.descricao}</p>
              <p className="text-[11px] text-slate-400 mt-2">{t.slides}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
