// Verificação ponta a ponta da ingestão de índices + geração de cronograma
// indexado, contra o banco real. Roda com `npx tsx scripts/verificar-juros-indexados.ts`.
//
// Não é teste automatizado (esses vivem em src/lib/*.test.ts, sem I/O) — é o
// script de conferência manual do caminho que depende de rede e de Postgres.

import { db } from '../src/lib/db';
import { fetchSerieBcb, fetchDolarBRL, fetchExpectativasFocusAnuais, SERIE_BCB } from '../src/lib/market-data';
import { calcularTaxaEfetiva } from '../src/lib/taxa-efetiva';
import {
  carregarIndicesVigentes,
  carregarSerieIndices,
  regerarCronograma,
  SELECT_CRONOGRAMA
} from '../src/server/cronograma-engine';
import { TIPO_TAXA_FROM_DB } from '../src/lib/enum-maps';

async function main() {
  console.log('\n=== 1. Fontes externas ===');
  const cdi = await fetchSerieBcb(SERIE_BCB.CDI);
  const ipca = await fetchSerieBcb(SERIE_BCB.IPCA);
  const usd = await fetchDolarBRL();
  console.log('CDI ', cdi ? `${cdi.valor}% a.a. (${cdi.dataReferencia})` : 'INDISPONÍVEL');
  console.log('IPCA', ipca ? `${ipca.valor}% (${ipca.dataReferencia})` : 'INDISPONÍVEL');
  console.log('USD ', usd ? `R$ ${usd.precoBrl}` : 'INDISPONÍVEL');

  console.log('\n=== 1b. Projeções BCB Focus (Fase 5) ===');
  const focusSelic = await fetchExpectativasFocusAnuais('Selic');
  const focusIpca = await fetchExpectativasFocusAnuais('IPCA');
  console.log('Selic (proxy CDI):', focusSelic ?? 'INDISPONÍVEL');
  console.log('IPCA             :', focusIpca ?? 'INDISPONÍVEL');

  console.log('\n=== 2. Índices persistidos ===');
  const indices = await carregarIndicesVigentes();
  console.log(indices);
  const series = await carregarSerieIndices();
  console.log('Série CDI :', series.cdi);
  console.log('Série IPCA:', series.ipca);

  console.log('\n=== 3. Taxa efetiva por tipo de contrato (spread de 4%) ===');
  for (const tipo of ['Pré-fixado (% a.a.)', 'CDI + spread', 'IPCA + spread', 'Dólar + juros'] as const) {
    const r = calcularTaxaEfetiva(tipo, 4, indices);
    console.log(`${tipo.padEnd(22)} → ${r.taxaAnual.toFixed(2)}% | ${r.memoria}`);
  }

  console.log('\n=== 4. Contratos e cronogramas ===');
  const contratos = await db.contratoBancario.findMany({
    where: { ativo: true },
    select: { ...SELECT_CRONOGRAMA, banco: true, taxaEfetivaAplicada: true, indiceReferencia: true }
  });

  for (const c of contratos) {
    const tipoTaxa = TIPO_TAXA_FROM_DB[c.tipoTaxa as keyof typeof TIPO_TAXA_FROM_DB];
    await regerarCronograma(c, indices, series);

    const parcelas = await db.parcela.findMany({ where: { contratoId: c.id }, orderBy: { numero: 'asc' } });
    const somaPrincipal = parcelas.reduce((s, p) => s + Number(p.valorPrincipal), 0);
    const somaJuros = parcelas.reduce((s, p) => s + Number(p.valorJuros), 0);
    const saldoFinal = parcelas.length ? Number(parcelas[parcelas.length - 1].saldoDevedor) : 0;
    const depois = await db.contratoBancario.findUniqueOrThrow({ where: { id: c.id } });

    console.log(
      `\n${c.banco} — ${tipoTaxa} — ${c.sistemaAmortizacao} P:${c.periodicidadePrincipal}/J:${c.periodicidadeJuros} ${c.moeda}`
    );
    console.log(`  taxa cadastrada : ${Number(c.taxaJuros).toFixed(2)}%`);
    console.log(`  taxa efetiva    : ${Number(depois.taxaEfetivaAplicada).toFixed(2)}%`);
    console.log(`  índice aplicado : ${depois.indiceReferencia ?? '—'}`);
    console.log(`  parcelas        : ${parcelas.length}`);
    console.log(`  Σ principal     : ${somaPrincipal.toFixed(2)} (contratado ${Number(c.saldoInicial).toFixed(2)})`);
    console.log(`  Σ juros         : ${somaJuros.toFixed(2)}`);
    console.log(`  saldo final     : ${saldoFinal.toFixed(2)}`);

    const reconcilia = Math.abs(somaPrincipal - Number(c.saldoInicial)) < 0.005 && saldoFinal === 0;
    console.log(`  reconcilia?     : ${reconcilia ? 'OK' : 'FALHOU'}`);
  }

  console.log('\n=== 5. Consolidado por ano ===');
  const parcelas = await db.parcela.findMany({
    select: { dataPagamento: true, valorJuros: true, valorPrincipal: true, contrato: { select: { tipoOperacao: true } } }
  });
  const porAno = new Map<number, { juros: number; amort: number }>();
  for (const p of parcelas) {
    const ano = p.dataPagamento.getUTCFullYear();
    const a = porAno.get(ano) ?? { juros: 0, amort: 0 };
    a.juros += Number(p.valorJuros);
    a.amort += Number(p.valorPrincipal);
    porAno.set(ano, a);
  }
  for (const [ano, a] of Array.from(porAno.entries()).sort((x, y) => x[0] - y[0])) {
    console.log(`  ${ano}  juros ${a.juros.toFixed(2)}  amort ${a.amort.toFixed(2)}  total ${(a.juros + a.amort).toFixed(2)}`);
  }

  await db.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await db.$disconnect();
  process.exit(1);
});
