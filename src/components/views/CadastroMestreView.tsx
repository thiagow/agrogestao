'use client';

import React, { useMemo, useState } from 'react';
import { Upload, Printer, RefreshCw, Plus, Edit2, Trash2 } from 'lucide-react';
import { Socio, BemDireito, Garantia, Capex, PerfilGrupoEconomico } from '../../types';
import { Card, Tabs, Button, Badge, KpiCard, Textarea } from '../ui';
import { SocioDrawer } from '../SocioDrawer';
import { BemDireitoDrawer } from '../BemDireitoDrawer';
import { GarantiaDrawer } from '../GarantiaDrawer';
import { CapexForm } from '../CapexForm';
import { PerfilGrupoDrawer } from '../PerfilGrupoDrawer';
import { saveSocio, deleteSocio } from '../../server/socios';
import { saveBemDireito, deleteBemDireito } from '../../server/bens-direitos';
import { saveGarantia, deleteGarantia } from '../../server/garantias';
import { saveCapex, deleteCapex } from '../../server/capex';
import { savePerfilGrupo } from '../../server/perfil-grupo';
import { formatCurrency, formatDateBR } from '../../lib/format';
import { calcularPatrimonioGrupo } from '../../lib/patrimonio';

interface CadastroMestreViewProps {
  initialSocios?: Socio[];
  initialBensDireitos?: BemDireito[];
  initialGarantias?: Garantia[];
  initialCapex?: Capex[];
  initialPerfilGrupo?: PerfilGrupoEconomico | null;
}

