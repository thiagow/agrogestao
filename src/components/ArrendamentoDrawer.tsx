'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ContratoArrendamento, TipoPagamentoAquisicao, StatusArrendamento, Cultura } from '../types';
import { Drawer, Input, Select, Textarea, Button, Badge } from './ui';
import { listCulturas } from '../server/culturas';
import { listarSafrasCobertas } from '../lib/safra-periodo';
import { formatCurrency } from '../data/initialData';

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
  // 1. Identificação
  const [nomeFazenda, setNomeFazenda] = useState('');
  const [proprietario, setProprietario] = useState('');
  const [denominacaoImovel, setDenominacaoImovel] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [comarca, setComarca] = useState('');
  const [numeroMatricula, setNumeroMatricula] = useState('');

  // 2. Área
  const [areaTotalHa, setAreaTotalHa] = useState('');
  const [areaArrendadaHa, setAreaArrendadaHa] = useState('');

  // 3. Contrato
  const [dataInicio, setDataInicio] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');

  // 4. Condições Econômicas e Pagamento
  const [tipoPagamento, setTipoPagamento] = useState<TipoPagamentoAquisicao>('SACAS');
  const [periodicidade, setPeriodicidade] = useState<ContratoArrendamento['periodicidade']>('Anual');
  const [culturaReferenciaId, setCulturaReferenciaId] = useState('');
  const [sacasHa, setSacasHa] = useState('');
  const [precoReferencia, setPrecoReferencia] = useState('');
  const [precoHa, setPrecoHa] = useState('');
  const [valorTotalManual, setValorTotalManual] = useState('');
  const [valorTotalEditadoManualmente, setValorTotalEditadoManualmente] = useState(false);

  // 5. Pagamento Antecipado
  const [possuiPagamentoAntecipado, setPossuiPagamentoAntecipado] = useState(false);
  const [valorAntecipado, setValorAntecipado] = useState('');
  const [dataPagamentoAntecipado, setDataPagamentoAntecipado] = useState('');
  const [safraReferenciaAntecipacao, setSafraReferenciaAntecipacao] = useState('');

  const [status, setStatus] = useState<StatusArrendamento>('ATIVO');
  const [observacoes, setObservacoes] = useState('');

  const [culturas, setCulturas] = useState<Cultura[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    listCulturas().then(setCulturas).catch(() => setCulturas([]));
  }, [isOpen]);

  useEffect(() => {
    if (editingArrendamento) {
      setNomeFazenda(editingArrendamento.nomeFazenda);
      setProprietario(editingArrendamento.proprietario ?? '');
      setDenominacaoImovel(editingArrendamento.denominacaoImovel ?? '');
      setMunicipio(editingArrendamento.municipio ?? '');
      setComarca(editingArrendamento.comarca ?? '');
      setNumeroMatricula(editingArrendamento.numeroMatricula ?? '');
      setAreaTotalHa(editingArrendamento.areaTotalHa?.toString() ?? '');
      setAreaArrendadaHa(editingArrendamento.areaArrendadaHa.toString());
      setDataInicio(editingArrendamento.dataInicio);
      setDataVencimento(editingArrendamento.dataVencimento);
      setTipoPagamento(editingArrendamento.tipoPagamento);
      setPeriodicidade(editingArrendamento.periodicidade as ContratoArrendamento['periodicidade']);
      setCulturaReferenciaId(editingArrendamento.culturaReferenciaId ?? '');
      setSacasHa(editingArrendamento.sacasHa?.toString() ?? '');
      setPrecoReferencia(editingArrendamento.precoReferencia?.toString() ?? '');
      setPrecoHa(editingArrendamento.precoHa?.toString() ?? '');
      setValorTotalManual(editingArrendamento.valorTotalManual?.toString() ?? '');
      setValorTotalEditadoManualmente(true);
      setPossuiPagamentoAntecipado(editingArrendamento.possuiPagamentoAntecipado);
      setValorAntecipado(editingArrendamento.valorAntecipado?.toString() ?? '');
      setDataPagamentoAntecipado(editingArrendamento.dataPagamentoAntecipado ?? '');
      setSafraReferenciaAntecipacao(editingArrendamento.safraReferenciaAntecipacao ?? '');
      setStatus(editingArrendamento.status);
      setObservacoes(editingArrendamento.observacoes ?? '');
    } else {
      setNomeFazenda('');
      setProprietario('');
      setDenominacaoImovel('');
      setMunicipio('');
      setComarca('');
      setNumeroMatricula('');
      setAreaTotalHa('');
      setAreaArrendadaHa('');
      setDataInicio(new Date().toISOString().split('T')[0]);
      setDataVencimento('');
      setTipoPagamento('SACAS');
      setPeriodicidade('Anual');
      setCulturaReferenciaId('');
      setSacasHa('');
      setPrecoReferencia('');
      setPrecoHa('');
      setValorTotalManual('');
      setValorTotalEditadoManualmente(false);
      setPossuiPagamentoAntecipado(false);
      setValorAntecipado('');
      setDataPagamentoAntecipado('');
      setSafraReferenciaAntecipacao('');
      setStatus('ATIVO');
      setObservacoes('');
    }
  }, [editingArrendamento, isOpen]);

  // Safra inicial/final CALCULADAS a partir das datas — nunca mais texto livre
  // digitado à mão (era o campo safraInicio/safraFim antigo, sem validação).
  const safrasCobertas = useMemo(
    () => listarSafrasCobertas(dataInicio, dataVencimento),
    [dataInicio, dataVencimento]
  );
  const safraInicial = safrasCobertas[0];
  const safraFinal = safrasCobertas[safrasCobertas.length - 1];

  const areaArrendadaNum = parseFloat(areaArrendadaHa) || 0;
  const sacasHaNum = parseFloat(sacasHa) || 0;
  const precoReferenciaNum = parseFloat(precoReferencia) || 0;
  const sacasPorSafra = sacasHaNum * areaArrendadaNum;
  const valorEstimadoTotal = sacasPorSafra * precoReferenciaNum;
  const valorHaEquivalente = sacasHaNum * precoReferenciaNum;

  const precoHaNum = parseFloat(precoHa) || 0;
  useEffect(() => {
    if (valorTotalEditadoManualmente) return;
    if (precoHaNum > 0 && areaArrendadaNum > 0) {
      setValorTotalManual((precoHaNum * areaArrendadaNum).toFixed(2));
    }
  }, [precoHaNum, areaArrendadaNum, valorTotalEditadoManualmente]);

  const rotuloValorAntecipado = tipoPagamento === 'SACAS' ? 'Valor Antecipado (sacas)' : 'Valor Antecipado (R$)';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeFazenda.trim()) return;

    onSave({
      id: editingArrendamento?.id,
      nomeFazenda: nomeFazenda.trim(),
      proprietario: proprietario.trim() || undefined,
      denominacaoImovel: denominacaoImovel.trim() || undefined,
      municipio: municipio.trim() || undefined,
      comarca: comarca.trim() || undefined,
      numeroMatricula: numeroMatricula.trim() || undefined,
      areaTotalHa: areaTotalHa ? parseFloat(areaTotalHa) : undefined,
      areaArrendadaHa: areaArrendadaNum,
      dataInicio,
      dataVencimento,
      tipoPagamento,
      periodicidade,
      culturaReferenciaId: tipoPagamento === 'SACAS' ? culturaReferenciaId || undefined : undefined,
      sacasHa: tipoPagamento === 'SACAS' ? sacasHaNum : undefined,
      precoReferencia: tipoPagamento === 'SACAS' && precoReferencia ? precoReferenciaNum : undefined,
      precoHa: tipoPagamento === 'REAIS' ? precoHaNum : undefined,
      valorTotalManual: tipoPagamento === 'REAIS' ? parseFloat(valorTotalManual) || undefined : undefined,
      possuiPagamentoAntecipado,
      valorAntecipado: possuiPagamentoAntecipado ? parseFloat(valorAntecipado) || undefined : undefined,
      dataPagamentoAntecipado: possuiPagamentoAntecipado ? dataPagamentoAntecipado || undefined : undefined,
      safraReferenciaAntecipacao: possuiPagamentoAntecipado ? safraReferenciaAntecipacao || undefined : undefined,
      observacoes: observacoes.trim() || undefined,
      status
    });

    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={editingArrendamento ? 'Editar Contrato de Arrendamento' : 'Cadastrar Contrato de Arrendamento'}
      subtitle="Terras arrendadas de terceiros para produção"
    >
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-emerald-700 border-b border-slate-200 pb-1.5">1. Identificação</h3>
          <Input
            label="Nome da Fazenda / Área *"
            type="text"
            required
            placeholder="Ex: Fazenda Santa Maria"
            value={nomeFazenda}
            onChange={(e) => setNomeFazenda(e.target.value)}
          />
          <Input
            label="Proprietário"
            type="text"
            placeholder="Nome do proprietário"
            value={proprietario}
            onChange={(e) => setProprietario(e.target.value)}
          />
          <Input
            label="Denominação do Imóvel"
            type="text"
            placeholder="Denominação legal"
            value={denominacaoImovel}
            onChange={(e) => setDenominacaoImovel(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Município" type="text" placeholder="Município" value={municipio} onChange={(e) => setMunicipio(e.target.value)} />
            <Input label="Comarca" type="text" placeholder="Comarca" value={comarca} onChange={(e) => setComarca(e.target.value)} />
          </div>
          <Input
            label="Nº Matrícula"
            type="text"
            placeholder="Número da matrícula"
            value={numeroMatricula}
            onChange={(e) => setNumeroMatricula(e.target.value)}
          />
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-bold text-emerald-700 border-b border-slate-200 pb-1.5">2. Área</h3>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Área Total (ha)"
              type="number"
              min={0}
              step="0.0001"
              placeholder="0,00"
              value={areaTotalHa}
              onChange={(e) => setAreaTotalHa(e.target.value)}
            />
            <Input
              label="Área Arrendada (ha) *"
              type="number"
              required
              min={0}
              step="0.0001"
              placeholder="0,00"
              value={areaArrendadaHa}
              onChange={(e) => setAreaArrendadaHa(e.target.value)}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-bold text-emerald-700 border-b border-slate-200 pb-1.5">3. Contrato</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input label="Data de Início" type="date" required value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
              {safraInicial && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Safra inicial calculada: <span className="font-bold text-slate-700">{safraInicial}</span>
                </p>
              )}
            </div>
            <div>
              <Input
                label="Data de Vencimento"
                type="date"
                required
                value={dataVencimento}
                onChange={(e) => setDataVencimento(e.target.value)}
              />
              {safraFinal && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Safra final calculada: <span className="font-bold text-slate-700">{safraFinal}</span>
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-2.5">
            {safrasCobertas.length > 0 ? (
              <p className="text-xs text-slate-700">
                Safras do contrato: <span className="font-bold">{safraInicial} → {safraFinal}</span>
              </p>
            ) : (
              <p className="text-xs text-slate-500 italic">Preencha as datas acima para calcular automaticamente</p>
            )}
          </div>

          {safrasCobertas.length > 1 && (
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1.5">Safras cobertas pelo contrato</p>
              <div className="flex flex-wrap gap-1.5">
                {safrasCobertas.map((s) => (
                  <Badge key={s} tone="emerald">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-bold text-emerald-700 border-b border-slate-200 pb-1.5">
            4. Condições Econômicas e Pagamento
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Tipo de Pagamento"
              value={tipoPagamento}
              onChange={(e) => setTipoPagamento(e.target.value as TipoPagamentoAquisicao)}
            >
              <option value="SACAS">Em Sacas (commodity)</option>
              <option value="REAIS">Em Reais (R$)</option>
            </Select>
            <Select
              label="Periodicidade"
              value={periodicidade}
              onChange={(e) => setPeriodicidade(e.target.value as ContratoArrendamento['periodicidade'])}
            >
              <option value="Anual">Anual</option>
              <option value="Mensal">Mensal</option>
              <option value="Por Safra">Por Safra</option>
            </Select>
          </div>

          {tipoPagamento === 'SACAS' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Select label="Cultura *" value={culturaReferenciaId} onChange={(e) => setCulturaReferenciaId(e.target.value)}>
                  <option value="">Selecione…</option>
                  {culturas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </Select>
                <div>
                  <Input
                    label="Sacas/ha *"
                    type="number"
                    required
                    min={0}
                    step="0.0001"
                    value={sacasHa}
                    onChange={(e) => setSacasHa(e.target.value)}
                  />
                  {sacasPorSafra > 0 && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      Sacas/ano: <span className="font-bold text-slate-700">{Math.round(sacasPorSafra).toLocaleString('pt-BR')} sc</span>
                    </p>
                  )}
                </div>
              </div>
              <Input
                label="Preço de Referência (R$/saca)"
                type="number"
                min={0}
                step="0.0001"
                value={precoReferencia}
                onChange={(e) => setPrecoReferencia(e.target.value)}
                hint="Se deixado em branco, o sistema usa a cotação de mercado da cultura (quando disponível) e sinaliza a origem do preço em toda a tela."
              />
              {valorEstimadoTotal > 0 && (
                <div className="rounded-xl bg-slate-50 border border-slate-200/80 px-4 py-3">
                  <p className="text-[11px] text-slate-500">Custo Anual Total</p>
                  <p className="text-lg font-extrabold text-slate-900">{formatCurrency(valorEstimadoTotal)}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Valor/ha: {valorHaEquivalente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Preço por ha (R$)"
                type="number"
                min={0}
                step="0.01"
                placeholder="0,00"
                value={precoHa}
                onChange={(e) => setPrecoHa(e.target.value)}
              />
              <Input
                label="Valor Total (R$)"
                type="number"
                min={0}
                step="0.01"
                placeholder="0,00"
                value={valorTotalManual}
                onChange={(e) => {
                  setValorTotalEditadoManualmente(true);
                  setValorTotalManual(e.target.value);
                }}
                hint="Sugerido a partir de Preço/ha × Área Arrendada — pode ser ajustado."
              />
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-bold text-emerald-700 border-b border-slate-200 pb-1.5">5. Pagamento Antecipado</h3>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={possuiPagamentoAntecipado}
              onChange={(e) => setPossuiPagamentoAntecipado(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
            />
            Possui pagamento antecipado
          </label>

          {possuiPagamentoAntecipado && (
            <div className="space-y-4 pl-1">
              <Input
                label={rotuloValorAntecipado}
                type="number"
                min={0}
                step="0.01"
                value={valorAntecipado}
                onChange={(e) => setValorAntecipado(e.target.value)}
              />
              <Input
                label="Data do Pagamento Antecipado"
                type="date"
                value={dataPagamentoAntecipado}
                onChange={(e) => setDataPagamentoAntecipado(e.target.value)}
              />
              <Select
                label="Safra de Referência"
                value={safraReferenciaAntecipacao}
                onChange={(e) => setSafraReferenciaAntecipacao(e.target.value)}
              >
                <option value="">Selecione…</option>
                {safrasCobertas.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as StatusArrendamento)}>
              <option value="ATIVO">ATIVO</option>
              <option value="ENCERRADO">ENCERRADO</option>
            </Select>
          </div>
          <Textarea
            label="Observações"
            rows={3}
            placeholder="Cláusulas especiais..."
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
          />
        </section>

        <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full">
            Cancelar
          </Button>
          <Button type="submit" variant="primary" className="w-full">
            Salvar Contrato
          </Button>
        </div>
      </form>
    </Drawer>
  );
};
