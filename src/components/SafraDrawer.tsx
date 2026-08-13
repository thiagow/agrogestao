import React, { useState, useEffect } from 'react';
import { CulturaSafraAno } from '../types';
import { calcularSafra, formatCurrency } from '../data/initialData';
import { Drawer, Input, Select, Button } from './ui';
import { GerenciarCulturasModal } from './GerenciarCulturasModal';
import type { Cultura } from '../types';

interface SafraDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<CulturaSafraAno>) => void;
  editingSafra?: CulturaSafraAno | null;
  culturas: Cultura[];
  onSaveCultura: (input: { nome: string; unidadeMedida: string }) => Promise<Cultura>;
  onDeleteCultura: (id: string) => Promise<void>;
  anosSafraDisponiveis: string[];
}

export const SafraDrawer: React.FC<SafraDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  editingSafra,
  culturas,
  onSaveCultura,
  onDeleteCultura,
  anosSafraDisponiveis
}) => {
  const [cultura, setCultura] = useState('');
  const [anoSafra, setAnoSafra] = useState('');
  const [hectares, setHectares] = useState('');
  const [haPropria, setHaPropria] = useState('');
  const [haArrendada, setHaArrendada] = useState('0');
  const [rendimento, setRendimento] = useState('');
  const [unidadeProducao, setUnidadeProducao] = useState('sc');
  const [precoMedio, setPrecoMedio] = useState('');
  const [despesa, setDespesa] = useState('');
  const [isGerenciarOpen, setIsGerenciarOpen] = useState(false);
  const [culturasState, setCulturas] = useState<Cultura[]>(culturas);

  useEffect(() => {
    setCulturas(culturas);
  }, [culturas]);

  useEffect(() => {
    if (editingSafra) {
      setCultura(editingSafra.cultura);
      setAnoSafra(editingSafra.anoSafra);
      setHectares(editingSafra.hectares.toString());
      setHaPropria(editingSafra.haPropria.toString());
      setHaArrendada(editingSafra.haArrendada.toString());
      setRendimento(editingSafra.rendimento.toString());
      setUnidadeProducao(editingSafra.unidadeProducao);
      setPrecoMedio(editingSafra.precoMedio.toString());
      setDespesa(editingSafra.despesa.toString());
    } else {
      const primeiraCultura = culturasState[0];
      setCultura(primeiraCultura?.nome ?? '');
      setUnidadeProducao(primeiraCultura?.unidadeMedida ?? 'sc');
      setAnoSafra(anosSafraDisponiveis[anosSafraDisponiveis.length - 1] ?? '');
      setHectares('');
      setHaPropria('');
      setHaArrendada('0');
      setRendimento('');
      setPrecoMedio('');
      setDespesa('');
    }
  }, [editingSafra, isOpen, culturasState, anosSafraDisponiveis]);

  const handleCulturaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const valor = e.target.value;
    if (valor === '__nova__') {
      setIsGerenciarOpen(true);
      return;
    }
    setCultura(valor);
    // Auto-preenche unidade a partir da cultura selecionada
    const culturaSelecionada = culturasState.find((c) => c.nome === valor);
    if (culturaSelecionada) {
      setUnidadeProducao(culturaSelecionada.unidadeMedida);
    }
  };

  const handleCulturaCriada = (novaCultura: Cultura) => {
    setCulturas([...culturasState, novaCultura]);
    setCultura(novaCultura.nome);
    setUnidadeProducao(novaCultura.unidadeMedida);
  };

  const preview = calcularSafra({
    id: 'preview',
    cultura,
    anoSafra,
    hectares: parseFloat(hectares) || 0,
    haPropria: parseFloat(haPropria) || 0,
    haArrendada: parseFloat(haArrendada) || 0,
    rendimento: parseFloat(rendimento) || 0,
    unidadeProducao,
    precoMedio: parseFloat(precoMedio) || 0,
    despesa: parseFloat(despesa) || 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cultura || !anoSafra) return;

    onSave({
      id: editingSafra?.id,
      cultura,
      anoSafra,
      hectares: parseFloat(hectares) || 0,
      haPropria: parseFloat(haPropria) || 0,
      haArrendada: parseFloat(haArrendada) || 0,
      rendimento: parseFloat(rendimento) || 0,
      unidadeProducao,
      precoMedio: parseFloat(precoMedio) || 0,
      despesa: parseFloat(despesa) || 0
    });

    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={editingSafra ? 'Editar Safra' : 'Nova Safra'}
      subtitle="Planejamento de produção por cultura e ano-safra"
    >
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        <Select label="Cultura" required value={cultura} onChange={handleCulturaChange}>
          {culturasState.length === 0 && <option value="">Nenhuma cultura cadastrada</option>}
          {culturasState.length > 0 && (
            <>
              <optgroup label="Culturas Padrão">
                {culturasState
                  .filter((c) => c.contaId === null)
                  .map((c) => (
                    <option key={c.id} value={c.nome}>
                      {c.nome}
                    </option>
                  ))}
              </optgroup>
              {culturasState.some((c) => c.contaId !== null) && (
                <optgroup label="Culturas Personalizadas">
                  {culturasState
                    .filter((c) => c.contaId !== null)
                    .map((c) => (
                      <option key={c.id} value={c.nome}>
                        {c.nome}
                      </option>
                    ))}
                </optgroup>
              )}
              <option value="__nova__">+ Adicionar nova cultura...</option>
            </>
          )}
        </Select>

        <Input
          label="Ano Safra"
          type="text"
          required
          placeholder="2026/2027"
          value={anoSafra}
          onChange={(e) => setAnoSafra(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Hectares (Total)"
            type="number"
            required
            min={0}
            value={hectares}
            onChange={(e) => setHectares(e.target.value)}
          />
          <Input
            label="Ha Área Própria"
            type="number"
            min={0}
            value={haPropria}
            onChange={(e) => setHaPropria(e.target.value)}
          />
        </div>

        <Input
          label="Ha Arrendado"
          type="number"
          min={0}
          value={haArrendada}
          onChange={(e) => setHaArrendada(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Rendimento (por ha)"
            type="number"
            required
            min={0}
            step="0.01"
            value={rendimento}
            onChange={(e) => setRendimento(e.target.value)}
          />
          <Input
            label="Unidade"
            type="text"
            placeholder="sc, kg, ton, @, m³"
            value={unidadeProducao}
            onChange={(e) => setUnidadeProducao(e.target.value)}
          />
        </div>

        <Input
          label="Preço Médio (R$/unidade)"
          type="number"
          required
          min={0}
          step="0.01"
          value={precoMedio}
          onChange={(e) => setPrecoMedio(e.target.value)}
        />

        <Input
          label="Despesa (R$)"
          type="number"
          required
          min={0}
          value={despesa}
          onChange={(e) => setDespesa(e.target.value)}
        />

        <div className="pt-3 border-t border-slate-200 space-y-1.5 text-xs">
          <p className="text-[11px] font-bold uppercase text-slate-500">Calculado automaticamente</p>
          <div className="flex justify-between text-slate-600">
            <span>Total de Produção</span>
            <span className="font-semibold text-slate-800">
              {preview.totalProducao.toLocaleString('pt-BR')} {unidadeProducao}
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Receita Bruta</span>
            <span className="font-semibold text-slate-800">{formatCurrency(preview.receitaBruta)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Receita Líquida</span>
            <span className="font-semibold text-slate-800">{formatCurrency(preview.receitaLiquida)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Margem</span>
            <span className="font-semibold text-slate-800">{preview.margem.toFixed(1)}%</span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full">
            Cancelar
          </Button>
          <Button type="submit" variant="primary" className="w-full">
            {editingSafra ? 'Salvar' : 'Cadastrar'}
          </Button>
        </div>
      </form>

      <GerenciarCulturasModal
        isOpen={isGerenciarOpen}
        onClose={() => setIsGerenciarOpen(false)}
        culturas={culturasState}
        onSave={onSaveCultura}
        onDelete={onDeleteCultura}
        onCulturaCriada={handleCulturaCriada}
      />
    </Drawer>
  );
};
