import { notFound } from 'next/navigation';
import { isActiveTab } from '@/lib/nav';
import { TabView } from '@/components/TabView';
import { listSuppliers } from '@/server/suppliers';
import { listSocios } from '@/server/socios';
import { listBensDireitos } from '@/server/bens-direitos';
import { listGarantias } from '@/server/garantias';
import { listCapex } from '@/server/capex';
import { getPerfilGrupo } from '@/server/perfil-grupo';
import { listQuadroSafra } from '@/server/quadro-safra';
import { listLancamentosMensais } from '@/server/lancamentos';
import { listContratosBancarios } from '@/server/contratos-bancarios';
import { listAquisicoes } from '@/server/aquisicoes';
import { listArrendamentos } from '@/server/arrendamentos';
import { listContratosComerciais } from '@/server/contratos-comerciais';
import { getBalancoAtual } from '@/server/balanco';
import { listEmpresasPJ } from '@/server/empresas-pj';
import { listCotacoes } from '@/server/cotacoes';

interface TabPageProps {
  params: Promise<{ tab: string }>;
}

export default async function TabPage({ params }: TabPageProps) {
  const { tab } = await params;

  if (!isActiveTab(tab)) {
    notFound();
  }

  // Buscados sempre (não só na aba correspondente) porque Resumo também
  // depende deles — mesmo padrão que o TabView já usava com mocks.
  const [
    initialSuppliers,
    initialSocios,
    initialBensDireitos,
    initialGarantias,
    initialCapex,
    initialPerfilGrupo,
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
    listCapex(),
    getPerfilGrupo(),
    listQuadroSafra(),
    listContratosBancarios(),
    listAquisicoes(),
    listArrendamentos(),
    listContratosComerciais()
  ]);

  // Só importam à própria aba — buscados sob demanda.
  const initialLancamentosMensais = tab === 'fluxo_mensal' ? await listLancamentosMensais() : undefined;
  const initialBalanco = tab === 'analise_financeira' ? await getBalancoAtual() : undefined;
  const initialEmpresasPJ = tab === 'balanco_pj' ? await listEmpresasPJ() : undefined;
  const cotacoes = tab === 'cotacoes' ? await listCotacoes() : undefined;

  return (
    <TabView
      tab={tab}
      initialSuppliers={initialSuppliers}
      initialSocios={initialSocios}
      initialBensDireitos={initialBensDireitos}
      initialGarantias={initialGarantias}
      initialCapex={initialCapex}
      initialPerfilGrupo={initialPerfilGrupo}
      initialCulturaSafras={initialCulturaSafras}
      initialLancamentosMensais={initialLancamentosMensais}
      initialContratosBancarios={initialContratosBancarios}
      initialAquisicoes={initialAquisicoes}
      initialArrendamentos={initialArrendamentos}
      initialContratosComerciais={initialContratosComerciais}
      initialBalanco={initialBalanco}
      initialEmpresasPJ={initialEmpresasPJ}
      initialCotacaoDolar={cotacoes?.dolar}
      initialCotacoesCommodities={cotacoes?.commodities}
    />
  );
}
