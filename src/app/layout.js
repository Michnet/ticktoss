import './globals.css';
import { Inter, Roboto } from 'next/font/google';
import QueryProvider from '@/components/providers/QueryProvider';
import ThemeProvider from '@/components/providers/ThemeProvider';
import AuthProvider from '@/components/providers/AuthProvider';
import ToastProvider from '@/components/notifications/ToastProvider';
import ServiceWorkerRegistrar from '@/components/pwa/ServiceWorkerRegistrar';
import InstallPrompt from '@/components/pwa/InstallPrompt';
import RouteProgressBar from '@/components/layout/RouteProgressBar';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-body',
  display: 'swap',
});

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-heading',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ticktoss.com';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'TickToss — Uganda\'s Urgency Marketplace',
    template: '%s | TickToss',
  },
  description: 'Discover deeply discounted deals with a countdown clock. Every listing on TickToss is time-limited — don\'t let the deal expire.',
  keywords: ['Uganda', 'marketplace', 'discounts', 'deals', 'classified', 'products', 'urgency'],
  openGraph: {
    type: 'website',
    locale: 'en_UG',
    siteName: 'TickToss',
    url: siteUrl,
    title: 'TickToss — Uganda\'s Urgency Marketplace',
    description: 'Discover deeply discounted deals with a countdown clock. Every listing on TickToss is time-limited — don\'t let the deal expire.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TickToss — Uganda\'s Urgency Marketplace',
    description: 'Discover deeply discounted deals with a countdown clock.',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${roboto.variable} bg-[var(--tt-surface)]`}>
        <RouteProgressBar />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <QueryProvider>
            <AuthProvider>
              <main style={{ minHeight: 'calc(100vh - var(--tt-nav-height))' }}>
                {children}
              </main>
              <ToastProvider />
              <ServiceWorkerRegistrar />
              <InstallPrompt />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
