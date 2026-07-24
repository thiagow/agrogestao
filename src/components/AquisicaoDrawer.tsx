import React, { useState, useEffect } from 'react';
import { Aquisicao } from '../types';
import { Drawer, Input, Button } from './ui';

interface AquisicaoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Aquisicao>) => void;
  editingAquisicao?: Aquisicao | null;
}

export const AquisicaoDrawer: React.FC<AquisicaoDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  editingAquisicao
}) => {
  const [nomeFazenda, setNomeFazenda] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [areaHectares, setAreaHectares] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [dataAquisicao, setDataAquisicao] = useState('');
  const [culturaPrincipal, setCulturaPrincipal] = useState('');
  const [safraInicio, setSafraInicio] = useState('');
  const [safraFim, setSafraFim] = useState('');
  const [valorTotalFluxo, setValorTotalFluxo] = useState('');
  const [totalSacas, setTotalSacas] = useState('');

  useEffect(() => {
    if (editingAquisicao) {
      setNomeFazenda(editingAquisicao.nomeFazenda);
      setLocalizacao(editingAquisicao.localizacao);
      setAreaHectares(editingAquisicao.areaHectares.toString());
      setValorTotal(editingAquisicao.valorTotal.toString());
      setDataAquisicao(editingAquisicao.dataAquisicao);
      setCulturaPrincipal(editingAquisicao.culturaPrincipal ?? '');
      setSafraInicio(editingAquisicao.safraInicio);
      setSafraFim(editingAquisicao.safraFim);
      setValorTotalFluxo(editingAquisicao.valorTotalFluxo.toString());
      setTotalSacas(editingAquisicao.totalSacas.toString());
    } else {
      setNomeFazenda('');
      setLocalizacao('');
      setAreaHectares('');
      setValorTotal('');
      setDataAquisicao(new Date().toISOString().split('T')[0]);
      setCulturaPrincipal('');
      setSafraInicio('');
      setSafraFim('');
      setValorTotalFluxo('');
      setTotalSacas('');
    }
  }, [editingAquisicao, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeFazenda.trim()) return;

    onSave({
      id: editingAquisicao?.id,
      nomeFazenda: nomeFazenda.trim(),
      localizacao: localizacao.trim(),
      areaHectares: parseFloat(areaHectares) || 0,
      valorTotal: parseFloat(valorTotal) || 0,
      dataAquisicao,
      culturaPrincipal: culturaPrincipal.trim() || undefined,
      safraInicio: safraInicio.trim(),
      safraFim: safraFim.trim(),
      valorTotalFluxo: parseFloat(valorTotalFluxo) || 0,
      totalSacas: parseFloat(totalSacas) || 0
    });

    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={editingAquisicao ? 'Editar Aquisição' : 'Nova Aquisição de Fazenda'}
      subtitle="Registro e fluxo de pagamento de compra de propriedade rural"
    >
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        <Input
          label="Nome da Fazenda"
          type="text"
          required
          value={nomeFazenda}
          onChange={(e) => setNomeFazenda(e.target.value)}
        />
        <Input
          label="Localização"
          type="text"
          required
          placeholder="Cidade - UF"
          value={localizacao}
          onChange={(e) => setLocalizacao(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Área (ha)"
            type="number"
            required
            min={0}
            value={areaHectares}
            onChange={(e) => setAreaHectares(e.target.value)}
          />
          <Input
            label="Cultura Principal"
            type="text"
            value={culturaPrincipal}
            onChange={(e) => setCulturaPrincipal(e.target.value)}
          />
        </div>
        <Input
          label="Valor Total"
          type="number"
          required
          min={0}
          prefix="R$"
          value={valorTotal}
          onChange={(e) => setValorTotal(e.target.value)}
        />
        <Input
          label="Data de Aquisição"
          type="date"
          required
          value={dataAquisicao}
          onChange={(e) => setDataAquisicao(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Safra Início"
            type="text"
            required
            placeholder="2026/2027"
            value={safraInicio}
            onChange={(e) => setSafraInicio(e.target.value)}
          />
          <Input
            label="Safra Fim"
            type="text"
            required
            placeholder="2029/2030"
            value={safraFim}
            onChange={(e) => setSafraFim(e.target.value)}
          />
        </div>
        <Input
          label="Valor Total do Fluxo"
          type="number"
          min={0}
          prefix="R$"
          value={valorTotalFluxo}
          onChange={(e) => setValorTotalFluxo(e.target.value)}
          hint="Fluxo de pagamento total previsto no período"
        />
        <Input
          label="Total de Sacas Estimado"
          type="number"
          min={0}
          value={totalSacas}
          onChange={(e) => setTotalSacas(e.target.value)}
        />

        <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full">
            Cancelar
          </Button>
          <Button type="submit" variant="primary" className="w-full">
            {editingAquisicao ? 'Salvar' : 'Cadastrar'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
};
