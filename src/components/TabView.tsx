'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  ActiveTab,
  Supplier,
  Socio,
  BemDireito,
  Garantia,
  Capex,
  PerfilGrupoEconomico,
  CulturaSafraAno,
  ContratoBancario,
  Aquisicao,
  ContratoArrendamento,
  ContratoComercial,
  LancamentoMensal,
  BalancoPatrimonial,
  EmpresaBalanco,
  Cotacao
} from '../types';
import { saveSupplier, deleteSupplier } from '../server/suppliers';
import { saveQuadroSafra, deleteQuadroSafra } from '../server/quadro-safra';
import { saveContratoBancario, deleteContratoBancario } from '../server/contratos-bancarios';
import { saveAquisicao, deleteAquisicao } from '../server/aquisicoes';
import { saveArrendamento, deleteArrendamento } from '../server/arrendamentos';
import { saveContratoComercial, deleteContratoComercial } from '../server/contratos-comerciais';
import { saveBalanco } from '../server/balanco';
import {
  initialSaudeFinanceira,
  initialPosicaoComercializacao,
  initialFluxoSafra,
  RECEITA_PROJETADA_SAFRA,
  initialCalendarioAgricola
} from '../data/initialData';
import { Header } from './Header';
import { MetricCards } from './MetricCards';
import { SupplierTable } from './SupplierTable';
import { SupplierDrawer } from './SupplierDrawer';
import { Button } from './ui';
import { ResumoView } from './views/ResumoView';
import { BancosView } from './views/BancosView';
import { QuadroSafraView } from './views/QuadroSafraView';
import { CotacoesView } from './views/CotacoesView';
import { CadastroMestreView } from './views/CadastroMestreView';
import { AnaliseFinanceiraView } from './views/AnaliseFinanceiraView';
import { AquisicaoFazendaView } from './views/AquisicaoFazendaView';
import { ArrendamentosView } from './views/ArrendamentosView';
import { ComercializacaoView } from './views/ComercializacaoView';
import { BalancoPjView } from './views/BalancoPjView';
import { FluxoSafraView } from './views/FluxoSafraView';
import { FluxoMensalView } from './views/FluxoMensalView';
import { ApresentacaoGrupoView } from './views/ApresentacaoGrupoView';
import { GenericView } from './views/GenericView';
import { useAppShell } from '../lib/app-shell-context';

interface TabViewProps {
  tab: ActiveTab;
  initialSuppliers?: Supplier[];
  initialSocios?: Socio[];
  initialBensDireitos?: BemDireito[];
  initialGarantias?: Garantia[];
  initialCapex?: Capex[];
  initialPerfilGrupo?: PerfilGrupoEconomico | null;
  initialCulturaSafras?: CulturaSafraAno[];
  initialLancamentosMensais?: LancamentoMensal[];
  initialContratosBancarios?: ContratoBancario[];
  initialAquisicoes?: Aquisicao[];
  initialArrendamentos?: ContratoArrendamento[];
  initialContratosComerciais?: ContratoComercial[];
  initialBalanco?: BalancoPatrimonial | null;
  initialEmpresasPJ?: EmpresaBalanco[];
  initialCotacaoDolar?: Cotacao | null;
  initialCotacoesCommodities?: Cotacao[];
}

