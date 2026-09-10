'use client';

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Star, CheckCircle2 } from 'lucide-react';
import { CulturaSafraAno, Cultura, SafraCadastrada, PecuariaBovinaAno, ProducaoAnimalAno } from '../../types';
import { formatCurrency } from '../../data/initialData';
import { calcularSafra, consolidarMargemLavoura } from '../../lib/agro';
import {
  calcularPecuariaBovina,
  calcularProducaoAnimal,
  estoqueTotalBovino,
  custoTotalPorCabecaBovino,
  anosPecuariaVisiveis,
  consolidarProducaoTotal
} from '../../lib/pecuaria-calc';
import { receitaCustoPecuariaDaSafra } from '../../lib/pecuaria-calc';
import { classificarSafra, anoInicioSafra, safraDoAno, safraDoAnoCivil, type StatusSafra } from '../../lib/safra-periodo';
import { Card, Button, Badge, Input, Select } from '../ui';
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

const BADGE_STATUS: Record<StatusSafra, { tone: 'slate' | 'emerald' | 'blue'; label: string }> = {
  Realizado: { tone: 'slate', label: 'Realizado' },
  Atual: { tone: 'emerald', label: 'Atual' },
  Previsão: { tone: 'blue', label: 'Previsão' }
};

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
      acc[ano] = {
        areaTotal: registrosDoAno.reduce((sum, r) => sum + r.hectares, 0),
        receitaBruta: calcs.reduce((sum, c) => sum + c.receitaBruta, 0),
        despesa: calcs.reduce((sum, c) => sum + c.despesa, 0),
        receitaLiquida: calcs.reduce((sum, c) => sum + c.receitaLiquida, 0)
      };
      return acc;
    },
    {} as Record<string, { areaTotal: number; receitaBruta: number; despesa: number; receitaLiquida: number }>
  );

  const TOTALIZADORES: { key: 'areaTotal' | 'receitaBruta' | 'despesa' | 'receitaLiquida'; label: string; formatar: (v: number) => string }[] = [
    { key: 'areaTotal', label: 'Total Área Utilizada (ha)', formatar: (v) => `${v.toLocaleString('pt-BR')} ha` },
    { key: 'receitaBruta', label: 'Total Receita Bruta', formatar: formatCurrency },
    { key: 'despesa', label: 'Total Despesas', formatar: formatCurrency },
    { key: 'receitaLiquida', label: 'Total Receita Líquida', formatar: formatCurrency }
  ];

  // Margem final da lavoura (item 1.6) — consolidado da safra vigente, entre
  // as culturas visíveis no filtro selecionado.
  const margemLavoura = consolidarMargemLavoura(
    culturaSafras.filter((s) => culturasVisiveis.includes(s.cultura) && s.anoSafra === referenciaSafra)
  );

  // Consolidado final (item 2.5) — soma Lavoura + Bovino + Avícola + Suíno da
  // safra vigente. Usa TODAS as culturas (não só o filtro selecionado), pois
  // é o total do Quadro de Produção, não da visualização filtrada.
  const margemLavouraTotal = consolidarMargemLavoura(culturaSafras.filter((s) => s.anoSafra === referenciaSafra));
  const pecuariaDaSafra = receitaCustoPecuariaDaSafra(referenciaSafra, pecuariaBovina, producaoAnimal);
  const consolidadoTotal = consolidarProducaoTotal(margemLavouraTotal, pecuariaDaSafra);

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

        {/* Margem final da lavoura (item 1.6) — consolidado da safra vigente. */}
        {culturasVisiveis.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-4 py-4 border-t border-slate-200/80 bg-slate-50/60">
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-500">Margem Final da Lavoura ({referenciaSafra})</p>
              <p className="text-lg font-extrabold text-slate-900">{formatCurrency(margemLavoura.margemRs)}</p>
              <p className="text-[11px] text-slate-500">
                Receita {formatCurrency(margemLavoura.receitaTotal)} − Custo {formatCurrency(margemLavoura.custoTotal)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-500">Margem (%)</p>
              <p className={`text-lg font-extrabold ${margemLavoura.margemPercent >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {margemLavoura.margemPercent.toFixed(1)}%
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Bovinocultura — tabela fixa, sempre exibida, 5 anos civis fixos ancorados na safra vigente. */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/80">
          <h3 className="text-sm font-bold text-slate-900">Bovinocultura</h3>
          <Button variant="primary" onClick={handleOpenNewPecuaria} className="w-auto flex items-center gap-1.5 px-3.5 py-2 text-xs">
            <Plus className="w-3.5 h-3.5" /> Novo Ano
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-white font-bold">
                <th className="bg-slate-900 py-3 px-4 whitespace-nowrap">Indicador</th>
                {anosPecuaria.map((ano) => {
                  const status = classificarSafra(safraDoAnoCivil(ano), referenciaSafra);
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
                { label: 'Plantel', render: (r: PecuariaBovinaAno) => `${estoqueTotalBovino(r).toLocaleString('pt-BR')} cab.` },
                { label: 'Ciclo Produtivo', render: (r: PecuariaBovinaAno) => r.cicloProdutivo || '—' },
                { label: 'Tipo de Terminação', render: (r: PecuariaBovinaAno) => r.tipoTerminacao || '—' },
                { label: 'Custo Total (R$/cabeça)', render: (r: PecuariaBovinaAno) => formatCurrency(custoTotalPorCabecaBovino(r)) },
                {
                  label: 'RECEITA BRUTA (R$)',
                  render: (r: PecuariaBovinaAno) => formatCurrency(calcularPecuariaBovina(r).receitaBruta),
                  destaque: true
                },
                {
                  label: 'CUSTO TOTAL DE PRODUÇÃO (R$)',
                  render: (r: PecuariaBovinaAno) => formatCurrency(calcularPecuariaBovina(r).despesa)
                },
                {
                  label: 'RESULTADO BRUTO (R$)',
                  render: (r: PecuariaBovinaAno) => formatCurrency(calcularPecuariaBovina(r).receitaLiquida),
                  destaque: true
                },
                { label: 'MARGEM BRUTA (%)', render: (r: PecuariaBovinaAno) => `${calcularPecuariaBovina(r).margem.toFixed(1)}%` }
              ].map((linha) => (
                <tr key={linha.label} className={linha.destaque ? 'bg-emerald-50/40' : 'hover:bg-slate-50/60'}>
                  <td className={`py-2.5 px-4 whitespace-nowrap ${linha.destaque ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                    {linha.label}
                  </td>
                  {anosPecuaria.map((ano) => {
                    const registro = pecuariaBovina.find((r) => r.anoCivil === ano);
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
                    const status = classificarSafra(safraDoAnoCivil(ano), referenciaSafra);
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

      {/* Consolidado final (item 2.5) — Lavoura + Bovinocultura + Avicultura + Suinocultura, safra vigente. */}
      <Card className="p-6 bg-slate-900 text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wide">Consolidado do Quadro de Produção</h3>
          <Badge tone="emerald">{referenciaSafra}</Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-[11px] uppercase text-slate-400">Receita Total</p>
            <p className="text-xl font-extrabold">{formatCurrency(consolidadoTotal.receitaTotal)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase text-slate-400">Custo Total</p>
            <p className="text-xl font-extrabold">{formatCurrency(consolidadoTotal.custoTotal)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase text-slate-400">Receita Líquida</p>
            <p className={`text-xl font-extrabold ${consolidadoTotal.margemRs >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(consolidadoTotal.margemRs)}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase text-slate-400">Margem (%)</p>
            <p className={`text-xl font-extrabold ${consolidadoTotal.margemPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {consolidadoTotal.margemPercent.toFixed(1)}%
            </p>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-slate-400">
          Soma de Lavoura + Bovinocultura + Avicultura + Suinocultura para a safra vigente ({referenciaSafra}).
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
