import { PrismaClient } from '@prisma/client';

// Singleton do PrismaClient — evita esgotar o pool de conexões durante o HMR
// do `next dev`, que recarrega módulos sem reiniciar o processo Node.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
