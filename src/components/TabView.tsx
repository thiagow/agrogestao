'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { ActiveTab, Supplier, CulturaSafraAno, ContratoBancario } from '../types';
import {
  initialSuppliers,
  initialCulturaSafras,
  initialContratosBancarios,
  initialBalanco,
  initialIndicadores,
  initialSaudeFinanceira
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

  // Bancos (usado também no Resumo)
  const [contratosBancarios, setContratosBancarios] = useState<ContratoBancario[]>(initialContratosBancarios);

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
      {tab === 'analise_financeira' && (
        <AnaliseFinanceiraView
          balanco={initialBalanco}
          indicadores={initialIndicadores}
          saudeFinanceira={initialSaudeFinanceira}
        />
      )}
      {tab === 'cotacoes' && <CotacoesView />}

      {tab !== 'fornecedores' &&
        tab !== 'resumo' &&
        tab !== 'cadastro_mestre' &&
        tab !== 'quadro_safra' &&
        tab !== 'bancos' &&
        tab !== 'analise_financeira' &&
        tab !== 'cotacoes' && <GenericView activeTab={tab} />}
    </>
  );
};
