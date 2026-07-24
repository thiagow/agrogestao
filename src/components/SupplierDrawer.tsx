import React, { useState, useEffect } from 'react';
import { Supplier, Category, Currency, Status } from '../types';
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
          placeholder="Ex: Cargill, Bunge, Syngenta..."
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />

        <Select label="Categoria" value={categoria} onChange={(e) => setCategoria(e.target.value as Category)}>
          <option value="FERTILIZANTES">FERTILIZANTES</option>
          <option value="DEFENSIVOS">DEFENSIVOS</option>
          <option value="SEMENTES">SEMENTES</option>
          <option value="MAQUINÁRIOS">MAQUINÁRIOS</option>
          <option value="COMBUSTÍVEL">COMBUSTÍVEL</option>
          <option value="SERVIÇOS">SERVIÇOS</option>
          <option value="OUTROS">OUTROS</option>
        </Select>

        <Select label="Cultura" value={cultura} onChange={(e) => setCultura(e.target.value)}>
          <option value="—">—</option>
          <option value="Soja">Soja</option>
          <option value="Milho">Milho</option>
          <option value="Algodão">Algodão</option>
          <option value="Café">Café</option>
          <option value="Trigo">Trigo</option>
        </Select>

        <Select label="Safra" value={safra} onChange={(e) => setSafra(e.target.value)}>
          <option value="—">—</option>
          <option value="23/24">23/24</option>
          <option value="24/25">24/25</option>
          <option value="25/26">25/26</option>
          <option value="26/27">26/27</option>
        </Select>

        <Input
          label="Dívida Total"
          type="number"
          required
          step="1000"
          prefix={moeda === 'BRL' ? 'R$' : 'US$'}
          value={dividaTotal}
          onChange={(e) => setDividaTotal(e.target.value)}
          className="font-extrabold"
        />

        <div className="grid grid-cols-2 gap-3">
          <Select label="Moeda" value={moeda} onChange={(e) => setMoeda(e.target.value as Currency)}>
            <option value="BRL">BRL</option>
            <option value="USD">USD</option>
          </Select>

          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as Status)}>
            <option value="PENDENTE">PENDENTE</option>
            <option value="PAGO">PAGO</option>
            <option value="VENCIDO">VENCIDO</option>
          </Select>
        </div>

        <Input
          label="Vencimento"
          type="date"
          required
          value={vencimento}
          onChange={(e) => setVencimento(e.target.value)}
        />

        <Input
          label="URL da Imagem / Logo (Link Direto HTML)"
          type="url"
          placeholder="https://exemplo.com/imagem.png"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          hint="Link direto da imagem para incorporar no HTML do relatório."
        />

        <Textarea
          label="Observações"
          rows={3}
          placeholder="Adicione detalhes do contrato, condições ou notas..."
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
        />

        <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full">
            Cancelar
          </Button>
          <Button type="submit" variant="primary" className="w-full">
            {editingSupplier ? 'Salvar' : 'Cadastrar'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
};
