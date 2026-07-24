import type { Metadata } from 'next';
import { Manrope, JetBrains_Mono } from 'next/font/google';
import { AppShell } from '../components/AppShell';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap'
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'AgroGestão',
  description:
    'Sistema de gestão financeira e controle agrícola com fornecedores, safras e cotações'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${manrope.variable} ${jetBrainsMono.variable}`}>
      <body className="font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
