'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  ActiveTab,
  Supplier,
  CulturaSafraAno,
  ContratoBancario,
  Aquisicao,
  ContratoArrendamento,
  ContratoComercial
} from '../types';
import {
  initialSuppliers,
  initialCulturaSafras,
  initialContratosBancarios,
  initialBalanco,
  initialIndicadores,
  initialSaudeFinanceira,
  initialAquisicoes,
  initialArrendamentos,
  initialContratosComerciais,
  initialPosicaoComercializacao,
  initialEmpresasBalanco,
  initialFluxoSafra,
  RECEITA_PROJETADA_SAFRA,
  initialCotacaoDolar,
  initialCotacoesCommodities,
  initialLancamentosMensais,
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
}

export const TabView: React.FC<TabViewProps> = ({ tab }) => {
  const { openImageModal } = useAppShell();

  // Fornecedores
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Quadro de Safra (usado também no Resumo)
  const [culturaSafras, setCulturaSafras] = useState<CulturaSafraAno[]>(initialCulturaSafras);

  // Bancos (usado também no Resumo e Fluxo de Safra)
  const [contratosBancarios, setContratosBancarios] = useState<ContratoBancario[]>(initialContratosBancarios);

  // Aquisição de Fazendas
  const [aquisicoes, setAquisicoes] = useState<Aquisicao[]>(initialAquisicoes);

  // Arrendamentos
  const [arrendamentos, setArrendamentos] = useState<ContratoArrendamento[]>(initialArrendamentos);

  // Comercialização
  const [contratosComerciais, setContratosComerciais] = useState<ContratoComercial[]>(initialContratosComerciais);

  const handleSaveSupplier = (supplierData: Partial<Supplier>) => {
    if (supplierData.id) {
      setSuppliers((prev) =>
        prev.map((s) => (s.id === supplierData.id ? ({ ...s, ...supplierData } as Supplier) : s))
      );
    } else {
      const newSupplier: Supplier = {
        id: `supp-${Date.now()}`,
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
      };
      setSuppliers((prev) => [newSupplier, ...prev]);
    }
  };

  const handleDeleteSupplier = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este fornecedor?')) {
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
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

  const handleSaveSafra = (data: Partial<CulturaSafraAno>) => {
    if (data.id) {
      setCulturaSafras((prev) =>
        prev.map((s) => (s.id === data.id ? ({ ...s, ...data } as CulturaSafraAno) : s))
      );
    } else {
      const nova: CulturaSafraAno = {
        id: `safra-${Date.now()}`,
        cultura: data.cultura || '',
        anoSafra: data.anoSafra || '',
        hectares: data.hectares || 0,
        haPropria: data.haPropria || 0,
        haArrendada: data.haArrendada || 0,
        rendimento: data.rendimento || 0,
        unidadeProducao: data.unidadeProducao || 'sc',
        precoMedio: data.precoMedio || 0,
        despesa: data.despesa || 0
      };
      setCulturaSafras((prev) => [nova, ...prev]);
    }
  };

  const handleDeleteSafra = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este registro de safra?')) {
      setCulturaSafras((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleSaveContrato = (data: Partial<ContratoBancario>) => {
    if (data.id) {
      setContratosBancarios((prev) =>
        prev.map((c) => (c.id === data.id ? ({ ...c, ...data } as ContratoBancario) : c))
      );
    } else {
      const novo: ContratoBancario = {
        id: `contrato-${Date.now()}`,
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
      };
      setContratosBancarios((prev) => [novo, ...prev]);
    }
  };

  const handleDeleteContrato = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este contrato?')) {
      setContratosBancarios((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const handleSaveAquisicao = (data: Partial<Aquisicao>) => {
    if (data.id) {
      setAquisicoes((prev) => prev.map((a) => (a.id === data.id ? ({ ...a, ...data } as Aquisicao) : a)));
    } else {
      const nova: Aquisicao = {
        id: `aquisicao-${Date.now()}`,
        nomeFazenda: data.nomeFazenda || '',
        localizacao: data.localizacao || '',
        areaHectares: data.areaHectares || 0,
        valorTotal: data.valorTotal || 0,
        dataAquisicao: data.dataAquisicao || new Date().toISOString().split('T')[0],
        culturaPrincipal: data.culturaPrincipal,
        safraInicio: data.safraInicio || '',
        safraFim: data.safraFim || '',
        valorTotalFluxo: data.valorTotalFluxo || 0,
        totalSacas: data.totalSacas || 0
      };
      setAquisicoes((prev) => [nova, ...prev]);
    }
  };

  const handleDeleteAquisicao = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta aquisição?')) {
      setAquisicoes((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const handleSaveArrendamento = (data: Partial<ContratoArrendamento>) => {
    if (data.id) {
      setArrendamentos((prev) =>
        prev.map((a) => (a.id === data.id ? ({ ...a, ...data } as ContratoArrendamento) : a))
      );
    } else {
      const novo: ContratoArrendamento = {
        id: `arrendamento-${Date.now()}`,
        nomePropriedade: data.nomePropriedade || '',
        localizacao: data.localizacao || '',
        proprietarioNome: data.proprietarioNome || '',
        proprietarioCpfCnpj: data.proprietarioCpfCnpj || '',
        areaHectares: data.areaHectares || 0,
        culturaPrincipal: data.culturaPrincipal || '',
        custoAnualHectare: data.custoAnualHectare || 0,
        dataInicio: data.dataInicio || new Date().toISOString().split('T')[0],
        dataFim: data.dataFim || '',
        periodicidade: data.periodicidade || 'Anual',
        renovavel: data.renovavel ?? true,
        status: data.status || 'ATIVO',
        safraInicio: data.safraInicio || '',
        safraFim: data.safraFim || '',
        observacoes: data.observacoes
      };
      setArrendamentos((prev) => [novo, ...prev]);
    }
  };

  const handleDeleteArrendamento = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este contrato de arrendamento?')) {
      setArrendamentos((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const handleSaveContratoComercial = (data: Partial<ContratoComercial>) => {
    if (data.id) {
      setContratosComerciais((prev) =>
        prev.map((c) => (c.id === data.id ? ({ ...c, ...data } as ContratoComercial) : c))
      );
    } else {
      const novo: ContratoComercial = {
        id: `comercial-${Date.now()}`,
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
      };
      setContratosComerciais((prev) => [novo, ...prev]);
    }
  };

  const handleDeleteContratoComercial = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este contrato comercial?')) {
      setContratosComerciais((prev) => prev.filter((c) => c.id !== id));
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
      {tab === 'cadastro_mestre' && <CadastroMestreView />}
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
      {tab === 'balanco_pj' && <BalancoPjView empresas={initialEmpresasBalanco} />}
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
          balanco={initialBalanco}
          indicadores={initialIndicadores}
          saudeFinanceira={initialSaudeFinanceira}
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
