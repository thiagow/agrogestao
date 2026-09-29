// Apoio de desenvolvimento (não é gate de CI): chama fetchCepeaIndicador()
// para Boi Gordo/Suíno/Frango e imprime o resultado bruto, SEM gravar nada no
// banco — usado pra validar o parser contra o HTML real do CEPEA, e como
// diagnóstico se o site mudar de layout no futuro (o parser depende de um
// texto-âncora no HTML, não de uma API versionada).
// Uso: npx tsx scripts/verificar-cepea.ts
import { fetchCepeaIndicador } from '../src/lib/market-data';

const COMMODITIES_CEPEA = [
  { commodity: 'Boi Gordo', unidade: '@', url: 'https://www.cepea.org.br/br/indicador/boi-gordo.aspx', tituloAncora: 'INDICADOR DO BOI GORDO' },
  {
    commodity: 'Suíno',
    unidade: 'kg',
    url: 'https://www.cepea.org.br/br/indicador/suino.aspx',
    tituloAncora: 'INDICADOR DO SUÍNO VIVO',
    praca: 'SP'
  },
  { commodity: 'Frango', unidade: 'kg', url: 'https://www.cepea.org.br/br/indicador/frango.aspx', tituloAncora: 'PREÇOS DO FRANGO CONGELADO' }
];

async function main() {
  for (const c of COMMODITIES_CEPEA) {
    const quote = await fetchCepeaIndicador({ url: c.url, tituloAncora: c.tituloAncora, praca: c.praca });
    if (!quote) {
      console.log(`${c.commodity.padEnd(10)} FALHA (ver log [market-data] acima)`);
      continue;
    }
    console.log(
      `${c.commodity.padEnd(10)} R$ ${quote.precoBrl.toFixed(2)}/${c.unidade}` +
        `  var ${quote.variacaoPercentual.toFixed(2)}%  ref ${quote.dataReferencia}  fonte ${quote.fonte}`
    );
  }
}

main().catch((e) => {
  console.error('ERRO:', e);
  process.exit(1);
});
