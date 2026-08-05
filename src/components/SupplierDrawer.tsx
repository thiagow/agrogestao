import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Supplier, Category, Currency, Status } from '../types';
import { formatCurrency, formatDateBR } from '../data/initialData';
import { Drawer, Input, Select, Textarea, Button } from './ui';

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
  const [status, setStatus] = useState<Status>('PENDENTE');
  const [dividaTotal, setDividaTotal] = useState('');
  const [moeda, setMoeda] = useState<Currency>('BRL');
  const [vencimento, setVencimento] = useState('2026-10-11');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (editingSupplier) {
      setNome(editingSupplier.nome);
      setCategoria(editingSupplier.categoria);
      setCultura(editingSupplier.cultura || '—');
      setSafra(editingSupplier.safra || '—');
      setStatus(editingSupplier.status || 'PENDENTE');
      setDividaTotal(editingSupplier.dividaTotal.toString());
      setMoeda(editingSupplier.moeda);
      setVencimento(editingSupplier.vencimento);
      setObservacoes(editingSupplier.observacoes || '');
    } else {
      setNome('');
      setCategoria('FERTILIZANTES');
      setCultura('—');
      setSafra('—');
      setStatus('PENDENTE');
      setDividaTotal('1000000');
      setMoeda('BRL');
      setVencimento('2026-12-31');
      setObservacoes('');
    }
  }, [editingSupplier, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || safra === '—') return;

    onSave({
      id: editingSupplier?.id,
      nome: nome.trim(),
      categoria,
      cultura,
      safra,
      status,
      dividaTotal: parseFloat(dividaTotal) || 0,
      moeda,
      vencimento,
      observacoes: observacoes.trim()
    });

    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={editingSupplier ? 'Editar Fornecedor' : 'Cadastrar Fornecedor'}
      subtitle="Preencha os dados do contrato com o fornecedor"
    >
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        <Input
          label="Nome do Fornecedor"
          type="text"
          required
          placeholder="Razão social ou nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select label="Categoria" value={categoria} onChange={(e) => setCategoria(e.target.value as Category)}>
            <option value="FERTILIZANTES">FERTILIZANTES</option>
            <option value="DEFENSIVOS">DEFENSIVOS</option>
            <option value="SEMENTES">SEMENTES</option>
            <option value="MAQUINÁRIOS">MAQUINÁRIOS</option>
            <option value="COMBUSTÍVEL">COMBUSTÍVEL</option>
            <option value="SERVIÇOS">SERVIÇOS</option>
            <option value="OUTROS">OUTROS</option>
          </Select>

          <Select label="Cultura Relacionada" value={cultura} onChange={(e) => setCultura(e.target.value)}>
            <option value="—">—</option>
            <option value="Soja">Soja</option>
            <option value="Milho">Milho</option>
            <option value="Algodão">Algodão</option>
            <option value="Café">Café</option>
            <option value="Trigo">Trigo</option>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select label="Safra" required value={safra} onChange={(e) => setSafra(e.target.value)}>
            <option value="—">Selecione a safra</option>
            <option value="23/24">23/24</option>
            <option value="24/25">24/25</option>
            <option value="25/26">25/26</option>
            <option value="26/27">26/27</option>
          </Select>

          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as Status)}>
            <option value="PENDENTE">PENDENTE</option>
            <option value="PAGO">PAGO</option>
            <option value="VENCIDO">VENCIDO</option>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Valor da Dívida"
            type="number"
            required
            step="1000"
            prefix={moeda === 'BRL' ? 'R$' : 'US$'}
            value={dividaTotal}
            onChange={(e) => setDividaTotal(e.target.value)}
            className="font-extrabold"
          />

          <Select label="Moeda" value={moeda} onChange={(e) => setMoeda(e.target.value as Currency)}>
            <option value="BRL">BRL</option>
            <option value="USD">USD</option>
          </Select>
        </div>

        <Input
          label="Vencimento"
          type="date"
          required
          value={vencimento}
          onChange={(e) => setVencimento(e.target.value)}
        />

        <Textarea
          label="Observações"
          rows={3}
          placeholder="Notas adicionais"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
        />

        {editingSupplier?.compras && editingSupplier.compras.length > 0 && (
          <div className="pt-3 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-700 mb-2">Compras / Faturas</p>
            <div className="space-y-2">
              {editingSupplier.compras.map((compra) => (
                <div
                  key={compra.id}
                  className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{compra.descricao}</p>
                    <p className="text-[11px] text-slate-500">
                      {formatDateBR(compra.data)}
                      {compra.culturaReferencia ? ` · ${compra.culturaReferencia}` : ''}
                    </p>
                  </div>
                  <p className="font-bold text-slate-900">{formatCurrency(compra.valor)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full">
            Cancelar
          </Button>
          <Button type="submit" variant="primary" className="w-full flex items-center justify-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            {editingSupplier ? 'Salvar' : 'Cadastrar Fornecedor'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
};
