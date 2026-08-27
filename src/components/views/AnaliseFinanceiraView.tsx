'use client';

import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Building2 } from 'lucide-react';
import type {
  Aquisicao,
  BemDireito,
  ContratoArrendamento,
  CulturaSafraAno,
  DadosComplementaresFinanceiro,
  PrecoDefinidoSafra,
  Supplier
} from '../../types';
import { formatCurrency } from '../../data/initialData';
import { montarBalanco, complementaresVazio } from '../../lib/balanco-calc';
import { Card, KpiCard, Badge, Select, Tabs, Tooltip } from '../ui';
import { DadosComplementaresForm } from '../DadosComplementaresForm';
import type { FluxoDetalhado, CronogramaConsolidado } from '../../server/contratos-bancarios';

interface AnaliseFinanceiraViewProps {
  culturaSafras: CulturaSafraAno[];
  suppliers: Supplier[];
  fluxoDetalhado?: FluxoDetalhado;
  cronograma?: CronogramaConsolidado;
  arrendamentos: ContratoArrendamento[];
  aquisicoes: Aquisicao[];
  bensDireitos: BemDireito[];
  precosDefinidos: PrecoDefinidoSafra[];
  dadosComplementares: DadosComplementaresFinanceiro[];
  onSaveDadosComplementares: (data: DadosComplementaresFinanceiro) => void;
}

const linha = (label: string, valor: number, negativo = false, destaque = false) => (
  <div className={`flex justify-between ${destaque ? 'border-t border-slate-200 pt-1.5 mt-1' : ''}`}>
    <span className={destaque ? 'font-bold text-slate-800' : 'text-slate-500'}>{label}</span>
    <span className={destaque ? 'font-extrabold text-slate-900' : 'font-semibold text-slate-800'}>
      {negativo && valor !== 0 ? `(${formatCurrency(valor)})` : formatCurrency(valor)}
    </span>
  </div>
);

