'use client';

import React, { useState } from 'react';
import { Upload, Printer, RefreshCw, Plus, Edit2, Trash2 } from 'lucide-react';
import { Socio, BemDireito, Garantia, Capex, EmpresaGrupo, ContratoBancario } from '../../types';
import { Card, Tabs, Button, Badge } from '../ui';
import { SocioDrawer } from '../SocioDrawer';
import { BemDireitoDrawer } from '../BemDireitoDrawer';
import { GarantiaDrawer } from '../GarantiaDrawer';
import { CapexDrawer } from '../CapexDrawer';
import { EmpresaGrupoDrawer } from '../EmpresaGrupoDrawer';
import { saveSocio, deleteSocio } from '../../server/socios';
import { saveBemDireito, deleteBemDireito } from '../../server/bens-direitos';
import { saveGarantia, deleteGarantia } from '../../server/garantias';
import { saveCapex, deleteCapex } from '../../server/capex';
import { saveEmpresaGrupo, deleteEmpresaGrupo } from '../../server/empresas-grupo';
import { formatCurrency, formatDateBR } from '../../lib/format';

const TABS_SEM_SPEC = [{ id: 'historico', label: 'Histórico do Grupo' }];

const EmConstrucao: React.FC<{ label: string }> = ({ label }) => (
  <div className="py-16 text-center text-slate-400">
    <p className="text-sm font-semibold">{label}</p>
    <p className="text-xs mt-1">Em construção — aguardando especificação detalhada desta aba.</p>
  </div>
);

interface CadastroMestreViewProps {
  initialSocios?: Socio[];
  initialBensDireitos?: BemDireito[];
  initialGarantias?: Garantia[];
  initialCapex?: Capex[];
  initialEmpresasGrupo?: EmpresaGrupo[];
  contratosBancarios?: ContratoBancario[];
}

