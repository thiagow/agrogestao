import React, { useState, useEffect } from 'react';
import { CulturaSafraAno } from '../types';
import { calcularSafra } from '../lib/agro';
import { formatCurrency } from '../data/initialData';
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
  /** Opções fechadas de "Ano Safra" (safras já cadastradas + atual + próxima) — nunca texto livre (10/09/2026). */
  anosSafraDisponiveis: string[];
  /** Safra vigente da conta — default do select ao criar (sem preset). */
  safraAtual?: string | null;
  /** Pré-seleciona cultura/ano ao abrir em modo "novo" (atalho de "Adicionar" numa coluna de ano vazia) — ignorado se `editingSafra` estiver definido. */
  presetCultura?: string;
  presetAnoSafra?: string;
}

export const SafraDrawer: React.FC<SafraDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  editingSafra,
  culturas,
  onSaveCultura,
  onDeleteCultura,
  anosSafraDisponiveis,
  safraAtual,
  presetCultura,
  presetAnoSafra
}) => {
  const [cultura, setCultura] = useState('');
  const [anoSafra, setAnoSafra] = useState('');
  const [haPropria, setHaPropria] = useState('');
  const [haArrendada, setHaArrendada] = useState('0');
  const [rendimento, setRendimento] = useState('');
  const [unidadeProducao, setUnidadeProducao] = useState('sc');
  const [precoMedio, setPrecoMedio] = useState('');
  const [custoProducao, setCustoProducao] = useState('');
  const [custoPlantioInicio, setCustoPlantioInicio] = useState('');
  const [custoPlantioFim, setCustoPlantioFim] = useState('');
  const [colheitaInicio, setColheitaInicio] = useState('');
  const [colheitaFim, setColheitaFim] = useState('');
  const [isGerenciarOpen, setIsGerenciarOpen] = useState(false);
  const [culturasState, setCulturas] = useState<Cultura[]>(culturas);

  useEffect(() => {
    setCulturas(culturas);
  }, [culturas]);

  useEffect(() => {
    if (editingSafra) {
      setCultura(editingSafra.cultura);
      setAnoSafra(editingSafra.anoSafra);
      setHaPropria(editingSafra.haPropria.toString());
      setHaArrendada(editingSafra.haArrendada.toString());
      setRendimento(editingSafra.rendimento.toString());
      setUnidadeProducao(editingSafra.unidadeProducao);
      setPrecoMedio(editingSafra.precoMedio.toString());
      setCustoProducao(editingSafra.custoProducao.toString());
      setCustoPlantioInicio(editingSafra.custoPlantioInicio ?? '');
      setCustoPlantioFim(editingSafra.custoPlantioFim ?? '');
      setColheitaInicio(editingSafra.colheitaInicio ?? '');
      setColheitaFim(editingSafra.colheitaFim ?? '');
    } else {
      const culturaSelecionada = presetCultura ? culturasState.find((c) => c.nome === presetCultura) : culturasState[0];
      setCultura(culturaSelecionada?.nome ?? presetCultura ?? '');
      setUnidadeProducao(culturaSelecionada?.unidadeMedida ?? 'sc');
      setAnoSafra(presetAnoSafra ?? safraAtual ?? anosSafraDisponiveis[anosSafraDisponiveis.length - 1] ?? '');
      setHaPropria('');
      setHaArrendada('0');
      setRendimento('');
      setPrecoMedio('');
      setCustoProducao('');
      setCustoPlantioInicio('');
      setCustoPlantioFim('');
      setColheitaInicio('');
      setColheitaFim('');
    }
  }, [editingSafra, isOpen, culturasState, anosSafraDisponiveis, safraAtual, presetCultura, presetAnoSafra]);

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

  // Total de Hectares deixou de ser digitado: é sempre a soma de Própria +
  // Arrendada, calculada ao vivo (10/09/2026) — nunca pode divergir da soma.
  const hectares = (parseFloat(haPropria) || 0) + (parseFloat(haArrendada) || 0);

  const preview = calcularSafra({
    hectares,
    rendimento: parseFloat(rendimento) || 0,
    precoMedio: parseFloat(precoMedio) || 0,
    custoProducao: parseFloat(custoProducao) || 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cultura || !anoSafra) return;

    onSave({
      id: editingSafra?.id,
      cultura,
      anoSafra,
      hectares,
      haPropria: parseFloat(haPropria) || 0,
      haArrendada: parseFloat(haArrendada) || 0,
      rendimento: parseFloat(rendimento) || 0,
      unidadeProducao,
      precoMedio: parseFloat(precoMedio) || 0,
      custoProducao: parseFloat(custoProducao) || 0,
      custoPlantioInicio: custoPlantioInicio || undefined,
      custoPlantioFim: custoPlantioFim || undefined,
      colheitaInicio: colheitaInicio || undefined,
      colheitaFim: colheitaFim || undefined
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

        <Select label="Ano Safra" required value={anoSafra} onChange={(e) => setAnoSafra(e.target.value)}>
          {anosSafraDisponiveis.length === 0 && <option value="">Nenhuma safra cadastrada</option>}
          {anosSafraDisponiveis.map((ano) => (
            <option key={ano} value={ano}>
              {ano}
            </option>
          ))}
        </Select>

        <div className="pt-2 pb-1 flex items-center gap-2">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-[11px] font-bold uppercase text-slate-500">Custos &amp; Plantio</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Ha Área Própria"
            type="number"
            min={0}
            value={haPropria}
            onChange={(e) => setHaPropria(e.target.value)}
          />
          <Input
            label="Ha Arrendado"
            type="number"
            min={0}
            value={haArrendada}
            onChange={(e) => setHaArrendada(e.target.value)}
          />
        </div>

        <Input
          label="Hectares (Total)"
          type="text"
          disabled
          value={`${hectares.toLocaleString('pt-BR')} ha`}
          hint="Somado automaticamente: Área Própria + Arrendada"
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
          label="Custo de Produção (R$/Há)"
          type="number"
          required
          min={0}
          step="0.01"
          value={custoProducao}
          onChange={(e) => setCustoProducao(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Início do Custeio/Plantio"
            type="date"
            value={custoPlantioInicio}
            onChange={(e) => setCustoPlantioInicio(e.target.value)}
          />
          <Input
            label="Fim do Custeio/Plantio"
            type="date"
            value={custoPlantioFim}
            onChange={(e) => setCustoPlantioFim(e.target.value)}
          />
        </div>
        <p className="text-[11px] text-slate-500 -mt-2">
          Opcional — sem preenchimento, o Fluxo Mensal usa o calendário agrícola genérico da região.
        </p>

        <div className="pt-2 pb-1 flex items-center gap-2">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-[11px] font-bold uppercase text-slate-500">Colheita &amp; Comercialização</span>
          <span className="h-px flex-1 bg-slate-200" />
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

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Início da Colheita/Comercialização"
            type="date"
            value={colheitaInicio}
            onChange={(e) => setColheitaInicio(e.target.value)}
          />
          <Input
            label="Fim da Colheita/Comercialização"
            type="date"
            value={colheitaFim}
            onChange={(e) => setColheitaFim(e.target.value)}
          />
        </div>
        <p className="text-[11px] text-slate-500 -mt-2">
          Opcional — sem preenchimento, o Fluxo Mensal usa o calendário agrícola genérico da região.
        </p>

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
            <span>Despesa</span>
            <span className="font-semibold text-slate-800">{formatCurrency(preview.despesa)}</span>
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
