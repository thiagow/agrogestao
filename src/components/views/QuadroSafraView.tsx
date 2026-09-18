'use client';

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Star, CheckCircle2 } from 'lucide-react';
import { CulturaSafraAno, Cultura, SafraCadastrada, PecuariaBovinaAno, ProducaoAnimalAno } from '../../types';
import { formatCurrency } from '../../data/initialData';
import { calcularSafra, consolidarMargemLavoura } from '../../lib/agro';
import {
  calcularPecuariaBovina,
  calcularProducaoAnimal,
  calcularQuantidadeTotalBovina,
  estoqueTotalBovino,
  custoTotalPorCabecaBovino,
  anosPecuariaVisiveis,
  consolidarProducaoTotal
} from '../../lib/pecuaria-calc';
import { receitaCustoPecuariaSafraBlend } from '../../lib/pecuaria-calc';
import { classificarSafra, anoInicioSafra, safraDoAno, type StatusSafra } from '../../lib/safra-periodo';
import { Card, Button, Input, Select } from '../ui';
import { SafraDrawer } from '../SafraDrawer';
import { PecuariaBovinaDrawer } from '../PecuariaBovinaDrawer';
import { ProducaoAnimalDrawer } from '../ProducaoAnimalDrawer';

interface QuadroSafraViewProps {
  culturaSafras: CulturaSafraAno[];
  culturas: Cultura[];
  onSave: (data: Partial<CulturaSafraAno>) => void;
  onDelete: (id: string) => void;
  onSaveCultura: (input: { nome: string; unidadeMedida: string }) => Promise<Cultura>;
  onDeleteCultura: (id: string) => Promise<void>;
  /** Safra vigente do sistema (src/server/safras.ts) — fonte única dos badges Realizado/Atual/Previsão. */
  safraAtual: string | null;
  /** Opções fechadas de "Ano Safra" do SafraDrawer — safras cadastradas + atual + próxima. */
  opcoesAnoSafra: string[];
  /** Safras cadastradas na conta — alimenta o painel de gestão de safra vigente abaixo. */
  safrasCadastradas: SafraCadastrada[];
  onSetSafraAtual: (safraId: string) => void;
  onCreateSafra: (anoSafra: string, marcarComoAtual: boolean) => void;
  pecuariaBovina: PecuariaBovinaAno[];
  producaoAnimal: ProducaoAnimalAno[];
  onSavePecuariaBovina: (data: Partial<PecuariaBovinaAno>) => void;
  onDeletePecuariaBovina: (id: string) => void;
  onSaveProducaoAnimal: (data: Partial<ProducaoAnimalAno>) => void;
  onDeleteProducaoAnimal: (id: string) => void;
}

type OrigemLinha = 'usuario' | 'calculado';
type DestaqueLinha = 'positivo' | 'total' | 'highlight' | undefined;

const LINHAS: { key: string; label: string; origem: OrigemLinha; destaque?: DestaqueLinha }[] = [
  { key: 'hectares', label: 'Há/Plantados (Total)', origem: 'usuario' },
  { key: 'haPropria', label: 'Há/Área Própria', origem: 'usuario' },
  { key: 'haArrendada', label: 'Há/Arrendado', origem: 'usuario' },
  { key: 'rendimento', label: 'Rendimento p/Há', origem: 'usuario' },
  { key: 'totalProducao', label: 'Total de Produção', origem: 'calculado' },
  { key: 'precoMedio', label: 'Preço Médio', origem: 'usuario' },
  { key: 'custoProducao', label: 'Custo de Produção (R$/Há)', origem: 'usuario' },
  { key: 'receitaBruta', label: 'RECEITA BRUTA (R$)', origem: 'calculado', destaque: 'positivo' },
  { key: 'despesa', label: 'DESPESA (R$)', origem: 'calculado', destaque: 'total' },
  { key: 'receitaLiquida', label: 'RECEITA LÍQUIDA (R$)', origem: 'calculado', destaque: 'positivo' },
  { key: 'margem', label: 'Margem (%)', origem: 'calculado', destaque: 'highlight' }
];

/** "22/23" a partir de "2022/2023" — formato curto usado só no Resumo — Quadro de Produção (réplica do print do usuário, 16/09/2026). */
function safraCurta(anoSafra: string): string {
  const [inicio, fim] = anoSafra.split('/');
  return `${inicio.slice(-2)}/${fim.slice(-2)}`;
}

const BADGE_STATUS: Record<StatusSafra, { tone: 'slate' | 'emerald' | 'blue'; label: string }> = {
  Realizado: { tone: 'slate', label: 'Realizado' },
  Atual: { tone: 'emerald', label: 'Atual' },
  Previsão: { tone: 'blue', label: 'Previsão' }
};

/** "Estoque Rebanho Atual" (16/09/2026, réplica confirmada da planilha do cliente) — as 8 categorias por sexo/faixa etária. */
const ESTOQUE_REBANHO_LINHAS: { label: string; key: keyof PecuariaBovinaAno }[] = [
  { label: 'Fêmeas 0-12 meses', key: 'femeas0a12' },
  { label: 'Fêmeas 12-24 meses', key: 'femeas12a24' },
  { label: 'Fêmeas 24-36 meses', key: 'femeas24a36' },
  { label: 'Fêmeas +36 meses', key: 'femeasAcima36' },
  { label: 'Machos 0-12 meses', key: 'machos0a12' },
  { label: 'Machos 12-24 meses', key: 'machos12a24' },
  { label: 'Machos 24-36 meses', key: 'machos24a36' },
  { label: 'Machos +36 meses', key: 'machosAcima36' }
];

