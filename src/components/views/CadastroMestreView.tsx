'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Edit2, Trash2, MapPin, Building } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Socio, BemDireito, Garantia, Capex, PerfilGrupoEconomico, DividaPf } from '../../types';
import { Card, Tabs, Button, Badge, KpiCard, Textarea, Input } from '../ui';
import { IntegranteDrawer } from '../IntegranteDrawer';
import { BemDireitoDrawer } from '../BemDireitoDrawer';
import { ImovelRuralModal } from '../ImovelRuralModal';
import { ImovelUrbanoModal } from '../ImovelUrbanoModal';
import { GarantiaDrawer } from '../GarantiaDrawer';
import { DividaPfDrawer } from '../DividaPfDrawer';
import { CapexForm } from '../CapexForm';
import { PerfilGrupoDrawer } from '../PerfilGrupoDrawer';
import { OrganogramaGrupo } from '../OrganogramaGrupo';
import { saveSocio, deleteSocio } from '../../server/socios';
import { saveBemDireito, deleteBemDireito } from '../../server/bens-direitos';
import { saveGarantia, deleteGarantia } from '../../server/garantias';
import { saveDividaPf, deleteDividaPf } from '../../server/dividas-pf';
import { saveCapex, deleteCapex } from '../../server/capex';
import { savePerfilGrupo } from '../../server/perfil-grupo';
import { formatCurrency, formatDateBR } from '../../lib/format';
import { calcularPatrimonioGrupo } from '../../lib/patrimonio';

interface CadastroMestreViewProps {
  initialSocios?: Socio[];
  initialBensDireitos?: BemDireito[];
  initialGarantias?: Garantia[];
  initialDividasPf?: DividaPf[];
  initialCapex?: Capex[];
  initialPerfilGrupo?: PerfilGrupoEconomico | null;
  // Nome/Razão Social/CNPJ do grupo vêm de Conta — cadastrados pelo Admin Master na
  // criação da conta (src/server/contas.ts), nunca duplicados em PerfilGrupoEconomico.
  contaNome?: string;
  contaRazaoSocial?: string;
  contaCnpj?: string;
}

