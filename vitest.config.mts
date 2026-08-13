import { defineConfig } from 'vitest/config';
import path from 'node:path';

const raiz = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));

// Testes cobrem as funções PURAS do domínio financeiro (src/lib/*.ts) — motor de
// amortização, taxa efetiva, indicadores, patrimônio. Nada aqui toca banco,
// rede ou React: são os cálculos que decidem projeção de dívida, e é neles que
// um erro silencioso custa caro.
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(raiz, 'src') }
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts']
  }
});
