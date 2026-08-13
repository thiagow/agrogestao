'use client';

import React, { useState, useEffect } from 'react';
import {
  ContratoBancario,
  TipoOperacaoBancaria,
  TipoTaxaBancaria,
  SistemaAmortizacao,
  PeriodicidadePagamento,
  BaseCalculoJuros,
  TipoCapitalizacao,
  Currency
} from '../types';
import { Drawer, Input, Select, Textarea, Button } from './ui';
import { listCulturas } from '../server/culturas';
import { listSafras } from '../server/safras';
import { calcularTaxaEfetiva, INDICES_VAZIOS, type IndicesVigentes } from '../lib/taxa-efetiva';

interface ContratoBancarioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<ContratoBancario>) => void;
  editingContrato?: ContratoBancario | null;
  /** Índices vigentes, para mostrar a taxa efetiva ao vivo enquanto se digita. */
  indices?: IndicesVigentes;
}

// O campo "Taxa" muda de significado conforme o Tipo de Taxa: é a taxa cheia no
// pré-fixado e o spread sobre o indexador nos demais. O label acompanha — dizer
// "% a.a." num contrato CDI + spread seria enganoso.
const LABEL_TAXA: Record<TipoTaxaBancaria, string> = {
  'Pré-fixado (% a.a.)': 'Taxa (% a.a.) *',
  'CDI + spread': 'Spread sobre o CDI (% a.a.) *',
  'IPCA + spread': 'Spread sobre o IPCA (% a.a.) *',
  'Dólar + juros': 'Juros em USD (% a.a.) *'
};

// Lista fechada de bancos do print "Cadastrar Contrato Bancário" (fotografado pelo
// usuário em 07/08/2026). "Outro" revela um campo de texto livre.
const BANCOS = [
  'Banco do Brasil',
  'Bradesco',
  'Itaú',
  'Santander',
  'Caixa Econômica Federal',
  'Sicredi',
  'Sicoob',
  'BRB',
  'Rabobank',
  'ABC Brasil',
  'Safra',
  'BTG Pactual',
  'C6 Bank',
  'Daycoval',
  'Fibra',
  'Indusval',
  'Industrial',
  'Votorantim',
  'BNB',
  'BASA',
  'BNDES'
];

const TIPOS_OPERACAO: TipoOperacaoBancaria[] = [
  'CUSTEIO AGRICOLA',
  'CUSTEIO PECUARIO',
  'INVESTIMENTO',
  'CAPITAL DE GIRO',
  'CPR',
  'BARTER',
  'PRONAF',
  'PRONAMP',
  'FCO',
  'FNO',
  'FINAME',
  'OUTROS'
];

const TIPOS_TAXA: TipoTaxaBancaria[] = ['Pré-fixado (% a.a.)', 'CDI + spread', 'IPCA + spread', 'Dólar + juros'];

const TIPOS_AMORTIZACAO: { value: SistemaAmortizacao; label: string }[] = [
  { value: 'SAC', label: 'SAC (amortização constante)' },
  { value: 'PRICE', label: 'PRICE (parcela fixa)' },
  { value: 'BULLET', label: 'Bullet (principal no vencimento)' },
  { value: 'JUROS_PERIODICOS', label: 'Juros periódicos + principal no final' }
];

const BASES_CALCULO: BaseCalculoJuros[] = ['252 dias úteis', '360 dias corridos', '365 dias corridos'];
const CAPITALIZACOES: TipoCapitalizacao[] = ['Composta', 'Simples'];

interface OpcaoSelect {
  id: string;
  label: string;
}

