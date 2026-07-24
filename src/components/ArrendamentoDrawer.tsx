import React, { useState, useEffect } from 'react';
import { ContratoArrendamento, PeriodicidadeArrendamento, StatusArrendamento } from '../types';
import { Drawer, Input, Select, Textarea, Button } from './ui';

interface ArrendamentoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<ContratoArrendamento>) => void;
  editingArrendamento?: ContratoArrendamento | null;
}

export const ArrendamentoDrawer: React.FC<ArrendamentoDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  editingArrendamento
}) => {
  const [nomePropriedade, setNomePropriedade] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [proprietarioNome, setProprietarioNome] = useState('');
  const [proprietarioCpfCnpj, setProprietarioCpfCnpj] = useState('');
  const [areaHectares, setAreaHectares] = useState('');
  const [culturaPrincipal, setCulturaPrincipal] = useState('');
  const [custoAnualHectare, setCustoAnualHectare] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [periodicidade, setPeriodicidade] = useState<PeriodicidadeArrendamento>('Anual');
  const [renovavel, setRenovavel] = useState(true);
  const [status, setStatus] = useState<StatusArrendamento>('ATIVO');
  const [safraInicio, setSafraInicio] = useState('');
  const [safraFim, setSafraFim] = useState('');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (editingArrendamento) {
      setNomePropriedade(editingArrendamento.nomePropriedade);
      setLocalizacao(editingArrendamento.localizacao);
      setProprietarioNome(editingArrendamento.proprietarioNome);
      setProprietarioCpfCnpj(editingArrendamento.proprietarioCpfCnpj);
      setAreaHectares(editingArrendamento.areaHectares.toString());
      setCulturaPrincipal(editingArrendamento.culturaPrincipal);
      setCustoAnualHectare(editingArrendamento.custoAnualHectare.toString());
      setDataInicio(editingArrendamento.dataInicio);
      setDataFim(editingArrendamento.dataFim);
      setPeriodicidade(editingArrendamento.periodicidade);
      setRenovavel(editingArrendamento.renovavel);
      setStatus(editingArrendamento.status);
      setSafraInicio(editingArrendamento.safraInicio);
      setSafraFim(editingArrendamento.safraFim);
      setObservacoes(editingArrendamento.observacoes ?? '');
    } else {
      setNomePropriedade('');
      setLocalizacao('');
      setProprietarioNome('');
      setProprietarioCpfCnpj('');
      setAreaHectares('');
      setCulturaPrincipal('');
      setCustoAnualHectare('');
      setDataInicio(new Date().toISOString().split('T')[0]);
      setDataFim('');
      setPeriodicidade('Anual');
      setRenovavel(true);
      setStatus('ATIVO');
      setSafraInicio('');
      setSafraFim('');
      setObservacoes('');
    }
  }, [editingArrendamento, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomePropriedade.trim()) return;

    onSave({
      id: editingArrendamento?.id,
      nomePropriedade: nomePropriedade.trim(),
      localizacao: localizacao.trim(),
      proprietarioNome: proprietarioNome.trim(),
      proprietarioCpfCnpj: proprietarioCpfCnpj.trim(),
      areaHectares: parseFloat(areaHectares) || 0,
      culturaPrincipal: culturaPrincipal.trim(),
      custoAnualHectare: parseFloat(custoAnualHectare) || 0,
      dataInicio,
      dataFim,
      periodicidade,
      renovavel,
      status,
      safraInicio: safraInicio.trim(),
      safraFim: safraFim.trim(),
      observacoes: observacoes.trim() || undefined
    });

    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={editingArrendamento ? 'Editar Arrendamento' : 'Novo Contrato de Arrendamento'}
      subtitle="Terras arrendadas de terceiros para produção"
    >
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        <Input
          label="Nome da Propriedade"
          type="text"
          required
          value={nomePropriedade}
          onChange={(e) => setNomePropriedade(e.target.value)}
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
            label="Proprietário"
            type="text"
            required
            value={proprietarioNome}
            onChange={(e) => setProprietarioNome(e.target.value)}
          />
          <Input
            label="CPF/CNPJ"
            type="text"
            required
            value={proprietarioCpfCnpj}
            onChange={(e) => setProprietarioCpfCnpj(e.target.value)}
          />
        </div>
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
            required
            value={culturaPrincipal}
            onChange={(e) => setCulturaPrincipal(e.target.value)}
          />
        </div>
        <Input
          label="Custo Anual por Hectare"
          type="number"
          required
          min={0}
          prefix="R$"
          value={custoAnualHectare}
          onChange={(e) => setCustoAnualHectare(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Data de Início"
            type="date"
            required
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />
          <Input
            label="Data de Fim"
            type="date"
            required
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
        </div>
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
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Periodicidade"
            value={periodicidade}
            onChange={(e) => setPeriodicidade(e.target.value as PeriodicidadeArrendamento)}
          >
            <option value="Anual">Anual</option>
            <option value="Mensal">Mensal</option>
            <option value="Por Safra">Por Safra</option>
          </Select>
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as StatusArrendamento)}>
            <option value="ATIVO">ATIVO</option>
            <option value="ENCERRADO">ENCERRADO</option>
          </Select>
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={renovavel}
            onChange={(e) => setRenovavel(e.target.checked)}
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
          />
          Contrato renovável
        </label>
        <Textarea
          label="Observações"
          rows={3}
          placeholder="Cláusulas especiais..."
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
        />

        <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full">
            Cancelar
          </Button>
          <Button type="submit" variant="primary" className="w-full">
            {editingArrendamento ? 'Salvar' : 'Cadastrar'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
};
