'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { DirectImageLinksModal } from './DirectImageLinksModal';
import { AppShellContext } from '../lib/app-shell-context';
import { Supplier } from '../types';

interface AppShellProps {
  children: React.ReactNode;
  user: { name: string; email: string };
  propriedade: { id: string; nome: string } | null;
  propriedades: { id: string; nome: string }[];
}

export const AppShell: React.FC<AppShellProps> = ({ children, user, propriedade, propriedades }) => {
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedSupplierForImage, setSelectedSupplierForImage] = useState<Supplier | null>(null);

  const openImageModal = (supplier?: Supplier) => {
    setSelectedSupplierForImage(supplier || null);
    setIsImageModalOpen(true);
  };

  return (
    <AppShellContext.Provider
      value={{
        openMobileSidebar: () => setIsOpenMobile(true),
        openImageModal
      }}
    >
      <div className="min-h-screen bg-[#f3f6f3] text-slate-900 font-sans antialiased flex">
        <Sidebar
          isOpenMobile={isOpenMobile}
          onCloseMobile={() => setIsOpenMobile(false)}
          user={user}
          propriedade={propriedade}
          propriedades={propriedades}
        />

        <main className="flex-1 lg:pl-[240px] transition-all min-w-0">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">{children}</div>
        </main>

        <DirectImageLinksModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          selectedSupplier={selectedSupplierForImage}
        />
      </div>
    </AppShellContext.Provider>
  );
};
