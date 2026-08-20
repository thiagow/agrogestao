'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  ActiveTab,
  Supplier,
  Socio,
  BemDireito,
  Garantia,
  DividaPf,
  Capex,
  PerfilGrupoEconomico,
  CulturaSafraAno,
  Cultura,
  ContratoBancario,
  Aquisicao,
  ContratoArrendamento,
  ContratoComercial,
  LancamentoMensal,
  BalancoPatrimonial,
  Cotacao,
  ItemFluxoManual
} from '../types';
import { saveSupplier, deleteSupplier } from '../server/suppliers';
import { saveQuadroSafra, deleteQuadroSafra } from '../server/quadro-safra';
import { saveCultura, deleteCultura } from '../server/culturas';
import { saveContratoBancario, deleteContratoBancario } from '../server/contratos-bancarios';
import { saveAquisicao, deleteAquisicao } from '../server/aquisicoes';
import { saveArrendamento, deleteArrendamento } from '../server/arrendamentos';
import { saveContratoComercial, deleteContratoComercial } from '../server/contratos-comerciais';
import { saveBalanco } from '../server/balanco';
import { saveItemFluxoManual, deleteItemFluxoManual } from '../server/fluxo-safra';
import { initialSaudeFinanceira, initialCalendarioAgricola } from '../data/initialData';
import { Header } from './Header';
import { MetricCards } from './MetricCards';
import { SupplierTable } from './SupplierTable';
import { SupplierDrawer } from './SupplierDrawer';
import { Button } from './ui';
import { ResumoView } from './views/ResumoView';
import { BancosView } from './views/BancosView';
import type { CronogramaConsolidado, FluxoDetalhado } from '../server/contratos-bancarios';
import type { LinhaFluxoConsolidado, ImpactoSafra } from '../server/aquisicoes';
import type { LinhaFluxoConsolidadoArrendamento, ImpactoSafraArrendamento } from '../server/arrendamentos';
import type { IndicesVigentes } from '../lib/taxa-efetiva';
import { QuadroSafraView } from './views/QuadroSafraView';
import { CotacoesView } from './views/CotacoesView';
import { CadastroMestreView } from './views/CadastroMestreView';
import { AnaliseFinanceiraView } from './views/AnaliseFinanceiraView';
import { AquisicaoFazendaView } from './views/AquisicaoFazendaView';
import { ArrendamentosView } from './views/ArrendamentosView';
import { ComercializacaoView } from './views/ComercializacaoView';
import { FluxoSafraView } from './views/FluxoSafraView';
import { FluxoMensalView } from './views/FluxoMensalView';
import { ApresentacaoGrupoView } from './views/ApresentacaoGrupoView';
import { GenericView } from './views/GenericView';

interface TabViewProps {
  tab: ActiveTab;
  initialSuppliers?: Supplier[];
  initialSocios?: Socio[];
  initialBensDireitos?: BemDireito[];
  initialGarantias?: Garantia[];
  initialDividasPf?: DividaPf[];
  initialCapex?: Capex[];
  initialPerfilGrupo?: PerfilGrupoEconomico | null;
  contaNome?: string;
  contaRazaoSocial?: string;
  contaCnpj?: string;
  initialCulturas?: Cultura[];
  initialCulturaSafras?: CulturaSafraAno[];
  initialLancamentosMensais?: LancamentoMensal[];
  initialContratosBancarios?: ContratoBancario[];
  /** Projeção consolidada por ano da aba Cronograma — computada no servidor. */
  cronogramaConsolidado?: CronogramaConsolidado;
  /** CDI/IPCA/dólar vigentes, usados no cálculo de juros dos contratos indexados. */
  indices?: IndicesVigentes;
  /** Fluxo período a período por contrato da aba Fluxo Detalhado — computado no servidor. */
  fluxoDetalhado?: FluxoDetalhado;
  initialAquisicoes?: Aquisicao[];
  /** Aba "Fluxo por Safra" de Aquisição Fazenda — computada no servidor. */
  fluxoConsolidadoAquisicoes?: LinhaFluxoConsolidado[];
  /** Aba "Análise de Impacto" de Aquisição Fazenda — computada no servidor. */
  impactoPorSafraAquisicoes?: ImpactoSafra[];
  initialArrendamentos?: ContratoArrendamento[];
  /** Aba "Fluxo por Safra" de Arrendamentos — computada no servidor. */
  fluxoConsolidadoArrendamentos?: LinhaFluxoConsolidadoArrendamento[];
  /** Aba "Análise de Impacto" de Arrendamentos — computada no servidor. */
  impactoPorSafraArrendamentos?: ImpactoSafraArrendamento[];
  initialContratosComerciais?: ContratoComercial[];
  initialBalanco?: BalancoPatrimonial | null;
  initialCotacaoDolar?: Cotacao | null;
  initialCotacoesCommodities?: Cotacao[];
  /** Itens manuais extraordinários do Fluxo de Safra — persistidos via src/server/fluxo-safra.ts. */
  initialItensFluxoManual?: ItemFluxoManual[];
}

