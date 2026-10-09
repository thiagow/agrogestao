'use client';

import React, { useMemo } from 'react';
import { User, Building2, Factory } from 'lucide-react';
import { Socio } from '../types';
import { montarOrganograma, type FaixaOrganograma, type NoOrganograma } from '../lib/organograma';

interface OrganogramaGrupoProps {
  socios: Socio[];
}

// Cor por faixa — usada no card e, nos rótulos de vínculo, na cor da faixa do DONO.
const ESTILO_FAIXA: Record<FaixaOrganograma, { card: string; chip: string; titulo: string }> = {
  PF: {
    card: 'bg-slate-100 border-slate-200 text-slate-800',
    chip: 'bg-slate-100 text-slate-700 border border-slate-200',
    titulo: 'Sócios (PF)'
  },
  HOLDING: {
    card: 'bg-rose-900 border-rose-950 text-white',
    chip: 'bg-rose-900 text-white',
    titulo: 'Holdings (PJ)'
  },
  OPERACIONAL: {
    card: 'bg-slate-800 border-slate-900 text-white',
    chip: 'bg-slate-800 text-white',
    titulo: 'Empresas operacionais (PJ)'
  }
};

const IconeFaixa: React.FC<{ faixa: FaixaOrganograma }> = ({ faixa }) =>
  faixa === 'PF' ? <User className="w-4 h-4" /> : faixa === 'HOLDING' ? <Building2 className="w-4 h-4" /> : <Factory className="w-4 h-4" />;

const CardNo: React.FC<{ no: NoOrganograma }> = ({ no }) => {
  const estilo = ESTILO_FAIXA[no.faixa];
  const sobreEscuro = no.faixa !== 'PF';
  return (
    <div className="w-44 shrink-0">
      <div className={`rounded-xl border px-3 py-3 text-center shadow-xs ${estilo.card}`}>
        <div className="flex justify-center mb-1 opacity-80">
          <IconeFaixa faixa={no.faixa} />
        </div>
        <p className="text-[11px] font-bold uppercase leading-tight tracking-wide break-words" title={no.nome}>
          {no.nome}
        </p>
        {no.cargoOuAtividade && (
          <p className={`mt-1 text-[10px] truncate ${sobreEscuro ? 'text-white/70' : 'text-slate-500'}`} title={no.cargoOuAtividade}>
            {no.cargoOuAtividade}
          </p>
        )}
      </div>
      {no.vinculos.length > 0 && (
        <ul className="mt-1.5 space-y-1">
          {no.vinculos.map((v) => (
            <li
              key={v.donoId}
              className={`rounded px-2 py-1 text-[10px] font-semibold truncate ${ESTILO_FAIXA[v.faixaDono].chip}`}
              title={`${v.percentual}% | ${v.donoNome}`}
            >
              {v.percentual.toFixed(0)}% | {v.donoNome}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const Faixa: React.FC<{ faixa: FaixaOrganograma; nos: NoOrganograma[] }> = ({ faixa, nos }) => {
  if (nos.length === 0) return null;
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">{ESTILO_FAIXA[faixa].titulo}</p>
      <div className="flex flex-wrap items-start gap-3">
        {nos.map((no) => (
          <CardNo key={no.socioId} no={no} />
        ))}
      </div>
    </div>
  );
};

export const OrganogramaGrupo: React.FC<OrganogramaGrupoProps> = ({ socios }) => {
  const organograma = useMemo(() => montarOrganograma(socios), [socios]);

  if (socios.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-slate-400">
        Cadastre integrantes em &quot;Sócios e Empresas&quot; para montar o organograma.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Faixa faixa="PF" nos={organograma.pessoasFisicas} />
      <Faixa faixa="HOLDING" nos={organograma.holdings} />
      <Faixa faixa="OPERACIONAL" nos={organograma.operacionais} />
    </div>
  );
};