/**
 * Linha da tabela "Bovinos" (16/09/2026, réplica confirmada da planilha do
 * cliente, docs/demandas/Template Agro_Banco_PECUARIA.xlsx) — suporta 3
 * formatos: divisor (cabeçalho de seção colorido, sem valor), label (linha
 * só de texto, sem valor por ano — ex. "Custo médio (R$/cabeça)" na
 * planilha original) e valor (linha normal, com `render` por ano).
 *
 * "Preço Médio Machos/Fêmeas/Outras" usa a unidade real R$/@ (a mesma usada
 * no cálculo do faturamento = quantidade × peso(@) × preço) — a planilha
 * original rotula essa linha "R$/Cabeça", um erro de rótulo da fonte que não
 * replicamos aqui por ser uma unidade monetária, onde rótulo errado confunde
 * o usuário sobre o preço real pago por arroba.
 */
type LinhaBovino =
  | { tipo: 'divisor'; label: string }
  | { tipo: 'label'; label: string }
  | { tipo?: 'valor'; label: string; destaque?: boolean; indent?: boolean; italic?: boolean; render: (r: PecuariaBovinaAno) => string };

const NUM_PT_BR = (v: number) => v.toLocaleString('pt-BR');

const LINHAS_BOVINO: LinhaBovino[] = [
  { label: 'Ciclo Produtivo Pecuário', render: (r) => r.cicloProdutivo || '—' },
  {
    label: 'Área de Pastagem Total (ha)',
    destaque: true,
    render: (r) => `${NUM_PT_BR(r.areaPastagemPropria + r.areaPastagemArrendada)} ha`
  },
  { label: 'Própria', indent: true, italic: true, render: (r) => (r.areaPastagemPropria > 0 ? `${NUM_PT_BR(r.areaPastagemPropria)} ha` : '—') },
  { label: 'Arrendada', indent: true, italic: true, render: (r) => (r.areaPastagemArrendada > 0 ? `${NUM_PT_BR(r.areaPastagemArrendada)} ha` : '—') },
  { label: 'Tipo de Terminação', render: (r) => r.tipoTerminacao || '—' },

  { tipo: 'divisor', label: 'Custos de Produção' },
  { tipo: 'label', label: 'Custo médio (R$/cabeça)' },
  { label: 'Custo Total (R$/cabeça)', destaque: true, render: (r) => formatCurrency(custoTotalPorCabecaBovino(r)) },
  {
    label: 'Valor total de cabeças adquiridas (R$/cabeça)',
    indent: true,
    italic: true,
    render: (r) => formatCurrency(r.custoAquisicaoPorCabeca)
  },
  {
    label: 'Custo de produção pastagem (R$/hectare)',
    indent: true,
    italic: true,
    render: (r) => formatCurrency(r.custoPastagemPorHectare)
  },
  {
    label: 'Diária Confinamento (R$/dia)',
    indent: true,
    italic: true,
    render: (r) => (r.diariaConfinamento > 0 ? formatCurrency(r.diariaConfinamento) : '—')
  },
  {
    label: 'Dias de Confinamento',
    indent: true,
    italic: true,
    render: (r) => (r.diasConfinamento > 0 ? NUM_PT_BR(r.diasConfinamento) : '—')
  },
  {
    label: 'Quantidade de Animais Confinados',
    indent: true,
    italic: true,
    render: (r) => (r.qtdAnimaisConfinados > 0 ? NUM_PT_BR(r.qtdAnimaisConfinados) : '—')
  },

  { tipo: 'divisor', label: 'Dados Confinamento' },
  {
    label: 'Capacidade de Lotação do Confinamento (cab.)',
    render: (r) => (r.capacidadeLotacaoConfinamento > 0 ? NUM_PT_BR(r.capacidadeLotacaoConfinamento) : '—')
  },
  {
    label: 'Ganho de Peso Médio Diário por Animal (Kg/dia)',
    render: (r) => (r.ganhoPesoMedioDiarioKg > 0 ? NUM_PT_BR(r.ganhoPesoMedioDiarioKg) : '—')
  },
  {
    label: 'Dias de Confinamento por Lote',
    render: (r) => (r.diasConfinamentoPorLote > 0 ? NUM_PT_BR(r.diasConfinamentoPorLote) : '—')
  },

  { tipo: 'divisor', label: 'Animais Comercializados' },
  {
    label: 'Faturamento Machos (R$)',
    destaque: true,
    render: (r) => formatCurrency(r.qtdMachosComercializados * r.pesoMedioMachos * r.precoMedioMachos)
  },
  {
    label: 'Quantidade de Machos (cabeças)',
    indent: true,
    italic: true,
    render: (r) => (r.qtdMachosComercializados > 0 ? NUM_PT_BR(r.qtdMachosComercializados) : '—')
  },
  { label: 'Peso Médio Machos (@)', indent: true, italic: true, render: (r) => (r.pesoMedioMachos > 0 ? NUM_PT_BR(r.pesoMedioMachos) : '—') },
  {
    label: 'Preço Médio Machos (R$/@)',
    indent: true,
    italic: true,
    render: (r) => (r.precoMedioMachos > 0 ? formatCurrency(r.precoMedioMachos) : '—')
  },

  {
    label: 'Faturamento Fêmeas (R$)',
    destaque: true,
    render: (r) => formatCurrency(r.qtdFemeasComercializadas * r.pesoMedioFemeas * r.precoMedioFemeas)
  },
  {
    label: 'Quantidade de Fêmeas (cabeças)',
    indent: true,
    italic: true,
    render: (r) => (r.qtdFemeasComercializadas > 0 ? NUM_PT_BR(r.qtdFemeasComercializadas) : '—')
  },
  { label: 'Peso Médio Fêmeas (@)', indent: true, italic: true, render: (r) => (r.pesoMedioFemeas > 0 ? NUM_PT_BR(r.pesoMedioFemeas) : '—') },
  {
    label: 'Preço Médio Fêmeas (R$/@)',
    indent: true,
    italic: true,
    render: (r) => (r.precoMedioFemeas > 0 ? formatCurrency(r.precoMedioFemeas) : '—')
  },

  {
    label: 'Faturamento Outras Categorias (R$)',
    destaque: true,
    render: (r) => formatCurrency(r.qtdOutrasComercializadas * r.pesoMedioOutras * r.precoMedioOutras)
  },
  {
    label: 'Quantidade de Outras (cabeças)',
    indent: true,
    italic: true,
    render: (r) => (r.qtdOutrasComercializadas > 0 ? NUM_PT_BR(r.qtdOutrasComercializadas) : '—')
  },
  { label: 'Peso Médio Outras (@)', indent: true, italic: true, render: (r) => (r.pesoMedioOutras > 0 ? NUM_PT_BR(r.pesoMedioOutras) : '—') },
  {
    label: 'Preço Médio Outras (R$/@)',
    indent: true,
    italic: true,
    render: (r) => (r.precoMedioOutras > 0 ? formatCurrency(r.precoMedioOutras) : '—')
  },

  { label: 'Receita Total (R$)', destaque: true, render: (r) => formatCurrency(calcularPecuariaBovina(r).receitaBruta) },
  { label: 'Custo Total de Produção (R$)', render: (r) => formatCurrency(calcularPecuariaBovina(r).despesa) },
  { label: 'Resultado Bruto (R$)', destaque: true, render: (r) => formatCurrency(calcularPecuariaBovina(r).receitaLiquida) },
  { label: 'Margem Bruta (%)', render: (r) => `${calcularPecuariaBovina(r).margem.toFixed(1)}%` }
];

