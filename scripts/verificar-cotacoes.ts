// Apoio de desenvolvimento (não é gate de CI): reproduz o pipeline completo de
// refreshCotacoes() contra as fontes e o banco reais, SEM gravar nada — mostra
// exatamente o que seria persistido. Também exercita os 3 degraus de fallback
// de câmbio simulando a falha da consulta ao vivo.
// Uso: npx tsx scripts/verificar-cotacoes.ts
import { PrismaClient } from '@prisma/client';
import { fetchDolarBRL, fetchYahooQuote } from '../src/lib/market-data';
import { converterCotacaoCommodity } from '../src/lib/commodity-unidade';

const db = new PrismaClient();

const COMMODITIES = [
  { commodity: 'Soja Grão', ticker: 'ZS=F' },
  { commodity: 'Milho Grão', ticker: 'ZC=F' },
  { commodity: 'Algodão Pluma', ticker: 'CT=F' },
  { commodity: 'Boi Gordo', ticker: 'GF=F' },
  { commodity: 'Trigo', ticker: 'ZW=F' },
  { commodity: 'Café Arábica', ticker: 'KC=F' }
];

async function degrausDeFallback() {
  const dolarSalvo = await db.cotacao.findUnique({ where: { commodity: 'Dólar Americano' } });
  const indiceUsd = await db.indiceMercado.findFirst({
    where: { tipo: 'USD', origem: 'REALIZADO' },
    orderBy: { dataReferencia: 'desc' }
  });
  console.log('  degrau 2 (Cotacao dólar) :', dolarSalvo ? `${dolarSalvo.precoBrl}` : 'AUSENTE');
  console.log('  degrau 3 (IndiceMercado) :', indiceUsd ? `${indiceUsd.valor} de ${indiceUsd.dataReferencia.toISOString().slice(0,10)} (${indiceUsd.fonte})` : 'AUSENTE');
  return indiceUsd ? Number(indiceUsd.valor) : null;
}

async function main() {
  console.log('=== 1. Câmbio ao vivo ===');
  const dolar = await fetchDolarBRL();
  console.log(dolar ? `  ${dolar.precoBrl} (${dolar.fonte}, ref ${dolar.dataReferencia})` : '  NULL');

  console.log('\n=== 2. Degraus de fallback disponíveis no banco ===');
  const cambioFallback = await degrausDeFallback();

  const cambio = dolar?.precoBrl ?? cambioFallback;
  console.log(`\n=== 3. Câmbio aplicado na conversão: ${cambio} ===`);
  if (cambio == null) { console.log('  Sem câmbio algum — commodities falhariam (esperado só em banco virgem).'); return; }

  console.log('\n=== 4. O que seria gravado por commodity ===');
  for (const c of COMMODITIES) {
    const q = await fetchYahooQuote(c.ticker, null);
    if (!q || q.precoUsd == null) { console.log(`  ${c.commodity.padEnd(15)} FALHA (bolsa não respondeu)`); continue; }
    const conv = converterCotacaoCommodity(c.commodity, q.precoUsd, cambio);
    const max = converterCotacaoCommodity(c.commodity, q.maxima, cambio).precoBrl;
    const min = converterCotacaoCommodity(c.commodity, q.minima, cambio).precoBrl;
    console.log(
      `  ${c.commodity.padEnd(15)} bruto ${String(conv.precoOriginal).padStart(9)} ${conv.unidadeOriginal}` +
      ` -> R$ ${conv.precoBrl.toFixed(2).padStart(9)}/${conv.unidadeFinal}` +
      `  (min ${min.toFixed(2)} / max ${max.toFixed(2)}, var ${q.variacaoPercentual.toFixed(2)}%)`
    );
  }
}

main().catch((e) => { console.error('ERRO:', e); process.exit(1); }).finally(() => db.$disconnect());
