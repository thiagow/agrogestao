'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Socio, TipoPessoa, EstadoCivil, ParticipacaoSocietaria } from '../types';
import { Drawer, Input, Select, Button } from './ui';

interface IntegranteDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Socio>) => void;
  editingSocio?: Socio | null;
  /** Todos os demais integrantes/empresas da conta (exclui o que está sendo editado) —
   * usado tanto pra validar a soma de participação no grupo quanto pra listar os
   * integrantes PF disponíveis pra compor o cap table de uma PJ. */
  outrosSocios: Socio[];
}

// Labels dinâmicos por tipoPessoa — mesmo campo de dado, rótulo diferente na UI
// (decisão registrada em 20/08/2026: sem rename de coluna, zero risco pra dado
// de produção já existente).
const LABEL = {
  PF: { nome: 'Nome Completo', cargo: 'Cargo', nacionalidade: 'Nacionalidade', data: 'Data de Nascimento' },
  PJ: { nome: 'Razão Social', cargo: 'Atividade Principal', nacionalidade: 'Cidade/UF', data: 'Data de Fundação' }
} as const;

export const IntegranteDrawer: React.FC<IntegranteDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  editingSocio,
  outrosSocios
}) => {
  const [tipoPessoa, setTipoPessoa] = useState<TipoPessoa>('PF');
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [cargoOuAtividade, setCargoOuAtividade] = useState('');
  const [participacao, setParticipacao] = useState('');
  const [estadoCivil, setEstadoCivil] = useState<EstadoCivil | ''>('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [nacionalidade, setNacionalidade] = useState('Brasileira');
  const [dataNascimento, setDataNascimento] = useState('');
  const [participacoes, setParticipacoes] = useState<ParticipacaoSocietaria[]>([]);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (editingSocio) {
      setTipoPessoa(editingSocio.tipoPessoa);
      setNome(editingSocio.nome);
      setCpf(editingSocio.cpf ?? '');
      setCnpj(editingSocio.cnpj ?? '');
      setCargoOuAtividade(editingSocio.cargoOuAtividade ?? '');
      setParticipacao(editingSocio.participacao.toString());
      setEstadoCivil(editingSocio.estadoCivil ?? '');
      setTelefone(editingSocio.telefone ?? '');
      setEmail(editingSocio.email ?? '');
      setNacionalidade(editingSocio.nacionalidade ?? '');
      setDataNascimento(editingSocio.dataNascimento ?? '');
      setParticipacoes(editingSocio.participacoes ?? []);
    } else {
      setTipoPessoa('PF');
      setNome('');
      setCpf('');
      setCnpj('');
      setCargoOuAtividade('');
      setParticipacao('');
      setEstadoCivil('');
      setTelefone('');
      setEmail('');
      setNacionalidade('Brasileira');
      setDataNascimento('');
      setParticipacoes([]);
    }
    setErro('');
  }, [editingSocio, isOpen]);

  const integrantesPF = useMemo(() => outrosSocios.filter((s) => s.tipoPessoa === 'PF'), [outrosSocios]);

  const somaParticipacoesSocietarias = participacoes.reduce((sum, p) => sum + (p.percentual || 0), 0);

  const addParticipacao = () => {
    const disponivel = integrantesPF.find((s) => !participacoes.some((p) => p.socioPfId === s.id));
    if (!disponivel) return;
    setParticipacoes((prev) => [...prev, { socioPfId: disponivel.id, socioPfNome: disponivel.nome, percentual: 0 }]);
  };

  const updateParticipacao = (index: number, patch: Partial<ParticipacaoSocietaria>) => {
    setParticipacoes((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  };

  const removeParticipacao = (index: number) => {
    setParticipacoes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!nome.trim()) return;
    if (tipoPessoa === 'PF' && cpf.trim().length < 11) {
      setErro('Informe um CPF válido.');
      return;
    }
    if (tipoPessoa === 'PJ' && cnpj.trim().length < 14) {
      setErro('Informe um CNPJ válido.');
      return;
    }

    const participacaoNum = parseFloat(participacao) || 0;
    const somaOutros = outrosSocios.reduce((sum, s) => sum + s.participacao, 0);
    if (somaOutros + participacaoNum > 100) {
      setErro(`Soma das participações no grupo excede 100% (já alocado: ${somaOutros}%).`);
      return;
    }

    if (tipoPessoa === 'PJ' && somaParticipacoesSocietarias > 100) {
      setErro('Soma da participação societária excede 100%.');
      return;
    }

    onSave({
      id: editingSocio?.id,
      tipoPessoa,
      nome: nome.trim(),
      cpf: tipoPessoa === 'PF' ? cpf.trim() : undefined,
      cnpj: tipoPessoa === 'PJ' ? cnpj.trim() : undefined,
      cargoOuAtividade: cargoOuAtividade.trim() || undefined,
      participacao: participacaoNum,
      estadoCivil: tipoPessoa === 'PF' ? estadoCivil || undefined : undefined,
      telefone: telefone.trim() || undefined,
      email: email.trim() || undefined,
      nacionalidade: nacionalidade.trim() || undefined,
      dataNascimento: dataNascimento || undefined,
      participacoes: tipoPessoa === 'PJ' ? participacoes.filter((p) => p.socioPfId) : undefined
    });

    onClose();
  };

  const labels = LABEL[tipoPessoa];

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={editingSocio ? 'Editar Integrante' : 'Adicionar Integrante'}
      subtitle="Dados do sócio, empresa ou representante do grupo econômico"
    >
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tipo de Documento</label>
          <div className="flex gap-2">
            {(['PF', 'PJ'] as TipoPessoa[]).map((tp) => (
              <button
                key={tp}
                type="button"
                onClick={() => setTipoPessoa(tp)}
                className={`flex-1 px-3.5 py-2.5 rounded-xl border text-sm font-bold transition ${
                  tipoPessoa === tp
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                {tp === 'PF' ? 'CPF' : 'CNPJ'}
              </button>
            ))}
          </div>
        </div>

        {erro && <p className="text-xs font-semibold text-rose-600">{erro}</p>}

        <Input label={labels.nome} type="text" required value={nome} onChange={(e) => setNome(e.target.value)} />

        {tipoPessoa === 'PF' ? (
          <Input
            label="CPF"
            type="text"
            required
            disabled={!!editingSocio}
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
          />
        ) : (
          <Input
            label="CNPJ"
            type="text"
            required
            disabled={!!editingSocio}
            value={cnpj}
            onChange={(e) => setCnpj(e.target.value)}
          />
        )}

        <Input
          label={labels.cargo}
          type="text"
          value={cargoOuAtividade}
          onChange={(e) => setCargoOuAtividade(e.target.value)}
        />

        <Input
          label="Participação no Grupo (%)"
          type="number"
          required
          min={0}
          max={100}
          step="0.01"
          value={participacao}
          onChange={(e) => setParticipacao(e.target.value)}
        />

        {tipoPessoa === 'PF' ? (
          <Select
            label="Estado Civil"
            value={estadoCivil}
            onChange={(e) => setEstadoCivil(e.target.value as EstadoCivil)}
          >
            <option value="">—</option>
            <option value="Solteiro">Solteiro</option>
            <option value="Casado">Casado</option>
            <option value="Viúvo">Viúvo</option>
            <option value="Divorciado">Divorciado</option>
            <option value="Separado">Separado</option>
          </Select>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">Participação Societária</label>
              <span className={`text-[11px] font-bold ${somaParticipacoesSocietarias > 100 ? 'text-rose-600' : 'text-slate-500'}`}>
                {somaParticipacoesSocietarias.toFixed(2)}% alocado
              </span>
            </div>
            <div className="space-y-2">
              {participacoes.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select
                    value={p.socioPfId}
                    onChange={(e) => {
                      const socio = integrantesPF.find((s) => s.id === e.target.value);
                      updateParticipacao(i, { socioPfId: e.target.value, socioPfNome: socio?.nome });
                    }}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 font-medium text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
                  >
                    <option value="">Selecione o integrante…</option>
                    {integrantesPF.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nome}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    placeholder="%"
                    value={p.percentual || ''}
                    onChange={(e) => updateParticipacao(i, { percentual: parseFloat(e.target.value) || 0 })}
                    className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 font-medium text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={() => removeParticipacao(i)}
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addParticipacao}
              disabled={integrantesPF.length === 0 || participacoes.length >= integrantesPF.length}
              className="mt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 disabled:text-slate-300 disabled:cursor-not-allowed"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar sócio
            </button>
            {integrantesPF.length === 0 && (
              <p className="text-[11px] text-slate-400 mt-1">
                Cadastre ao menos um integrante PF antes de compor o quadro societário desta empresa.
              </p>
            )}
          </div>
        )}

        <Input label="Telefone" type="text" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
        <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input
          label={labels.nacionalidade}
          type="text"
          value={nacionalidade}
          onChange={(e) => setNacionalidade(e.target.value)}
        />
        <Input
          label={labels.data}
          type="date"
          value={dataNascimento}
          onChange={(e) => setDataNascimento(e.target.value)}
        />

        <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full">
            Cancelar
          </Button>
          <Button type="submit" variant="primary" className="w-full">
            Salvar
          </Button>
        </div>
      </form>
    </Drawer>
  );
};
