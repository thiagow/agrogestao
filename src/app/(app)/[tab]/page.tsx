import { notFound } from 'next/navigation';
import { isActiveTab } from '@/lib/nav';
import { requireContext } from '@/lib/session';
import { TabView } from '@/components/TabView';
import { listSuppliers } from '@/server/suppliers';
import { listSocios } from '@/server/socios';
import { listBensDireitos } from '@/server/bens-direitos';
import { listGarantias } from '@/server/garantias';
import { listDividasPf } from '@/server/dividas-pf';
import { listCapex } from '@/server/capex';
import { getPerfilGrupo } from '@/server/perfil-grupo';
import { listCulturas } from '@/server/culturas';
import { getSafraAtual, listOpcoesAnoSafra, listSafras } from '@/server/safras';
import { listQuadroSafra } from '@/server/quadro-safra';
import { listQuadroPecuariaBovina } from '@/server/quadro-pecuaria';
import { listQuadroProducaoAnimal } from '@/server/producao-animal';
import { listContratosBancarios, listCronogramaConsolidado, listFluxoDetalhado } from '@/server/contratos-bancarios';
import { listIndices } from '@/server/indices';
import { listAquisicoes, listFluxoConsolidadoAquisicoes, listImpactoPorSafra } from '@/server/aquisicoes';
import { listArrendamentos, listFluxoConsolidadoArrendamentos, listImpactoPorSafraArrendamentos } from '@/server/arrendamentos';
import { listContratosComerciais } from '@/server/contratos-comerciais';
import { listDadosComplementares } from '@/server/balanco';
import { listCotacoes, listPrecosDefinidos } from '@/server/cotacoes';
import { listItensFluxoManual } from '@/server/fluxo-safra';
import { listItensLancamentoManualMensal } from '@/server/lancamentos-manuais';

interface TabPageProps {
  params: Promise<{ tab: string }>;
}