export const AnaliseFinanceiraView: React.FC<AnaliseFinanceiraViewProps> = ({
  culturaSafras,
  suppliers,
  fluxoDetalhado,
  cronograma,
  arrendamentos,
  aquisicoes,
  bensDireitos,
  precosDefinidos,
  dadosComplementares,
  onSaveDadosComplementares
}) => {
  const safrasDisponiveis = useMemo(() => Array.from(new Set(culturaSafras.map((r) => r.anoSafra))).sort(), [culturaSafras]);
  const [safraSelecionada, setSafraSelecionada] = useState('');
  const safraAtiva = safraSelecionada || safrasDisponiveis[safrasDisponiveis.length - 1] || '';

  const complementaresAtivo = useMemo(
    () => dadosComplementares.find((d) => d.safra === safraAtiva) ?? complementaresVazio(safraAtiva),
    [dadosComplementares, safraAtiva]
  );

  const fluxoDetalhadoBancos = useMemo(() => (fluxoDetalhado?.contratos ?? []).map((c) => ({ anos: c.anos })), [fluxoDetalhado]);

  const balanco = useMemo(
    () =>
      montarBalanco({
        safra: safraAtiva,
        quadroSafra: culturaSafras,
        suppliers,
        fluxoDetalhadoBancos,
        anosCronograma: cronograma?.anos ?? [],
        arrendamentos,
        aquisicoes,
        bensDireitos,
        precosDefinidos,
        complementares: complementaresAtivo
      }),
    [safraAtiva, culturaSafras, suppliers, fluxoDetalhadoBancos, cronograma, arrendamentos, aquisicoes, bensDireitos, precosDefinidos, complementaresAtivo]
  );

  const dreChart = [
    { nome: 'Receita Bruta', valor: balanco.dre.receitaBruta },
    { nome: 'Receita Líquida', valor: balanco.dre.receitaLiquida },
    { nome: 'Lucro Bruto', valor: balanco.dre.lucroBruto },
    { nome: 'EBITDA', valor: balanco.dre.ebitda },
    { nome: 'EBIT', valor: balanco.dre.ebit },
    { nome: 'Lucro Líquido', valor: balanco.dre.resultadoLiquido }
  ];

  const gruposIndicadores: { titulo: string; grupo: typeof balanco.indicadores[number]['grupo'] }[] = [
    { titulo: 'Grupo 1 — Índices de Liquidez', grupo: 'Liquidez' },
    { titulo: 'Grupo 2 — Estrutura de Capital e Endividamento', grupo: 'Estrutura de Capital' },
    { titulo: 'Grupo 3 — Rentabilidade e Lucratividade', grupo: 'Rentabilidade' },
    { titulo: 'Grupo 4 — Cobertura e Capacidade de Pagamento', grupo: 'Cobertura' },
    { titulo: 'Grupo 5 — Eficiência Operacional', grupo: 'Eficiência' },
    { titulo: 'Grupo 6 — Indicadores do Agronegócio', grupo: 'Agronegócio' }
  ];

  return (
    <div className="space-y-6">
      <div className="w-full sm:w-56">
        <Select label="Safra" value={safraAtiva} onChange={(e) => setSafraSelecionada(e.target.value)}>
          {safrasDisponiveis.length === 0 && <option value="">Nenhuma safra cadastrada</option>}
          {safrasDisponiveis.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      <Card className="p-5">
        <Tabs
          items={[
            { id: 'indices', label: '📊 Índices' },
            { id: 'balanco', label: '⚖️ Balanço' },
            { id: 'complementares', label: '✏️ Dados Complementares' },
            { id: 'consolidado', label: '🏢 Consolidado Grupo' }
          ]}
          defaultTabId="indices"
        >
          {(activeTabId) => {
            if (activeTabId === 'indices') {
              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-3">Saúde Financeira — Safra {safraAtiva || '—'}</h3>
                      <ResponsiveContainer width="100%" height={280}>
                        <RadarChart data={balanco.radar}>
                          <PolarGrid stroke="#e2e8f0" />
                          <PolarAngleAxis dataKey="dimensao" tick={{ fontSize: 11, fill: '#475569' }} />
                          <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                          <Radar dataKey="valor" stroke="#4a6700" fill="#a3e635" fillOpacity={0.45} />
                        </RadarChart>
                      </ResponsiveContainer>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Score próprio (0-100, média por status dos indicadores de cada eixo) — a fórmula de agregação do
                        AgroFlow original não é documentada.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-3">Balanço Resumido — Safra {safraAtiva || '—'}</h3>
                      <div className="space-y-4 text-sm">
                        <div>
                          <p className="text-[11px] font-bold uppercase text-slate-500 mb-1.5">Ativo</p>
                          <div className="space-y-1">
                            {linha('Circulante', balanco.ativo.totalCirculante)}
                            {linha('Não Circulante', balanco.ativo.totalNaoCirculante)}
                            {linha('Total Ativo', balanco.ativo.total, false, true)}
                          </div>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold uppercase text-slate-500 mb-1.5">Passivo</p>
                          <div className="space-y-1">
                            {linha('Circulante', balanco.passivo.totalCirculante)}
                            {linha('Não Circulante', balanco.passivo.totalNaoCirculante)}
                            {linha('Total Passivo', balanco.passivo.total, false, true)}
                          </div>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold uppercase text-slate-500 mb-1.5">Patrimônio</p>
                          <div className="space-y-1">
                            {linha('Capital + Reservas', balanco.pl.capitalSocial + balanco.pl.reservasLucrosAcumulados)}
                            {linha('Resultado Safra', balanco.pl.resultadoSafra)}
                            <div className="flex justify-between border-t border-slate-200 pt-1.5 mt-1">
                              <span className="font-bold text-slate-800">PL Total</span>
                              <span className="font-extrabold text-emerald-700">{formatCurrency(balanco.pl.total)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-2">
                          <span className="font-bold text-slate-700">Capital de Giro Líquido (CCL)</span>
                          <span className="font-extrabold text-blue-700">{formatCurrency(balanco.ccl)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {gruposIndicadores.map(({ titulo, grupo }) => (
                    <div key={grupo}>
                      <h3 className="text-sm font-bold text-slate-900 mb-3">{titulo}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {balanco.indicadores
                          .filter((i) => i.grupo === grupo)
                          .map((ind) => (
                            <KpiCard
                              key={ind.id}
                              title={ind.nome}
                              value={ind.valor === null ? '—' : `${ind.valor.toFixed(2)}${ind.unidade}`}
                              status={ind.status}
                              formula={ind.formula}
                              referencia={ind.referencia}
                            />
                          ))}
                      </div>
                    </div>
                  ))}

                  <Card className="p-6">
                    <h3 className="text-base font-bold text-slate-900 mb-4">
                      Demonstrativo de Resultados (DRE) — Safra {safraAtiva || '—'}
                    </h3>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={dreChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="nome" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" height={50} />
                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
                        <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Bar dataKey="valor" fill="#4a6700" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </div>
              );
            }

            if (activeTabId === 'balanco') {
              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-5">
                      <h3 className="text-sm font-bold text-slate-900 mb-3">ATIVO — Safra {safraAtiva || '—'}</h3>
                      <p className="text-[11px] font-bold uppercase text-slate-500 mb-1.5">Ativo Circulante</p>
                      <div className="space-y-1 text-sm mb-4">
                        {linha('Caixa e Equivalentes', balanco.ativo.caixaEquivalentes)}
                        {linha('Aplicações Financeiras', balanco.ativo.aplicacoesFinanceiras)}
                        {linha('Contas a Receber (Safra)', balanco.ativo.contasReceberSafra)}
                        {linha('Estoque de Grãos', balanco.ativo.estoqueGraos)}
                        {linha('Estoque de Insumos', balanco.ativo.estoqueInsumos)}
                        {linha('Outros Créditos CP', balanco.ativo.outrosCreditosCp)}
                        {linha('Total Ativo Circulante', balanco.ativo.totalCirculante, false, true)}
                      </div>
                      <p className="text-[11px] font-bold uppercase text-slate-500 mb-1.5">Ativo Não Circulante</p>
                      <div className="space-y-1 text-sm">
                        {linha('Contas a Receber LP', balanco.ativo.contasReceberLp)}
                        {linha('Outros Créditos LP', balanco.ativo.outrosCreditosLp)}
                        {linha('Investimentos', balanco.ativo.investimentos)}
                        {linha('Máquinas e Equipamentos', balanco.ativo.maquinasEquipamentos)}
                        {linha('Benfeitorias', balanco.ativo.benfeitorias)}
                        {linha('Fazendas', balanco.ativo.fazendas)}
                        {linha('(-) Depreciação Acumulada', balanco.ativo.depreciacaoAcumulada, true)}
                        <div className="flex justify-between">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            ↳ Bens IRPF Imóveis/Móveis
                            <Tooltip text="Consolida os bens declarados no IRPF dos sócios (imóveis, máquinas, outros direitos), cadastrados na aba Bens e Direitos — corrige a falta de transparência do AgroFlow original, que somava este valor sem linha própria." />
                          </span>
                          <span className="font-semibold text-slate-800">{formatCurrency(balanco.ativo.bensIrpf)}</span>
                        </div>
                        {linha('Total Ativo Não Circulante', balanco.ativo.totalNaoCirculante, false, true)}
                        <div className="flex justify-between border-t border-slate-300 pt-1.5 mt-1">
                          <span className="font-extrabold text-slate-900">TOTAL DO ATIVO</span>
                          <span className="font-extrabold text-slate-900">{formatCurrency(balanco.ativo.total)}</span>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-5">
                      <h3 className="text-sm font-bold text-slate-900 mb-3">DRE — Safra {safraAtiva || '—'}</h3>
                      <div className="space-y-1 text-sm">
                        {linha('(+) Receita Bruta', balanco.dre.receitaBruta)}
                        {linha('(-) Impostos / Deduções', balanco.dre.deducoes, true)}
                        {linha('= Receita Líquida', balanco.dre.receitaLiquida, false, true)}
                        {linha('(-) Custos (CPV / Custo Safra)', balanco.dre.custos, true)}
                        {linha('(-) Arrendamentos (safra)', balanco.dre.arrendamentos, true)}
                        {linha('= Lucro Bruto', balanco.dre.lucroBruto, false, true)}
                        {linha('(-) Despesas Operacionais', balanco.dre.despesasOperacionais, true)}
                        {linha('(-) Despesas Administrativas', balanco.dre.despesasAdministrativas, true)}
                        <div className="flex justify-between">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            (-) Despesas Comerciais (sc/ha)
                            <Tooltip text="3 sacas de soja por hectare (configurável na aba Dados Complementares) ao preço de Soja definido em Cotações; usa o fallback manual quando não há cotação." />
                          </span>
                          <span className="font-semibold text-slate-800">
                            {balanco.dre.despesaComercial === null ? (
                              <span className="text-slate-400 font-medium">indisponível</span>
                            ) : (
                              `(${formatCurrency(balanco.dre.despesaComercial)})`
                            )}
                          </span>
                        </div>
                        {linha('= Resultado Operacional', balanco.dre.resultadoOperacional, false, true)}
                        {linha('(-) Dividendos', balanco.dre.dividendos, true)}
                        {linha('= EBITDA', balanco.dre.ebitda, false, true)}
                        {linha('(-) Custo Financeiro (Juros / Bancos)', balanco.dre.custoFinanceiro, true)}
                        {linha('(-) Depreciação e Amortização', balanco.dre.depreciacao, true)}
                        {linha('= LAIR', balanco.dre.lair, false, true)}
                        {linha('(-) IR/CSLL', balanco.dre.irCsll, true)}
                        {linha('= Resultado Líquido', balanco.dre.resultadoLiquido, false, true)}
                      </div>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-5">
                      <h3 className="text-sm font-bold text-slate-900 mb-3">PASSIVO — Safra {safraAtiva || '—'}</h3>
                      <p className="text-[11px] font-bold uppercase text-slate-500 mb-1.5">Passivo Circulante</p>
                      <div className="space-y-1 text-sm mb-4">
                        {linha('Bancos CP', balanco.passivo.bancosCp)}
                        {linha('Fornecedores CP', balanco.passivo.fornecedoresCp)}
                        {linha('Arrendamentos (anual)', balanco.passivo.arrendamentos)}
                        {linha('Aquisição de Fazendas CP', balanco.passivo.aquisicaoFazendasCp)}
                        {linha('Obrigações Trabalhistas', balanco.passivo.obrigTrabalhistasCp)}
                        {linha('Obrigações Fiscais CP', balanco.passivo.obrigFiscaisCp)}
                        {linha('Outras Obrigações CP', balanco.passivo.outrasObrigCp)}
                        {linha('Total Passivo Circulante', balanco.passivo.totalCirculante, false, true)}
                      </div>
                      <p className="text-[11px] font-bold uppercase text-slate-500 mb-1.5">Passivo Não Circulante</p>
                      <div className="space-y-1 text-sm">
                        {linha('Bancos LP', balanco.passivo.bancosLp)}
                        {linha('Aquisição de Fazendas LP', balanco.passivo.aquisicaoFazendasLp)}
                        {linha('Fornecedores LP', balanco.passivo.fornecedoresLp)}
                        {linha('Obrigações Fiscais LP', balanco.passivo.obrigFiscaisLp)}
                        {linha('Outras Obrigações LP', balanco.passivo.outrasObrigLp)}
                        {linha('Partes Relacionadas', balanco.passivo.partesRelacionadas)}
                        {linha('Total Passivo Não Circulante', balanco.passivo.totalNaoCirculante, false, true)}
                        <div className="flex justify-between border-t border-slate-300 pt-1.5 mt-1">
                          <span className="font-extrabold text-slate-900">TOTAL DO PASSIVO</span>
                          <span className="font-extrabold text-slate-900">{formatCurrency(balanco.passivo.total)}</span>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-5">
                      <h3 className="text-sm font-bold text-slate-900 mb-3">PATRIMÔNIO LÍQUIDO</h3>
                      <div className="space-y-1 text-sm">
                        {linha('Capital Social', balanco.pl.capitalSocial)}
                        {linha('Reservas e Lucros Acumulados', balanco.pl.reservasLucrosAcumulados)}
                        {linha('Resultado da Safra', balanco.pl.resultadoSafra)}
                        <div className="flex justify-between">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            ↳ Bens IRPF Imóveis/Móveis
                            <Tooltip text="Mesma linha do Ativo Não Circulante — exibida aqui também, resolvendo a falta de transparência do AgroFlow original (BUG #1 da spec)." />
                          </span>
                          <span className="font-semibold text-slate-800">{formatCurrency(balanco.pl.bensIrpf)}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-300 pt-1.5 mt-1">
                          <span className="font-extrabold text-slate-900">PATRIMÔNIO LÍQUIDO</span>
                          <span className="font-extrabold text-emerald-700">{formatCurrency(balanco.pl.total)}</span>
                        </div>
                        <div className="flex justify-between pt-1">
                          <span className="font-bold text-slate-700">PASSIVO + PL</span>
                          <span className="font-bold text-slate-700">{formatCurrency(balanco.passivo.total + balanco.pl.total)}</span>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-200">
                        <p className="text-[11px] font-bold uppercase text-slate-500 mb-2">Dados de Referência</p>
                        <div className="space-y-1 text-xs text-slate-500">
                          <div className="flex justify-between">
                            <span>Área Total Plantada</span>
                            <span className="font-semibold text-slate-700">{balanco.areaTotalHa.toLocaleString('pt-BR')} ha</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Bancos CP / LP</span>
                            <span className="font-semibold text-slate-700">
                              {formatCurrency(balanco.passivo.bancosCp)} / {formatCurrency(balanco.passivo.bancosLp)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Fornecedores CP / LP</span>
                            <span className="font-semibold text-slate-700">
                              {formatCurrency(balanco.passivo.fornecedoresCp)} / {formatCurrency(balanco.passivo.fornecedoresLp)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Arrendamentos (anual)</span>
                            <span className="font-semibold text-slate-700">{formatCurrency(balanco.passivo.arrendamentos)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Fazendas (imobilizado)</span>
                            <span className="font-semibold text-slate-700">{formatCurrency(balanco.ativo.fazendas)}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>

                  <Card className="p-6">
                    <h3 className="text-base font-bold text-slate-900 mb-1">Bens e Direitos IRPF — Detalhamento por Categoria</h3>
                    <p className="text-xs text-slate-500 mb-4">Patrimônio Pessoal dos Sócios</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <KpiCard
                        title="Fazendas Próprias (IRPF)"
                        value={formatCurrency(balanco.patrimonioIrpf.fazendasProprias.valor)}
                        subtitle={`${balanco.patrimonioIrpf.fazendasProprias.itens} itens`}
                      />
                      <KpiCard
                        title="Máquinas e Equipamentos"
                        value={formatCurrency(balanco.patrimonioIrpf.maquinasEquipamentos.valor)}
                        subtitle={`${balanco.patrimonioIrpf.maquinasEquipamentos.itens} itens`}
                      />
                      <KpiCard
                        title="Bens e Direitos IRPF"
                        value={formatCurrency(balanco.patrimonioIrpf.totalBensIrpf)}
                        subtitle={`${balanco.patrimonioIrpf.categorias.reduce((s, c) => s + c.itens.length, 0)} itens`}
                      />
                      <KpiCard
                        title="Patrimônio Total"
                        value={formatCurrency(balanco.patrimonioIrpf.patrimonioTotal)}
                        valueClassName="text-emerald-700"
                      />
                    </div>

                    <div className="space-y-5">
                      {balanco.patrimonioIrpf.categorias.length === 0 && (
                        <p className="text-xs text-slate-400">Nenhum bem cadastrado em Cadastro Mestre → Bens e Direitos.</p>
                      )}
                      {balanco.patrimonioIrpf.categorias.map((cat) => (
                        <div key={cat.categoria}>
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-xs font-bold uppercase text-slate-600">{cat.categoria}</p>
                            <p className="text-xs font-bold text-slate-800">{formatCurrency(cat.subtotal)}</p>
                          </div>
                          <div className="space-y-1">
                            {cat.itens.map((item, idx) => (
                              <div key={`${cat.categoria}-${idx}`} className="flex justify-between text-sm">
                                <span className="text-slate-500">{item.descricao}</span>
                                <span className="font-semibold text-slate-700">{formatCurrency(item.valor)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              );
            }

            if (activeTabId === 'complementares') {
              return (
                <DadosComplementaresForm safra={safraAtiva} complementares={complementaresAtivo} onSave={onSaveDadosComplementares} />
              );
            }

            // Consolidado Grupo — sempre espelho PF (Balanço PJ não existe no sistema, ver CLAUDE.md 05/08/2026)
            return (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="emerald">📊 PF: dados carregados</Badge>
                  <Badge tone="slate">🏢 PJ: 0 empresas com balanço</Badge>
                </div>
                <p className="text-xs text-slate-500">
                  Balanço PJ não está disponível neste sistema — os índices consolidados abaixo refletem só os dados do
                  Produtor Rural (PF).
                </p>

                <Card className="p-6">
                  <h3 className="text-base font-bold text-slate-900 mb-4">Faturamento Consolidado — PF + PJ</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <KpiCard title="PF (Produtor Rural)" value={formatCurrency(balanco.dre.receitaBruta)} subtitle="100,0% do grupo" />
                    <KpiCard title="PJ (Empresas do Grupo)" value={formatCurrency(0)} subtitle="0,0% do grupo" />
                    <KpiCard
                      title="Total Consolidado"
                      value={formatCurrency(balanco.dre.receitaBruta)}
                      subtitle={`Média: ${formatCurrency(balanco.dre.receitaBruta / 12)}/mês`}
                      icon={<Building2 className="w-4 h-4 text-slate-500" />}
                    />
                  </div>

                  {balanco.receitaPorCultura.length > 0 && (
                    <>
                      <p className="text-sm font-bold text-slate-900 mb-3">Receita PF por Produto (Cultura)</p>
                      <ResponsiveContainer width="100%" height={Math.max(balanco.receitaPorCultura.length * 36, 120)}>
                        <BarChart data={balanco.receitaPorCultura} layout="vertical" margin={{ left: 24 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
                          <YAxis type="category" dataKey="cultura" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} width={100} />
                          <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Bar dataKey="receita" radius={[0, 8, 8, 0]}>
                            {balanco.receitaPorCultura.map((c) => (
                              <Cell key={c.cultura} fill="#4a6700" />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </>
                  )}
                </Card>

                {gruposIndicadores.slice(0, 3).map(({ titulo, grupo }) => (
                  <div key={grupo}>
                    <h3 className="text-sm font-bold text-slate-900 mb-3">{titulo} — Grupo Consolidado</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {balanco.indicadores
                        .filter((i) => i.grupo === grupo)
                        .map((ind) => (
                          <KpiCard
                            key={ind.id}
                            title={ind.nome}
                            value={ind.valor === null ? '—' : `${ind.valor.toFixed(2)}${ind.unidade}`}
                            status={ind.status}
                            referencia={ind.referencia}
                          />
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          }}
        </Tabs>
      </Card>
    </div>
  );
};
