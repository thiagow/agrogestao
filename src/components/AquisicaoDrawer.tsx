'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Aquisicao, TipoPagamentoAquisicao, Cultura } from '../types';
import { Drawer, Input, Select, Button, Badge } from './ui';
import { listCulturas } from '../server/culturas';
import { listarSafrasCobertas } from '../lib/aquisicao-engine';
import { formatCurrency } from '../data/initialData';

interface AquisicaoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Aquisicao>) => void;
  editingAquisicao?: Aquisicao | null;
}

// Lista fechada de UFs — não é uma spec de negócio própria, é o alfabeto de
// estados brasileiros.
const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

function diffMeses(inicioISO: string, fimISO: string): number {
  if (!inicioISO || !fimISO) return 0;
  const inicio = new Date(inicioISO);
  const fim = new Date(fimISO);
  return Math.max((fim.getFullYear() - inicio.getFullYear()) * 12 + (fim.getMonth() - inicio.getMonth()), 0);
}

export const AquisicaoDrawer: React.FC<AquisicaoDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  editingAquisicao
}) => {
  // 1. Identificação
  const [nomeFazenda, setNomeFazenda] = useState('');
  const [vendedor, setVendedor] = useState('');
  const [denominacaoImovel, setDenominacaoImovel] = useState('');
  const [comarca, setComarca] = useState('');
  const [numeroMatricula, setNumeroMatricula] = useState('');
  const [estado, setEstado] = useState('GO');
  const [municipio, setMunicipio] = useState('');

  // 2. Área
  const [areaTotalHa, setAreaTotalHa] = useState('');
  const [areaAgricolaHa, setAreaAgricolaHa] = useState('');

  // 3. Contrato
  const [dataAquisicao, setDataAquisicao] = useState('');
  const [dataInicioPagamento, setDataInicioPagamento] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [prazoFinanciamentoMeses, setPrazoFinanciamentoMeses] = useState('');
  const [prazoEditadoManualmente, setPrazoEditadoManualmente] = useState(false);

  // 4. Condições de Pagamento
  const [tipoPagamento, setTipoPagamento] = useState<TipoPagamentoAquisicao>('SACAS');
  const [periodicidade, setPeriodicidade] = useState('Anual');
  const [culturaReferenciaId, setCulturaReferenciaId] = useState('');
  const [sacasHa, setSacasHa] = useState('');
  const [precoReferencia, setPrecoReferencia] = useState('');
  const [precoHa, setPrecoHa] = useState('');
  const [valorTotalManual, setValorTotalManual] = useState('');
  const [valorTotalEditadoManualmente, setValorTotalEditadoManualmente] = useState(false);
  const [valorFinanciado, setValorFinanciado] = useState('');
  const [taxaJurosAA, setTaxaJurosAA] = useState('');

  // 5. Entrada (Sinal)
  const [valorEntrada, setValorEntrada] = useState('');
  const [safraEntrada, setSafraEntrada] = useState('');

  const [culturas, setCulturas] = useState<Cultura[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    listCulturas().then(setCulturas).catch(() => setCulturas([]));
  }, [isOpen]);

  useEffect(() => {
    if (editingAquisicao) {
      setNomeFazenda(editingAquisicao.nomeFazenda);
      setVendedor(editingAquisicao.vendedor ?? '');
      setDenominacaoImovel(editingAquisicao.denominacaoImovel ?? '');
      setComarca(editingAquisicao.comarca ?? '');
      setNumeroMatricula(editingAquisicao.numeroMatricula ?? '');
      setEstado(editingAquisicao.estado);
      setMunicipio(editingAquisicao.municipio);
      setAreaTotalHa(editingAquisicao.areaTotalHa.toString());
      setAreaAgricolaHa(editingAquisicao.areaAgricolaHa.toString());
      setDataAquisicao(editingAquisicao.dataAquisicao);
      setDataInicioPagamento(editingAquisicao.dataInicioPagamento);
      setDataVencimento(editingAquisicao.dataVencimento);
      setPrazoFinanciamentoMeses(editingAquisicao.prazoFinanciamentoMeses?.toString() ?? '');
      setPrazoEditadoManualmente(true);
      setTipoPagamento(editingAquisicao.tipoPagamento);
      setPeriodicidade(editingAquisicao.periodicidade);
      setCulturaReferenciaId(editingAquisicao.culturaReferenciaId ?? '');
      setSacasHa(editingAquisicao.sacasHa?.toString() ?? '');
      setPrecoReferencia(editingAquisicao.precoReferencia?.toString() ?? '');
      setPrecoHa(editingAquisicao.precoHa?.toString() ?? '');
      setValorTotalManual(editingAquisicao.valorTotalManual?.toString() ?? '');
      setValorTotalEditadoManualmente(true);
      setValorFinanciado(editingAquisicao.valorFinanciado?.toString() ?? '');
      setTaxaJurosAA(editingAquisicao.taxaJurosAA?.toString() ?? '');
      setValorEntrada(editingAquisicao.valorEntrada?.toString() ?? '');
      setSafraEntrada(editingAquisicao.safraEntrada ?? '');
    } else {
      setNomeFazenda('');
      setVendedor('');
      setDenominacaoImovel('');
      setComarca('');
      setNumeroMatricula('');
      setEstado('GO');
      setMunicipio('');
      setAreaTotalHa('');
      setAreaAgricolaHa('');
      setDataAquisicao(new Date().toISOString().split('T')[0]);
      setDataInicioPagamento('');
      setDataVencimento('');
      setPrazoFinanciamentoMeses('');
      setPrazoEditadoManualmente(false);
      setTipoPagamento('SACAS');
      setPeriodicidade('Anual');
      setCulturaReferenciaId('');
      setSacasHa('');
      setPrecoReferencia('');
      setPrecoHa('');
      setValorTotalManual('');
      setValorTotalEditadoManualmente(false);
      setValorFinanciado('');
      setTaxaJurosAA('');
      setValorEntrada('');
      setSafraEntrada('');
    }
  }, [editingAquisicao, isOpen]);

  // Safra inicial/final derivadas ao vivo das datas — corrige o BUG #2 da spec
  // (Prazo de Financiamento nunca era auto-calculado no AgroFlow original).
  const safrasCobertas = useMemo(
    () => listarSafrasCobertas(dataInicioPagamento, dataVencimento),
    [dataInicioPagamento, dataVencimento]
  );
  const safraInicial = safrasCobertas[0];
  const safraFinal = safrasCobertas[safrasCobertas.length - 1];

  useEffect(() => {
    if (prazoEditadoManualmente) return;
    const meses = diffMeses(dataInicioPagamento, dataVencimento);
    if (meses > 0) setPrazoFinanciamentoMeses(meses.toString());
  }, [dataInicioPagamento, dataVencimento, prazoEditadoManualmente]);

  const areaTotalNum = parseFloat(areaTotalHa) || 0;
  const sacasHaNum = parseFloat(sacasHa) || 0;
  const precoReferenciaNum = parseFloat(precoReferencia) || 0;
  const totalSacasSafra = sacasHaNum * areaTotalNum;
  const valorEstimadoTotal = totalSacasSafra * precoReferenciaNum;
  const precoHaEquivalente = sacasHaNum * precoReferenciaNum;

  const precoHaNum = parseFloat(precoHa) || 0;
  useEffect(() => {
    if (valorTotalEditadoManualmente) return;
    if (precoHaNum > 0 && areaTotalNum > 0) {
      setValorTotalManual((precoHaNum * areaTotalNum).toFixed(2));
    }
  }, [precoHaNum, areaTotalNum, valorTotalEditadoManualmente]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeFazenda.trim()) return;

    onSave({
      id: editingAquisicao?.id,
      nomeFazenda: nomeFazenda.trim(),
      vendedor: vendedor.trim() || undefined,
      denominacaoImovel: denominacaoImovel.trim() || undefined,
      comarca: comarca.trim() || undefined,
      numeroMatricula: numeroMatricula.trim() || undefined,
      estado,
      municipio: municipio.trim(),
      areaTotalHa: areaTotalNum,
      areaAgricolaHa: parseFloat(areaAgricolaHa) || 0,
      dataAquisicao,
      dataInicioPagamento,
      dataVencimento,
      prazoFinanciamentoMeses: prazoFinanciamentoMeses ? parseInt(prazoFinanciamentoMeses, 10) : undefined,
      tipoPagamento,
      periodicidade,
      culturaReferenciaId: tipoPagamento === 'SACAS' ? culturaReferenciaId || undefined : undefined,
      sacasHa: tipoPagamento === 'SACAS' ? sacasHaNum : undefined,
      precoReferencia: tipoPagamento === 'SACAS' ? precoReferenciaNum : undefined,
      precoHa: tipoPagamento === 'REAIS' ? precoHaNum : undefined,
      valorTotalManual: tipoPagamento === 'REAIS' ? parseFloat(valorTotalManual) || undefined : undefined,
      valorFinanciado: tipoPagamento === 'REAIS' ? parseFloat(valorFinanciado) || undefined : undefined,
      taxaJurosAA: tipoPagamento === 'REAIS' ? parseFloat(taxaJurosAA) || undefined : undefined,
      valorEntrada: parseFloat(valorEntrada) || undefined,
      safraEntrada: safraEntrada || undefined
    });

    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={editingAquisicao ? 'Editar Aquisição' : 'Registrar Aquisição de Fazenda'}
      subtitle="Registro e fluxo de pagamento de compra de propriedade rural"
    >
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-emerald-700 border-b border-slate-200 pb-1.5">1. Identificação</h3>
          <Input
            label="Nome da Fazenda *"
            type="text"
            required
            placeholder="Ex: Fazenda Santa Cruz"
            value={nomeFazenda}
            onChange={(e) => setNomeFazenda(e.target.value)}
          />
          <Input
            label="Vendedor / Proprietário"
            type="text"
            placeholder="Nome do vendedor"
            value={vendedor}
            onChange={(e) => setVendedor(e.target.value)}
          />
          <Input
            label="Denominação do Imóvel"
            type="text"
            placeholder="Denominação conforme matrícula"
            value={denominacaoImovel}
            onChange={(e) => setDenominacaoImovel(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Comarca"
              type="text"
              value={comarca}
              onChange={(e) => setComarca(e.target.value)}
            />
            <Input
              label="Nº da Matrícula"
              type="text"
              value={numeroMatricula}
              onChange={(e) => setNumeroMatricula(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
              {UFS.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </Select>
            <Input
              label="Município"
              type="text"
              required
              placeholder="Cidade"
              value={municipio}
              onChange={(e) => setMunicipio(e.target.value)}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-bold text-emerald-700 border-b border-slate-200 pb-1.5">2. Área</h3>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Área Total (ha)"
              type="number"
              required
              min={0}
              step="0.0001"
              placeholder="0,00"
              value={areaTotalHa}
              onChange={(e) => setAreaTotalHa(e.target.value)}
            />
            <Input
              label="Área Agrícola (ha)"
              type="number"
              min={0}
              step="0.0001"
              placeholder="0,00"
              value={areaAgricolaHa}
              onChange={(e) => setAreaAgricolaHa(e.target.value)}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-bold text-emerald-700 border-b border-slate-200 pb-1.5">3. Contrato</h3>
          <Input
            label="Data da Aquisição"
            type="date"
            required
            value={dataAquisicao}
            onChange={(e) => setDataAquisicao(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input
                label="Data de Início do Pagamento"
                type="date"
                required
                value={dataInicioPagamento}
                onChange={(e) => setDataInicioPagamento(e.target.value)}
              />
              {safraInicial && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Safra inicial: <span className="font-bold text-slate-700">{safraInicial}</span>
                </p>
              )}
            </div>
            <div>
              <Input
                label="Data de Vencimento (Fim do Pagamento)"
                type="date"
                required
                value={dataVencimento}
                onChange={(e) => setDataVencimento(e.target.value)}
              />
              {safraFinal && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Safra final: <span className="font-bold text-slate-700">{safraFinal}</span>
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

          {safrasCobertas.length > 0 && (
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

          <Input
            label="Prazo de Financiamento (meses)"
            type="number"
            min={0}
            placeholder="Ex: 60"
            value={prazoFinanciamentoMeses}
            onChange={(e) => {
              setPrazoEditadoManualmente(true);
              setPrazoFinanciamentoMeses(e.target.value);
            }}
            hint="Sugerido automaticamente a partir do intervalo entre as datas acima — pode ser ajustado."
          />
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-bold text-emerald-700 border-b border-slate-200 pb-1.5">
            4. Condições de Pagamento
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
            <Select label="Periodicidade" value={periodicidade} onChange={(e) => setPeriodicidade(e.target.value)}>
              <option value="Anual">Anual</option>
            </Select>
          </div>

          {tipoPagamento === 'SACAS' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Cultura de Referência"
                  value={culturaReferenciaId}
                  onChange={(e) => setCulturaReferenciaId(e.target.value)}
                >
                  <option value="">Selecione…</option>
                  {culturas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </Select>
                <div>
                  <Input
                    label="Sacas/ha"
                    type="number"
                    min={0}
                    step="0.0001"
                    value={sacasHa}
                    onChange={(e) => setSacasHa(e.target.value)}
                  />
                  {totalSacasSafra > 0 && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      Total: <span className="font-bold text-slate-700">{Math.round(totalSacasSafra).toLocaleString('pt-BR')} sc/safra</span>
                    </p>
                  )}
                </div>
              </div>
              <Input
                label="Preço de Referência (R$/sc)"
                type="number"
                min={0}
                step="0.0001"
                value={precoReferencia}
                onChange={(e) => setPrecoReferencia(e.target.value)}
              />
              {valorEstimadoTotal > 0 && (
                <div className="rounded-xl bg-slate-50 border border-slate-200/80 px-4 py-3">
                  <p className="text-[11px] text-slate-500">Valor estimado total</p>
                  <p className="text-lg font-extrabold text-slate-900">{formatCurrency(valorEstimadoTotal)}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {precoHaEquivalente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/ha × {areaTotalNum.toLocaleString('pt-BR')} ha
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
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
                  hint="Sugerido a partir de Preço/ha × Área Total — pode ser ajustado."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Valor Financiado (R$)"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0,00"
                  value={valorFinanciado}
                  onChange={(e) => setValorFinanciado(e.target.value)}
                />
                <Input
                  label="Taxa de Juros (% a.a.)"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0,00"
                  value={taxaJurosAA}
                  onChange={(e) => setTaxaJurosAA(e.target.value)}
                  hint="Amortização PRICE, parcela anual constante."
                />
              </div>
            </>
          )}
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-bold text-emerald-700 border-b border-slate-200 pb-1.5">5. Entrada (Sinal)</h3>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Valor da Entrada (R$)"
              type="number"
              min={0}
              step="0.01"
              placeholder="0,00"
              value={valorEntrada}
              onChange={(e) => setValorEntrada(e.target.value)}
            />
            <Select label="Safra da Entrada" value={safraEntrada} onChange={(e) => setSafraEntrada(e.target.value)}>
              <option value="">Selecione…</option>
              {safrasCobertas.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
        </section>

        <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full">
            Cancelar
          </Button>
          <Button type="submit" variant="primary" className="w-full">
            Salvar Aquisição
          </Button>
        </div>
      </form>
    </Drawer>
  );
};