/** "Quantidade total" (16/09/2026) — rodapé da tabela Bovinos, ver calcularQuantidadeTotalBovina em pecuaria-calc.ts. */
const QUANTIDADE_TOTAL_LINHAS: { label: string; render: (r: PecuariaBovinaAno) => string }[] = [
  { label: 'Cabeças', render: (r) => NUM_PT_BR(calcularQuantidadeTotalBovina(r).totalCabecas) },
  { label: 'Preço Médio Total (R$/@)', render: (r) => formatCurrency(calcularQuantidadeTotalBovina(r).precoMedioTotal) },
  { label: 'Peso Médio (@)', render: (r) => calcularQuantidadeTotalBovina(r).pesoMedio.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) }
];

export const QuadroSafraView: React.FC<QuadroSafraViewProps> = ({
  culturaSafras,
  culturas,
  onSave,
  onDelete,
  onSaveCultura,
  onDeleteCultura,
  safraAtual,
  opcoesAnoSafra,
  safrasCadastradas,
  onSetSafraAtual,
  onCreateSafra,
  pecuariaBovina,
  producaoAnimal,
  onSavePecuariaBovina,
  onDeletePecuariaBovina,
  onSaveProducaoAnimal,
  onDeleteProducaoAnimal
}) => {
  const culturasComRegistro = Array.from(new Set(culturaSafras.map((s) => s.cultura)));
  const [culturaFiltro, setCulturaFiltro] = useState('Todas');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<CulturaSafraAno | null>(null);
  // Pré-seleção de cultura/ano ao clicar em "Adicionar" numa coluna de ano vazia (só usada em modo "novo").
  const [presetSafra, setPresetSafra] = useState<{ cultura: string; ano: string } | null>(null);
  const [novaSafraInput, setNovaSafraInput] = useState('');
  const [novaSafraAtual, setNovaSafraAtual] = useState(true);

  // Sem nenhuma safra configurada ainda (conta nova) — usa o ano corrente só
  // como referência de bootstrap para não quebrar a tela; assim que o usuário
  // cadastrar a 1ª safra pelo painel abaixo, `safraAtual` deixa de ser null e
  // essa referência para de ser usada.
  const referenciaSafra = safraAtual ?? safraDoAno(new Date().getFullYear());

  // Colunas de "Ano Safra" (item 1.2/1.3, 10/09/2026): união dinâmica das
  // safras já lançadas no Quadro + a safra atual + a próxima — nunca uma
  // lista hardcoded. Cada coluna é classificada via classificarSafra().
  const anosSafra = Array.from(
    new Set([
      ...culturaSafras.map((s) => s.anoSafra),
      referenciaSafra,
      safraDoAno(anoInicioSafra(referenciaSafra) + 1)
    ])
  ).sort((a, b) => anoInicioSafra(a) - anoInicioSafra(b));

  // Pecuária/Suinocultura/Avicultura — 3 tabelas fixas, sempre exibidas
  // abaixo do Quadro de Produção, 5 anos civis fixos ancorados na safra
  // vigente (Realizado/Realizado/Realizado/Atual/Previsão — item 2.2).
  const anosPecuaria = anosPecuariaVisiveis(referenciaSafra);
  const [isPecuariaDrawerOpen, setIsPecuariaDrawerOpen] = useState(false);
  const [editingPecuaria, setEditingPecuaria] = useState<PecuariaBovinaAno | null>(null);
  const [presetAnoPecuaria, setPresetAnoPecuaria] = useState<number | null>(null);
  const [producaoAnimalDrawer, setProducaoAnimalDrawer] = useState<{
    tipo: 'Avicultura' | 'Suinocultura';
    editing: ProducaoAnimalAno | null;
    presetAno?: number;
  } | null>(null);

  const handleOpenNewPecuaria = () => {
    setEditingPecuaria(null);
    setPresetAnoPecuaria(null);
    setIsPecuariaDrawerOpen(true);
  };
  const handleOpenNewPecuariaForAno = (ano: number) => {
    setEditingPecuaria(null);
    setPresetAnoPecuaria(ano);
    setIsPecuariaDrawerOpen(true);
  };
  const handleOpenEditPecuaria = (registro: PecuariaBovinaAno) => {
    setEditingPecuaria(registro);
    setIsPecuariaDrawerOpen(true);
  };
  const handleOpenNewProducaoAnimal = (tipo: 'Avicultura' | 'Suinocultura') => setProducaoAnimalDrawer({ tipo, editing: null });
  const handleOpenNewProducaoAnimalForAno = (tipo: 'Avicultura' | 'Suinocultura', ano: number) =>
    setProducaoAnimalDrawer({ tipo, editing: null, presetAno: ano });
  const handleOpenEditProducaoAnimal = (tipo: 'Avicultura' | 'Suinocultura', registro: ProducaoAnimalAno) =>
    setProducaoAnimalDrawer({ tipo, editing: registro });

  const culturasVisiveis = culturaFiltro === 'Todas' ? culturasComRegistro : [culturaFiltro];

  const handleOpenNew = () => {
    setEditing(null);
    setPresetSafra(null);
    setIsDrawerOpen(true);
  };

  const handleOpenNewForAno = (cultura: string, ano: string) => {
    setEditing(null);
    setPresetSafra({ cultura, ano });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (registro: CulturaSafraAno) => {
    setEditing(registro);
    setIsDrawerOpen(true);
  };

  const handleCriarSafra = () => {
    if (!novaSafraInput.trim()) return;
    onCreateSafra(novaSafraInput.trim(), novaSafraAtual);
    setNovaSafraInput('');
  };

  const totaisPorAno = anosSafra.reduce(
    (acc, ano) => {
      const registrosDoAno = culturaSafras.filter(
        (s) => culturasVisiveis.includes(s.cultura) && s.anoSafra === ano
      );
      const calcs = registrosDoAno.map(calcularSafra);
      const receitaBruta = calcs.reduce((sum, c) => sum + c.receitaBruta, 0);
      const receitaLiquida = calcs.reduce((sum, c) => sum + c.receitaLiquida, 0);
      acc[ano] = {
        areaTotal: registrosDoAno.reduce((sum, r) => sum + r.hectares, 0),
        receitaBruta,
        despesa: calcs.reduce((sum, c) => sum + c.despesa, 0),
        receitaLiquida,
        margemFinalPercent: receitaBruta > 0 ? (receitaLiquida / receitaBruta) * 100 : 0
      };
      return acc;
    },
    {} as Record<
      string,
      { areaTotal: number; receitaBruta: number; despesa: number; receitaLiquida: number; margemFinalPercent: number }
    >
  );

  const TOTALIZADORES: { key: 'areaTotal' | 'receitaBruta' | 'despesa' | 'receitaLiquida'; label: string; formatar: (v: number) => string }[] = [
    { key: 'areaTotal', label: 'Total Área Utilizada (ha)', formatar: (v) => `${v.toLocaleString('pt-BR')} ha` },
    { key: 'receitaBruta', label: 'Total Receita Bruta', formatar: formatCurrency },
    { key: 'despesa', label: 'Total Despesas', formatar: formatCurrency },
    { key: 'receitaLiquida', label: 'Total Receita Líquida', formatar: formatCurrency }
  ];

  // "Resumo — Quadro de Produção" (16/09/2026, pedido do usuário) — Lavoura +
  // Bovinocultura + Avicultura + Suinocultura consolidados, uma coluna por
  // ano-safra (mesmas colunas de `anosSafra`, TODAS as culturas — nunca
  // filtradas pelo seletor de cultura acima). A pecuária usa
  // `receitaCustoPecuariaSafraBlend` (50% do ano civil de início da safra +
  // 50% do ano seguinte); substitui o antigo card "Consolidado do Quadro de
  // Produção" (só a safra vigente, redundante com a coluna "Atual" aqui).
  const resumoProducaoPorAno = anosSafra.map((ano) => {
    const lavoura = consolidarMargemLavoura(culturaSafras.filter((s) => s.anoSafra === ano));
    const pecuaria = receitaCustoPecuariaSafraBlend(ano, pecuariaBovina, producaoAnimal);
    const consolidado = consolidarProducaoTotal(lavoura, pecuaria);
    return { anoSafra: ano, ...consolidado };
  });

  return (
    <div className="space-y-6">
      {/* Painel de gestão de safra vigente (10/09/2026) — UI mínima: marcar
          uma safra existente como atual, ou cadastrar uma nova. */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase text-slate-500">Safra Vigente</p>
            <p className="text-sm font-semibold text-slate-800">
              {safraAtual ?? 'Nenhuma safra configurada — cadastre a primeira abaixo'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {safrasCadastradas
              .slice()
              .sort((a, b) => anoInicioSafra(a.anoSafra) - anoInicioSafra(b.anoSafra))
              .map((s) => (
                <button
                  key={s.id}
                  onClick={() => !s.atual && onSetSafraAtual(s.id)}
                  disabled={s.atual}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    s.atual ? 'bg-emerald-100 text-emerald-800 cursor-default' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title={s.atual ? 'Safra vigente' : 'Marcar como safra vigente'}
                >
                  {s.atual && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {s.anoSafra}
                </button>
              ))}
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="2028/2029"
              value={novaSafraInput}
              onChange={(e) => setNovaSafraInput(e.target.value)}
              className="w-32"
            />
            <label className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <input type="checkbox" checked={novaSafraAtual} onChange={(e) => setNovaSafraAtual(e.target.checked)} />
              Marcar como atual
            </label>
            <Button variant="secondary" onClick={handleCriarSafra} className="w-auto px-3 py-2 text-xs">
              + Nova Safra
            </Button>
          </div>
        </div>
      </Card>

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
        {culturasComRegistro.map((c) => {
          const meta = culturas.find((cult) => cult.nome === c);
          const isPersonalizada = meta?.contaId != null;
          return (
            <button
              key={c}
              onClick={() => setCulturaFiltro(c)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                culturaFiltro === c
                  ? 'bg-[#a3e635] text-[#0b2310]'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isPersonalizada && <Star className="w-3 h-3 fill-current" />}
              {c}
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="primary"
            onClick={handleOpenNew}
            className="w-auto flex items-center gap-1.5 px-3.5 py-2 text-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Nova Safra
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-white font-bold">
                <th className="bg-slate-900 py-3 px-4 whitespace-nowrap">Cultura</th>
                <th className="bg-slate-900 py-3 px-4 whitespace-nowrap">Descrição</th>
                {anosSafra.map((ano) => {
                  const status = classificarSafra(ano, referenciaSafra);
                  const badge = BADGE_STATUS[status];
                  return (
                    <th
                      key={ano}
                      className={`py-3 px-4 text-right whitespace-nowrap ${
                        status === 'Atual' ? 'bg-emerald-800' : status === 'Previsão' ? 'bg-slate-700' : 'bg-slate-900'
                      }`}
                    >
                      {ano}
                      <div className="text-[9px] font-normal normal-case opacity-80">{badge.label}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {culturasVisiveis.length === 0 && (
              <tbody>
                <tr>
                  <td colSpan={anosSafra.length + 2} className="py-8 px-4 text-center text-slate-400">
                    Nenhum registro de safra cadastrado ainda.
                  </td>
                </tr>
              </tbody>
            )}

            {culturasVisiveis.map((cultura) => {
              const registros = culturaSafras.filter((s) => s.cultura === cultura);
              const porAno = new Map(registros.map((r) => [r.anoSafra, r]));

              return (
                <tbody key={cultura} className="divide-y divide-slate-100">
                  {LINHAS.map((linha, idx) => (
                    <tr
                      key={linha.key}
                      className={
                        linha.destaque === 'highlight' ? 'bg-blue-50/60' : 'hover:bg-slate-50/60'
                      }
                    >
                      {idx === 0 && (
                        <td
                          rowSpan={LINHAS.length + 1}
                          className="bg-slate-900 text-white font-bold align-top py-3 px-4 whitespace-nowrap"
                        >
                          {cultura}
                        </td>
                      )}
                      <td
                        className={`py-2.5 px-4 whitespace-nowrap ${
                          linha.destaque === 'positivo' || linha.destaque === 'total'
                            ? 'font-bold text-slate-900'
                            : 'font-semibold text-slate-800'
                        }`}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              linha.origem === 'usuario' ? 'bg-amber-400' : 'bg-slate-300'
                            }`}
                          />
                          {linha.label}
                        </span>
                      </td>
                      {anosSafra.map((ano) => {
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
                          case 'precoMedio':
                            valor = formatCurrency(registro.precoMedio);
                            break;
                          case 'custoProducao':
                            valor = `${formatCurrency(registro.custoProducao)}/ha`;
                            break;
                          case 'receitaBruta':
                            valor = formatCurrency(calc.receitaBruta);
                            break;
                          case 'despesa':
                            valor = formatCurrency(calc.despesa);
                            break;
                          case 'receitaLiquida':
                            valor = formatCurrency(calc.receitaLiquida);
                            break;
                          case 'margem':
                            valor = `${calc.margem.toFixed(1)}%`;
                            break;
                          default:
                            valor = '—';
                        }
                        const corTexto =
                          linha.destaque === 'positivo'
                            ? 'text-emerald-700 font-bold'
                            : linha.destaque === 'total'
                              ? 'font-bold text-slate-900'
                              : linha.destaque === 'highlight'
                                ? 'font-bold text-blue-700'
                                : 'font-medium text-slate-700';
                        return (
                          <td key={ano} className={`py-2.5 px-4 text-right whitespace-nowrap ${corTexto}`}>
                            {valor}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr>
                    <td className="py-2 px-4 text-slate-400 text-[11px]">Ações por ano-safra:</td>
                    {anosSafra.map((ano) => {
                      const registro = porAno.get(ano);
                      return (
                        <td key={ano} className="py-2 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {registro ? (
                              <>
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
                              </>
                            ) : (
                              <button
                                onClick={() => handleOpenNewForAno(cultura, ano)}
                                title="Adicionar"
                                className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-md transition"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              );
            })}

            {culturasVisiveis.length > 0 && (
              <tbody>
                <tr>
                  <td
                    colSpan={anosSafra.length + 2}
                    className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px] py-2.5 px-4"
                  >
                    Totais por Safra
                  </td>
                </tr>
                {TOTALIZADORES.map((tot) => (
                  <tr key={tot.key} className="font-bold text-slate-900 bg-slate-50">
                    <td colSpan={2} className="py-2.5 px-4">
                      {tot.label}
                    </td>
                    {anosSafra.map((ano) => (
                      <td key={ano} className="py-2.5 px-4 text-right whitespace-nowrap">
                        {tot.formatar(totaisPorAno[ano][tot.key])}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="font-bold bg-blue-50/60">
                  <td colSpan={2} className="py-2.5 px-4 text-slate-900">
                    Margem final %
                  </td>
                  {anosSafra.map((ano) => (
                    <td key={ano} className="py-2.5 px-4 text-right whitespace-nowrap text-blue-700">
                      {totaisPorAno[ano].margemFinalPercent.toFixed(1)}%
                    </td>
                  ))}
                </tr>
              </tbody>
            )}
          </table>
        </div>

        <div className="flex items-center gap-4 px-4 py-3 border-t border-slate-200/80 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Campos preenchidos pelo usuário
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Calculado automaticamente
          </span>
        </div>
      </Card>

      {/* Bovinocultura — tabela fixa, sempre exibida, 6 anos civis fixos ancorados na safra vigente
          (16/09/2026, réplica confirmada da planilha do cliente): Estoque Rebanho + tabela Bovinos
          completa + rodapé Quantidade Total. */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/80">
          <h3 className="text-sm font-bold text-slate-900">Bovinocultura</h3>
          <Button variant="primary" onClick={handleOpenNewPecuaria} className="w-auto flex items-center gap-1.5 px-3.5 py-2 text-xs">
            <Plus className="w-3.5 h-3.5" /> Novo Ano
          </Button>
        </div>

        {/* Estoque Rebanho Atual — 8 categorias por sexo/faixa etária + total (Plantel). */}
        <div className="overflow-x-auto border-b border-slate-200/80">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr>
                <th
                  colSpan={anosPecuaria.length + 1}
                  className="bg-amber-800 text-white font-bold uppercase tracking-wider text-[11px] py-2.5 px-4 text-center"
                >
                  Estoque Rebanho Atual (qtdade)
                </th>
              </tr>
              <tr className="text-[11px] uppercase tracking-wider text-white font-bold">
                <th className="bg-slate-900 py-3 px-4 whitespace-nowrap">Categoria</th>
                {anosPecuaria.map((ano) => {
                  const status = classificarSafra(safraDoAno(ano), referenciaSafra);
                  const badge = BADGE_STATUS[status];
                  return (
                    <th
                      key={ano}
                      className={`py-3 px-4 text-right whitespace-nowrap ${
                        status === 'Atual' ? 'bg-emerald-800' : status === 'Previsão' ? 'bg-slate-700' : 'bg-slate-900'
                      }`}
                    >
                      {ano}
                      <div className="text-[9px] font-normal normal-case opacity-80">{badge.label}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ESTOQUE_REBANHO_LINHAS.map((linha) => (
                <tr key={linha.key} className="hover:bg-slate-50/60">
                  <td className="py-2 px-4 whitespace-nowrap font-semibold text-slate-700">{linha.label}</td>
                  {anosPecuaria.map((ano) => {
                    const registro = pecuariaBovina.find((r) => r.anoCivil === ano);
                    return (
                      <td key={ano} className="py-2 px-4 text-right whitespace-nowrap font-medium text-slate-700">
                        {registro ? NUM_PT_BR(registro[linha.key] as number) : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="bg-slate-900 text-white font-bold">
                <td className="py-2.5 px-4">Plantel</td>
                {anosPecuaria.map((ano) => {
                  const registro = pecuariaBovina.find((r) => r.anoCivil === ano);
                  return (
                    <td key={ano} className="py-2.5 px-4 text-right whitespace-nowrap">
                      {registro ? NUM_PT_BR(estoqueTotalBovino(registro)) : '—'}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bovinos — indicadores completos de ciclo, custo e comercialização. */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-white font-bold">
                <th className="bg-slate-900 py-3 px-4 whitespace-nowrap">Bovinos</th>
                {anosPecuaria.map((ano) => {
                  const status = classificarSafra(safraDoAno(ano), referenciaSafra);
                  const badge = BADGE_STATUS[status];
                  return (
                    <th
                      key={ano}
                      className={`py-3 px-4 text-right whitespace-nowrap ${
                        status === 'Atual' ? 'bg-emerald-800' : status === 'Previsão' ? 'bg-slate-700' : 'bg-slate-900'
                      }`}
                    >
                      {ano}
                      <div className="text-[9px] font-normal normal-case opacity-80">{badge.label}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {LINHAS_BOVINO.map((linha, idx) => {
                if (linha.tipo === 'divisor') {
                  return (
                    <tr key={`div-${idx}`}>
                      <td
                        colSpan={anosPecuaria.length + 1}
                        className="bg-amber-800 text-white font-bold uppercase tracking-wider text-[11px] py-2.5 px-4"
                      >
                        {linha.label}
                      </td>
                    </tr>
                  );
                }
                if (linha.tipo === 'label') {
                  return (
                    <tr key={`label-${idx}`} className="bg-slate-50/60">
                      <td colSpan={anosPecuaria.length + 1} className="py-2 px-4 font-semibold text-slate-500 italic">
                        {linha.label}
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={linha.label} className={linha.destaque ? 'bg-emerald-50/40' : 'hover:bg-slate-50/60'}>
                    <td
                      className={`py-2 px-4 whitespace-nowrap ${linha.indent ? 'pl-8' : ''} ${
                        linha.italic ? 'italic text-slate-500 font-normal' : linha.destaque ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'
                      }`}
                    >
                      {linha.label}
                    </td>
                    {anosPecuaria.map((ano) => {
                      const registro = pecuariaBovina.find((r) => r.anoCivil === ano);
                      return (
                        <td
                          key={ano}
                          className={`py-2 px-4 text-right whitespace-nowrap ${
                            linha.italic ? 'text-slate-500 font-normal' : linha.destaque ? 'font-bold text-slate-900' : 'font-medium text-slate-700'
                          }`}
                        >
                          {registro ? linha.render(registro) : '—'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              <tr>
                <td
                  colSpan={anosPecuaria.length + 1}
                  className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px] py-2.5 px-4"
                >
                  Quantidade Total
                </td>
              </tr>
              {QUANTIDADE_TOTAL_LINHAS.map((linha) => (
                <tr key={linha.label} className="bg-slate-50 font-bold text-slate-900">
                  <td className="py-2.5 px-4">{linha.label}</td>
                  {anosPecuaria.map((ano) => {
                    const registro = pecuariaBovina.find((r) => r.anoCivil === ano);
                    return (
                      <td key={ano} className="py-2.5 px-4 text-right whitespace-nowrap">
                        {registro ? linha.render(registro) : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}

              <tr>
                <td className="py-2 px-4 text-slate-400 text-[11px]">Ações por ano:</td>
                {anosPecuaria.map((ano) => {
                  const registro = pecuariaBovina.find((r) => r.anoCivil === ano);
                  return (
                    <td key={ano} className="py-2 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {registro ? (
                          <>
                            <button onClick={() => handleOpenEditPecuaria(registro)} title="Editar" className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => onDeletePecuariaBovina(registro.id)} title="Deletar" className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button onClick={() => handleOpenNewPecuariaForAno(ano)} title="Adicionar" className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-md transition">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Avicultura / Suinocultura — tabelas fixas, mesma estrutura simples entre si. */}
      {(['Avicultura', 'Suinocultura'] as const).map((tipo) => (
        <Card key={tipo} className="overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/80">
            <h3 className="text-sm font-bold text-slate-900">{tipo}</h3>
            <Button variant="primary" onClick={() => handleOpenNewProducaoAnimal(tipo)} className="w-auto flex items-center gap-1.5 px-3.5 py-2 text-xs">
              <Plus className="w-3.5 h-3.5" /> Novo Ano
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-white font-bold">
                  <th className="bg-slate-900 py-3 px-4 whitespace-nowrap">Indicador</th>
                  {anosPecuaria.map((ano) => {
                    const status = classificarSafra(safraDoAno(ano), referenciaSafra);
                    const badge = BADGE_STATUS[status];
                    return (
                      <th
                        key={ano}
                        className={`py-3 px-4 text-right whitespace-nowrap ${
                          status === 'Atual' ? 'bg-emerald-800' : status === 'Previsão' ? 'bg-slate-700' : 'bg-slate-900'
                        }`}
                      >
                        {ano}
                        <div className="text-[9px] font-normal normal-case opacity-80">{badge.label}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { label: 'Plantel', render: (r: ProducaoAnimalAno) => `${r.plantel.toLocaleString('pt-BR')} cab.` },
                  { label: 'Produção (cabeças)', render: (r: ProducaoAnimalAno) => `${r.producaoCabecas.toLocaleString('pt-BR')} cab.` },
                  { label: 'Preço Médio (R$/cabeça)', render: (r: ProducaoAnimalAno) => formatCurrency(r.precoMedioPorCabeca) },
                  { label: 'Custo Médio (R$/cabeça)', render: (r: ProducaoAnimalAno) => formatCurrency(r.custoMedioPorCabeca) },
                  { label: 'RECEITA TOTAL (R$)', render: (r: ProducaoAnimalAno) => formatCurrency(calcularProducaoAnimal(r).receitaBruta), destaque: true },
                  { label: 'CUSTO TOTAL DE PRODUÇÃO (R$)', render: (r: ProducaoAnimalAno) => formatCurrency(calcularProducaoAnimal(r).despesa) },
                  { label: 'RESULTADO BRUTO (R$)', render: (r: ProducaoAnimalAno) => formatCurrency(calcularProducaoAnimal(r).receitaLiquida), destaque: true },
                  { label: 'MARGEM BRUTA (%)', render: (r: ProducaoAnimalAno) => `${calcularProducaoAnimal(r).margem.toFixed(1)}%` }
                ].map((linha) => (
                  <tr key={linha.label} className={linha.destaque ? 'bg-emerald-50/40' : 'hover:bg-slate-50/60'}>
                    <td className={`py-2.5 px-4 whitespace-nowrap ${linha.destaque ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                      {linha.label}
                    </td>
                    {anosPecuaria.map((ano) => {
                      const registro = producaoAnimal.find((r) => r.tipo === tipo && r.anoCivil === ano);
                      return (
                        <td key={ano} className={`py-2.5 px-4 text-right whitespace-nowrap ${linha.destaque ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                          {registro ? linha.render(registro) : '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr>
                  <td className="py-2 px-4 text-slate-400 text-[11px]">Ações por ano:</td>
                  {anosPecuaria.map((ano) => {
                    const registro = producaoAnimal.find((r) => r.tipo === tipo && r.anoCivil === ano);
                    return (
                      <td key={ano} className="py-2 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {registro ? (
                            <>
                              <button onClick={() => handleOpenEditProducaoAnimal(tipo, registro)} title="Editar" className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => onDeleteProducaoAnimal(registro.id)} title="Deletar" className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <button onClick={() => handleOpenNewProducaoAnimalForAno(tipo, ano)} title="Adicionar" className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-md transition">
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      ))}

      {/* Resumo — Quadro de Produção (16/09/2026, pedido do usuário) — Lavoura +
          Bovinocultura + Avicultura + Suinocultura consolidados, uma coluna por
          ano-safra (mesmas colunas do Quadro de Lavoura acima). Substitui o
          card "Consolidado do Quadro de Produção" (só a safra vigente,
          redundante com a nova coluna "Atual" desta tabela). */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr>
                <th
                  colSpan={anosSafra.length + 1}
                  className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px] py-3 px-4 text-center"
                >
                  Resumo — Quadro de Produção
                </th>
              </tr>
              <tr className="text-[11px] uppercase tracking-wider text-white font-bold">
                <th className="bg-slate-800 py-3 px-4 whitespace-nowrap"> </th>
                {anosSafra.map((ano) => {
                  const status = classificarSafra(ano, referenciaSafra);
                  return (
                    <th
                      key={ano}
                      className={`py-3 px-4 text-center whitespace-nowrap ${
                        status === 'Atual' ? 'bg-emerald-800' : status === 'Previsão' ? 'bg-slate-700' : 'bg-slate-800'
                      }`}
                    >
                      {safraCurta(ano)}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="bg-white">
                <td className="py-2.5 px-4 font-bold text-slate-900 whitespace-nowrap">Receita Total (R$)</td>
                {resumoProducaoPorAno.map((r) => (
                  <td key={r.anoSafra} className="py-2.5 px-4 text-center font-bold text-slate-900 whitespace-nowrap">
                    {formatCurrency(r.receitaTotal)}
                  </td>
                ))}
              </tr>
              <tr className="bg-slate-50">
                <td className="py-2.5 px-4 font-bold text-slate-900 whitespace-nowrap">Custo Total (R$)</td>
                {resumoProducaoPorAno.map((r) => (
                  <td key={r.anoSafra} className="py-2.5 px-4 text-center font-bold text-slate-900 whitespace-nowrap">
                    {formatCurrency(r.custoTotal)}
                  </td>
                ))}
              </tr>
              <tr className="bg-white">
                <td className="py-2.5 px-4 font-bold text-slate-900 whitespace-nowrap">Resultado Bruto (R$)</td>
                {resumoProducaoPorAno.map((r) => (
                  <td key={r.anoSafra} className="py-2.5 px-4 text-center font-bold text-slate-900 whitespace-nowrap">
                    {formatCurrency(r.margemRs)}
                  </td>
                ))}
              </tr>
              <tr className="bg-blue-50/60">
                <td className="py-2.5 px-4 font-bold text-slate-900 whitespace-nowrap">Margem Bruta (%)</td>
                {resumoProducaoPorAno.map((r) => (
                  <td key={r.anoSafra} className="py-2.5 px-4 text-center font-bold text-blue-700 whitespace-nowrap">
                    {r.margemPercent.toFixed(0)}%
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="px-4 py-3 border-t border-slate-200/80 text-[11px] text-slate-500">
          Lavoura (todas as culturas) + Bovinocultura + Avicultura + Suinocultura. A pecuária é atividade de ano civil —
          cada coluna usa 50% do ano civil de início da safra + 50% do ano civil seguinte (ex.: safra {safraCurta('2023/2024')} = 50%
          de 2023 + 50% de 2024).
        </p>
      </Card>

      <SafraDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={onSave}
        editingSafra={editing}
        culturas={culturas}
        onSaveCultura={onSaveCultura}
        onDeleteCultura={onDeleteCultura}
        anosSafraDisponiveis={opcoesAnoSafra.length > 0 ? opcoesAnoSafra : anosSafra}
        safraAtual={safraAtual}
        presetCultura={presetSafra?.cultura}
        presetAnoSafra={presetSafra?.ano}
      />

      <PecuariaBovinaDrawer
        isOpen={isPecuariaDrawerOpen}
        onClose={() => setIsPecuariaDrawerOpen(false)}
        onSave={onSavePecuariaBovina}
        editingRegistro={editingPecuaria}
        anosDisponiveis={anosPecuaria}
        presetAnoCivil={presetAnoPecuaria ?? undefined}
      />

      {producaoAnimalDrawer && (
        <ProducaoAnimalDrawer
          isOpen={true}
          onClose={() => setProducaoAnimalDrawer(null)}
          onSave={onSaveProducaoAnimal}
          editingRegistro={producaoAnimalDrawer.editing}
          tipo={producaoAnimalDrawer.tipo}
          anosDisponiveis={anosPecuaria}
          presetAnoCivil={producaoAnimalDrawer.presetAno}
        />
      )}
    </div>
  );
};
