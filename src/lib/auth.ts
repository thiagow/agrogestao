import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin } from 'better-auth/plugins';
import { createAccessControl } from 'better-auth/plugins/access';
import { nextCookies } from 'better-auth/next-js';
import { db } from './db';

// Papel de plataforma próprio ("superadmin") — o plugin admin do Better Auth
// só reconhece papéis declarados em `roles`, então precisamos declarar o
// nosso em vez de reaproveitar o "admin" default (que colidiria em leitura
// com o MembershipRole.ADMIN de conta, um conceito totalmente diferente).
const statement = { user: ['create', 'list', 'set-role', 'ban', 'set-password', 'get', 'update'], session: ['list', 'revoke'] } as const;
const ac = createAccessControl(statement);
const superadminRole = ac.newRole({
  user: ['create', 'list', 'set-role', 'ban', 'set-password', 'get', 'update'],
  session: ['list', 'revoke']
});

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: 'postgresql' }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    autoSignIn: false
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 dias
    cookieCache: { enabled: true, maxAge: 5 * 60 }
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 10 // anti brute-force no login
  },
  user: {
    additionalFields: {
      mustChangePassword: { type: 'boolean', defaultValue: true, input: false }
    }
  },
  // nextCookies() precisa ser o último plugin: sincroniza os Set-Cookie de
  // qualquer chamada auth.api.* feita dentro de Server Actions (via
  // next/headers), essencial para refrescar o cookie de cache da sessão
  // (session.cookieCache) quando mudamos dado do usuário fora do fluxo padrão
  // do Better Auth (ver clearMustChangePassword em src/server/usuarios.ts).
  plugins: [admin({ ac, roles: { superadmin: superadminRole }, adminRoles: ['superadmin'], defaultRole: 'user' }), nextCookies()],
  advanced: {
    cookiePrefix: 'agrogestao',
    useSecureCookies: process.env.NODE_ENV === 'production'
  }
});

export type Auth = typeof auth;
