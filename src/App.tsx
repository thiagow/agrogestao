import React, { useState } from 'react';
import { ActiveTab, Supplier, BankAccount, CropSeason } from './types';
import {
  initialSuppliers,
  initialBankAccounts,
  initialCropSeasons
} from './data/initialData';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { SupplierTable } from './components/SupplierTable';
import { SupplierDrawer } from './components/SupplierDrawer';
import { DirectImageLinksModal } from './components/DirectImageLinksModal';
import { ResumoView } from './components/views/ResumoView';
import { BancosView } from './components/views/BancosView';
import { QuadroSafraView } from './components/views/QuadroSafraView';
import { CotacoesView } from './components/views/CotacoesView';
import { GenericView } from './components/views/GenericView';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('fornecedores');
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  // Data State
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [banks] = useState<BankAccount[]>(initialBankAccounts);
  const [crops] = useState<CropSeason[]>(initialCropSeasons);

  // UI Modals & Drawers State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedSupplierForImage, setSelectedSupplierForImage] = useState<Supplier | null>(null);

  const [searchTerm, setSearchTerm] = useState('');

  // Handle Add / Edit Supplier
  const handleSaveSupplier = (supplierData: Partial<Supplier>) => {
    if (supplierData.id) {
      // Edit existing
      setSuppliers((prev) =>
        prev.map((s) => (s.id === supplierData.id ? ({ ...s, ...supplierData } as Supplier) : s))
      );
    } else {
      // Add new
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

  // Handle Delete Supplier
  const handleDeleteSupplier = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este fornecedor?')) {
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
    }
  };

  // Open Edit Drawer
  const handleOpenEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsDrawerOpen(true);
  };

  // Open New Drawer
  const handleOpenNewSupplier = () => {
    setEditingSupplier(null);
    setIsDrawerOpen(true);
  };

  // Open Direct Image Link Generator Modal
  const handleOpenImageModal = (supplier?: Supplier) => {
    setSelectedSupplierForImage(supplier || null);
    setIsImageModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#f3f6f3] text-slate-900 font-sans antialiased flex">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpenMobile={isOpenMobile}
        setIsOpenMobile={setIsOpenMobile}
        onOpenImageModal={() => handleOpenImageModal()}
      />

      {/* Main Content View Container */}
      <main className="flex-1 lg:pl-[240px] transition-all min-w-0">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <Header
            activeTab={activeTab}
            onOpenMobileSidebar={() => setIsOpenMobile(true)}
            onOpenNewSupplierDrawer={handleOpenNewSupplier}
            onOpenImageModal={() => handleOpenImageModal()}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />

          {/* Active View Routing */}
          {activeTab === 'fornecedores' && (
            <>
              {/* 4 Summary Metric Cards */}
              <MetricCards suppliers={suppliers} />

              {/* Suppliers Table */}
              <SupplierTable
                suppliers={suppliers}
                onEditSupplier={handleOpenEditSupplier}
                onDeleteSupplier={handleDeleteSupplier}
                onOpenImageModalForSupplier={(s) => handleOpenImageModal(s)}
              />
            </>
          )}

          {activeTab === 'resumo' && (
            <ResumoView suppliers={suppliers} banks={banks} crops={crops} />
          )}

          {activeTab === 'bancos' && <BancosView banks={banks} />}

          {activeTab === 'quadro_safra' && <QuadroSafraView crops={crops} />}

          {activeTab === 'cotacoes' && <CotacoesView />}

          {activeTab !== 'fornecedores' &&
            activeTab !== 'resumo' &&
            activeTab !== 'bancos' &&
            activeTab !== 'quadro_safra' &&
            activeTab !== 'cotacoes' && <GenericView activeTab={activeTab} />}
        </div>
      </main>

      {/* Drawer Panel for Cadastrar/Editar Fornecedor (Matching Screenshot 2) */}
      <SupplierDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={handleSaveSupplier}
        editingSupplier={editingSupplier}
      />

      {/* Direct Image Links Modal for HTML generation */}
      <DirectImageLinksModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        selectedSupplier={selectedSupplierForImage}
      />
    </div>
  );
}
