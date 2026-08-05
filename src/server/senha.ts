import crypto from 'crypto';

// Alfabeto sem caracteres ambíguos (0/O, 1/l/I) — a senha é lida por humanos
// no painel do Admin Master antes de ser repassada ao cliente.
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

export function gerarSenhaProvisoria(tamanho = 16): string {
  const bytes = crypto.randomBytes(tamanho);
  let senha = '';
  for (let i = 0; i < tamanho; i++) {
    senha += ALFABETO[bytes[i] % ALFABETO.length];
  }
  return senha;
}
