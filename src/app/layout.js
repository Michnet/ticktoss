import './globals.css';
import { Inter, Syne } from 'next/font/google';
import QueryProvider from '@/components/providers/QueryProvider';
import ThemeProvider from '@/components/providers/ThemeProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ToastProvider from '@/components/notifications/ToastProvider';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
});

export const metadata = {
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
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${syne.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <QueryProvider>
            <Navbar />
            <main style={{ minHeight: 'calc(100vh - var(--tt-nav-height))' }}>
              {children}
            </main>
            <Footer />
            <ToastProvider />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
