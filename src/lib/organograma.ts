// Monta a árvore do organograma societário do grupo — função pura, sem I/O, pra
// poder ser testada isoladamente (mesmo critério de amortizacao.ts/patrimonio.ts).
// Usado por src/components/OrganogramaGrupo.tsx.
//
// Estrutura: 2 níveis (a spec de "Sócios e Empresas" só permite vincular PF já
// cadastrados como donos de uma PJ, nunca PJ dona de outra PJ — ver decisão
// registrada em 20/08/2026). Nós raiz = todo Socio (PF e PJ) da conta. Cada nó PJ
// ganha filhos = seus donos PF (via ParticipacaoSocietaria), com o percentual
// daquela relação. Um PF que também é dono de uma PJ aparece como raiz **e** como
// filho da PJ — reflete a realidade (é a mesma pessoa em 2 papéis: sócio do grupo
// e sócio da empresa).

import type { Socio } from '@/types';

export interface NoOrganograma {
  socioId: string;
  nome: string;
  documento: string; // CPF ou CNPJ, "—" se ausente
  tipoPessoa: 'PF' | 'PJ';
  idadeOuAnoFundacao: string; // "42 anos" (PF) ou "Fundada em 2010" (PJ), "—" se sem data
  cargoOuAtividade?: string;
  percentual: number; // % no grupo (raiz) ou % na empresa (filho)
  filhos: NoOrganograma[];
}

// Parsing manual em vez de `new Date(iso)` de propósito: uma string "YYYY-MM-DD"
// vira meia-noite UTC, e ler de volta getFullYear()/getMonth() (métodos locais)
// pode devolver o dia/ano anterior em fusos horários negativos (ex: America/Sao_Paulo).
function partesData(iso: string): { ano: number; mes: number; dia: number } {
  const [ano, mes, dia] = iso.slice(0, 10).split('-').map(Number);
  return { ano, mes, dia };
}

function calcularIdade(dataNascimentoIso: string, hoje: Date): number {
  const nascimento = partesData(dataNascimentoIso);
  const hojeAno = hoje.getUTCFullYear();
  const hojeMes = hoje.getUTCMonth() + 1;
  const hojeDia = hoje.getUTCDate();

  let idade = hojeAno - nascimento.ano;
  const aindaNaoFezAniversario =
    hojeMes < nascimento.mes || (hojeMes === nascimento.mes && hojeDia < nascimento.dia);
  if (aindaNaoFezAniversario) idade -= 1;
  return idade;
}

function idadeOuAnoFundacao(socio: Socio, hoje: Date): string {
  if (!socio.dataNascimento) return '—';
  if (socio.tipoPessoa === 'PJ') {
    return `Fundada em ${partesData(socio.dataNascimento).ano}`;
  }
  return `${calcularIdade(socio.dataNascimento, hoje)} anos`;
}

function montarNo(socio: Socio, percentual: number, hoje: Date): NoOrganograma {
  return {
    socioId: socio.id,
    nome: socio.nome,
    documento: socio.tipoPessoa === 'PJ' ? socio.cnpj ?? '—' : socio.cpf ?? '—',
    tipoPessoa: socio.tipoPessoa,
    idadeOuAnoFundacao: idadeOuAnoFundacao(socio, hoje),
    cargoOuAtividade: socio.cargoOuAtividade,
    percentual,
    filhos: []
  };
}

export function montarOrganograma(socios: Socio[], hoje: Date = new Date()): NoOrganograma[] {
  const socioMap = new Map(socios.map((s) => [s.id, s]));

  return socios.map((socio) => {
    const raiz = montarNo(socio, socio.participacao, hoje);

    if (socio.tipoPessoa === 'PJ') {
      raiz.filhos = (socio.participacoes ?? [])
        .map((p) => {
          const dono = socioMap.get(p.socioPfId);
          if (!dono) return null;
          return montarNo(dono, p.percentual, hoje);
        })
        .filter((n): n is NoOrganograma => n !== null)
        .sort((a, b) => b.percentual - a.percentual);
    }

    return raiz;
  });
}
