'use client';

import React, { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Edit2,
  Trash2,
  Landmark,
  RefreshCw,
  BarChart3,
  AlertTriangle,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { ContratoBancario } from '../../types';
import { formatCurrency, formatDateBR, isCurtoPrazo } from '../../data/initialData';
import { Card, Tabs, Button, Badge, KpiCard } from '../ui';
import { ContratoBancarioDrawer, LABEL_TIPO_TAXA } from '../ContratoBancarioDrawer';
import type { CronogramaConsolidado, FluxoContrato, FluxoDetalhado, AnoFluxo } from '../../server/contratos-bancarios';
import { atualizarIndices } from '../../server/indices';
import { INDICES_VAZIOS, type IndicesVigentes } from '../../lib/taxa-efetiva';

/** Faixa de índices vigentes + gatilho de atualização das fontes externas. */
const FaixaIndices: React.FC<{ indices: IndicesVigentes; contratosSemIndice: number }> = ({
  indices,
  contratosSemIndice
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const handleAtualizar = () => {
    setErro(null);
    startTransition(async () => {
      const result = await atualizarIndices();
      if (result.falhas.length > 0) {
        setErro(`Não foi possível atualizar: ${result.falhas.join(', ')}. Os últimos valores foram mantidos.`);
      }
      router.refresh();
    });
  };

  const itens = [
    { rotulo: 'CDI', valor: indices.cdiAA, sufixo: '% a.a.' },
    { rotulo: 'IPCA', valor: indices.ipcaAA, sufixo: '% (12m)' },
    { rotulo: 'Dólar', valor: indices.usdBrl, sufixo: '', prefixo: 'R$ ' }
  ];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
          {itens.map((i) => (
            <div key={i.rotulo} className="flex items-baseline gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{i.rotulo}</span>
              <span className="font-mono text-sm font-bold text-slate-900">
                {i.valor === null
                  ? '—'
                  : `${i.prefixo ?? ''}${i.valor.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}${i.sufixo}`}
              </span>
            </div>
          ))}
          <span className="text-[11px] text-slate-500">
            {indices.atualizadoEm ? `referência ${formatDateBR(indices.atualizadoEm)}` : 'nunca atualizado'}
          </span>
        </div>

        <Button
          variant="secondary"
          onClick={handleAtualizar}
          disabled={isPending}
          className="w-auto flex items-center gap-2 px-3 py-2 text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} />
          {isPending ? 'Atualizando…' : 'Atualizar Índices'}
        </Button>
      </div>

      {erro && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{erro}</div>
      )}

      {contratosSemIndice > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>
            {contratosSemIndice} contrato{contratosSemIndice !== 1 ? 's' : ''} indexado
            {contratosSemIndice !== 1 ? 's' : ''} projetado{contratosSemIndice !== 1 ? 's' : ''} apenas com o
            spread — o indexador ainda não foi buscado. Clique em Atualizar Índices.
          </span>
        </div>
      )}
    </div>
  );
};