export const TabView: React.FC<TabViewProps> = ({
  tab,
  initialSuppliers = [],
  initialSocios = [],
  initialBensDireitos = [],
  initialGarantias = [],
  initialCapex = [],
  initialPerfilGrupo = null,
  initialCulturaSafras = [],
  initialLancamentosMensais = [],
  initialContratosBancarios = [],
  initialAquisicoes = [],
  initialArrendamentos = [],
  initialContratosComerciais = [],
  initialBalanco = null,
  initialEmpresasPJ = [],
  initialCotacaoDolar = null,
  initialCotacoesCommodities = []
}) => {
  const { openImageModal } = useAppShell();

  // Fornecedores — persistido via src/server/suppliers.ts
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

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
        observacoes: supplierData.observacoes || '',
        imageUrl: supplierData.imageUrl || '',
        cnpjCpf: supplierData.cnpjCpf,
        contatoNome: supplierData.contatoNome,
        contatoTelefone: supplierData.contatoTelefone,
        contatoEmail: supplierData.contatoEmail
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
        despesa: data.despesa || 0,
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
        tipoContrato: data.tipoContrato || 'CUSTEO',
        saldoInicial: data.saldoInicial || 0,
        saldoAtual: data.saldoAtual || data.saldoInicial || 0,
        taxaJuros: data.taxaJuros || 0,
        tipoTaxa: data.tipoTaxa || 'CDI',
        taxaAdicional: data.taxaAdicional,
        dataContratacao: data.dataContratacao || new Date().toISOString().split('T')[0],
        dataVencimento: data.dataVencimento || new Date().toISOString().split('T')[0],
        sistemaAmortizacao: data.sistemaAmortizacao || 'SAC',
        periodicidade: data.periodicidade || 'Mensal',
        finalidade: data.finalidade || 'CUSTEIO',
        moeda: data.moeda || 'BRL',
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
        localizacao: data.localizacao || '',
        areaHectares: data.areaHectares || 0,
        valorTotal: data.valorTotal || 0,
        dataAquisicao: data.dataAquisicao || new Date().toISOString().split('T')[0],
        dataOcupacao: data.dataOcupacao,
        culturaPrincipal: data.culturaPrincipal,
        safraInicio: data.safraInicio || '',
        safraFim: data.safraFim || '',
        valorTotalFluxo: data.valorTotalFluxo || 0,
        totalSacas: data.totalSacas || 0
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
        nomePropriedade: data.nomePropriedade || '',
        localizacao: data.localizacao || '',
        proprietarioNome: data.proprietarioNome || '',
        proprietarioCpfCnpj: data.proprietarioCpfCnpj || '',
        areaHectares: data.areaHectares || 0,
        culturaPrincipal: data.culturaPrincipal || '',
        custoAnualHectare: data.custoAnualHectare || 0,
        sacasPorHectare: data.sacasPorHectare,
        dataInicio: data.dataInicio || new Date().toISOString().split('T')[0],
        dataFim: data.dataFim || '',
        periodicidade: data.periodicidade || 'Anual',
        renovavel: data.renovavel ?? true,
        status: data.status || 'ATIVO',
        safraInicio: data.safraInicio || '',
        safraFim: data.safraFim || '',
        observacoes: data.observacoes
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
            onOpenImageModalForSupplier={(s) => openImageModal(s)}
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
        <ResumoView suppliers={suppliers} culturaSafras={culturaSafras} contratosBancarios={contratosBancarios} />
      )}
      {tab === 'cadastro_mestre' && (
        <CadastroMestreView
          initialSocios={initialSocios}
          initialBensDireitos={initialBensDireitos}
          initialGarantias={initialGarantias}
          initialCapex={initialCapex}
          initialPerfilGrupo={initialPerfilGrupo}
        />
      )}
      {tab === 'quadro_safra' && (
        <QuadroSafraView culturaSafras={culturaSafras} onSave={handleSaveSafra} onDelete={handleDeleteSafra} />
      )}
      {tab === 'bancos' && (
        <BancosView contratos={contratosBancarios} onSave={handleSaveContrato} onDelete={handleDeleteContrato} />
      )}
      {tab === 'aquisicao_fazenda' && (
        <AquisicaoFazendaView
          aquisicoes={aquisicoes}
          onSave={handleSaveAquisicao}
          onDelete={handleDeleteAquisicao}
        />
      )}
      {tab === 'arrendamentos' && (
        <ArrendamentosView
          arrendamentos={arrendamentos}
          onSave={handleSaveArrendamento}
          onDelete={handleDeleteArrendamento}
        />
      )}
      {tab === 'comercializacao' && (
        <ComercializacaoView
          posicoes={initialPosicaoComercializacao}
          contratos={contratosComerciais}
          onSave={handleSaveContratoComercial}
          onDelete={handleDeleteContratoComercial}
        />
      )}
      {tab === 'balanco_pj' && <BalancoPjView empresas={initialEmpresasPJ} />}
      {tab === 'fluxo_safra' && (
        <FluxoSafraView
          itens={initialFluxoSafra}
          receitaProjetada={RECEITA_PROJETADA_SAFRA}
          saldoDevedorBancos={contratosBancarios.reduce((sum, c) => sum + c.saldoAtual, 0)}
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
        tab !== 'balanco_pj' &&
        tab !== 'fluxo_safra' &&
        tab !== 'cotacoes' &&
        tab !== 'analise_financeira' &&
        tab !== 'fluxo_mensal' &&
        tab !== 'apresentacao_grupo' && <GenericView activeTab={tab} />}
    </>
  );
};
