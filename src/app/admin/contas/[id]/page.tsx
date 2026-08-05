import { notFound } from 'next/navigation';
import { getConta } from '@/server/contas';
import { ContaDetalheClient } from './ContaDetalheClient';

export default async function ContaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const conta = await getConta(id);
  if (!conta) notFound();

  return <ContaDetalheClient conta={conta} />;
}