export const ContratoBancarioDrawer: React.FC<ContratoBancarioDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  editingContrato,
  indices = INDICES_VAZIOS
}) => {
  const [culturas, setCulturas] = useState<OpcaoSelect[]>([]);
  const [safras, setSafras] = useState<OpcaoSelect[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    listCulturas().then((rows) => setCulturas(rows.map((c) => ({ id: c.id, label: c.nome }))));
    listSafras().then((rows) => setSafras(rows.map((s) => ({ id: s.id, label: s.anoSafra }))));
  }, [isOpen]);

  const [bancoSelecionado, setBancoSelecionado] = useState<string>(BANCOS[0]);
  const [bancoCustom, setBancoCustom] = useState('');
  const [nomeTomador, setNomeTomador] = useState('');
  const [numeroContrato, setNumeroContrato] = useState('');
  const [tipoOperacao, setTipoOperacao] = useState<TipoOperacaoBancaria>('CUSTEIO AGRICOLA');
  const [moeda, setMoeda] = useState<Currency>('BRL');
  const [safraVinculadaId, setSafraVinculadaId] = useState('');
  const [culturaVinculadaId, setCulturaVinculadaId] = useState('');

  const [saldoInicial, setSaldoInicial] = useState('');
  const [saldoAtual, setSaldoAtual] = useState('');
  const [tipoTaxa, setTipoTaxa] = useState<TipoTaxaBancaria>('Pré-fixado (% a.a.)');
  const [taxaJuros, setTaxaJuros] = useState('');
  const [baseCalculo, setBaseCalculo] = useState<BaseCalculoJuros>('360 dias corridos');
  const [capitalizacao, setCapitalizacao] = useState<TipoCapitalizacao>('Composta');

  const [sistemaAmortizacao, setSistemaAmortizacao] = useState<SistemaAmortizacao>('SAC');
  const [periodicidade, setPeriodicidade] = useState<PeriodicidadePagamento>('Mensal');
  const [possuiCarencia, setPossuiCarencia] = useState(false);

  const [dataContratacao, setDataContratacao] = useState('');
  const [inicioPagamento, setInicioPagamento] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');

  const [tipoGarantia, setTipoGarantia] = useState('');
  const [valorGarantia, setValorGarantia] = useState('');

  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (editingContrato) {
      const bancoConhecido = BANCOS.includes(editingContrato.banco);
      setBancoSelecionado(bancoConhecido ? editingContrato.banco : 'Outro');
      setBancoCustom(bancoConhecido ? '' : editingContrato.banco);
      setNomeTomador(editingContrato.nomeTomador ?? '');
      setNumeroContrato(editingContrato.numeroContrato ?? '');
      setTipoOperacao(editingContrato.tipoOperacao);
      setMoeda(editingContrato.moeda);
      setSafraVinculadaId(editingContrato.safraVinculadaId ?? '');
      setCulturaVinculadaId(editingContrato.culturaVinculadaId ?? '');
      setSaldoInicial(editingContrato.saldoInicial.toString());
      setSaldoAtual(editingContrato.saldoAtual.toString());
      setTipoTaxa(editingContrato.tipoTaxa);
      setTaxaJuros(editingContrato.taxaJuros.toString());
      setBaseCalculo(editingContrato.baseCalculo);
      setCapitalizacao(editingContrato.capitalizacao);
      setSistemaAmortizacao(editingContrato.sistemaAmortizacao);
      setPeriodicidade(editingContrato.periodicidade);
      setPossuiCarencia(editingContrato.possuiCarencia);
      setDataContratacao(editingContrato.dataContratacao);
      setInicioPagamento(editingContrato.inicioPagamento ?? '');
      setDataVencimento(editingContrato.dataVencimento);
      setTipoGarantia(editingContrato.tipoGarantia ?? '');
      setValorGarantia(editingContrato.valorGarantia?.toString() ?? '');
      setObservacoes(editingContrato.observacoes ?? '');
    } else {
      setBancoSelecionado(BANCOS[0]);
      setBancoCustom('');
      setNomeTomador('');
      setNumeroContrato('');
      setTipoOperacao('CUSTEIO AGRICOLA');
      setMoeda('BRL');
      setSafraVinculadaId('');
      setCulturaVinculadaId('');
      setSaldoInicial('');
      setSaldoAtual('');
      setTipoTaxa('Pré-fixado (% a.a.)');
      setTaxaJuros('');
      setBaseCalculo('360 dias corridos');
      setCapitalizacao('Composta');
      setSistemaAmortizacao('SAC');
      setPeriodicidade('Mensal');
      setPossuiCarencia(false);
      setDataContratacao(new Date().toISOString().split('T')[0]);
      setInicioPagamento('');
      setDataVencimento('');
      setTipoGarantia('');
      setValorGarantia('');
      setObservacoes('');
    }
  }, [editingContrato, isOpen]);

  const banco = bancoSelecionado === 'Outro' ? bancoCustom.trim() : bancoSelecionado;
  const simboloMoeda = moeda === 'USD' ? 'US$' : 'R$';

  // Memória de cálculo ao vivo: a mesma função pura que o servidor usa para
  // gerar o cronograma, então o que o usuário lê aqui é o que vai ser projetado.
  const taxaEfetiva = calcularTaxaEfetiva(tipoTaxa, parseFloat(taxaJuros) || 0, indices);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!banco) return;

    onSave({
      id: editingContrato?.id,
      banco,
      nomeTomador: nomeTomador.trim() || undefined,
      numeroContrato: numeroContrato.trim() || undefined,
      tipoOperacao,
      safraVinculadaId: safraVinculadaId || undefined,
      culturaVinculadaId: culturaVinculadaId || undefined,
      saldoInicial: parseFloat(saldoInicial) || 0,
      saldoAtual: editingContrato ? parseFloat(saldoAtual) || 0 : parseFloat(saldoInicial) || 0,
      taxaJuros: parseFloat(taxaJuros) || 0,
      tipoTaxa,
      baseCalculo,
      capitalizacao,
      dataContratacao,
      inicioPagamento: inicioPagamento || undefined,
      dataVencimento,
      sistemaAmortizacao,
      periodicidade,
      possuiCarencia,
      tipoGarantia: tipoGarantia.trim() || undefined,
      valorGarantia: valorGarantia ? parseFloat(valorGarantia) || 0 : undefined,
      moeda,
      observacoes: observacoes.trim() || undefined
    });

    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={editingContrato ? 'Editar Contrato Bancário' : 'Cadastrar Contrato Bancário'}
      subtitle="Financiamento, custeio ou CPR junto a instituição financeira"
    >
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
        <div className="space-y-4">
          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Identificação</h4>

          <Select
            label="Banco / Credor *"
            required
            value={bancoSelecionado}
            onChange={(e) => setBancoSelecionado(e.target.value)}
          >
            {BANCOS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
            <option value="Outro">Outro</option>
          </Select>

          {bancoSelecionado === 'Outro' && (
            <Input
              label="Nome do Banco/Credor"
              type="text"
              required
              placeholder="Informe o nome"
              value={bancoCustom}
              onChange={(e) => setBancoCustom(e.target.value)}
            />
          )}

          <Input
            label="Nome do Tomador"
            type="text"
            placeholder="Razão social ou nome"
            value={nomeTomador}
            onChange={(e) => setNomeTomador(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Número do Contrato"
              type="text"
              placeholder="Nº do contrato"
              value={numeroContrato}
              onChange={(e) => setNumeroContrato(e.target.value)}
            />
            <Select
              label="Tipo de Operação"
              value={tipoOperacao}
              onChange={(e) => setTipoOperacao(e.target.value as TipoOperacaoBancaria)}
            >
              {TIPOS_OPERACAO.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select label="Moeda" value={moeda} onChange={(e) => setMoeda(e.target.value as Currency)}>
              <option value="BRL">BRL (Real)</option>
              <option value="USD">USD (Dólar)</option>
            </Select>
            <Select
              label="Safra Vinculada"
              value={safraVinculadaId}
              onChange={(e) => setSafraVinculadaId(e.target.value)}
            >
              <option value="">Nenhuma</option>
              {safras.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>

          <Select
            label="Cultura Vinculada"
            value={culturaVinculadaId}
            onChange={(e) => setCulturaVinculadaId(e.target.value)}
          >
            <option value="">Nenhuma</option>
            {culturas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-200">
          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Condições Financeiras</h4>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={`Valor Contratado (${simboloMoeda})`}
              type="number"
              required
              min={0}
              step="0.01"
              value={saldoInicial}
              onChange={(e) => setSaldoInicial(e.target.value)}
            />
            <Input
              label={`Saldo Devedor Atual (${simboloMoeda}) *`}
              type="number"
              required
              min={0}
              step="0.01"
              value={editingContrato ? saldoAtual : saldoInicial}
              disabled={!editingContrato}
              onChange={(e) => setSaldoAtual(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select label="Tipo de Taxa" value={tipoTaxa} onChange={(e) => setTipoTaxa(e.target.value as TipoTaxaBancaria)}>
              {TIPOS_TAXA.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            <Input
              label={LABEL_TAXA[tipoTaxa]}
              type="number"
              required
              min={0}
              step="0.01"
              placeholder={tipoTaxa === 'Pré-fixado (% a.a.)' ? 'Ex: 12.5' : 'Ex: 4.0'}
              value={taxaJuros}
              onChange={(e) => setTaxaJuros(e.target.value)}
            />
          </div>

          <div
            className={`rounded-lg px-3 py-2.5 text-xs border ${
              taxaEfetiva.indisponivel
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <span className="font-bold uppercase tracking-wider text-[10px] block mb-0.5 opacity-70">
              Taxa aplicada no cronograma
            </span>
            {taxaEfetiva.memoria}
            {taxaEfetiva.indisponivel && (
              <span className="block mt-1 opacity-80">
                Atualize os índices na aba Cronograma para projetar com o valor vigente.
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Base de Cálculo"
              value={baseCalculo}
              onChange={(e) => setBaseCalculo(e.target.value as BaseCalculoJuros)}
            >
              {BASES_CALCULO.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </Select>
            <Select
              label="Capitalização"
              value={capitalizacao}
              onChange={(e) => setCapitalizacao(e.target.value as TipoCapitalizacao)}
            >
              {CAPITALIZACOES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-200">
          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Estrutura de Pagamento</h4>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Tipo de Amortização"
              value={sistemaAmortizacao}
              onChange={(e) => setSistemaAmortizacao(e.target.value as SistemaAmortizacao)}
            >
              {TIPOS_AMORTIZACAO.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
            <Select
              label="Periodicidade"
              disabled={sistemaAmortizacao === 'BULLET'}
              value={sistemaAmortizacao === 'BULLET' ? 'Anual' : periodicidade}
              onChange={(e) => setPeriodicidade(e.target.value as PeriodicidadePagamento)}
            >
              <option value="Mensal">Mensal</option>
              <option value="Trimestral">Trimestral</option>
              <option value="Semestral">Semestral</option>
              <option value="Anual">Anual</option>
            </Select>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={possuiCarencia}
              onChange={(e) => setPossuiCarencia(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
            />
            Possui carência?
          </label>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-200">
          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Datas</h4>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Data de Contratação"
              type="date"
              required
              disabled={!!editingContrato}
              value={dataContratacao}
              onChange={(e) => setDataContratacao(e.target.value)}
            />
            <Input
              label="Vencimento Final"
              type="date"
              required
              value={dataVencimento}
              onChange={(e) => setDataVencimento(e.target.value)}
            />
          </div>

          <Input
            label="Início de Pagamento"
            type="date"
            hint={!possuiCarencia ? 'Só é usado no cálculo do cronograma quando "Possui carência?" está marcado.' : undefined}
            value={inicioPagamento}
            onChange={(e) => setInicioPagamento(e.target.value)}
          />
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-200">
          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Garantias (opcional)</h4>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Tipo de Garantia"
              type="text"
              placeholder="Ex: Hipoteca, Penhor, Aval"
              value={tipoGarantia}
              onChange={(e) => setTipoGarantia(e.target.value)}
            />
            <Input
              label="Valor da Garantia (R$)"
              type="number"
              min={0}
              step="0.01"
              value={valorGarantia}
              onChange={(e) => setValorGarantia(e.target.value)}
            />
          </div>
        </div>

        <Textarea
          label="Observações"
          rows={3}
          placeholder="Notas adicionais..."
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
        />

        <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full">
            Cancelar
          </Button>
          <Button type="submit" variant="primary" className="w-full">
            {editingContrato ? 'Salvar' : 'Cadastrar Contrato'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
};
