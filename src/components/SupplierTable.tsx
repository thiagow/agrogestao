import React, { useState } from 'react';
import { Edit2, Trash2, Search, Filter, Image as ImageIcon, ExternalLink, Paperclip } from 'lucide-react';
import { Supplier } from '../types';
import { formatCurrency, formatDateBR, isCurtoPrazo } from '../data/initialData';

interface SupplierTableProps {
  suppliers: Supplier[];
  onEditSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
  onOpenImageModalForSupplier: (supplier: Supplier) => void;
}

export const SupplierTable: React.FC<SupplierTableProps> = ({
  suppliers,
  onEditSupplier,
  onDeleteSupplier,
  onOpenImageModalForSupplier
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Filter suppliers
  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch =
      supplier.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.categoria.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory =
      categoryFilter === 'ALL' || supplier.categoria === categoryFilter;

    const matchesStatus =
      statusFilter === 'ALL' || supplier.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calculate totals for summary footer
  const totalDebt = filteredSuppliers.reduce((sum, s) => sum + s.dividaTotal, 0);

  const totalCP = filteredSuppliers
    .filter((s) => isCurtoPrazo(s.vencimento))
    .reduce((sum, s) => sum + s.dividaTotal, 0);

  const totalLP = filteredSuppliers
    .filter((s) => !isCurtoPrazo(s.vencimento))
    .reduce((sum, s) => sum + s.dividaTotal, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden mb-8">
      {/* Table Header Controls */}
      <div className="p-5 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Lista de Fornecedores
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {filteredSuppliers.length} {filteredSuppliers.length === 1 ? 'fornecedor cadastrado' : 'fornecedores cadastrados'}
          </p>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar fornecedor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
            >
              <option value="ALL">Todas Categorias</option>
              <option value="FERTILIZANTES">FERTILIZANTES</option>
              <option value="DEFENSIVOS">DEFENSIVOS</option>
              <option value="SEMENTES">SEMENTES</option>
              <option value="MAQUINÁRIOS">MAQUINÁRIOS</option>
              <option value="COMBUSTÍVEL">COMBUSTÍVEL</option>
              <option value="SERVIÇOS">SERVIÇOS</option>
              <option value="OUTROS">OUTROS</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
            >
              <option value="ALL">Todos Status</option>
              <option value="PENDENTE">PENDENTE</option>
              <option value="PAGO">PAGO</option>
              <option value="VENCIDO">VENCIDO</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-600 font-bold">
              <th className="py-3 px-4">Fornecedor</th>
              <th className="py-3 px-4">Categoria</th>
              <th className="py-3 px-4">Cultura</th>
              <th className="py-3 px-4">Safra</th>
              <th className="py-3 px-4">Dívida Total</th>
              <th className="py-3 px-4">Moeda</th>
              <th className="py-3 px-4">Vencimento</th>
              <th className="py-3 px-4 text-center">CP/LP</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center">Anexo / Imagem</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {filteredSuppliers.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-slate-400">
                  Nenhum fornecedor encontrado para os filtros selecionados.
                </td>
              </tr>
            ) : (
              filteredSuppliers.map((supplier) => {
                const cp = isCurtoPrazo(supplier.vencimento);

                return (
                  <tr
                    key={supplier.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    {/* Fornecedor */}
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        {supplier.imageUrl ? (
                          <img
                            src={supplier.imageUrl}
                            alt={supplier.nome}
                            className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                        ) : null}
                        <span>{supplier.nome}</span>
                      </div>
                    </td>

                    {/* Categoria */}
                    <td className="py-3.5 px-4 font-semibold text-slate-600 uppercase text-[11px]">
                      {supplier.categoria}
                    </td>

                    {/* Cultura */}
                    <td className="py-3.5 px-4 text-slate-500">
                      {supplier.cultura || '—'}
                    </td>

                    {/* Safra */}
                    <td className="py-3.5 px-4 text-slate-500">
                      {supplier.safra || '—'}
                    </td>

                    {/* Dívida Total */}
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">
                      {formatCurrency(supplier.dividaTotal, supplier.moeda)}
                    </td>

                    {/* Moeda */}
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {supplier.moeda}
                    </td>

                    {/* Vencimento */}
                    <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                      {formatDateBR(supplier.vencimento)}
                    </td>

                    {/* CP/LP */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wide border ${
                          cp
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-blue-100 text-blue-800 border-blue-300'
                        }`}
                      >
                        {cp ? 'CP' : 'LP'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider border ${
                          supplier.status === 'PENDENTE'
                            ? 'bg-amber-100/80 text-amber-900 border-amber-300/80'
                            : supplier.status === 'PAGO'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : 'bg-rose-100 text-rose-900 border-rose-300'
                        }`}
                      >
                        {supplier.status}
                      </span>
                    </td>

                    {/* Direct Image Link Button */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => onOpenImageModalForSupplier(supplier)}
                        title="Ver / Copiar Link Direto da Imagem (HTML)"
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Link HTML</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEditSupplier(supplier)}
                          title="Editar fornecedor"
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteSupplier(supplier.id)}
                          title="Excluir fornecedor"
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Table Footer Total Row (Exact match to Screenshot 1) */}
          <tfoot>
            <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold text-xs text-slate-800">
              <td colSpan={4} className="py-3.5 px-4 uppercase tracking-wider font-extrabold text-slate-900">
                TOTAL
              </td>
              <td className="py-3.5 px-4 font-black text-rose-800 text-sm">
                {formatCurrency(totalDebt)}
              </td>
              <td colSpan={6} className="py-3.5 px-4 text-left font-bold text-slate-700">
                <span className="text-amber-800 mr-4">CP: {formatCurrency(totalCP)}</span>
                <span className="text-blue-800">LP: {formatCurrency(totalLP)}</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
