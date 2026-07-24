import React, { useState, useEffect } from 'react';
import { Socio, EstadoCivil } from '../types';
import { Drawer, Input, Select, Button } from './ui';

interface SocioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (socioData: Partial<Socio>) => void;
  editingSocio?: Socio | null;
  outrosSocios: Socio[];
}

export const SocioDrawer: React.FC<SocioDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  editingSocio,
  outrosSocios
}) => {
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [participacao, setParticipacao] = useState('');
  const [estadoCivil, setEstadoCivil] = useState<EstadoCivil | ''>('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [nacionalidade, setNacionalidade] = useState('Brasileira');
  const [dataNascimento, setDataNascimento] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (editingSocio) {
      setNome(editingSocio.nome);
      setCpf(editingSocio.cpf);
      setParticipacao(editingSocio.participacao.toString());
      setEstadoCivil(editingSocio.estadoCivil ?? '');
      setTelefone(editingSocio.telefone ?? '');
      setEmail(editingSocio.email ?? '');
      setNacionalidade(editingSocio.nacionalidade ?? 'Brasileira');
      setDataNascimento(editingSocio.dataNascimento ?? '');
    } else {
      setNome('');
      setCpf('');
      setParticipacao('');
      setEstadoCivil('');
      setTelefone('');
      setEmail('');
      setNacionalidade('Brasileira');
      setDataNascimento('');
    }
    setErro('');
  }, [editingSocio, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    const participacaoNum = parseFloat(participacao) || 0;
    const somaOutros = outrosSocios.reduce((sum, s) => sum + s.participacao, 0);
    if (somaOutros + participacaoNum > 100) {
      setErro(
        `A soma das participações não pode exceder 100%. Disponível: ${(100 - somaOutros).toFixed(1)}%.`
      );
      return;
    }

    onSave({
      id: editingSocio?.id,
      nome: nome.trim(),
      cpf: cpf.trim(),
      participacao: participacaoNum,
      estadoCivil: estadoCivil || undefined,
      telefone: telefone.trim() || undefined,
      email: email.trim() || undefined,
      nacionalidade: nacionalidade.trim() || undefined,
      dataNascimento: dataNascimento || undefined
    });

    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={editingSocio ? 'Editar Sócio' : 'Adicionar Sócio'}
      subtitle="Dados do sócio/representante do grupo econômico"
    >
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        <Input
          label="Nome"
          type="text"
          required
          placeholder="Nome completo"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />

        <Input
          label="CPF"
          type="text"
          required
          disabled={!!editingSocio}
          placeholder="000.000.000-00"
          value={cpf}
          onChange={(e) => setCpf(e.target.value)}
        />

        <Input
          label="Participação (%)"
          type="number"
          required
          min={0}
          max={100}
          step="0.1"
          value={participacao}
          onChange={(e) => setParticipacao(e.target.value)}
        />
        {erro && <p className="text-xs font-semibold text-rose-600">{erro}</p>}

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

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Telefone"
            type="tel"
            placeholder="(00) 00000-0000"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            placeholder="nome@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Nacionalidade"
            type="text"
            value={nacionalidade}
            onChange={(e) => setNacionalidade(e.target.value)}
          />
          <Input
            label="Data de Nascimento"
            type="date"
            value={dataNascimento}
            onChange={(e) => setDataNascimento(e.target.value)}
          />
        </div>

        <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full">
            Cancelar
          </Button>
          <Button type="submit" variant="primary" className="w-full">
            {editingSocio ? 'Salvar' : 'Adicionar'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
};