export const CadastroMestreView: React.FC<CadastroMestreViewProps> = ({
  initialSocios = [],
  initialBensDireitos = [],
  initialGarantias = [],
  initialCapex = [],
  initialPerfilGrupo = null
}) => {
  const [socios, setSocios] = useState<Socio[]>(initialSocios);
  const [isSocioDrawerOpen, setIsSocioDrawerOpen] = useState(false);
  const [editingSocio, setEditingSocio] = useState<Socio | null>(null);

  const [bensDireitos, setBensDireitos] = useState<BemDireito[]>(initialBensDireitos);
  const [isBemDrawerOpen, setIsBemDrawerOpen] = useState(false);
  const [editingBem, setEditingBem] = useState<BemDireito | null>(null);

  const [garantias, setGarantias] = useState<Garantia[]>(initialGarantias);
  const [isGarantiaDrawerOpen, setIsGarantiaDrawerOpen] = useState(false);
  const [editingGarantia, setEditingGarantia] = useState<Garantia | null>(null);

  const [capexList, setCapexList] = useState<Capex[]>(initialCapex);
  const [isCapexFormOpen, setIsCapexFormOpen] = useState(false);
  const [editingCapex, setEditingCapex] = useState<Capex | null>(null);
  const [anoSelecionado, setAnoSelecionado] = useState(() => {
    const anos = initialCapex.map((c) => c.ano);
    return anos.length ? Math.max(...anos) : new Date().getFullYear();
  });

  const [perfilGrupo, setPerfilGrupo] = useState<PerfilGrupoEconomico | null>(initialPerfilGrupo);
  const [isPerfilDrawerOpen, setIsPerfilDrawerOpen] = useState(false);
  const [historicoDraft, setHistoricoDraft] = useState(initialPerfilGrupo?.historico ?? '');

  // ---- Sócios ----

  const handleSaveSocio = async (data: Partial<Socio>) => {
    try {
      const saved = await saveSocio({
        id: data.id,
        nome: data.nome || 'Novo Sócio',
        cpf: data.cpf || '',
        participacao: data.participacao || 0,
        estadoCivil: data.estadoCivil,
        telefone: data.telefone,
        email: data.email,
        nacionalidade: data.nacionalidade,
        dataNascimento: data.dataNascimento
      });
      setSocios((prev) => (data.id ? prev.map((s) => (s.id === saved.id ? saved : s)) : [saved, ...prev]));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Erro ao salvar sócio.');
    }
  };

  const handleDeleteSocio = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este sócio?')) return;
    try {
      await deleteSocio(id);
      setSocios((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Erro ao remover sócio.');
    }
  };

  // ---- Bens e Direitos ----

  const handleSaveBem = async (data: Partial<BemDireito>) => {
    try {
      const saved = await saveBemDireito({
        id: data.id,
        socioId: data.socioId,
        grupoIrpf: data.grupoIrpf || 'Outros Bens e Direitos',
        codigoTipo: data.codigoTipo || '',
        descricao: data.descricao || '',
        valorDeclaradoIrpf: data.valorDeclaradoIrpf,
        valorMercadoEstimado: data.valorMercadoEstimado,
        dataAquisicao: data.dataAquisicao,
        valorAquisicao: data.valorAquisicao,
        liquidez: data.liquidez || 'Baixa',
        ltv: data.ltv,
        elegivelGarantia: data.elegivelGarantia || false,
        geraFluxoCaixa: data.geraFluxoCaixa || false,
        observacoes: data.observacoes
      });
      setBensDireitos((prev) => (data.id ? prev.map((b) => (b.id === saved.id ? saved : b)) : [saved, ...prev]));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Erro ao salvar bem.');
    }
  };

  const handleDeleteBem = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este bem?')) return;
    try {
      await deleteBemDireito(id);
      setBensDireitos((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Erro ao remover bem.');
    }
  };

  // ---- Garantias ----

  const handleSaveGarantia = async (data: Partial<Garantia>) => {
    try {
      const saved = await saveGarantia({
        id: data.id,
        tipoAtivo: data.tipoAtivo || '',
        tipoGarantia: data.tipoGarantia || '',
        descricao: data.descricao || '',
        bancoVinculado: data.bancoVinculado,
        numeroOperacao: data.numeroOperacao,
        valor: data.valor || 0,
        moeda: data.moeda || 'BRL',
        observacoes: data.observacoes
      });
      setGarantias((prev) => (data.id ? prev.map((g) => (g.id === saved.id ? saved : g)) : [saved, ...prev]));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Erro ao salvar garantia.');
    }
  };

  const handleDeleteGarantia = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover esta garantia?')) return;
    try {
      await deleteGarantia(id);
      setGarantias((prev) => prev.filter((g) => g.id !== id));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Erro ao remover garantia.');
    }
  };

  // ---- CAPEX ----

  const anosDisponiveis = useMemo(() => {
    const anos = new Set(capexList.map((c) => c.ano));
    anos.add(anoSelecionado);
    return Array.from(anos).sort((a, b) => b - a);
  }, [capexList, anoSelecionado]);

  const capexDoAno = useMemo(
    () => capexList.filter((c) => c.ano === anoSelecionado),
    [capexList, anoSelecionado]
  );

  const capexKpis = useMemo(() => {
    const totalPlanejado = capexDoAno.reduce((sum, c) => sum + c.valorPlanejado, 0);
    const totalExecutado = capexDoAno.reduce((sum, c) => sum + c.valorExecutado, 0);
    const financiamento = capexDoAno.reduce(
      (sum, c) => sum + c.valorPlanejado * ((c.percentualFinanciamento ?? 0) / 100),
      0
    );
    return { totalPlanejado, totalExecutado, financiamento, capitalProprio: totalPlanejado - financiamento };
  }, [capexDoAno]);

  const handleSaveCapex = async (data: Partial<Capex>) => {
    try {
      const saved = await saveCapex({
        id: data.id,
        descricao: data.descricao || '',
        tipo: data.tipo || '',
        ano: data.ano || anoSelecionado,
        valorPlanejado: data.valorPlanejado || 0,
        valorExecutado: data.valorExecutado || 0,
        percentualFinanciamento: data.percentualFinanciamento,
        status: data.status || 'Planejado',
        observacoes: data.observacoes
      });
      setCapexList((prev) => (data.id ? prev.map((c) => (c.id === saved.id ? saved : c)) : [saved, ...prev]));
      setIsCapexFormOpen(false);
      setEditingCapex(null);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Erro ao salvar investimento.');
    }
  };

  const handleDeleteCapex = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este investimento?')) return;
    try {
      await deleteCapex(id);
      setCapexList((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Erro ao remover investimento.');
    }
  };

  // ---- Grupo Econômico ----

  const patrimonioGrupo = useMemo(() => calcularPatrimonioGrupo(bensDireitos, socios), [bensDireitos, socios]);

  const handleSavePerfil = async (data: Partial<PerfilGrupoEconomico>) => {
    try {
      const saved = await savePerfilGrupo(data);
      setPerfilGrupo(saved);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Erro ao salvar perfil do grupo.');
    }
  };

  const handleSalvarHistorico = async () => {
    try {
      const saved = await savePerfilGrupo({ historico: historicoDraft });
      setPerfilGrupo(saved);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Erro ao salvar histórico.');
    }
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
          items={[
            { id: 'socios', label: 'Sócios', badge: socios.length },
            { id: 'bens', label: 'Bens e Direitos', badge: bensDireitos.length },
            { id: 'garantias', label: 'Garantias', badge: garantias.length },
            { id: 'capex', label: 'CAPEX', badge: capexList.length },
            { id: 'grupo_economico', label: 'Grupo Econômico' },
            { id: 'historico', label: 'Histórico do Grupo' }
          ]}
          defaultTabId="socios"
        >
          {(activeTabId) => {
            if (activeTabId === 'socios') {
              return (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900">Sócios e Representantes</h3>
                    <Button
                      variant="primary"
                      onClick={() => {
                        setEditingSocio(null);
                        setIsSocioDrawerOpen(true);
                      }}
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
                                  onClick={() => {
                                    setEditingSocio(socio);
                                    setIsSocioDrawerOpen(true);
                                  }}
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
            }

            if (activeTabId === 'bens') {
              return (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900">Bens e Direitos</h3>
                    <Button
                      variant="primary"
                      onClick={() => {
                        setEditingBem(null);
                        setIsBemDrawerOpen(true);
                      }}
                      className="w-auto flex items-center gap-1.5 px-3.5 py-2 text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-600 font-bold">
                          <th className="py-3 px-4">Descrição</th>
                          <th className="py-3 px-4">Sócio Titular</th>
                          <th className="py-3 px-4">Grupo IRPF</th>
                          <th className="py-3 px-4">Código / Tipo</th>
                          <th className="py-3 px-4">Liquidez</th>
                          <th className="py-3 px-4 text-right">Valor Declarado IRPF</th>
                          <th className="py-3 px-4 text-right">Valor de Mercado</th>
                          <th className="py-3 px-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                        {bensDireitos.map((bem) => (
                          <tr key={bem.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {bem.descricao}
                              {bem.elegivelGarantia && (
                                <span className="block mt-1">
                                  <Badge tone="emerald">Elegível como garantia</Badge>
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-600">{bem.socioNome ?? 'Grupo'}</td>
                            <td className="py-3 px-4">
                              <Badge tone="slate">{bem.grupoIrpf}</Badge>
                            </td>
                            <td className="py-3 px-4 text-slate-600">{bem.codigoTipo}</td>
                            <td className="py-3 px-4 text-slate-600">{bem.liquidez}</td>
                            <td className="py-3 px-4 text-right font-semibold text-slate-800">
                              {bem.valorDeclaradoIrpf != null ? formatCurrency(bem.valorDeclaradoIrpf) : '—'}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-emerald-700">
                              {bem.valorMercadoEstimado != null ? formatCurrency(bem.valorMercadoEstimado) : '—'}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditingBem(bem);
                                    setIsBemDrawerOpen(true);
                                  }}
                                  title="Editar bem"
                                  className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteBem(bem.id)}
                                  title="Remover bem"
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
            }

            if (activeTabId === 'garantias') {
              return (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900">Garantias</h3>
                    <Button
                      variant="primary"
                      onClick={() => {
                        setEditingGarantia(null);
                        setIsGarantiaDrawerOpen(true);
                      }}
                      className="w-auto flex items-center gap-1.5 px-3.5 py-2 text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-600 font-bold">
                          <th className="py-3 px-4">Descrição</th>
                          <th className="py-3 px-4">Tipo de Ativo</th>
                          <th className="py-3 px-4">Tipo de Garantia</th>
                          <th className="py-3 px-4">Banco Vinculado</th>
                          <th className="py-3 px-4">Nº Operação</th>
                          <th className="py-3 px-4 text-right">Valor</th>
                          <th className="py-3 px-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                        {garantias.map((garantia) => (
                          <tr key={garantia.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900">{garantia.descricao}</td>
                            <td className="py-3 px-4">
                              <Badge tone="slate">{garantia.tipoAtivo}</Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Badge tone="amber">{garantia.tipoGarantia}</Badge>
                            </td>
                            <td className="py-3 px-4 text-slate-600">{garantia.bancoVinculado ?? '—'}</td>
                            <td className="py-3 px-4 text-slate-600">{garantia.numeroOperacao ?? '—'}</td>
                            <td className="py-3 px-4 text-right font-semibold text-slate-800">
                              {formatCurrency(garantia.valor, garantia.moeda)}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditingGarantia(garantia);
                                    setIsGarantiaDrawerOpen(true);
                                  }}
                                  title="Editar garantia"
                                  className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteGarantia(garantia.id)}
                                  title="Remover garantia"
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
            }

            if (activeTabId === 'capex') {
              return (
                <div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <KpiCard title="Total Planejado" value={formatCurrency(capexKpis.totalPlanejado)} />
                    <KpiCard
                      title="Total Executado"
                      value={formatCurrency(capexKpis.totalExecutado)}
                      valueClassName="text-emerald-700"
                    />
                    <KpiCard
                      title="Financiamento"
                      value={formatCurrency(capexKpis.financiamento)}
                      valueClassName="text-amber-600"
                    />
                    <KpiCard
                      title="Capital Próprio"
                      value={formatCurrency(capexKpis.capitalProprio)}
                      valueClassName="text-blue-700"
                    />
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900">CAPEX — Investimentos e Manutenções</h3>
                    <div className="flex items-center gap-2">
                      <select
                        value={anoSelecionado}
                        onChange={(e) => setAnoSelecionado(Number(e.target.value))}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 font-medium text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
                      >
                        {anosDisponiveis.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="primary"
                        onClick={() => {
                          setEditingCapex(null);
                          setIsCapexFormOpen(true);
                        }}
                        className="w-auto flex items-center gap-1.5 px-3.5 py-2 text-xs"
                      >
                        <Plus className="w-3.5 h-3.5" /> Novo Item
                      </Button>
                    </div>
                  </div>

                  {isCapexFormOpen && (
                    <CapexForm
                      editingCapex={editingCapex}
                      anoPadrao={anoSelecionado}
                      onSave={handleSaveCapex}
                      onCancel={() => {
                        setIsCapexFormOpen(false);
                        setEditingCapex(null);
                      }}
                    />
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-600 font-bold">
                          <th className="py-3 px-4">Descrição</th>
                          <th className="py-3 px-4">Tipo</th>
                          <th className="py-3 px-4 text-right">Planejado</th>
                          <th className="py-3 px-4 text-right">Executado</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                        {capexDoAno.map((capex) => (
                          <tr key={capex.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900">{capex.descricao}</td>
                            <td className="py-3 px-4 text-slate-600">{capex.tipo}</td>
                            <td className="py-3 px-4 text-right font-semibold text-slate-800">
                              {formatCurrency(capex.valorPlanejado)}
                            </td>
                            <td className="py-3 px-4 text-right text-emerald-700">
                              {formatCurrency(capex.valorExecutado)}
                            </td>
                            <td className="py-3 px-4">
                              <Badge tone="amber">{capex.status}</Badge>
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditingCapex(capex);
                                    setIsCapexFormOpen(true);
                                  }}
                                  title="Editar investimento"
                                  className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCapex(capex.id)}
                                  title="Remover investimento"
                                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-slate-200 font-bold text-slate-900 text-xs">
                          <td className="py-3 px-4">Total {anoSelecionado}</td>
                          <td className="py-3 px-4" />
                          <td className="py-3 px-4 text-right">{formatCurrency(capexKpis.totalPlanejado)}</td>
                          <td className="py-3 px-4 text-right text-emerald-700">
                            {formatCurrency(capexKpis.totalExecutado)}
                          </td>
                          <td className="py-3 px-4" />
                          <td className="py-3 px-4" />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              );
            }

            if (activeTabId === 'grupo_economico') {
              return (
                <div className="space-y-5">
                  <Card className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-slate-900">Grupo Econômico</h3>
                      <Button
                        variant="secondary"
                        onClick={() => setIsPerfilDrawerOpen(true)}
                        className="w-auto flex items-center gap-1.5 px-3.5 py-2 text-xs"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Editar
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <p className="text-slate-500 mb-1">Nome do Grupo</p>
                        <p className="font-bold text-slate-900">{perfilGrupo?.nome ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1">E-mail</p>
                        <p className="font-semibold text-slate-800">{perfilGrupo?.email ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1">Telefone</p>
                        <p className="font-semibold text-slate-800">{perfilGrupo?.telefone ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1">Atividade Principal</p>
                        <p className="font-semibold text-slate-800">{perfilGrupo?.atividadePrincipal ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1">Fundação</p>
                        <p className="font-semibold text-slate-800">
                          {perfilGrupo?.fundacao ? formatDateBR(perfilGrupo.fundacao) : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1">Sede</p>
                        <p className="font-semibold text-slate-800">{perfilGrupo?.sede ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1">Consultor Responsável</p>
                        <p className="font-semibold text-slate-800">{perfilGrupo?.consultorResponsavel ?? '—'}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-sm font-bold text-slate-900">Painel Consolidado do Grupo</h3>
                      <Badge tone="emerald">Patrimônio × Participação</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                      <KpiCard
                        title="Patrimônio Total Bruto"
                        value={formatCurrency(patrimonioGrupo.patrimonioTotalBruto)}
                        subtitle="Soma de todos os sócios"
                        valueClassName="text-emerald-700"
                      />
                      <KpiCard
                        title="Patrimônio Ponderado (% Part.)"
                        value={formatCurrency(patrimonioGrupo.patrimonioPonderado)}
                        subtitle="Proporcional à participação"
                        valueClassName="text-blue-700"
                      />
                      <KpiCard
                        title="Garantia Ponderada Total"
                        value={formatCurrency(patrimonioGrupo.garantiaPonderadaTotal)}
                        subtitle="Bens elegíveis × participação"
                        valueClassName="text-purple-700"
                      />
                    </div>

                    <p className="text-xs font-bold text-slate-900 mb-2">Patrimônio por Sócio</p>
                    <div className="space-y-1.5">
                      {patrimonioGrupo.porSocio.map((s) => (
                        <div
                          key={s.socioId ?? 'grupo'}
                          className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg text-xs"
                        >
                          <span className="text-slate-700">{s.nome}</span>
                          <span className="font-semibold text-slate-800">
                            {formatCurrency(s.patrimonioPonderado)}
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 rounded-lg text-xs font-bold">
                        <span className="text-emerald-900">Total Consolidado</span>
                        <span className="text-emerald-900">{formatCurrency(patrimonioGrupo.patrimonioPonderado)}</span>
                      </div>
                    </div>
                  </Card>
                </div>
              );
            }

            // Histórico do Grupo
            return (
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-bold text-slate-900">Histórico do Grupo</h3>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Descreva a história, trajetória e contexto do grupo econômico. Este texto é utilizado na
                  Apresentação do Grupo (Slide 2) e no Parecer Executivo.
                </p>
                <Textarea
                  rows={16}
                  value={historicoDraft}
                  onChange={(e) => setHistoricoDraft(e.target.value)}
                />
                <div className="flex justify-end mt-4">
                  <Button
                    variant="primary"
                    onClick={handleSalvarHistorico}
                    className="w-auto flex items-center gap-1.5 px-4 py-2 text-xs"
                  >
                    Salvar Histórico
                  </Button>
                </div>
              </Card>
            );
          }}
        </Tabs>
      </Card>

      <SocioDrawer
        isOpen={isSocioDrawerOpen}
        onClose={() => setIsSocioDrawerOpen(false)}
        onSave={handleSaveSocio}
        editingSocio={editingSocio}
        outrosSocios={socios.filter((s) => s.id !== editingSocio?.id)}
      />

      <BemDireitoDrawer
        isOpen={isBemDrawerOpen}
        onClose={() => setIsBemDrawerOpen(false)}
        onSave={handleSaveBem}
        editingBem={editingBem}
        socios={socios}
      />

      <GarantiaDrawer
        isOpen={isGarantiaDrawerOpen}
        onClose={() => setIsGarantiaDrawerOpen(false)}
        onSave={handleSaveGarantia}
        editingGarantia={editingGarantia}
      />

      <PerfilGrupoDrawer
        isOpen={isPerfilDrawerOpen}
        onClose={() => setIsPerfilDrawerOpen(false)}
        onSave={handleSavePerfil}
        perfil={perfilGrupo}
      />
    </div>
  );
};
