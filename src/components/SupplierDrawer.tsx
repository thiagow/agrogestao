import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Image as ImageIcon } from 'lucide-react';
import { Supplier, Category, Currency, Status } from '../types';

interface SupplierDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (supplierData: Partial<Supplier>) => void;
  editingSupplier?: Supplier | null;
}

export const SupplierDrawer: React.FC<SupplierDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  editingSupplier
}) => {
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<Category>('FERTILIZANTES');
  const [cultura, setCultura] = useState('—');
  const [safra, setSafra] = useState('—');
  const [dividaTotal, setDividaTotal] = useState('');
  const [moeda, setMoeda] = useState<Currency>('BRL');
  const [vencimento, setVencimento] = useState('2026-10-11');
  const [observacoes, setObservacoes] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState<Status>('PENDENTE');

  useEffect(() => {
    if (editingSupplier) {
      setNome(editingSupplier.nome);
      setCategoria(editingSupplier.categoria);
      setCultura(editingSupplier.cultura || '—');
      setSafra(editingSupplier.safra || '—');
      setDividaTotal(editingSupplier.dividaTotal.toString());
      setMoeda(editingSupplier.moeda);
      setVencimento(editingSupplier.vencimento);
      setObservacoes(editingSupplier.observacoes || '');
      setImageUrl(editingSupplier.imageUrl || '');
      setStatus(editingSupplier.status || 'PENDENTE');
    } else {
      setNome('');
      setCategoria('FERTILIZANTES');
      setCultura('—');
      setSafra('—');
      setDividaTotal('1000000');
      setMoeda('BRL');
      setVencimento('2026-12-31');
      setObservacoes('');
      setImageUrl('');
      setStatus('PENDENTE');
    }
  }, [editingSupplier, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    onSave({
      id: editingSupplier?.id,
      nome: nome.trim(),
      categoria,
      cultura,
      safra,
      dividaTotal: parseFloat(dividaTotal) || 0,
      moeda,
      vencimento,
      observacoes: observacoes.trim(),
      imageUrl: imageUrl.trim(),
      status
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white text-slate-900 shadow-2xl flex flex-col justify-between border-l border-slate-200">
          {/* Header - Clean White */}
          <div className="p-6 flex items-center justify-between border-b border-slate-200 bg-slate-50/50">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[#0b2310] font-sans">
                {editingSupplier ? 'Editar Fornecedor' : 'Cadastrar Fornecedor'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Preencha os dados do contrato com o fornecedor</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {/* Nome do Fornecedor */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nome do Fornecedor
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Cargill, Bunge, Syngenta..."
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 font-medium text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 focus:bg-white transition"
              />
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Categoria
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as Category)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 font-medium text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 focus:bg-white transition"
              >
                <option value="FERTILIZANTES">FERTILIZANTES</option>
                <option value="DEFENSIVOS">DEFENSIVOS</option>
                <option value="SEMENTES">SEMENTES</option>
                <option value="MAQUINÁRIOS">MAQUINÁRIOS</option>
                <option value="COMBUSTÍVEL">COMBUSTÍVEL</option>
                <option value="SERVIÇOS">SERVIÇOS</option>
                <option value="OUTROS">OUTROS</option>
              </select>
            </div>

            {/* Cultura */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Cultura
              </label>
              <select
                value={cultura}
                onChange={(e) => setCultura(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 font-medium text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 focus:bg-white transition"
              >
                <option value="—">—</option>
                <option value="Soja">Soja</option>
                <option value="Milho">Milho</option>
                <option value="Algodão">Algodão</option>
                <option value="Café">Café</option>
                <option value="Trigo">Trigo</option>
              </select>
            </div>

            {/* Safra */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Safra
              </label>
              <select
                value={safra}
                onChange={(e) => setSafra(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 font-medium text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 focus:bg-white transition"
              >
                <option value="—">—</option>
                <option value="23/24">23/24</option>
                <option value="24/25">24/25</option>
                <option value="25/26">25/26</option>
                <option value="26/27">26/27</option>
              </select>
            </div>

            {/* Dívida Total */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Dívida Total
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">
                  {moeda === 'BRL' ? 'R$' : 'US$'}
                </span>
                <input
                  type="number"
                  required
                  step="1000"
                  value={dividaTotal}
                  onChange={(e) => setDividaTotal(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 font-extrabold text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Moeda & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Moeda
                </label>
                <select
                  value={moeda}
                  onChange={(e) => setMoeda(e.target.value as Currency)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 font-medium text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 focus:bg-white transition"
                >
                  <option value="BRL">BRL</option>
                  <option value="USD">USD</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Status)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 font-medium text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 focus:bg-white transition"
                >
                  <option value="PENDENTE">PENDENTE</option>
                  <option value="PAGO">PAGO</option>
                  <option value="VENCIDO">VENCIDO</option>
                </select>
              </div>
            </div>

            {/* Vencimento */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Vencimento
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={vencimento}
                  onChange={(e) => setVencimento(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 font-medium text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 focus:bg-white transition"
                />
              </div>
            </div>

            {/* URL da Imagem / Link Direto (HTML) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                URL da Imagem / Logo (Link Direto HTML)
              </label>
              <input
                type="url"
                placeholder="https://exemplo.com/imagem.png"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 font-medium text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 focus:bg-white transition"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Link direto da imagem para incorporar no HTML do relatório.
              </p>
            </div>

            {/* Observações */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Observações
              </label>
              <textarea
                rows={3}
                placeholder="Adicione detalhes do contrato, condições ou notas..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 font-normal text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 focus:bg-white transition"
              />
            </div>

            {/* Drawer Footer Actions */}
            <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-full py-2.5 bg-[#a3e635] hover:bg-[#8cc627] text-[#0b2310] font-extrabold text-sm rounded-xl shadow-xs transition hover:shadow-md cursor-pointer"
              >
                {editingSupplier ? 'Salvar' : 'Cadastrar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