export const CadastroMestreView: React.FC<CadastroMestreViewProps> = ({
  initialSocios = [],
  initialBensDireitos = [],
  initialGarantias = [],
  initialCapex = [],
  initialEmpresasGrupo = [],
  contratosBancarios = []
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
  const [isCapexDrawerOpen, setIsCapexDrawerOpen] = useState(false);
  const [editingCapex, setEditingCapex] = useState<Capex | null>(null);

  const [empresasGrupo, setEmpresasGrupo] = useState<EmpresaGrupo[]>(initialEmpresasGrupo);
  const [isEmpresaDrawerOpen, setIsEmpresaDrawerOpen] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<EmpresaGrupo | null>(null);

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
        descricao: data.descricao || '',
        tipo: data.tipo || 'Outros',
        valor: data.valor || 0,
        contratoBancarioId: data.contratoBancarioId,
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

  const handleSaveCapex = async (data: Partial<Capex>) => {
    try {
      const saved = await saveCapex({
        id: data.id,
        descricao: data.descricao || '',
        categoria: data.categoria || 'Outros',
        valor: data.valor || 0,
        dataInvestimento: data.dataInvestimento || '',
        safra: data.safra,
        observacoes: data.observacoes
      });
      setCapexList((prev) => (data.id ? prev.map((c) => (c.id === saved.id ? saved : c)) : [saved, ...prev]));
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

  const handleSaveEmpresa = async (data: Partial<EmpresaGrupo>) => {
    try {
      const saved = await saveEmpresaGrupo({
        id: data.id,
        nome: data.nome || '',
        cnpj: data.cnpj,
        tipoRelacao: data.tipoRelacao || 'Outras',
        participacaoPercentual: data.participacaoPercentual,
        observacoes: data.observacoes
      });
      setEmpresasGrupo((prev) => (data.id ? prev.map((e) => (e.id === saved.id ? saved : e)) : [saved, ...prev]));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Erro ao salvar empresa.');
    }
  };

  const handleDeleteEmpresa = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover esta empresa?')) return;
    try {
      await deleteEmpresaGrupo(id);
      setEmpresasGrupo((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Erro ao remover empresa.');
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
            { id: 'grupo_economico', label: 'Grupo Econômico', badge: empresasGrupo.length },
            ...TABS_SEM_SPEC
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
                          <th className="py-3 px-4">Tipo</th>
                          <th className="py-3 px-4">Contrato Vinculado</th>
                          <th className="py-3 px-4 text-right">Valor</th>
                          <th className="py-3 px-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                        {garantias.map((garantia) => {
                          const contrato = contratosBancarios.find((c) => c.id === garantia.contratoBancarioId);
                          return (
                            <tr key={garantia.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-3 px-4 font-bold text-slate-900">{garantia.descricao}</td>
                              <td className="py-3 px-4">
                                <Badge tone="amber">{garantia.tipo}</Badge>
                              </td>
                              <td className="py-3 px-4 text-slate-600">{contrato?.banco ?? '—'}</td>
                              <td className="py-3 px-4 text-right font-semibold text-slate-800">
                                {formatCurrency(garantia.valor)}
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
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            }

            if (activeTabId === 'capex') {
              return (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900">CAPEX — Investimentos Capitalizados</h3>
                    <Button
                      variant="primary"
                      onClick={() => {
                        setEditingCapex(null);
                        setIsCapexDrawerOpen(true);
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
                          <th className="py-3 px-4">Categoria</th>
                          <th className="py-3 px-4">Data</th>
                          <th className="py-3 px-4">Safra</th>
                          <th className="py-3 px-4 text-right">Valor</th>
                          <th className="py-3 px-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                        {capexList.map((capex) => (
                          <tr key={capex.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900">{capex.descricao}</td>
                            <td className="py-3 px-4">
                              <Badge tone="blue">{capex.categoria}</Badge>
                            </td>
                            <td className="py-3 px-4 text-slate-600">{formatDateBR(capex.dataInvestimento)}</td>
                            <td className="py-3 px-4 text-slate-600">{capex.safra ?? '—'}</td>
                            <td className="py-3 px-4 text-right font-semibold text-slate-800">
                              {formatCurrency(capex.valor)}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditingCapex(capex);
                                    setIsCapexDrawerOpen(true);
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
                    </table>
                  </div>
                </div>
              );
            }

            if (activeTabId === 'grupo_economico') {
              return (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900">Grupo Econômico</h3>
                    <Button
                      variant="primary"
                      onClick={() => {
                        setEditingEmpresa(null);
                        setIsEmpresaDrawerOpen(true);
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
                          <th className="py-3 px-4">CNPJ</th>
                          <th className="py-3 px-4">Relação</th>
                          <th className="py-3 px-4 text-right">Participação</th>
                          <th className="py-3 px-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                        {empresasGrupo.map((empresa) => (
                          <tr key={empresa.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900">{empresa.nome}</td>
                            <td className="py-3 px-4 font-mono text-slate-600">{empresa.cnpj ?? '—'}</td>
                            <td className="py-3 px-4">
                              <Badge tone="emerald">{empresa.tipoRelacao}</Badge>
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-slate-800">
                              {empresa.participacaoPercentual != null ? `${empresa.participacaoPercentual}%` : '—'}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditingEmpresa(empresa);
                                    setIsEmpresaDrawerOpen(true);
                                  }}
                                  title="Editar empresa"
                                  className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteEmpresa(empresa.id)}
                                  title="Remover empresa"
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

            const tab = TABS_SEM_SPEC.find((t) => t.id === activeTabId);
            return <EmConstrucao label={tab?.label ?? ''} />;
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
        contratosBancarios={contratosBancarios}
      />

      <CapexDrawer
        isOpen={isCapexDrawerOpen}
        onClose={() => setIsCapexDrawerOpen(false)}
        onSave={handleSaveCapex}
        editingCapex={editingCapex}
      />

      <EmpresaGrupoDrawer
        isOpen={isEmpresaDrawerOpen}
        onClose={() => setIsEmpresaDrawerOpen(false)}
        onSave={handleSaveEmpresa}
        editingEmpresa={editingEmpresa}
      />
    </div>
  );
};