/** Projeção consolidada por ano — a tabela principal da aba, réplica do AgroFlow. */
const TabelaConsolidada: React.FC<{ cronograma: CronogramaConsolidado }> = ({ cronograma }) => (
  <div>
    <div className="flex items-center gap-2 mb-1">
      <BarChart3 className="w-4 h-4 text-slate-700" />
      <h3 className="text-sm font-bold text-slate-900">
        Cronograma de Amortização — {cronograma.anoInicial} a {cronograma.anoFinal}
      </h3>
    </div>
    <p className="text-xs text-slate-500 mb-4">
      Projeção consolidada de pagamentos por ano, incluindo juros e amortização de todos os contratos ativos.
    </p>

    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-600 font-bold">
            <th className="py-2.5 px-4">Ano</th>
            <th className="py-2.5 px-4 text-right">Juros</th>
            <th className="py-2.5 px-4 text-right">Amortização</th>
            <th className="py-2.5 px-4 text-right">Total</th>
            <th className="py-2.5 px-4">Composição por Tipo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs">
          {cronograma.anos.map((a) => (
            <tr key={a.ano} className="hover:bg-slate-50/60">
              <td className="py-3 px-4 font-bold text-slate-900">{a.ano}</td>
              <td className="py-3 px-4 text-right font-medium text-amber-700">{formatCurrency(a.juros)}</td>
              <td className="py-3 px-4 text-right font-medium text-blue-700">{formatCurrency(a.amortizacao)}</td>
              <td className="py-3 px-4 text-right font-bold text-rose-700">{formatCurrency(a.total)}</td>
              <td className="py-3 px-4">
                <div className="flex flex-wrap gap-1.5">
                  {a.porTipo.map((t) => (
                    <Badge key={t.tipoOperacao} tone="slate">
                      {t.tipoOperacao}: {formatCurrency(t.total)}
                    </Badge>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-slate-50 border-t border-slate-200 text-xs">
            <td className="py-3 px-4 font-bold text-slate-900">Total Geral</td>
            <td className="py-3 px-4 text-right font-bold text-amber-700">
              {formatCurrency(cronograma.totalJuros)}
            </td>
            <td className="py-3 px-4 text-right font-bold text-blue-700">
              {formatCurrency(cronograma.totalAmortizacao)}
            </td>
            <td className="py-3 px-4 text-right font-bold text-rose-700">
              {formatCurrency(cronograma.totalGeral)}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
);

interface CronogramaTabProps {
  contratos: ContratoBancario[];
  cronograma: CronogramaConsolidado;
  indices: IndicesVigentes;
}

const CronogramaTab: React.FC<CronogramaTabProps> = ({ contratos, cronograma, indices }) => {
  if (contratos.length === 0) {
    return (
      <div className="py-16 text-center text-slate-400">
        <p className="text-sm font-semibold">Cronograma</p>
        <p className="text-xs mt-1">Cadastre um contrato para ver o cronograma de amortização.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FaixaIndices indices={indices} contratosSemIndice={cronograma.contratosSemIndice} />

      {cronograma.anos.length > 0 ? (
        <TabelaConsolidada cronograma={cronograma} />
      ) : (
        <p className="text-xs text-slate-400 py-8 text-center">Nenhuma parcela projetada.</p>
      )}
    </div>
  );
};

/** Tabela período a período de um contrato — flat quando cada ano tem uma única
 *  parcela (ex: periodicidade Anual), agrupada com expansão por ano quando não. */
const TabelaFluxo: React.FC<{ fluxo: FluxoContrato }> = ({ fluxo }) => {
  const [anosAbertos, setAnosAbertos] = useState<Set<number>>(() => new Set());

  const toggleAno = (ano: number) =>
    setAnosAbertos((prev) => {
      const next = new Set(prev);
      if (next.has(ano)) next.delete(ano);
      else next.add(ano);
      return next;
    });

  const linhaParcela = (numero: number, data: string, p: AnoFluxo['parcelas'][number], indentada: boolean) => (
    <tr key={numero} className={indentada ? 'bg-slate-50/40 text-slate-600' : 'hover:bg-slate-50/60 text-slate-700'}>
      <td className={`py-2.5 px-4 font-semibold ${indentada ? 'pl-9 text-slate-600 font-medium' : 'text-slate-800'}`}>
        {numero}
      </td>
      <td className="py-2.5 px-4 text-slate-600">{formatDateBR(data)}</td>
      <td className="py-2.5 px-4 text-right">{formatCurrency(p.saldoInicial)}</td>
      <td className="py-2.5 px-4 text-right text-amber-700">{formatCurrency(p.juros)}</td>
      <td className="py-2.5 px-4 text-right text-blue-700">{formatCurrency(p.amortizacao)}</td>
      <td className="py-2.5 px-4 text-right font-bold text-slate-900">{formatCurrency(p.parcela)}</td>
      <td className="py-2.5 px-4 text-right text-rose-700">{formatCurrency(p.saldoFinal)}</td>
    </tr>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-600 font-bold">
            <th className="py-2.5 px-4">{fluxo.agrupadoPorAno ? 'Ano' : 'Período'}</th>
            <th className="py-2.5 px-4">Data</th>
            <th className="py-2.5 px-4 text-right">Saldo Inicial</th>
            <th className="py-2.5 px-4 text-right">Juros</th>
            <th className="py-2.5 px-4 text-right">Amortização</th>
            <th className="py-2.5 px-4 text-right">Parcela</th>
            <th className="py-2.5 px-4 text-right">Saldo Final</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs">
          {fluxo.agrupadoPorAno
            ? fluxo.anos.map((a) => (
                <React.Fragment key={a.ano}>
                  <tr
                    className="hover:bg-slate-50/60 cursor-pointer"
                    onClick={() => toggleAno(a.ano)}
                  >
                    <td className="py-2.5 px-4 font-semibold text-slate-800">
                      <span className="flex items-center gap-1.5">
                        <ChevronRight
                          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                            anosAbertos.has(a.ano) ? 'rotate-90' : ''
                          }`}
                        />
                        {a.ano}
                      </span>
                    </td>
                    <td className="py-2.5 px-4" />
                    <td className="py-2.5 px-4 text-right text-slate-700">{formatCurrency(a.saldoInicial)}</td>
                    <td className="py-2.5 px-4 text-right text-amber-700">{formatCurrency(a.juros)}</td>
                    <td className="py-2.5 px-4 text-right text-blue-700">{formatCurrency(a.amortizacao)}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900">{formatCurrency(a.parcela)}</td>
                    <td className="py-2.5 px-4 text-right text-rose-700">{formatCurrency(a.saldoFinal)}</td>
                  </tr>
                  {anosAbertos.has(a.ano) &&
                    a.parcelas.map((p) => linhaParcela(p.numero, p.data, p, true))}
                </React.Fragment>
              ))
            : fluxo.anos
                .flatMap((a) => a.parcelas)
                .map((p) => linhaParcela(p.numero, p.data, p, false))}
        </tbody>
        <tfoot>
          <tr className="bg-slate-50 border-t border-slate-200 text-xs font-bold">
            <td className="py-2.5 px-4 text-slate-900" colSpan={2}>
              Total
            </td>
            <td />
            <td className="py-2.5 px-4 text-right text-amber-700">{formatCurrency(fluxo.totalJuros)}</td>
            <td className="py-2.5 px-4 text-right text-blue-700">{formatCurrency(fluxo.totalAmortizacao)}</td>
            <td className="py-2.5 px-4 text-right text-slate-900">{formatCurrency(fluxo.totalParcelas)}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

/** Card recolhível de um contrato — cabeçalho sempre visível, tabela expande ao clicar. */
const CardContratoFluxo: React.FC<{ fluxo: FluxoContrato; aberto: boolean; onToggle: () => void }> = ({
  fluxo,
  aberto,
  onToggle
}) => (
  <Card className="overflow-hidden p-0">
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-slate-50/60 transition-colors"
    >
      <div className="flex items-start gap-3 min-w-0">
        <Landmark className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-slate-900">{fluxo.banco}</p>
            <Badge tone="slate">{fluxo.tipoOperacao}</Badge>
            <Badge tone="blue">
              {fluxo.sistemaAmortizacao} / Principal {fluxo.periodicidadePrincipal}
              {fluxo.periodicidadeJuros !== fluxo.periodicidadePrincipal ? ` · Juros ${fluxo.periodicidadeJuros}` : ''}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Saldo: <span className="font-semibold text-slate-700">{formatCurrency(fluxo.saldoAtual)}</span>
            {'   ·   '}Taxa: <span className="font-semibold text-slate-700">{fluxo.memoriaTaxa}</span>
            {'   ·   '}Venc.: <span className="font-semibold text-slate-700">{formatDateBR(fluxo.dataVencimento)}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right hidden sm:block">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Total Juros</p>
          <p className="text-sm font-bold text-amber-700">{formatCurrency(fluxo.totalJuros)}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${aberto ? 'rotate-180' : ''}`} />
      </div>
    </button>

    {aberto && (
      <div className="border-t border-slate-200 px-4 pb-4 pt-3">
        {fluxo.sistemaAmortizacao === 'BULLET' && (
          <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
            Juros capitalizados no saldo devedor, liquidados integralmente no vencimento.
          </p>
        )}
        {fluxo.anos.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">Nenhuma parcela projetada.</p>
        ) : (
          <TabelaFluxo fluxo={fluxo} />
        )}
      </div>
    )}
  </Card>
);

const FluxoDetalhadoTab: React.FC<{ fluxo: FluxoDetalhado }> = ({ fluxo }) => {
  const [abertos, setAbertos] = useState<Set<string>>(
    () => new Set(fluxo.contratos[0] ? [fluxo.contratos[0].contratoId] : [])
  );

  const toggle = (id: string) =>
    setAbertos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (fluxo.contratos.length === 0) {
    return (
      <div className="py-16 text-center text-slate-400">
        <p className="text-sm font-semibold">Fluxo Detalhado</p>
        <p className="text-xs mt-1">Cadastre um contrato para ver o fluxo período a período.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {fluxo.contratos.map((f) => (
        <CardContratoFluxo
          key={f.contratoId}
          fluxo={f}
          aberto={abertos.has(f.contratoId)}
          onToggle={() => toggle(f.contratoId)}
        />
      ))}

      <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-1 px-2 pt-2 text-xs text-slate-600">
        <span>
          Juros: <span className="font-bold text-amber-700">{formatCurrency(fluxo.totalJuros)}</span>
        </span>
        <span>
          Amortização: <span className="font-bold text-blue-700">{formatCurrency(fluxo.totalAmortizacao)}</span>
        </span>
        <span>
          Desembolso total: <span className="font-bold text-rose-700">{formatCurrency(fluxo.totalParcelas)}</span>
        </span>
      </div>
    </div>
  );
};

interface CredorGroup {
  banco: string;
  saldoAtualTotal: number;
  saldoInicialTotal: number;
  qtdContratos: number;
  tipos: string[];
  percentual: number;
}

const PorCredorTab: React.FC<{ contratos: ContratoBancario[] }> = ({ contratos }) => {
  if (contratos.length === 0) {
    return (
      <div className="py-16 text-center text-slate-400">
        <p className="text-sm font-semibold">Por Credor</p>
        <p className="text-xs mt-1">Cadastre um contrato para ver o ranking de credores.</p>
      </div>
    );
  }

  // Agrupar contratos por banco
  const creditoresMap = new Map<string, ContratoBancario[]>();
  contratos.forEach((c) => {
    const grupo = creditoresMap.get(c.banco) ?? [];
    creditoresMap.set(c.banco, [...grupo, c]);
  });

  // Calcular totais gerais
  const saldoGeralTotal = contratos.reduce((sum, c) => sum + c.saldoAtual, 0);

  // Montar dados de cada credor
  const credores: CredorGroup[] = Array.from(creditoresMap.entries())
    .map(([banco, contratosBanco]) => {
      const saldoAtualTotal = contratosBanco.reduce((sum, c) => sum + c.saldoAtual, 0);
      const saldoInicialTotal = contratosBanco.reduce((sum, c) => sum + c.saldoInicial, 0);
      const tipos = Array.from(new Set(contratosBanco.map((c) => c.tipoOperacao)));
      const percentual = saldoGeralTotal > 0 ? (saldoAtualTotal / saldoGeralTotal) * 100 : 0;

      return {
        banco,
        saldoAtualTotal,
        saldoInicialTotal,
        qtdContratos: contratosBanco.length,
        tipos,
        percentual
      };
    })
    .sort((a, b) => b.saldoAtualTotal - a.saldoAtualTotal);

  return (
    <div className="space-y-3">
      {credores.map((credor) => (
        <Card key={credor.banco} className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-bold text-slate-900">{credor.banco}</p>
              <p className="text-xs text-slate-600 mt-0.5">
                {credor.qtdContratos} contrato{credor.qtdContratos !== 1 ? 's' : ''} ·{' '}
                {credor.tipos.join(', ')}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-rose-800">{formatCurrency(credor.saldoAtualTotal)}</p>
              <p className="text-xs text-slate-600 mt-0.5">{credor.percentual.toFixed(1)}% do total</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-rose-600 rounded-full h-full transition-all duration-300"
                style={{ width: `${credor.percentual}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Contratado: {formatCurrency(credor.saldoInicialTotal)}</span>
            <span>Participação: {credor.percentual.toFixed(1)}%</span>
          </div>
        </Card>
      ))}
    </div>
  );
};

interface BancosViewProps {
  contratos: ContratoBancario[];
  cronograma?: CronogramaConsolidado;
  indices?: IndicesVigentes;
  fluxoDetalhado?: FluxoDetalhado;
  onSave: (data: Partial<ContratoBancario>) => void;
  onDelete: (id: string) => void;
}

const CRONOGRAMA_VAZIO: CronogramaConsolidado = {
  anos: [],
  totalJuros: 0,
  totalAmortizacao: 0,
  totalGeral: 0,
  anoInicial: 0,
  anoFinal: 0,
  contratosSemIndice: 0
};

const FLUXO_DETALHADO_VAZIO: FluxoDetalhado = {
  contratos: [],
  totalJuros: 0,
  totalAmortizacao: 0,
  totalParcelas: 0
};

export const BancosView: React.FC<BancosViewProps> = ({
  contratos,
  cronograma = CRONOGRAMA_VAZIO,
  indices = INDICES_VAZIOS,
  fluxoDetalhado = FLUXO_DETALHADO_VAZIO,
  onSave,
  onDelete
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ContratoBancario | null>(null);

  const saldoTotal = contratos.reduce((sum, c) => sum + c.saldoAtual, 0);
  const curtoPrazo = contratos
    .filter((c) => isCurtoPrazo(c.dataVencimento))
    .reduce((sum, c) => sum + c.saldoAtual, 0);
  const longoPrazo = saldoTotal - curtoPrazo;

  // Custo do contrato = taxa EFETIVA (indexador + spread), não a taxa digitada:
  // num contrato CDI + spread a taxa cadastrada é só o spread, e usá-la aqui
  // subestimaria o custo da dívida. Cai para a taxa cadastrada só enquanto o
  // cronograma nunca foi gerado.
  const custoEfetivo = (c: ContratoBancario) => c.taxaEfetivaAplicada ?? c.taxaJuros;

  const custoMedioPonderado =
    saldoTotal > 0 ? contratos.reduce((sum, c) => sum + c.saldoAtual * custoEfetivo(c), 0) / saldoTotal : 0;

  const gruposPorTaxa = useMemo(() => {
    const grupos = new Map<string, { saldo: number; somaPonderada: number }>();
    contratos.forEach((c) => {
      const grupo = grupos.get(c.tipoTaxa) ?? { saldo: 0, somaPonderada: 0 };
      grupo.saldo += c.saldoAtual;
      grupo.somaPonderada += c.saldoAtual * custoEfetivo(c);
      grupos.set(c.tipoTaxa, grupo);
    });
    return grupos;
  }, [contratos]);

  const handleOpenNew = () => {
    setEditing(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (contrato: ContratoBancario) => {
    setEditing(contrato);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={handleOpenNew}
          className="w-auto flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" /> Novo Contrato
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<Landmark className="w-4 h-4 text-rose-700" />}
          title="Saldo Devedor Total"
          value={formatCurrency(saldoTotal)}
          subtitle={`${contratos.length} contratos`}
          valueClassName="text-rose-800"
        />
        <KpiCard
          title="Curto Prazo (CP) ≤ 12 meses"
          value={formatCurrency(curtoPrazo)}
          subtitle={saldoTotal > 0 ? `${((curtoPrazo / saldoTotal) * 100).toFixed(1)}% do total` : '—'}
          valueClassName="text-amber-700"
        />
        <KpiCard
          title="Longo Prazo (LP) > 12 meses"
          value={formatCurrency(longoPrazo)}
          subtitle={saldoTotal > 0 ? `${((longoPrazo / saldoTotal) * 100).toFixed(1)}% do total` : '—'}
          valueClassName="text-blue-700"
        />
        <KpiCard
          title="Custo Médio Ponderado"
          value={`${custoMedioPonderado.toFixed(2)}% a.a.`}
          subtitle={Array.from(gruposPorTaxa.entries())
            .map(([tipo, g]) => `${tipo}: ${(g.somaPonderada / g.saldo).toFixed(2)}% — ${formatCurrency(g.saldo)}`)
            .join(' | ')}
        />
      </div>

      <Card className="p-5">
        <Tabs
          items={[
            { id: 'contratos', label: 'Contratos', badge: contratos.length },
            { id: 'credor', label: 'Por Credor' },
            { id: 'cronograma', label: 'Cronograma' },
            { id: 'fluxo', label: 'Fluxo Detalhado' }
          ]}
          defaultTabId="contratos"
        >
          {(activeTabId) => {
            if (activeTabId === 'cronograma') {
              return <CronogramaTab contratos={contratos} cronograma={cronograma} indices={indices} />;
            }

            if (activeTabId === 'credor') {
              return <PorCredorTab contratos={contratos} />;
            }

            if (activeTabId === 'fluxo') {
              return <FluxoDetalhadoTab fluxo={fluxoDetalhado} />;
            }

            if (activeTabId !== 'contratos') {
              return (
                <div className="py-16 text-center text-slate-400">
                  <p className="text-sm font-semibold">Em construção</p>
                  <p className="text-xs mt-1">Aguardando especificação detalhada desta aba.</p>
                </div>
              );
            }

            return (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-600 font-bold">
                      <th className="py-3 px-4">Banco/Credor</th>
                      <th className="py-3 px-4">Tomador</th>
                      <th className="py-3 px-4">Tipo de Operação</th>
                      <th className="py-3 px-4">Saldo</th>
                      <th className="py-3 px-4">Taxa</th>
                      <th className="py-3 px-4">Tipo de Taxa</th>
                      <th className="py-3 px-4">Vencimento</th>
                      <th className="py-3 px-4">Sistema Amortização</th>
                      <th className="py-3 px-4">Período</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {contratos.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{c.banco}</td>
                        <td className="py-3 px-4 text-slate-600">{c.nomeTomador || '—'}</td>
                        <td className="py-3 px-4">
                          <Badge tone="slate">{c.tipoOperacao}</Badge>
                        </td>
                        <td className="py-3 px-4 font-extrabold text-slate-900">{formatCurrency(c.saldoAtual)}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-bold text-slate-800">{custoEfetivo(c).toFixed(2)}% a.a.</span>
                          {c.taxaEfetivaAplicada != null && c.tipoTaxa !== 'Pré-fixado (% a.a.)' && (
                            <span className="block text-[10px] text-slate-500">
                              spread {c.taxaJuros.toFixed(2)}%
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge tone="blue">{LABEL_TIPO_TAXA[c.tipoTaxa]}</Badge>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-600 whitespace-nowrap">
                          {formatDateBR(c.dataVencimento)}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{c.sistemaAmortizacao}</td>
                        <td className="py-3 px-4 text-slate-600">
                          {c.periodicidadePrincipal === c.periodicidadeJuros ? (
                            c.periodicidadePrincipal
                          ) : (
                            <>
                              P: {c.periodicidadePrincipal}
                              <br />
                              J: {c.periodicidadeJuros}
                            </>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(c)}
                              title="Editar contrato"
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDelete(c.id)}
                              title="Deletar contrato"
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }}
        </Tabs>
      </Card>

      <ContratoBancarioDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={onSave}
        editingContrato={editing}
        indices={indices}
      />
    </div>
  );
};
