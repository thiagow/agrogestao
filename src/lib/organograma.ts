// Monta o organograma societário do grupo — função pura, sem I/O, pra poder ser
// testada isoladamente (mesmo critério de amortizacao.ts/patrimonio.ts).
// Usado por src/components/OrganogramaGrupo.tsx.
//
// Estrutura (validação do cliente, 09/10/2026): 3 faixas — Sócios PF (topo), Holdings
// (meio) e Empresas Operacionais (base). Cada integrante aparece UMA única vez; o
// vínculo societário não é uma linha desenhada entre cards, é uma lista de rótulos
// "% | Dono" abaixo do card da empresa, na cor da faixa do dono. PJ pode ser dona de
// PJ e PF e PJ podem dividir uma mesma empresa. PJ sem `tipoEmpresa` (cadastrada antes
// dessa classificação existir) cai em Empresas Operacionais até ser reclassificada.

import type { Socio } from '@/types';

export type FaixaOrganograma = 'PF' | 'HOLDING' | 'OPERACIONAL';

export interface VinculoOrganograma {
  donoId: string;
  donoNome: string;
  faixaDono: FaixaOrganograma; // define a cor do rótulo
  percentual: number;
}

export interface NoOrganograma {
  socioId: string;
  nome: string;
  documento: string; // CPF ou CNPJ, "—" se ausente
  tipoPessoa: 'PF' | 'PJ';
  faixa: FaixaOrganograma;
  idadeOuAnoFundacao: string; // "42 anos" (PF) ou "Fundada em 2010" (PJ), "—" se sem data
  cargoOuAtividade?: string;
  vinculos: VinculoOrganograma[]; // donos desta empresa (sempre vazio pra PF)
}

export interface Organograma {
  pessoasFisicas: NoOrganograma[];
  holdings: NoOrganograma[];
  operacionais: NoOrganograma[];
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

function faixaDoSocio(socio: Socio): FaixaOrganograma {
  if (socio.tipoPessoa === 'PF') return 'PF';
  return socio.tipoEmpresa === 'Holding' ? 'HOLDING' : 'OPERACIONAL';
}

export function montarOrganograma(socios: Socio[], hoje: Date = new Date()): Organograma {
  const socioMap = new Map(socios.map((s) => [s.id, s]));

  const montarNo = (socio: Socio): NoOrganograma => ({
    socioId: socio.id,
    nome: socio.nome,
    documento: socio.tipoPessoa === 'PJ' ? socio.cnpj ?? '—' : socio.cpf ?? '—',
    tipoPessoa: socio.tipoPessoa,
    faixa: faixaDoSocio(socio),
    idadeOuAnoFundacao: idadeOuAnoFundacao(socio, hoje),
    cargoOuAtividade: socio.cargoOuAtividade,
    vinculos:
      socio.tipoPessoa === 'PJ'
        ? (socio.participacoes ?? [])
            .map((p): VinculoOrganograma | null => {
              const dono = socioMap.get(p.socioDonoId);
              if (!dono || dono.id === socio.id) return null;
              return {
                donoId: dono.id,
                donoNome: dono.nome,
                faixaDono: faixaDoSocio(dono),
                percentual: p.percentual
              };
            })
            .filter((v): v is VinculoOrganograma => v !== null)
            .sort((a, b) => b.percentual - a.percentual)
        : []
  });

  const nos = socios.map(montarNo);
  return {
    pessoasFisicas: nos.filter((n) => n.faixa === 'PF'),
    holdings: nos.filter((n) => n.faixa === 'HOLDING'),
    operacionais: nos.filter((n) => n.faixa === 'OPERACIONAL')
  };
}
