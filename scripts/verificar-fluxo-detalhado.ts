// Conferência aritmética manual da aba "Fluxo Detalhado" (docs/PLANO_BANCOS_FLUXO_DETALHADO.md,
// seção Verificação, itens 2-5) — roda só as funções puras, sem banco.
// `npx tsx scripts/verificar-fluxo-detalhado.ts`

import { gerarCronograma } from '../src/lib/amortizacao';
import { calcularTaxaEfetiva } from '../src/lib/taxa-efetiva';

function linha(...cols: (string | number)[]) {
  console.log(cols.map((c) => String(c).padStart(14)).join(' '));
}

console.log('\n=== 2. Sicoob — SAC anual, 3 períodos, R$ 967.569, CDI + 4% ===');
const cdi = 13.9;
const spread = 4;
const efetiva = calcularTaxaEfetiva('CDI + spread', spread, { cdiAA: cdi, ipcaAA: null, usdBrl: null });
console.log('Taxa efetiva:', efetiva.memoria);

const sicoob = gerarCronograma({
  saldoInicial: 967569,
  taxaJurosAnual: efetiva.taxaAnual,
  sistemaAmortizacao: 'SAC',
  periodicidade: 'Anual',
  baseCalculo: '360 dias corridos',
  capitalizacao: 'Composta',
  dataContratacao: '2026-01-01',
  dataVencimento: '2029-01-01',
  possuiCarencia: false
});
linha('Período', 'Data', 'Amortização', 'Saldo Final', 'Juros');
sicoob.forEach((p) => linha(p.numero, p.dataPagamento, p.valorPrincipal, p.saldoDevedor, p.valorJuros));
console.log('Esperado (print): Amortização 322.523 constante | Saldo Final 645.046 / 322.523 / 0');
console.log('Esperado: Juros do período 1 DIVERGE do print (R$ 38.703) — deve ser bem maior, ~R$ 173.195.');

console.log('\n=== 3. BULLET anual, 3 anos, R$ 1.000.000, 12% Composta ===');
const bullet = gerarCronograma({
  saldoInicial: 1_000_000,
  taxaJurosAnual: 12,
  sistemaAmortizacao: 'BULLET',
  periodicidade: 'Anual',
  baseCalculo: '360 dias corridos',
  capitalizacao: 'Composta',
  dataContratacao: '2026-01-01',
  dataVencimento: '2029-01-01',
  possuiCarencia: false
});
linha('Período', 'Data', 'Principal', 'Juros', 'Parcela', 'Saldo Final');
bullet.forEach((p) => linha(p.numero, p.dataPagamento, p.valorPrincipal, p.valorJuros, p.valorTotal, p.saldoDevedor));
const razao1 = bullet[0].saldoDevedor / 1_000_000;
const razao2 = bullet[1].saldoDevedor / bullet[0].saldoDevedor;
console.log(`Razão de crescimento do saldo: período1=${razao1.toFixed(6)} período2=${razao2.toFixed(6)} (devem ser iguais, ~1.12)`);
console.log(`Última: Juros(${bullet[2].valorJuros}) + Principal(${bullet[2].valorPrincipal}) = Parcela(${bullet[2].valorTotal})?`,
  Math.abs(bullet[2].valorJuros + bullet[2].valorPrincipal - bullet[2].valorTotal) < 0.01);

console.log('\n=== 4. PRICE mensal, 5 anos, R$ 500.000, 10% ===');
const price = gerarCronograma({
  saldoInicial: 500000,
  taxaJurosAnual: 10,
  sistemaAmortizacao: 'PRICE',
  periodicidade: 'Mensal',
  baseCalculo: '360 dias corridos',
  capitalizacao: 'Composta',
  dataContratacao: '2026-01-01',
  dataVencimento: '2031-01-01',
  possuiCarencia: false
});
console.log(`Total de parcelas: ${price.length} (esperado 60)`);
const ano2026 = price.filter((p) => p.dataPagamento.startsWith('2026'));
console.log(`Parcelas em 2026: ${ano2026.length} (esperado 12)`);
const somaParcela2026 = ano2026.reduce((s, p) => s + p.valorTotal, 0);
console.log(`Soma das parcelas de 2026: ${somaParcela2026.toFixed(2)}`);
console.log(`Parcela mensal aproximadamente constante: ${price[0].valorTotal} ~ ${price[1].valorTotal}`);

console.log('\n=== 5. JUROS_PERIODICOS anual, 3 anos, R$ 300.000, 8% ===');
const jp = gerarCronograma({
  saldoInicial: 300000,
  taxaJurosAnual: 8,
  sistemaAmortizacao: 'JUROS_PERIODICOS',
  periodicidade: 'Anual',
  baseCalculo: '360 dias corridos',
  capitalizacao: 'Composta',
  dataContratacao: '2026-01-01',
  dataVencimento: '2029-01-01',
  possuiCarencia: false
});
linha('Período', 'Amortização', 'Saldo Final');
jp.forEach((p) => linha(p.numero, p.valorPrincipal, p.saldoDevedor));
console.log('Esperado: Amortização 0 nos 2 primeiros, 300.000 no último; Saldo Final = 300.000 / 300.000 / 0');

console.log('\n=== 6. Filtro de anos zerados no consolidado (BULLET não deve gerar linha de R$ 0) ===');
const anosComValor = new Map<number, { juros: number; amort: number }>();
for (const p of bullet) {
  const ano = new Date(p.dataPagamento).getUTCFullYear();
  const acc = anosComValor.get(ano) ?? { juros: 0, amort: 0 };
  acc.juros += p.valorJuros;
  acc.amort += p.valorPrincipal;
  anosComValor.set(ano, acc);
}
const anosFiltrados = Array.from(anosComValor.entries()).filter(([, a]) => a.juros !== 0 || a.amort !== 0);
console.log(`Anos brutos: ${anosComValor.size} | Anos após filtro: ${anosFiltrados.length} (esperado 1, só o ano da liquidação)`);
