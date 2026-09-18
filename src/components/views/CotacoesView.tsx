'use client';

import React, { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Line, LineChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import { RefreshCw, TrendingUp, TrendingDown, Check, Save, ArrowUpCircle, History, AlertTriangle } from 'lucide-react';
import { Cotacao, PrecoDefinidoSafra, CulturaSafraAno } from '../../types';
import { Card, Tabs, Button, Badge, Input, Select } from '../ui';
import { refreshCotacoes, salvarPrecoDefinidoSafra, aplicarMercadoEmLote } from '../../server/cotacoes';
import { atualizarIndices } from '../../server/indices';
import type { IndicadorPainel } from '../../server/indices';

const LIMITE_DIVERGENCIA = 0.1; // 10% — ver docs/demandas/SPEC_TELA_COTACOES.md, seção 3.3

/** "2026-08-19" -> "19/08/2026". Sem `new Date(...)`, que desloca a data por fuso. */
function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split('-');
  return dia && mes && ano ? `${dia}/${mes}/${ano}` : iso;
}

/** Chips de cultura da aba "Histórico por Safra" — Soja e Milho vêm ativos por padrão, igual à spec. */
const CHIPS_CULTURA: { commodity: string; label: string; ativoPadrao: boolean; cor: string }[] = [
  { commodity: 'Soja Grão', label: '🌱 Soja', ativoPadrao: true, cor: '#5f7d1c' },
  { commodity: 'Milho Grão', label: '🌽 Milho', ativoPadrao: true, cor: '#d97706' },
  { commodity: 'Algodão Pluma', label: '🌿 Algodão', ativoPadrao: false, cor: '#0d9488' },
  { commodity: 'Boi Gordo', label: '🐄 Boi Gordo', ativoPadrao: false, cor: '#7c2d12' },
  { commodity: 'Trigo', label: '🌾 Trigo', ativoPadrao: false, cor: '#a16207' },
  { commodity: 'Café Arábica', label: '☕ Café Arábica', ativoPadrao: false, cor: '#78350f' }
];

interface CotacaoCardProps {
  cotacao: Cotacao;
  precoDefinido: PrecoDefinidoSafra | undefined;
  safraAtiva: string;
  onSalvarPreco: (commodity: string, preco: number) => void;
}