export const CadastroMestreView: React.FC<CadastroMestreViewProps> = ({
  initialSocios = [],
  initialBensDireitos = [],
  initialGarantias = [],
  initialDividasPf = [],
  initialCapex = [],
  initialPerfilGrupo = null,
  contaNome,
  contaRazaoSocial,
  contaCnpj
}) => {
  const [socios, setSocios] = useState<Socio[]>(initialSocios);
  const [isIntegranteDrawerOpen, setIsIntegranteDrawerOpen] = useState(false);
  const [editingSocio, setEditingSocio] = useState<Socio | null>(null);

  const [bensDireitos, setBensDireitos] = useState<BemDireito[]>(initialBensDireitos);
  const [isBemDrawerOpen, setIsBemDrawerOpen] = useState(false);
  const [isImovelRuralOpen, setIsImovelRuralOpen] = useState(false);
  const [isImovelUrbanoOpen, setIsImovelUrbanoOpen] = useState(false);
  const [editingBem, setEditingBem] = useState<BemDireito | null>(null);

  const [garantias, setGarantias] = useState<Garantia[]>(initialGarantias);
  const [isGarantiaDrawerOpen, setIsGarantiaDrawerOpen] = useState(false);
  const [editingGarantia, setEditingGarantia] = useState<Garantia | null>(null);

  const [dividasPf, setDividasPf] = useState<DividaPf[]>(initialDividasPf);
  const [isDividaDrawerOpen, setIsDividaDrawerOpen] = useState(false);
  const [editingDivida, setEditingDivida] = useState<DividaPf | null>(null);
  const [subAbaBens, setSubAbaBens] = useState<'bens' | 'dividas'>('bens');

  const [capexList, setCapexList] = useState<Capex[]>(initialCapex);
  const [isCapexFormOpen, setIsCapexFormOpen] = useState(false);
  const [editingCapex, setEditingCapex] = useState<Capex | null>(null);
  const [anoSelecionado, setAnoSelecionado] = useState(() => {
    const anos = initialCapex.map((c) => c.ano);
    return anos.length ? Math.max(...anos) : new Date().getFullYear();
  });

  const [perfilGrupo, setPerfilGrupo] = useState<PerfilGrupoEconomico | null>(initialPerfilGrupo);
  const [isPerfilDrawerOpen, setIsPerfilDrawerOpen] = useState(false);

  // Histórico do Grupo — 7 blocos de questionário (20/08/2026). Um draft por
  // sub-pergunta, tudo salvo de uma vez no botão "Salvar" (handleSalvarHistorico).
  const [historicoDraft, setHistoricoDraft] = useState({
    historicoInicio: initialPerfilGrupo?.historicoInicio ?? '',
    historicoHerancaOrigem: initialPerfilGrupo?.historicoHerancaOrigem ?? '',
    historicoEvolucaoNegocio: initialPerfilGrupo?.historicoEvolucaoNegocio ?? '',
    historicoGestaoCrises: initialPerfilGrupo?.historicoGestaoCrises ?? '',
    gestaoAdministracao: initialPerfilGrupo?.gestaoAdministracao ?? '',
    gestaoParceriasSocios: initialPerfilGrupo?.gestaoParceriasSocios ?? '',
    gestaoDivisaoCustosFaturamento: initialPerfilGrupo?.gestaoDivisaoCustosFaturamento ?? '',
    gestaoPlanoSucessorioHerdeiros: initialPerfilGrupo?.gestaoPlanoSucessorioHerdeiros ?? '',
    agriculturaCustos: initialPerfilGrupo?.agriculturaCustos ?? '',
    agriculturaCronogramaPlantioColheita: initialPerfilGrupo?.agriculturaCronogramaPlantioColheita ?? '',
    agriculturaCapacidadeArmazenamento: initialPerfilGrupo?.agriculturaCapacidadeArmazenamento ?? '',
    agriculturaFornecedoresClientes: initialPerfilGrupo?.agriculturaFornecedoresClientes ?? '',
    agriculturaModalidadesCompra: initialPerfilGrupo?.agriculturaModalidadesCompra ?? '',
    agriculturaExportacao: initialPerfilGrupo?.agriculturaExportacao ?? '',
    pecuariaCicloProducao: initialPerfilGrupo?.pecuariaCicloProducao ?? '',
    pecuariaConfinamento: initialPerfilGrupo?.pecuariaConfinamento ?? '',
    pecuariaTaxaDesfrutePercent: initialPerfilGrupo?.pecuariaTaxaDesfrutePercent?.toString() ?? '',
    pecuariaCustosCronogramaCompraAbate: initialPerfilGrupo?.pecuariaCustosCronogramaCompraAbate ?? '',
    financeiroFinanciamentos: initialPerfilGrupo?.financeiroFinanciamentos ?? '',
    financeiroPoliticaHedge: initialPerfilGrupo?.financeiroPoliticaHedge ?? '',
    financeiroPosicaoComercializadaSafraAtual: initialPerfilGrupo?.financeiroPosicaoComercializadaSafraAtual ?? '',
    empresasColigadas: initialPerfilGrupo?.empresasColigadas ?? '',
    missao: initialPerfilGrupo?.missao ?? '',
    visao: initialPerfilGrupo?.visao ?? '',
    valores: initialPerfilGrupo?.valores ?? ''
  });

  const setHistoricoCampo = (campo: keyof typeof historicoDraft, valor: string) =>
    setHistoricoDraft((prev) => ({ ...prev, [campo]: valor }));

  // ---- Sócios ----

  const handleSaveSocio = async (data: Partial<Socio>) => {
    try {
      const saved = await saveSocio({
        id: data.id,
        tipoPessoa: data.tipoPessoa || 'PF',
        nome: data.nome || 'Novo Integrante',
        cpf: data.cpf,
        cnpj: data.cnpj,
        cargoOuAtividade: data.cargoOuAtividade,
        participacao: data.participacao || 0,
        estadoCivil: data.estadoCivil,
        telefone: data.telefone,
        email: data.email,
        nacionalidade: data.nacionalidade,
        dataNascimento: data.dataNascimento,
        participacoes: data.participacoes
      });
      setSocios((prev) => (data.id ? prev.map((s) => (s.id === saved.id ? saved : s)) : [saved, ...prev]));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Erro ao salvar integrante.');
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

  // Calcular dados para gráficos e resumo por categoria
  const bemsOrdenados = useMemo(() => {
    const grupos: Record<string, BemDireito[]> = {};
    bensDireitos.forEach((bem) => {
      const grupo = bem.grupoIrpf || 'Outros Bens e Direitos';
      if (!grupos[grupo]) grupos[grupo] = [];
      grupos[grupo].push(bem);
    });
    return grupos;
  }, [bensDireitos]);

  const resumoPorCategoria = useMemo(() => {
    return Object.entries(bemsOrdenados).map(([categoria, bens]) => {
      const valorTotal = bens.reduce((sum, bem) => sum + (bem.valorMercadoEstimado || bem.valorDeclaradoIrpf || 0), 0);
      return {
        categoria,
        itens: bens.length,
        valor: valorTotal
      };
    }).filter(item => item.valor > 0).sort((a, b) => b.valor - a.valor);
  }, [bemsOrdenados]);

  const totalPatrimonioCategoria = useMemo(
    () => resumoPorCategoria.reduce((sum, item) => sum + item.valor, 0),
    [resumoPorCategoria]
  );

  const dadosPizza = useMemo(() => {
    const cores = ['#a3e635', '#84cc16', '#65a30d', '#4b5320', '#22c55e', '#10b981', '#14b8a6', '#06b6d4'];
    return resumoPorCategoria.map((item, idx) => ({
      name: item.categoria,
      value: parseFloat((item.valor / totalPatrimonioCategoria * 100).toFixed(1)),
      fill: cores[idx % cores.length]
    }));
  }, [resumoPorCategoria, totalPatrimonioCategoria]);

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
        observacoes: data.observacoes,
        detalheImovelRural: data.detalheImovelRural,
        detalheImovelUrbano: data.detalheImovelUrbano
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

  // Soma bruta entre moedas — a maioria das contas usa uma moeda só por garantia;
  // sem conversão de câmbio aqui (mesma simplificação assumida em outros totais do app).
  const garantiaKpis = useMemo(() => {
    const valorTotal = garantias.reduce((sum, g) => sum + g.valor, 0);
    const moedaPredominante = garantias[0]?.moeda ?? 'BRL';
    return { totalGarantias: garantias.length, valorTotal, moedaPredominante };
  }, [garantias]);

  // ---- Dívidas PF ----

  const handleSaveDivida = async (data: Partial<DividaPf>) => {
    try {
      const saved = await saveDividaPf({
        id: data.id,
        tipoDivida: data.tipoDivida || 'Financiamento',
        credor: data.credor,
        saldoDevedor: data.saldoDevedor || 0,
        parcelaMensal: data.parcelaMensal,
        vencimentoFinal: data.vencimentoFinal,
        observacoes: data.observacoes
      });
      setDividasPf((prev) => (data.id ? prev.map((d) => (d.id === saved.id ? saved : d)) : [saved, ...prev]));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Erro ao salvar dívida.');
    }
  };

  const handleDeleteDivida = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover esta dívida?')) return;
    try {
      await deleteDividaPf(id);
      setDividasPf((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Erro ao remover dívida.');
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
      const saved = await savePerfilGrupo({
        ...historicoDraft,
        pecuariaTaxaDesfrutePercent: historicoDraft.pecuariaTaxaDesfrutePercent
          ? parseFloat(historicoDraft.pecuariaTaxaDesfrutePercent)
          : undefined
      });
      setPerfilGrupo(saved);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Erro ao salvar narrativas.');
    }
  };

  return (
    <div className="space-y-6">

      <Card className="p-5">
        <Tabs
          items={[
            { id: 'socios', label: 'Sócios e Empresas', badge: socios.length },
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
                    <h3 className="text-sm font-bold text-slate-900">Sócios e Empresas</h3>
                    <Button
                      variant="primary"
                      onClick={() => {
                        setEditingSocio(null);
                        setIsIntegranteDrawerOpen(true);
                      }}
                      className="w-auto flex items-center gap-1.5 px-3.5 py-2 text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Integrante
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-600 font-bold">
                          <th className="py-3 px-4">Tipo</th>
                          <th className="py-3 px-4">Nome / Razão Social</th>
                          <th className="py-3 px-4">Documento</th>
                          <th className="py-3 px-4">Participação</th>
                          <th className="py-3 px-4">Estado Civil</th>
                          <th className="py-3 px-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                        {socios.map((socio) => (
                          <tr key={socio.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4">
                              <Badge tone={socio.tipoPessoa === 'PJ' ? 'blue' : 'emerald'}>{socio.tipoPessoa}</Badge>
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900">{socio.nome}</td>
                            <td className="py-3 px-4 font-mono text-slate-600">
                              {socio.tipoPessoa === 'PJ' ? socio.cnpj : socio.cpf}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-800">{socio.participacao}%</td>
                            <td className="py-3 px-4 text-slate-600">{socio.estadoCivil ?? '—'}</td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditingSocio(socio);
                                    setIsIntegranteDrawerOpen(true);
                                  }}
                                  title="Editar integrante"
                                  className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSocio(socio.id)}
                                  title="Remover integrante"
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
                <div className="space-y-6">
                  {/* Gráficos e Resumo — sempre visíveis, independem da sub-aba selecionada */}
                  {bensDireitos.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Gráfico de Pizza */}
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
                        <h4 className="text-sm font-bold text-slate-900 mb-4">Composição do Patrimônio</h4>
                        {dadosPizza.length > 0 ? (
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={dadosPizza}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value }) => `${name}: ${value}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {dadosPizza.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => `${value}%`} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-[300px] flex items-center justify-center text-slate-400">
                            Sem dados
                          </div>
                        )}
                      </div>

                      {/* Resumo por Categoria */}
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
                        <h4 className="text-sm font-bold text-slate-900 mb-4">Resumo por Categoria</h4>
                        <div className="space-y-2 max-h-[320px] overflow-y-auto">
                          {resumoPorCategoria.map((item) => (
                            <div key={item.categoria} className="flex items-center justify-between py-2 px-3 bg-slate-50/50 rounded-lg border border-slate-100">
                              <div>
                                <div className="text-xs font-semibold text-slate-900">{item.categoria}</div>
                                <div className="text-[11px] text-slate-600">{item.itens} {item.itens === 1 ? 'item' : 'itens'}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-bold text-emerald-700">{formatCurrency(item.valor)}</div>
                                <div className="text-[11px] text-slate-500">
                                  {((item.valor / totalPatrimonioCategoria) * 100).toFixed(1)}%
                                </div>
                              </div>
                            </div>
                          ))}
                          <div className="border-t border-slate-200 mt-3 pt-3 flex items-center justify-between font-bold">
                            <div className="text-xs text-slate-900">Total Patrimônio</div>
                            <div className="text-sm text-emerald-700">{formatCurrency(totalPatrimonioCategoria)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sub-navegação: Bens e Direitos / Dívidas PF */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSubAbaBens('bens')}
                      className={`px-3.5 py-2 rounded-lg border text-xs font-bold transition ${
                        subAbaBens === 'bens'
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      Bens e Direitos ({bensDireitos.length})
                    </button>
                    <button
                      onClick={() => setSubAbaBens('dividas')}
                      className={`px-3.5 py-2 rounded-lg border text-xs font-bold transition ${
                        subAbaBens === 'dividas'
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      Dívidas PF ({dividasPf.length})
                    </button>
                  </div>

                  {subAbaBens === 'dividas' ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-900">Dívidas PF</h3>
                        <Button
                          variant="primary"
                          onClick={() => {
                            setEditingDivida(null);
                            setIsDividaDrawerOpen(true);
                          }}
                          className="w-auto flex items-center gap-1.5 px-3.5 py-2 text-xs"
                        >
                          <Plus className="w-3.5 h-3.5" /> Nova Dívida
                        </Button>
                      </div>

                      <p className="text-xs text-slate-500 mb-4">
                        Dívidas pessoais dos sócios (não capturadas no Balanço PJ)
                      </p>

                      {dividasPf.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500 border border-dashed border-slate-200 rounded-2xl">
                          <p className="text-sm font-semibold text-slate-700">Nenhuma dívida PF cadastrada</p>
                          <p className="text-xs text-slate-500 mt-1">
                            Financiamentos, cartões, empréstimos pessoais e crédito rural PF
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-600 font-bold">
                                <th className="py-3 px-4">Tipo</th>
                                <th className="py-3 px-4">Credor</th>
                                <th className="py-3 px-4 text-right">Saldo Devedor</th>
                                <th className="py-3 px-4 text-right">Parcela Mensal</th>
                                <th className="py-3 px-4">Vencimento Final</th>
                                <th className="py-3 px-4 text-right">Ações</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                              {dividasPf.map((divida) => (
                                <tr key={divida.id} className="hover:bg-slate-50/60 transition-colors">
                                  <td className="py-3 px-4">
                                    <Badge tone="amber">{divida.tipoDivida}</Badge>
                                  </td>
                                  <td className="py-3 px-4 font-bold text-slate-900">{divida.credor ?? '—'}</td>
                                  <td className="py-3 px-4 text-right font-semibold text-slate-800">
                                    {formatCurrency(divida.saldoDevedor)}
                                  </td>
                                  <td className="py-3 px-4 text-right text-slate-600">
                                    {divida.parcelaMensal != null ? formatCurrency(divida.parcelaMensal) : '—'}
                                  </td>
                                  <td className="py-3 px-4 text-slate-600">
                                    {divida.vencimentoFinal ? formatDateBR(divida.vencimentoFinal) : '—'}
                                  </td>
                                  <td className="py-3 px-4 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => {
                                          setEditingDivida(divida);
                                          setIsDividaDrawerOpen(true);
                                        }}
                                        title="Editar dívida"
                                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteDivida(divida.id)}
                                        title="Remover dívida"
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
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Listagem de Bens Agrupada */}
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                          <h3 className="text-sm font-bold text-slate-900">Bens e Direitos</h3>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              variant="secondary"
                              onClick={() => {
                                setEditingBem(null);
                                setIsImovelRuralOpen(true);
                              }}
                              className="w-auto flex items-center gap-1.5 px-3.5 py-2 text-xs"
                            >
                              <MapPin className="w-3.5 h-3.5" /> Imóvel Rural (ANEXO A)
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() => {
                                setEditingBem(null);
                                setIsImovelUrbanoOpen(true);
                              }}
                              className="w-auto flex items-center gap-1.5 px-3.5 py-2 text-xs"
                            >
                              <Building className="w-3.5 h-3.5" /> Imóvel Urbano (ANEXO B)
                            </Button>
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
                        </div>

                        <div className="space-y-4">
                          {Object.entries(bemsOrdenados).map(([grupo, bens]) => {
                            const subtotalGrupo = bens.reduce((sum, bem) => sum + (bem.valorMercadoEstimado || bem.valorDeclaradoIrpf || 0), 0);
                            if (subtotalGrupo === 0) return null;

                            return (
                              <div key={grupo} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                                {/* Header do Grupo */}
                                <div className="bg-slate-50/80 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
                                  <div>
                                    <h4 className="text-sm font-bold text-slate-900">{grupo}</h4>
                                    <p className="text-xs text-slate-600 mt-0.5">{bens.length} {bens.length === 1 ? 'bem' : 'bens'}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-bold text-emerald-700">{formatCurrency(subtotalGrupo)}</p>
                                  </div>
                                </div>

                                {/* Tabela do Grupo — ANEXO A/B têm colunas próprias e editam via modal específico */}
                                <div className="overflow-x-auto">
                                  {grupo === 'Imóveis Rurais - ANEXO A' ? (
                                    <table className="w-full text-left border-collapse">
                                      <thead>
                                        <tr className="bg-white border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                                          <th className="py-2.5 px-4">Denominação do Imóvel</th>
                                          <th className="py-2.5 px-4">Município/UF</th>
                                          <th className="py-2.5 px-4">Matrícula</th>
                                          <th className="py-2.5 px-4 text-right">Área (ha)</th>
                                          <th className="py-2.5 px-4 text-right">Área Plantada (ha)</th>
                                          <th className="py-2.5 px-4 text-right">R$/ha</th>
                                          <th className="py-2.5 px-4 text-right">Valor de Mercado Total</th>
                                          <th className="py-2.5 px-4">Situação/Credor</th>
                                          <th className="py-2.5 px-4 text-right">Ações</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                                        {bens.map((bem) => (
                                          <tr key={bem.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="py-3 px-4 font-bold text-slate-900">
                                              {bem.detalheImovelRural?.denominacaoImovel ?? bem.descricao}
                                            </td>
                                            <td className="py-3 px-4 text-slate-600">{bem.detalheImovelRural?.municipioUf ?? '—'}</td>
                                            <td className="py-3 px-4 text-slate-600">{bem.detalheImovelRural?.matricula ?? '—'}</td>
                                            <td className="py-3 px-4 text-right text-slate-700">
                                              {bem.detalheImovelRural?.areaHa.toLocaleString('pt-BR') ?? '—'}
                                            </td>
                                            <td className="py-3 px-4 text-right text-slate-700">
                                              {bem.detalheImovelRural?.areaPropriaPlantadaHa?.toLocaleString('pt-BR') ?? '—'}
                                            </td>
                                            <td className="py-3 px-4 text-right text-slate-700">
                                              {bem.detalheImovelRural?.valorMercadoHa != null
                                                ? formatCurrency(bem.detalheImovelRural.valorMercadoHa)
                                                : '—'}
                                            </td>
                                            <td className="py-3 px-4 text-right font-bold text-emerald-700">
                                              {bem.valorMercadoEstimado != null ? formatCurrency(bem.valorMercadoEstimado) : '—'}
                                            </td>
                                            <td className="py-3 px-4 text-slate-600">{bem.detalheImovelRural?.situacaoCredor ?? '—'}</td>
                                            <td className="py-3 px-4 text-right whitespace-nowrap">
                                              <div className="flex items-center justify-end gap-2">
                                                <button
                                                  onClick={() => {
                                                    setEditingBem(bem);
                                                    setIsImovelRuralOpen(true);
                                                  }}
                                                  title="Editar imóvel rural"
                                                  className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                                                >
                                                  <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                  onClick={() => handleDeleteBem(bem.id)}
                                                  title="Remover imóvel"
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
                                  ) : grupo === 'Imóveis Urbanos - ANEXO B' ? (
                                    <table className="w-full text-left border-collapse">
                                      <thead>
                                        <tr className="bg-white border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                                          <th className="py-2.5 px-4">Descrição</th>
                                          <th className="py-2.5 px-4">Matrícula</th>
                                          <th className="py-2.5 px-4">Cidade</th>
                                          <th className="py-2.5 px-4 text-right">Valor Atual</th>
                                          <th className="py-2.5 px-4 text-right">Ações</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                                        {bens.map((bem) => (
                                          <tr key={bem.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="py-3 px-4 font-bold text-slate-900">
                                              {bem.detalheImovelUrbano?.descricao ?? bem.descricao}
                                            </td>
                                            <td className="py-3 px-4 text-slate-600">{bem.detalheImovelUrbano?.matricula ?? '—'}</td>
                                            <td className="py-3 px-4 text-slate-600">{bem.detalheImovelUrbano?.cidade ?? '—'}</td>
                                            <td className="py-3 px-4 text-right font-bold text-emerald-700">
                                              {bem.valorMercadoEstimado != null ? formatCurrency(bem.valorMercadoEstimado) : '—'}
                                            </td>
                                            <td className="py-3 px-4 text-right whitespace-nowrap">
                                              <div className="flex items-center justify-end gap-2">
                                                <button
                                                  onClick={() => {
                                                    setEditingBem(bem);
                                                    setIsImovelUrbanoOpen(true);
                                                  }}
                                                  title="Editar imóvel urbano"
                                                  className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                                                >
                                                  <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                  onClick={() => handleDeleteBem(bem.id)}
                                                  title="Remover imóvel"
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
                                  ) : (
                                    <table className="w-full text-left border-collapse">
                                      <thead>
                                        <tr className="bg-white border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                                          <th className="py-2.5 px-4">Descrição</th>
                                          <th className="py-2.5 px-4">Sócio Titular</th>
                                          <th className="py-2.5 px-4">Código / Tipo</th>
                                          <th className="py-2.5 px-4">Liquidez</th>
                                          <th className="py-2.5 px-4 text-right">Valor Declarado IRPF</th>
                                          <th className="py-2.5 px-4 text-right">Valor de Mercado</th>
                                          <th className="py-2.5 px-4 text-right">Ações</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                                        {bens.map((bem) => (
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
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {/* Total Geral */}
                          {bensDireitos.length > 0 && (
                            <div className="bg-emerald-50/50 rounded-2xl border border-emerald-200 shadow-xs p-5">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-emerald-900">Total de Bens e Direitos</h4>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-emerald-700">{formatCurrency(totalPatrimonioCategoria)}</p>
                                  <p className="text-xs text-emerald-600 mt-1">{bensDireitos.length} {bensDireitos.length === 1 ? 'bem' : 'bens'}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {bensDireitos.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                          <p className="text-sm mb-4">Nenhum bem cadastrado</p>
                          <Button
                            variant="primary"
                            onClick={() => {
                              setEditingBem(null);
                              setIsBemDrawerOpen(true);
                            }}
                            className="w-auto flex items-center gap-1.5 px-3.5 py-2 text-xs"
                          >
                            <Plus className="w-3.5 h-3.5" /> Adicionar Bem
                          </Button>
                        </div>
                      )}
                    </>
                  )}
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <KpiCard
                      title="Total de Garantias"
                      value={`${garantiaKpis.totalGarantias} ${garantiaKpis.totalGarantias === 1 ? 'item' : 'itens'}`}
                      valueClassName="text-emerald-700"
                    />
                    <KpiCard
                      title="Valor Total"
                      value={formatCurrency(garantiaKpis.valorTotal, garantiaKpis.moedaPredominante)}
                      valueClassName="text-blue-700"
                    />
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
                        <p className="font-bold text-slate-900">{contaNome ?? '—'}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Cadastrado pelo Admin Master</p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1">Razão Social</p>
                        <p className="font-semibold text-slate-800">{contaRazaoSocial ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1">CNPJ</p>
                        <p className="font-semibold text-slate-800 font-mono">{contaCnpj ?? '—'}</p>
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
                    <h3 className="text-sm font-bold text-slate-900 mb-4">Organograma Societário</h3>
                    <OrganogramaGrupo socios={socios} />
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

            // Histórico do Grupo — 7 blocos de questionário (reestruturado em 20/08/2026)
            type CampoHistorico = keyof typeof historicoDraft;
            const BLOCOS_HISTORICO: {
              titulo: string;
              descricao?: string;
              campos: { campo: CampoHistorico; label: string; rows?: number }[];
            }[] = [
              {
                titulo: '1. Histórico',
                descricao:
                  'Este texto é utilizado na Apresentação do Grupo (Slide 2) e no Parecer Executivo.',
                campos: [
                  { campo: 'historicoInicio', label: 'Início' },
                  { campo: 'historicoHerancaOrigem', label: 'Herança/Origem' },
                  { campo: 'historicoEvolucaoNegocio', label: 'Evolução do negócio' },
                  { campo: 'historicoGestaoCrises', label: 'Gestão de crises climáticas/financeiras' }
                ]
              },
              {
                titulo: '2. Gestão — Sucessão',
                campos: [
                  { campo: 'gestaoAdministracao', label: 'Administração' },
                  { campo: 'gestaoParceriasSocios', label: 'Parcerias/Sócios' },
                  { campo: 'gestaoDivisaoCustosFaturamento', label: 'Divisão de custos/faturamento' },
                  { campo: 'gestaoPlanoSucessorioHerdeiros', label: 'Plano sucessório/Herdeiros' }
                ]
              },
              {
                titulo: '3. Modus Operandi — Agricultura',
                campos: [
                  { campo: 'agriculturaCustos', label: 'Custos' },
                  { campo: 'agriculturaCronogramaPlantioColheita', label: 'Cronogramas de plantio/colheita' },
                  { campo: 'agriculturaCapacidadeArmazenamento', label: 'Capacidade de Armazenamento estático' },
                  { campo: 'agriculturaFornecedoresClientes', label: 'Fornecedores/Clientes' },
                  { campo: 'agriculturaModalidadesCompra', label: 'Modalidades de compra' },
                  { campo: 'agriculturaExportacao', label: 'Exportação' }
                ]
              },
              {
                titulo: '4. Modus Operandi — Pecuária',
                campos: [
                  { campo: 'pecuariaCicloProducao', label: 'Ciclo de produção' },
                  { campo: 'pecuariaConfinamento', label: 'Confinamento' },
                  { campo: 'pecuariaCustosCronogramaCompraAbate', label: 'Custos e Cronograma de compra/abate' }
                ]
              },
              {
                titulo: '5. Gestão Financeira',
                campos: [
                  { campo: 'financeiroFinanciamentos', label: 'Financiamentos' },
                  { campo: 'financeiroPoliticaHedge', label: 'Política de Hedge para commodities e câmbio' },
                  { campo: 'financeiroPosicaoComercializadaSafraAtual', label: 'Posição comercializada da safra atual' }
                ]
              },
              {
                titulo: '6. Outras Atividades / Empresas Coligadas',
                campos: [{ campo: 'empresasColigadas', label: 'Empresas Coligadas', rows: 8 }]
              }
            ];

            return (
              <Card className="p-5">
                <div className="space-y-8">
                  {BLOCOS_HISTORICO.map((bloco, i) => (
                    <div key={bloco.titulo} className={i === 0 ? '' : 'border-t border-slate-200 pt-6'}>
                      <h4 className="text-sm font-bold text-slate-900 mb-1.5">{bloco.titulo}</h4>
                      {bloco.descricao && <p className="text-xs text-slate-500 mb-3">{bloco.descricao}</p>}
                      <div className="space-y-4">
                        {bloco.campos.map(({ campo, label, rows }) => (
                          <Textarea
                            key={campo}
                            label={label}
                            rows={rows ?? 4}
                            value={historicoDraft[campo]}
                            onChange={(e) => setHistoricoCampo(campo, e.target.value)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* 4. campo numérico — taxa de desfrute (único número do bloco Pecuária) */}
                  <div className="border-t border-slate-200 pt-6 -mt-4">
                    <Input
                      label="Taxa de desfrute (%)"
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={historicoDraft.pecuariaTaxaDesfrutePercent}
                      onChange={(e) => setHistoricoCampo('pecuariaTaxaDesfrutePercent', e.target.value)}
                      hint="Percentual de animais abatidos/comercializados sobre o rebanho total — bloco 4, Pecuária."
                    />
                  </div>

                  {/* 7. Missão, Visão e Valores — destacado do restante do formulário */}
                  <div className="border-t border-slate-200 pt-6">
                    <h4 className="text-sm font-bold text-slate-900 mb-3">7. Missão, Visão e Valores</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(
                        [
                          { campo: 'missao' as const, label: 'Missão', tone: 'from-emerald-50 to-emerald-100/40 border-emerald-200' },
                          { campo: 'visao' as const, label: 'Visão', tone: 'from-blue-50 to-blue-100/40 border-blue-200' },
                          { campo: 'valores' as const, label: 'Valores', tone: 'from-amber-50 to-amber-100/40 border-amber-200' }
                        ]
                      ).map(({ campo, label, tone }) => (
                        <div key={campo} className={`rounded-2xl border bg-gradient-to-br ${tone} p-4`}>
                          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-700 mb-2">{label}</p>
                          <Textarea
                            rows={6}
                            value={historicoDraft[campo]}
                            onChange={(e) => setHistoricoCampo(campo, e.target.value)}
                            className="bg-white/70"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6 pt-4 border-t border-slate-200">
                  <Button
                    variant="primary"
                    onClick={handleSalvarHistorico}
                    className="w-auto flex items-center gap-1.5 px-4 py-2 text-xs"
                  >
                    Salvar
                  </Button>
                </div>
              </Card>
            );
          }}
        </Tabs>
      </Card>

      <IntegranteDrawer
        isOpen={isIntegranteDrawerOpen}
        onClose={() => setIsIntegranteDrawerOpen(false)}
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

      <ImovelRuralModal
        isOpen={isImovelRuralOpen}
        onClose={() => setIsImovelRuralOpen(false)}
        onSave={handleSaveBem}
        editingBem={editingBem}
        socios={socios}
      />

      <ImovelUrbanoModal
        isOpen={isImovelUrbanoOpen}
        onClose={() => setIsImovelUrbanoOpen(false)}
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

      <DividaPfDrawer
        isOpen={isDividaDrawerOpen}
        onClose={() => setIsDividaDrawerOpen(false)}
        onSave={handleSaveDivida}
        editingDivida={editingDivida}
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