export const TabView: React.FC<TabViewProps> = ({
  tab,
  initialSuppliers = [],
  initialSocios = [],
  initialBensDireitos = [],
  initialGarantias = [],
  initialDividasPf = [],
  initialCapex = [],
  initialPerfilGrupo = null,
  contaNome,
  contaRazaoSocial,
  contaCnpj,
  initialCulturas = [],
  initialCulturaSafras = [],
  initialLancamentosMensais = [],
  initialContratosBancarios = [],
  cronogramaConsolidado,
  indices,
  fluxoDetalhado,
  initialAquisicoes = [],
  fluxoConsolidadoAquisicoes = [],
  impactoPorSafraAquisicoes = [],
  initialArrendamentos = [],
  fluxoConsolidadoArrendamentos = [],
  impactoPorSafraArrendamentos = [],
  initialContratosComerciais = [],
  initialBalanco = null,
  initialCotacaoDolar = null,
  initialCotacoesCommodities = [],
  initialItensFluxoManual = []
}) => {
  // Fornecedores — persistido via src/server/suppliers.ts
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Culturas — persistido via src/server/culturas.ts (catálogo padrão + personalizadas)
  const [culturas, setCulturas] = useState<Cultura[]>(initialCulturas);

  // Quadro de Safra (usado também no Resumo) — persistido via src/server/quadro-safra.ts
  const [culturaSafras, setCulturaSafras] = useState<CulturaSafraAno[]>(initialCulturaSafras);

  // Bancos (usado também no Resumo e Fluxo de Safra) — persistido via src/server/contratos-bancarios.ts
  const [contratosBancarios, setContratosBancarios] = useState<ContratoBancario[]>(initialContratosBancarios);

  // Aquisição de Fazendas — persistido via src/server/aquisicoes.ts
  const [aquisicoes, setAquisicoes] = useState<Aquisicao[]>(initialAquisicoes);

  // Arrendamentos — persistido via src/server/arrendamentos.ts
  const [arrendamentos, setArrendamentos] = useState<ContratoArrendamento[]>(initialArrendamentos);

  // Comercialização — persistido via src/server/contratos-comerciais.ts
  const [contratosComerciais, setContratosComerciais] = useState<ContratoComercial[]>(initialContratosComerciais);

  // Análise Financeira — persistido via src/server/balanco.ts (indicadores computados ao vivo)
  const [balanco, setBalanco] = useState<BalancoPatrimonial | null>(initialBalanco);

  // Fluxo de Safra — itens manuais extraordinários, persistido via src/server/fluxo-safra.ts
  // (o demonstrativo em si é agregado no client, ver src/lib/fluxo-safra-calc.ts)
  const [itensFluxoManual, setItensFluxoManual] = useState<ItemFluxoManual[]>(initialItensFluxoManual);

  const handleSaveSupplier = async (supplierData: Partial<Supplier>) => {
    try {
      const saved = await saveSupplier({
        id: supplierData.id,
        nome: supplierData.nome || 'Novo Fornecedor',
        categoria: supplierData.categoria || 'FERTILIZANTES',
        cultura: supplierData.cultura || '—',
        safra: supplierData.safra || '—',
        dividaTotal: supplierData.dividaTotal || 0,
        moeda: supplierData.moeda || 'BRL',
        vencimento: supplierData.vencimento || new Date().toISOString().split('T')[0],
        status: supplierData.status || 'PENDENTE',
        observacoes: supplierData.observacoes || ''
      });
      setSuppliers((prev) =>
        supplierData.id ? prev.map((s) => (s.id === saved.id ? saved : s)) : [saved, ...prev]
      );
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Erro ao salvar fornecedor.');
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este fornecedor?')) return;
    try {
      await deleteSupplier(id);
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Erro ao excluir fornecedor.');
    }
  };

  const handleOpenEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsDrawerOpen(true);
  };

  const handleOpenNewSupplier = () => {
    setEditingSupplier(null);
    setIsDrawerOpen(true);
  };

  const handleSaveCultura = async (input: { nome: string; unidadeMedida: string }): Promise<Cultura> => {
    try {
      const saved = await saveCultura(input);
      setCulturas((prev) => [...prev, saved]);
      return saved;
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteCultura = async (id: string) => {
    try {
      await deleteCultura(id);
      setCulturas((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      throw err;
    }
  };

  const handleSaveSafra = async (data: Partial<CulturaSafraAno>) => {
    try {
      const saved = await saveQuadroSafra({
        id: data.id,
        cultura: data.cultura || '',
        anoSafra: data.anoSafra || '',
        hectares: data.hectares || 0,
        haPropria: data.haPropria || 0,
        haArrendada: data.haArrendada || 0,
        rendimento: data.rendimento || 0,
        unidadeProducao: data.unidadeProducao || 'sc',
        precoMedio: data.precoMedio || 0,
        custoProducao: data.custoProducao || 0,
        producaoFixadaPercent: data.producaoFixadaPercent
      });
      setCulturaSafras((prev) => (data.id ? prev.map((s) => (s.id === saved.id ? saved : s)) : [saved, ...prev]));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Erro ao salvar safra.');
    }
  };

  const handleDeleteSafra = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este registro de safra?')) return;
    try {
      await deleteQuadroSafra(id);
      setCulturaSafras((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Erro ao excluir safra.');
    }
  };

  const handleSaveContrato = async (data: Partial<ContratoBancario>) => {
    try {
      const saved = await saveContratoBancario({
        id: data.id,
        banco: data.banco || '',
        nomeTomador: data.nomeTomador,
        numeroContrato: data.numeroContrato,
        tipoOperacao: data.tipoOperacao || 'CUSTEIO AGRICOLA',
        safraVinculadaId: data.safraVinculadaId,
        culturaVinculadaId: data.culturaVinculadaId,
        saldoInicial: data.saldoInicial || 0,
        saldoAtual: data.saldoAtual || data.saldoInicial || 0,
        taxaJuros: data.taxaJuros || 0,
        tipoTaxa: data.tipoTaxa || 'Pré-fixado (% a.a.)',
        baseCalculo: data.baseCalculo || '360 dias corridos',
        capitalizacao: data.capitalizacao || 'Composta',
        dataContratacao: data.dataContratacao || new Date().toISOString().split('T')[0],
        inicioPagamento: data.inicioPagamento,
        dataVencimento: data.dataVencimento || new Date().toISOString().split('T')[0],
        sistemaAmortizacao: data.sistemaAmortizacao || 'SAC',
        periodicidadePrincipal: data.periodicidadePrincipal || 'Mensal',
        periodicidadeJuros: data.periodicidadeJuros || 'Mensal',
        possuiCarencia: data.possuiCarencia || false,
        tipoGarantia: data.tipoGarantia,
        valorGarantia: data.valorGarantia,
        moeda: data.moeda || 'BRL',
        ptaxInicial: data.ptaxInicial,
        observacoes: data.observacoes
      });
      setContratosBancarios((prev) =>
        data.id ? prev.map((c) => (c.id === saved.id ? saved : c)) : [saved, ...prev]
      );
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Erro ao salvar contrato.');
    }
  };

  const handleDeleteContrato = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este contrato?')) return;
    try {
      await deleteContratoBancario(id);
      setContratosBancarios((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Erro ao excluir contrato.');
    }
  };

  const handleSaveAquisicao = async (data: Partial<Aquisicao>) => {
    try {
      const saved = await saveAquisicao({
        id: data.id,
        nomeFazenda: data.nomeFazenda || '',
        vendedor: data.vendedor,
        denominacaoImovel: data.denominacaoImovel,
        comarca: data.comarca,
        numeroMatricula: data.numeroMatricula,
        estado: data.estado || '',
        municipio: data.municipio || '',
        areaTotalHa: data.areaTotalHa || 0,
        areaAgricolaHa: data.areaAgricolaHa || 0,
        dataAquisicao: data.dataAquisicao || new Date().toISOString().split('T')[0],
        dataInicioPagamento: data.dataInicioPagamento || new Date().toISOString().split('T')[0],
        dataVencimento: data.dataVencimento || new Date().toISOString().split('T')[0],
        prazoFinanciamentoMeses: data.prazoFinanciamentoMeses,
        tipoPagamento: data.tipoPagamento || 'SACAS',
        periodicidade: data.periodicidade || 'Anual',
        culturaReferenciaId: data.culturaReferenciaId,
        sacasHa: data.sacasHa,
        precoReferencia: data.precoReferencia,
        precoHa: data.precoHa,
        valorTotalManual: data.valorTotalManual,
        valorFinanciado: data.valorFinanciado,
        taxaJurosAA: data.taxaJurosAA,
        valorEntrada: data.valorEntrada,
        safraEntrada: data.safraEntrada
      });
      setAquisicoes((prev) => (data.id ? prev.map((a) => (a.id === saved.id ? saved : a)) : [saved, ...prev]));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Erro ao salvar aquisição.');
    }
  };

  const handleDeleteAquisicao = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta aquisição?')) return;
    try {
      await deleteAquisicao(id);
      setAquisicoes((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Erro ao excluir aquisição.');
    }
  };

  const handleSaveArrendamento = async (data: Partial<ContratoArrendamento>) => {
    try {
      const saved = await saveArrendamento({
        id: data.id,
        nomeFazenda: data.nomeFazenda || '',
        proprietario: data.proprietario,
        denominacaoImovel: data.denominacaoImovel,
        municipio: data.municipio,
        comarca: data.comarca,
        numeroMatricula: data.numeroMatricula,
        areaTotalHa: data.areaTotalHa,
        areaArrendadaHa: data.areaArrendadaHa || 0,
        dataInicio: data.dataInicio || new Date().toISOString().split('T')[0],
        dataVencimento: data.dataVencimento || '',
        culturaReferenciaId: data.culturaReferenciaId,
        tipoPagamento: data.tipoPagamento || 'SACAS',
        periodicidade: data.periodicidade || 'Anual',
        sacasHa: data.sacasHa,
        precoReferencia: data.precoReferencia,
        precoHa: data.precoHa,
        valorTotalManual: data.valorTotalManual,
        possuiPagamentoAntecipado: data.possuiPagamentoAntecipado ?? false,
        valorAntecipado: data.valorAntecipado,
        dataPagamentoAntecipado: data.dataPagamentoAntecipado,
        safraReferenciaAntecipacao: data.safraReferenciaAntecipacao,
        observacoes: data.observacoes,
        status: data.status || 'ATIVO'
      });
      setArrendamentos((prev) => (data.id ? prev.map((a) => (a.id === saved.id ? saved : a)) : [saved, ...prev]));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Erro ao salvar arrendamento.');
    }
  };

  const handleDeleteArrendamento = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este contrato de arrendamento?')) return;
    try {
      await deleteArrendamento(id);
      setArrendamentos((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Erro ao excluir arrendamento.');
    }
  };

  const handleSaveContratoComercial = async (data: Partial<ContratoComercial>) => {
    try {
      const saved = await saveContratoComercial({
        id: data.id,
        cultura: data.cultura || '',
        safra: data.safra || '',
        quantidadeSc: data.quantidadeSc || 0,
        precoFixado: data.precoFixado || 0,
        tipoContrato: data.tipoContrato || 'FUTURO',
        dataContrato: data.dataContrato || new Date().toISOString().split('T')[0],
        dataVencimento: data.dataVencimento || '',
        status: data.status || 'ATIVO',
        compradorNome: data.compradorNome,
        cambioUsd: data.cambioUsd,
        dataLiquidacaoFinanceira: data.dataLiquidacaoFinanceira,
        observacoes: data.observacoes
      });
      setContratosComerciais((prev) =>
        data.id ? prev.map((c) => (c.id === saved.id ? saved : c)) : [saved, ...prev]
      );
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Erro ao salvar contrato comercial.');
    }
  };

  const handleDeleteContratoComercial = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este contrato comercial?')) return;
    try {
      await deleteContratoComercial(id);
      setContratosComerciais((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Erro ao excluir contrato comercial.');
    }
  };

  const handleSaveBalanco = async (data: BalancoPatrimonial) => {
    try {
      const saved = await saveBalanco(data);
      setBalanco(saved);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Erro ao salvar balanço.');
    }
  };

  const handleSaveItemFluxoManual = async (data: Partial<ItemFluxoManual>) => {
    try {
      const saved = await saveItemFluxoManual({
        id: data.id,
        safra: data.safra || '',
        categoria: data.categoria || 'OUTRAS_SAIDAS',
        descricao: data.descricao || '',
        valor: data.valor || 0,
        observacoes: data.observacoes
      });
      setItensFluxoManual((prev) => (data.id ? prev.map((i) => (i.id === saved.id ? saved : i)) : [...prev, saved]));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Erro ao salvar item do fluxo.');
    }
  };

  const handleDeleteItemFluxoManual = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este item?')) return;
    try {
      await deleteItemFluxoManual(id);
      setItensFluxoManual((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Erro ao excluir item do fluxo.');
    }
  };

  return (
    <>
      <Header
        tab={tab}
        actions={
          tab === 'fornecedores' ? (
            <Button
              variant="primary"
              onClick={handleOpenNewSupplier}
              className="w-auto flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Novo Fornecedor</span>
            </Button>
          ) : null
        }
      />

      {tab === 'fornecedores' && (
        <>
          <MetricCards suppliers={suppliers} />
          <SupplierTable
            suppliers={suppliers}
            onEditSupplier={handleOpenEditSupplier}
            onDeleteSupplier={handleDeleteSupplier}
          />
          <SupplierDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            onSave={handleSaveSupplier}
            editingSupplier={editingSupplier}
          />
        </>
      )}

      {tab === 'resumo' && (
        <ResumoView
          suppliers={suppliers}
          culturaSafras={culturaSafras}
          contratosBancarios={contratosBancarios}
          aquisicoes={aquisicoes}
          arrendamentos={arrendamentos}
        />
      )}
      {tab === 'cadastro_mestre' && (
        <CadastroMestreView
          initialSocios={initialSocios}
          initialBensDireitos={initialBensDireitos}
          initialGarantias={initialGarantias}
          initialDividasPf={initialDividasPf}
          initialCapex={initialCapex}
          initialPerfilGrupo={initialPerfilGrupo}
          contaNome={contaNome}
          contaRazaoSocial={contaRazaoSocial}
          contaCnpj={contaCnpj}
        />
      )}
      {tab === 'quadro_safra' && (
        <QuadroSafraView
          culturaSafras={culturaSafras}
          culturas={culturas}
          onSave={handleSaveSafra}
          onDelete={handleDeleteSafra}
          onSaveCultura={handleSaveCultura}
          onDeleteCultura={handleDeleteCultura}
        />
      )}
      {tab === 'bancos' && (
        <BancosView
          contratos={contratosBancarios}
          cronograma={cronogramaConsolidado}
          indices={indices}
          fluxoDetalhado={fluxoDetalhado}
          onSave={handleSaveContrato}
          onDelete={handleDeleteContrato}
        />
      )}
      {tab === 'aquisicao_fazenda' && (
        <AquisicaoFazendaView
          aquisicoes={aquisicoes}
          fluxoConsolidado={fluxoConsolidadoAquisicoes}
          impactoPorSafra={impactoPorSafraAquisicoes}
          onSave={handleSaveAquisicao}
          onDelete={handleDeleteAquisicao}
        />
      )}
      {tab === 'arrendamentos' && (
        <ArrendamentosView
          arrendamentos={arrendamentos}
          fluxoConsolidado={fluxoConsolidadoArrendamentos}
          impactoPorSafra={impactoPorSafraArrendamentos}
          onSave={handleSaveArrendamento}
          onDelete={handleDeleteArrendamento}
        />
      )}
      {tab === 'comercializacao' && (
        <ComercializacaoView
          culturaSafras={culturaSafras}
          culturas={culturas}
          cotacoes={initialCotacoesCommodities}
          contratos={contratosComerciais}
          onSave={handleSaveContratoComercial}
          onDelete={handleDeleteContratoComercial}
        />
      )}
      {tab === 'fluxo_safra' && (
        <FluxoSafraView
          culturaSafras={culturaSafras}
          suppliers={suppliers}
          contratosBancarios={contratosBancarios}
          cronograma={cronogramaConsolidado}
          linhasArrendamento={fluxoConsolidadoArrendamentos}
          linhasAquisicao={fluxoConsolidadoAquisicoes}
          contratosComerciais={contratosComerciais}
          cotacoesCommodities={initialCotacoesCommodities}
          itensManuais={itensFluxoManual}
          onSaveItem={handleSaveItemFluxoManual}
          onDeleteItem={handleDeleteItemFluxoManual}
        />
      )}
      {tab === 'cotacoes' && <CotacoesView dolar={initialCotacaoDolar} commodities={initialCotacoesCommodities} />}
      {tab === 'analise_financeira' && (
        <AnaliseFinanceiraView
          balanco={balanco}
          saudeFinanceira={initialSaudeFinanceira}
          onSaveBalanco={handleSaveBalanco}
        />
      )}
      {tab === 'fluxo_mensal' && (
        <FluxoMensalView lancamentos={initialLancamentosMensais} calendario={initialCalendarioAgricola} />
      )}
      {tab === 'apresentacao_grupo' && <ApresentacaoGrupoView />}

      {tab !== 'fornecedores' &&
        tab !== 'resumo' &&
        tab !== 'cadastro_mestre' &&
        tab !== 'quadro_safra' &&
        tab !== 'bancos' &&
        tab !== 'aquisicao_fazenda' &&
        tab !== 'arrendamentos' &&
        tab !== 'comercializacao' &&
        tab !== 'fluxo_safra' &&
        tab !== 'cotacoes' &&
        tab !== 'analise_financeira' &&
        tab !== 'fluxo_mensal' &&
        tab !== 'apresentacao_grupo' && <GenericView activeTab={tab} />}
    </>
  );
};