const CotacaoCard: React.FC<CotacaoCardProps> = ({ cotacao, precoDefinido, safraAtiva, onSalvarPreco }) => {
  const [valorInput, setValorInput] = useState<string>(precoDefinido != null ? String(precoDefinido.precoBrl) : '');
  const [salvo, setSalvo] = useState(false);
  const isUp = cotacao.variacaoPercentual >= 0;
  const semConversaoConfirmada = cotacao.unidade === 'lb'; // Algodão (até 16/09/2026) / Óleo de Soja — sem saca/embalagem padronizada confirmada
  // Frango/Suíno (16/09/2026) — sem cotação de bolsa, preço só entra manualmente
  // via "Preço Definido" (varia por região). Nunca mostra "R$ 0,00" de mercado.
  const isManual = cotacao.bolsa === 'MANUAL';

  const divergencia =
    !isManual && precoDefinido != null && cotacao.precoBrl > 0
      ? Math.abs(precoDefinido.precoBrl - cotacao.precoBrl) / cotacao.precoBrl
      : null;
  const divergenciaAlta = divergencia != null && divergencia > LIMITE_DIVERGENCIA;

  const handleSalvar = () => {
    const num = Number(valorInput.replace(',', '.'));
    if (!Number.isFinite(num) || num <= 0) return;
    onSalvarPreco(cotacao.commodity, num);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2000);
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-1.5">
        <div>
          <p className="text-sm font-bold text-slate-900">{cotacao.commodity}</p>
          <p className="text-[10px] text-slate-400">{isManual ? 'Informado pelo cliente' : `${cotacao.bolsa} · ${cotacao.ticker}`}</p>
        </div>
        {!isManual && (
          <Badge tone={isUp ? 'emerald' : 'rose'}>
            <span className="inline-flex items-center gap-0.5">
              {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isUp ? '+' : ''}
              {cotacao.variacaoPercentual.toFixed(2)}%
            </span>
          </Badge>
        )}
      </div>

      {isManual ? (
        <p className="text-[11px] text-slate-500">
          Sem cotação de bolsa — o preço varia por região e é definido diretamente abaixo, por safra.
        </p>
      ) : (
        <>
          <div className="text-xl font-black text-slate-900 font-sans">
            R$ {cotacao.precoBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            <span className="ml-1 text-xs font-semibold text-slate-400">/{cotacao.unidade}</span>
          </div>
          {semConversaoConfirmada && (
            <p className="text-[10px] text-amber-700">Sem unidade comercial padronizada confirmada — preço em R$/lb.</p>
          )}

          <div className="mt-1.5 space-y-0.5 text-[10px] text-slate-400">
            <p>
              Original: {cotacao.precoOriginal.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} {cotacao.unidadeOriginal}
            </p>
            {cotacao.precoUsd !== undefined && (
              <p>
                USD: {cotacao.precoUsd.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}/{cotacao.unidade}
              </p>
            )}
          </div>

          {cotacao.maxima > 0 && (
            <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1.5">
              <span>Máx: {cotacao.maxima.toLocaleString('pt-BR')}</span>
              <span>Mín: {cotacao.minima.toLocaleString('pt-BR')}</span>
              {cotacao.volume > 0 ? <span>Vol: {cotacao.volume.toLocaleString('pt-BR')}</span> : <span>Vol: —</span>}
            </div>
          )}
        </>
      )}

      <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
        <p className="text-[10px] font-semibold uppercase text-slate-500">Preço Definido — Safra {safraAtiva || '—'}</p>
        {divergenciaAlta && (
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
            Divergência de {(divergencia! * 100).toFixed(1)}% entre preço travado e mercado atual.
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Input
            type="text"
            inputMode="decimal"
            value={valorInput}
            onChange={(e) => setValorInput(e.target.value)}
            placeholder="0,0000"
            className="!py-1.5 !text-xs"
          />
          {!isManual && (
            <button
              type="button"
              title="Aplicar preço de mercado"
              onClick={() => setValorInput(String(cotacao.precoBrl))}
              className="flex-shrink-0 p-2 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
            >
              <ArrowUpCircle className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={handleSalvar}
            className={`flex-shrink-0 flex items-center gap-1 text-[11px] font-semibold px-2.5 py-2 rounded-md transition ${
              salvo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-900 text-white hover:bg-slate-700'
            }`}
          >
            {salvo ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
            {salvo ? 'Salvo' : 'Salvar'}
          </button>
        </div>
        {precoDefinido == null && <p className="text-[10px] text-slate-400">Nenhum preço salvo para esta safra.</p>}
      </div>
    </Card>
  );
};

/** Um card compacto do Painel de Indicadores (Selic/CDI/IPCA/Dólar/Euro) — sem série/gráfico, só o valor mais recente + data de referência. */
const IndicadorCard: React.FC<{ label: string; valor: string; referencia: string; fonte?: string }> = ({ label, valor, referencia, fonte }) => (
  <Card className="p-4">
    <p className="text-[11px] font-bold uppercase text-slate-500">{label}</p>
    <p className="text-xl font-black text-slate-900">{valor}</p>
    <p className="text-[10px] text-slate-400 mt-1">{referencia}</p>
    {fonte && <p className="text-[10px] text-slate-300 truncate" title={fonte}>{fonte}</p>}
  </Card>
);

interface CotacoesViewProps {
  dolar: Cotacao | null;
  euro: Cotacao | null;
  commodities: Cotacao[];
  indicadoresPainel: { selic: IndicadorPainel | null; cdi: IndicadorPainel | null; ipca: IndicadorPainel | null };
  safraAtual?: string | null;
  precosDefinidos: PrecoDefinidoSafra[];
  culturaSafras: CulturaSafraAno[];
}

export const CotacoesView: React.FC<CotacoesViewProps> = ({
  dolar,
  euro,
  commodities,
  indicadoresPainel,
  safraAtual,
  precosDefinidos,
  culturaSafras
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [avisoCambio, setAvisoCambio] = useState<string | null>(null);
  const [chipsAtivos, setChipsAtivos] = useState<Set<string>>(
    new Set(CHIPS_CULTURA.filter((c) => c.ativoPadrao).map((c) => c.commodity))
  );

  const safrasDisponiveis = useMemo(() => Array.from(new Set(culturaSafras.map((r) => r.anoSafra))).sort(), [culturaSafras]);
  const [safraSelecionada, setSafraSelecionada] = useState('');
  const safraPadrao =
    safraAtual && safrasDisponiveis.includes(safraAtual) ? safraAtual : safrasDisponiveis[safrasDisponiveis.length - 1] ?? '';
  const safraAtiva = safraSelecionada || safraPadrao;

  const precoDefinidoPorCommodity = useMemo(
    () => new Map(precosDefinidos.filter((p) => p.anoSafra === safraAtiva).map((p) => [p.commodity, p])),
    [precosDefinidos, safraAtiva]
  );

  const handleAtualizar = () => {
    setErro(null);
    setAvisoCambio(null);
    startTransition(async () => {
      const [result, resultIndices] = await Promise.all([refreshCotacoes(), atualizarIndices()]);

      const detalhesFalhas = [
        ...result.falhas.map((f) => `${f.item} (${f.motivo})`),
        ...resultIndices.falhas
      ];
      if (detalhesFalhas.length > 0) {
        // Cada falha carrega o motivo — uma lista de nomes sozinha não diz ao
        // usuário o que aconteceu nem o que fazer a respeito.
        setErro(`Não foi possível atualizar: ${detalhesFalhas.join(', ')}.`);
      }

      // Câmbio de rodada anterior converte os preços do mesmo jeito, mas o
      // usuário precisa saber que o número em R$ não é do câmbio de hoje.
      if (result.cambioUsado && !result.cambioUsado.aoVivo) {
        setAvisoCambio(
          `Preços em R$ convertidos pelo câmbio de ${formatarData(result.cambioUsado.data)} ` +
            `(R$ ${result.cambioUsado.valor.toFixed(4)} — ${result.cambioUsado.fonte}), ` +
            'porque não foi possível obter a cotação de hoje.'
        );
      }

      router.refresh();
    });
  };

  const handleSalvarPreco = (commodity: string, preco: number) => {
    if (!safraAtiva) {
      window.alert('Cadastre uma safra no Quadro de Produção antes de travar um preço.');
      return;
    }
    startTransition(async () => {
      await salvarPrecoDefinidoSafra(commodity, safraAtiva, preco);
      router.refresh();
    });
  };

  const handleAplicarMercado = () => {
    if (!safraAtiva) return;
    const jaExisteAlgum = precosDefinidos.some((p) => p.anoSafra === safraAtiva);
    if (jaExisteAlgum && !window.confirm(`Isso sobrescreve os preços já travados na safra ${safraAtiva} pelos preços de mercado atuais. Continuar?`)) {
      return;
    }
    startTransition(async () => {
      await aplicarMercadoEmLote(safraAtiva);
      router.refresh();
    });
  };

  // "Salvar Todas": persiste, pra cada commodity, o valor que já está travado
  // (ou o de mercado, se ainda não houver trava) — mesmo conjunto que
  // "Aplicar Mercado" cobre, então reaproveita a mesma action em lote.
  const handleSalvarTodas = () => handleAplicarMercado();

  // Série do gráfico "Evolução do Preço por Safra": uma linha por commodity
  // ativa nos chips, um ponto por safra em que ela tem preço travado.
  const serieHistorico = useMemo(() => {
    const safras = Array.from(new Set(precosDefinidos.map((p) => p.anoSafra))).sort();
    return safras.map((safra) => {
      const ponto: Record<string, string | number> = { safra };
      for (const chip of CHIPS_CULTURA) {
        if (!chipsAtivos.has(chip.commodity)) continue;
        const preco = precosDefinidos.find((p) => p.anoSafra === safra && p.commodity === chip.commodity);
        if (preco) ponto[chip.commodity] = preco.precoBrl;
      }
      return ponto;
    });
  }, [precosDefinidos, chipsAtivos]);

  const temHistoricoSuficiente = new Set(precosDefinidos.map((p) => p.anoSafra)).size >= 2;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs text-slate-500">
            Última atualização:{' '}
            <span className="font-semibold text-slate-700">{dolar?.atualizadoEm ?? 'nunca atualizado'}</span>
          </p>
          <div className="w-40">
            <Select value={safraAtiva} onChange={(e) => setSafraSelecionada(e.target.value)}>
              {safrasDisponiveis.length === 0 && <option value="">Nenhuma safra cadastrada</option>}
              {safrasDisponiveis.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={handleAtualizar}
            disabled={isPending}
            className="w-auto flex items-center gap-1.5 px-3 py-2 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} />
            {isPending ? 'Atualizando…' : 'Atualizar'}
          </Button>
          <Button
            variant="secondary"
            onClick={handleAplicarMercado}
            disabled={isPending || !safraAtiva || commodities.length === 0}
            className="w-auto flex items-center gap-1.5 px-3 py-2 text-xs"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Aplicar Mercado
          </Button>
          <Button
            variant="primary"
            onClick={handleSalvarTodas}
            disabled={isPending || !safraAtiva || commodities.length === 0}
            className="w-auto flex items-center gap-1.5 px-3 py-2 text-xs"
          >
            <Save className="w-3.5 h-3.5" />
            Salvar Todas
          </Button>
        </div>
      </div>

      {erro && (
        <div className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
          {erro}
        </div>
      )}

      {avisoCambio && (
        <div className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3">
          {avisoCambio}
        </div>
      )}

      <Card className="p-5">
        <Tabs items={[{ id: 'cotacoes', label: 'Cotações' }, { id: 'historico', label: 'Histórico por Safra' }]} defaultTabId="cotacoes">
          {(activeTabId) => {
            if (activeTabId === 'historico') {
              return (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <History className="w-4 h-4 text-slate-400" />
                    <p className="text-sm font-bold text-slate-700">Evolução do Preço por Safra</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {CHIPS_CULTURA.map((chip) => {
                      const ativo = chipsAtivos.has(chip.commodity);
                      return (
                        <button
                          key={chip.commodity}
                          type="button"
                          onClick={() =>
                            setChipsAtivos((prev) => {
                              const next = new Set(prev);
                              if (next.has(chip.commodity)) next.delete(chip.commodity);
                              else next.add(chip.commodity);
                              return next;
                            })
                          }
                          className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
                            ativo ? 'text-white border-transparent' : 'text-slate-500 border-slate-300 bg-white'
                          }`}
                          style={ativo ? { backgroundColor: chip.cor } : undefined}
                        >
                          {chip.label}
                        </button>
                      );
                    })}
                  </div>

                  {!temHistoricoSuficiente ? (
                    <div className="py-16 text-center text-slate-400">
                      <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm font-semibold">Nenhum histórico disponível</p>
                      <p className="text-xs mt-1">Salve cotações em diferentes safras para visualizar a evolução.</p>
                    </div>
                  ) : (
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={serieHistorico}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="safra" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <RechartsTooltip
                            formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`}
                          />
                          <Legend />
                          {CHIPS_CULTURA.filter((c) => chipsAtivos.has(c.commodity)).map((chip) => (
                            <Line
                              key={chip.commodity}
                              type="monotone"
                              dataKey={chip.commodity}
                              name={chip.label}
                              stroke={chip.cor}
                              strokeWidth={2}
                              connectNulls
                              dot={{ r: 3 }}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500 mb-3">Painel de Indicadores</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <IndicadorCard
                      label="Selic"
                      valor={indicadoresPainel.selic ? `${indicadoresPainel.selic.valor.toFixed(2)}% a.a.` : '—'}
                      referencia={indicadoresPainel.selic ? formatarData(indicadoresPainel.selic.dataReferencia) : 'Clique em "Atualizar"'}
                      fonte="Meta Selic (Copom) — informativo, cálculos de juros usam o CDI"
                    />
                    <IndicadorCard
                      label="CDI"
                      valor={indicadoresPainel.cdi ? `${indicadoresPainel.cdi.valor.toFixed(2)}% a.a.` : '—'}
                      referencia={indicadoresPainel.cdi ? formatarData(indicadoresPainel.cdi.dataReferencia) : 'Clique em "Atualizar"'}
                      fonte={indicadoresPainel.cdi?.fonte}
                    />
                    <IndicadorCard
                      label="IPCA Acumulado (12m)"
                      valor={indicadoresPainel.ipca ? `${indicadoresPainel.ipca.valor.toFixed(2)}%` : '—'}
                      referencia={indicadoresPainel.ipca ? formatarData(indicadoresPainel.ipca.dataReferencia) : 'Clique em "Atualizar"'}
                      fonte={indicadoresPainel.ipca?.fonte}
                    />
                    <IndicadorCard
                      label="Dólar (USD/BRL)"
                      valor={dolar ? `R$ ${dolar.precoBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}` : '—'}
                      referencia={dolar ? `Atualizado às ${dolar.atualizadoEm}` : 'Clique em "Atualizar"'}
                    />
                    <IndicadorCard
                      label="Euro (EUR/BRL)"
                      valor={euro ? `R$ ${euro.precoBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}` : '—'}
                      referencia={euro ? `Atualizado às ${euro.atualizadoEm}` : 'Clique em "Atualizar"'}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">
                    Selic e CDI são taxas distintas — o CDI acompanha a Selic de perto, mas os cálculos de juros dos contratos
                    bancários indexados sempre usam o CDI, nunca a Selic. Selic/CDI/IPCA são atualizados pelo mesmo botão
                    &quot;Atualizar&quot; desta tela.
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase text-slate-500 mb-3">
                    Commodities Agrícolas — Safra {safraAtiva || '—'}
                  </p>
                  {commodities.length === 0 ? (
                    <p className="text-xs text-slate-400 py-8 text-center">
                      Clique em &quot;Atualizar&quot; para buscar as cotações de commodities.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {commodities.map((c) => (
                        <CotacaoCard
                          key={c.id}
                          cotacao={c}
                          precoDefinido={precoDefinidoPorCommodity.get(c.commodity)}
                          safraAtiva={safraAtiva}
                          onSalvarPreco={handleSalvarPreco}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          }}
        </Tabs>
      </Card>
    </div>
  );
};
