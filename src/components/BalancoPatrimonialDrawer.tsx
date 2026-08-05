import React, { useState, useEffect } from 'react';
import { BalancoPatrimonial } from '../types';
import { Drawer, Input, Button } from './ui';

interface BalancoPatrimonialDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: BalancoPatrimonial) => void;
  balancoAtual: BalancoPatrimonial | null;
}

export const BalancoPatrimonialDrawer: React.FC<BalancoPatrimonialDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  balancoAtual
}) => {
  const [safra, setSafra] = useState('');
  const [ativoCirculante, setAtivoCirculante] = useState('');
  const [ativoNaoCirculante, setAtivoNaoCirculante] = useState('');
  const [passivoCirculante, setPassivoCirculante] = useState('');
  const [passivoNaoCirculante, setPassivoNaoCirculante] = useState('');
  const [capitalReservas, setCapitalReservas] = useState('');
  const [resultadoSafra, setResultadoSafra] = useState('');

  useEffect(() => {
    if (balancoAtual) {
      setSafra(balancoAtual.safra);
      setAtivoCirculante(balancoAtual.ativoCirculante.toString());
      setAtivoNaoCirculante(balancoAtual.ativoNaoCirculante.toString());
      setPassivoCirculante(balancoAtual.passivoCirculante.toString());
      setPassivoNaoCirculante(balancoAtual.passivoNaoCirculante.toString());
      setCapitalReservas(balancoAtual.capitalReservas.toString());
      setResultadoSafra(balancoAtual.resultadoSafra.toString());
    } else {
      setSafra('');
      setAtivoCirculante('');
      setAtivoNaoCirculante('');
      setPassivoCirculante('');
      setPassivoNaoCirculante('');
      setCapitalReservas('');
      setResultadoSafra('');
    }
  }, [balancoAtual, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!safra.trim()) return;

    onSave({
      safra: safra.trim(),
      ativoCirculante: parseFloat(ativoCirculante) || 0,
      ativoNaoCirculante: parseFloat(ativoNaoCirculante) || 0,
      passivoCirculante: parseFloat(passivoCirculante) || 0,
      passivoNaoCirculante: parseFloat(passivoNaoCirculante) || 0,
      capitalReservas: parseFloat(capitalReservas) || 0,
      resultadoSafra: parseFloat(resultadoSafra) || 0
    });

    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Balanço Patrimonial"
      subtitle="Balanço consolidado do grupo — base dos índices de liquidez e endividamento"
    >
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        <Input
          label="Safra"
          type="text"
          required
          placeholder="2026/2027"
          value={safra}
          onChange={(e) => setSafra(e.target.value)}
        />

        <p className="text-[11px] font-bold uppercase text-slate-500 pt-2">Ativo</p>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Circulante"
            type="number"
            required
            min={0}
            prefix="R$"
            value={ativoCirculante}
            onChange={(e) => setAtivoCirculante(e.target.value)}
          />
          <Input
            label="Não Circulante"
            type="number"
            required
            min={0}
            prefix="R$"
            value={ativoNaoCirculante}
            onChange={(e) => setAtivoNaoCirculante(e.target.value)}
          />
        </div>

        <p className="text-[11px] font-bold uppercase text-slate-500 pt-2">Passivo</p>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Circulante"
            type="number"
            required
            min={0}
            prefix="R$"
            value={passivoCirculante}
            onChange={(e) => setPassivoCirculante(e.target.value)}
          />
          <Input
            label="Não Circulante"
            type="number"
            required
            min={0}
            prefix="R$"
            value={passivoNaoCirculante}
            onChange={(e) => setPassivoNaoCirculante(e.target.value)}
          />
        </div>

        <p className="text-[11px] font-bold uppercase text-slate-500 pt-2">Patrimônio</p>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Capital + Reservas"
            type="number"
            required
            prefix="R$"
            value={capitalReservas}
            onChange={(e) => setCapitalReservas(e.target.value)}
          />
          <Input
            label="Resultado da Safra"
            type="number"
            required
            prefix="R$"
            value={resultadoSafra}
            onChange={(e) => setResultadoSafra(e.target.value)}
          />
        </div>

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
