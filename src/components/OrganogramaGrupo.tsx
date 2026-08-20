'use client';

import React, { useMemo } from 'react';
import { User, Building2 } from 'lucide-react';
import { Socio } from '../types';
import { montarOrganograma, type NoOrganograma } from '../lib/organograma';
import { Badge } from './ui';

interface OrganogramaGrupoProps {
  socios: Socio[];
}

const CardNo: React.FC<{ no: NoOrganograma }> = ({ no }) => (
  <div className="w-56 shrink-0 rounded-xl border border-slate-200 bg-white shadow-xs p-3.5">
    <div className="flex items-start gap-2">
      <div
        className={`p-1.5 rounded-lg shrink-0 ${
          no.tipoPessoa === 'PJ' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
        }`}
      >
        {no.tipoPessoa === 'PJ' ? <Building2 className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-900 leading-tight truncate" title={no.nome}>
          {no.nome}
        </p>
        <p className="text-[10px] text-slate-500 font-mono truncate">{no.documento}</p>
      </div>
    </div>

    <div className="mt-2.5 space-y-1 text-[11px] text-slate-600">
      <div className="flex justify-between">
        <span className="text-slate-400">{no.tipoPessoa === 'PJ' ? 'Fundação' : 'Idade'}</span>
        <span className="font-semibold text-slate-700">{no.idadeOuAnoFundacao}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-slate-400">{no.tipoPessoa === 'PJ' ? 'Atividade' : 'Cargo'}</span>
        <span className="font-semibold text-slate-700 truncate max-w-[110px]" title={no.cargoOuAtividade}>
          {no.cargoOuAtividade ?? '—'}
        </span>
      </div>
    </div>

    <div className="mt-2.5">
      <Badge tone={no.tipoPessoa === 'PJ' ? 'blue' : 'emerald'}>{no.percentual.toFixed(2)}%</Badge>
    </div>
  </div>
);

const RamoOrganograma: React.FC<{ no: NoOrganograma }> = ({ no }) => (
  <div className="flex flex-col items-center">
    <CardNo no={no} />
    {no.filhos.length > 0 && (
      <>
        <div className="w-px h-5 bg-slate-300" />
        <div className="flex items-start gap-6">
          {no.filhos.map((filho) => (
            <div key={filho.socioId} className="flex flex-col items-center">
              <div className="h-5 w-px bg-slate-300 -mt-5" />
              <CardNo no={filho} />
            </div>
          ))}
        </div>
      </>
    )}
  </div>
);

export const OrganogramaGrupo: React.FC<OrganogramaGrupoProps> = ({ socios }) => {
  const arvore = useMemo(() => montarOrganograma(socios), [socios]);

  if (arvore.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-slate-400">
        Cadastre integrantes em &quot;Sócios e Empresas&quot; para montar o organograma.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex items-start gap-8 min-w-max px-1">
        {arvore.map((no) => (
          <RamoOrganograma key={no.socioId} no={no} />
        ))}
      </div>
    </div>
  );
};
