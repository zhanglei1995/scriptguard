import type { Metadata } from 'next';
import '../styles/globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: {
    default: 'ScriptGuard — Userscript Health Monitoring',
    template: '%s | ScriptGuard',
  },
  description:
    'Monitor, manage, and protect your userscripts. Real-time health checks, automatic updates, and instant alerts.',
  keywords: ['userscripts', 'tampermonkey', 'greasemonkey', 'monitoring', 'chrome extension'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
