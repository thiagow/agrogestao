'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { ActiveTab, Supplier } from '../types';
import { initialSuppliers, initialBankAccounts, initialCropSeasons } from '../data/initialData';
import { Header } from './Header';
import { MetricCards } from './MetricCards';
import { SupplierTable } from './SupplierTable';
import { SupplierDrawer } from './SupplierDrawer';
import { Button } from './ui';
import { ResumoView } from './views/ResumoView';
import { BancosView } from './views/BancosView';
import { QuadroSafraView } from './views/QuadroSafraView';
import { CotacoesView } from './views/CotacoesView';
import { GenericView } from './views/GenericView';
import { useAppShell } from '../lib/app-shell-context';

interface TabViewProps {
  tab: ActiveTab;
}

export const TabView: React.FC<TabViewProps> = ({ tab }) => {
  const { openImageModal } = useAppShell();

  // Data State
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [banks] = useState(initialBankAccounts);
  const [crops] = useState(initialCropSeasons);

  // Supplier Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

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
        imageUrl: supplierData.imageUrl || ''
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

      {tab === 'resumo' && <ResumoView suppliers={suppliers} banks={banks} crops={crops} />}
      {tab === 'bancos' && <BancosView banks={banks} />}
      {tab === 'quadro_safra' && <QuadroSafraView crops={crops} />}
      {tab === 'cotacoes' && <CotacoesView />}

      {tab !== 'fornecedores' &&
        tab !== 'resumo' &&
        tab !== 'bancos' &&
        tab !== 'quadro_safra' &&
        tab !== 'cotacoes' && <GenericView activeTab={tab} />}
    </>
  );
};