export default async function TabPage({ params }: TabPageProps) {
  const { tab } = await params;

  if (!isActiveTab(tab)) {
    notFound();
  }

  // Nome/Razão Social/CNPJ do grupo são cadastrados pelo Admin Master na criação da
  // conta (src/server/contas.ts) — a aba "Grupo Econômico" só lê, nunca duplica.
  const ctx = await requireContext();

  // Buscados sempre (não só na aba correspondente) porque Resumo também
  // depende deles — mesmo padrão que o TabView já usava com mocks.
  const [
    initialSuppliers,
    initialSocios,
    initialBensDireitos,
    initialGarantias,
    initialDividasPf,
    initialCapex,
    initialPerfilGrupo,
    initialCulturas,
    initialCulturaSafras,
    initialPecuariaBovina,
    initialProducaoAnimal,
    initialContratosBancarios,
    initialAquisicoes,
    initialArrendamentos,
    initialContratosComerciais
  ] = await Promise.all([
    listSuppliers(),
    listSocios(),
    listBensDireitos(),
    listGarantias(),
    listDividasPf(),
    listCapex(),
    getPerfilGrupo(),
    listCulturas(),
    listQuadroSafra(),
    listQuadroPecuariaBovina(),
    listQuadroProducaoAnimal(),
    listContratosBancarios(),
    listAquisicoes(),
    listArrendamentos(),
    listContratosComerciais()
  ]);

  // Só importam à própria aba — buscados sob demanda.
  const initialDadosComplementares = tab === 'analise_financeira' ? await listDadosComplementares() : undefined;
  // Comercialização também precisa das cotações (PrecoDefinidoSafra
  // alimenta a coluna "Cotação" da Posição por Cultura, src/lib/comercializacao.ts).
  // Fluxo de Safra e Análise Financeira usam a cotação de Soja pra estimar a
  // Despesa Comercial (3 sc/ha, configurável em Análise Financeira).
  const cotacoes =
    tab === 'cotacoes' || tab === 'comercializacao' || tab === 'fluxo_safra' || tab === 'analise_financeira'
      ? await listCotacoes()
      : undefined;
  // Preço travado por safra — mesmas abas, mesma decisão de "carrega a lista
  // inteira e filtra no client" já usada para culturaSafras/contratos.
  const initialPrecosDefinidos =
    tab === 'cotacoes' || tab === 'comercializacao' || tab === 'fluxo_safra' || tab === 'analise_financeira'
      ? await listPrecosDefinidos()
      : undefined;
  const [cronogramaConsolidado, indices, fluxoDetalhadoBancos] =
    tab === 'bancos'
      ? await Promise.all([listCronogramaConsolidado(), listIndices(), listFluxoDetalhado()])
      : [undefined, undefined, undefined];
  // Fluxo Mensal e Análise Financeira também consomem o Fluxo Detalhado
  // (parcelas de cada contrato ativo, já com data real) — Fluxo Mensal pras
  // linhas "Vinculado" de Bancos, Análise Financeira pro split CP/LP real.
  const fluxoDetalhado =
    (tab === 'fluxo_mensal' || tab === 'analise_financeira') && !fluxoDetalhadoBancos
      ? await listFluxoDetalhado()
      : fluxoDetalhadoBancos;
  // Fluxo de Safra e Análise Financeira também consomem o cronograma
  // consolidado (linhas "Amortização"/"Juros" do demonstrativo/DRE).
  const cronogramaBancario =
    (tab === 'fluxo_safra' || tab === 'analise_financeira') && !cronogramaConsolidado
      ? await listCronogramaConsolidado()
      : cronogramaConsolidado;
  const [fluxoConsolidadoAquisicoes, impactoPorSafraAquisicoes] =
    tab === 'aquisicao_fazenda'
      ? await Promise.all([listFluxoConsolidadoAquisicoes(), listImpactoPorSafra()])
      : [undefined, undefined];
  // Fluxo de Safra também consome a linha "Parcelas de Aquisição de Fazenda".
  const fluxoAquisicoesSafra =
    tab === 'fluxo_safra' && !fluxoConsolidadoAquisicoes ? await listFluxoConsolidadoAquisicoes() : fluxoConsolidadoAquisicoes;
  const [fluxoConsolidadoArrendamentos, impactoPorSafraArrendamentos] =
    tab === 'arrendamentos'
      ? await Promise.all([listFluxoConsolidadoArrendamentos(), listImpactoPorSafraArrendamentos()])
      : [undefined, undefined];
  // Fluxo de Safra também consome a linha "Arrendamentos".
  const fluxoArrendamentosSafra =
    tab === 'fluxo_safra' && !fluxoConsolidadoArrendamentos
      ? await listFluxoConsolidadoArrendamentos()
      : fluxoConsolidadoArrendamentos;
  const initialItensFluxoManual = tab === 'fluxo_safra' ? await listItensFluxoManual() : undefined;
  const initialItensLancamentoManualMensal =
    tab === 'fluxo_mensal' ? await listItensLancamentoManualMensal() : undefined;
  // Safra vigente — config única usada pelos badges Realizado/Atual/Previsão
  // e pelo select de "Ano Safra" no Quadro de Produção (10/09/2026).
  const [initialSafraAtual, initialOpcoesAnoSafra, initialSafrasCadastradas] =
    tab === 'quadro_safra' ? await Promise.all([getSafraAtual(), listOpcoesAnoSafra(), listSafras()]) : [undefined, undefined, undefined];

  return (
    <TabView
      tab={tab}
      initialSuppliers={initialSuppliers}
      initialSocios={initialSocios}
      initialBensDireitos={initialBensDireitos}
      initialGarantias={initialGarantias}
      initialDividasPf={initialDividasPf}
      initialCapex={initialCapex}
      initialPerfilGrupo={initialPerfilGrupo}
      contaNome={ctx.conta.nome}
      contaRazaoSocial={ctx.conta.razaoSocial ?? undefined}
      contaCnpj={ctx.conta.cnpj ?? undefined}
      initialCulturas={initialCulturas}
      initialCulturaSafras={initialCulturaSafras}
      initialSafraAtual={initialSafraAtual}
      initialOpcoesAnoSafra={initialOpcoesAnoSafra}
      initialSafrasCadastradas={initialSafrasCadastradas}
      initialPecuariaBovina={initialPecuariaBovina}
      initialProducaoAnimal={initialProducaoAnimal}
      initialContratosBancarios={initialContratosBancarios}
      cronogramaConsolidado={cronogramaBancario}
      indices={indices}
      fluxoDetalhado={fluxoDetalhado}
      initialAquisicoes={initialAquisicoes}
      fluxoConsolidadoAquisicoes={fluxoAquisicoesSafra}
      impactoPorSafraAquisicoes={impactoPorSafraAquisicoes}
      initialArrendamentos={initialArrendamentos}
      fluxoConsolidadoArrendamentos={fluxoArrendamentosSafra}
      impactoPorSafraArrendamentos={impactoPorSafraArrendamentos}
      initialContratosComerciais={initialContratosComerciais}
      initialDadosComplementares={initialDadosComplementares}
      initialCotacaoDolar={cotacoes?.dolar}
      initialCotacoesCommodities={cotacoes?.commodities}
      initialPrecosDefinidos={initialPrecosDefinidos}
      initialItensFluxoManual={initialItensFluxoManual}
      initialItensLancamentoManualMensal={initialItensLancamentoManualMensal}
    />
  );
}
