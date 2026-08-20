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
import { listQuadroSafra } from '@/server/quadro-safra';
import { listLancamentosMensais } from '@/server/lancamentos';
import { listContratosBancarios, listCronogramaConsolidado, listFluxoDetalhado } from '@/server/contratos-bancarios';
import { listIndices } from '@/server/indices';
import { listAquisicoes, listFluxoConsolidadoAquisicoes, listImpactoPorSafra } from '@/server/aquisicoes';
import { listArrendamentos, listFluxoConsolidadoArrendamentos, listImpactoPorSafraArrendamentos } from '@/server/arrendamentos';
import { listContratosComerciais } from '@/server/contratos-comerciais';
import { getBalancoAtual } from '@/server/balanco';
import { listCotacoes } from '@/server/cotacoes';

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
    listContratosBancarios(),
    listAquisicoes(),
    listArrendamentos(),
    listContratosComerciais()
  ]);

  // Só importam à própria aba — buscados sob demanda.
  const initialLancamentosMensais = tab === 'fluxo_mensal' ? await listLancamentosMensais() : undefined;
  const initialBalanco = tab === 'analise_financeira' ? await getBalancoAtual() : undefined;
  const cotacoes = tab === 'cotacoes' ? await listCotacoes() : undefined;
  const [cronogramaConsolidado, indices, fluxoDetalhado] =
    tab === 'bancos'
      ? await Promise.all([listCronogramaConsolidado(), listIndices(), listFluxoDetalhado()])
      : [undefined, undefined, undefined];
  const [fluxoConsolidadoAquisicoes, impactoPorSafraAquisicoes] =
    tab === 'aquisicao_fazenda'
      ? await Promise.all([listFluxoConsolidadoAquisicoes(), listImpactoPorSafra()])
      : [undefined, undefined];
  const [fluxoConsolidadoArrendamentos, impactoPorSafraArrendamentos] =
    tab === 'arrendamentos'
      ? await Promise.all([listFluxoConsolidadoArrendamentos(), listImpactoPorSafraArrendamentos()])
      : [undefined, undefined];

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
      initialLancamentosMensais={initialLancamentosMensais}
      initialContratosBancarios={initialContratosBancarios}
      cronogramaConsolidado={cronogramaConsolidado}
      indices={indices}
      fluxoDetalhado={fluxoDetalhado}
      initialAquisicoes={initialAquisicoes}
      fluxoConsolidadoAquisicoes={fluxoConsolidadoAquisicoes}
      impactoPorSafraAquisicoes={impactoPorSafraAquisicoes}
      initialArrendamentos={initialArrendamentos}
      fluxoConsolidadoArrendamentos={fluxoConsolidadoArrendamentos}
      impactoPorSafraArrendamentos={impactoPorSafraArrendamentos}
      initialContratosComerciais={initialContratosComerciais}
      initialBalanco={initialBalanco}
      initialCotacaoDolar={cotacoes?.dolar}
      initialCotacoesCommodities={cotacoes?.commodities}
    />
  );
}
