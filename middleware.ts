import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

// Guarda otimista por cookie de sessão — barata, roda no edge, sem hit no banco.
// A checagem que vale (papel, conta ativa, mustChangePassword) acontece nos
// layouts de (app) e (admin) via requireContext()/requireSuperAdmin().
export function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request, { cookiePrefix: 'agrogestao' });

  if (!sessionCookie) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)']
};
