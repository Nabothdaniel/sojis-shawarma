import type { Metadata, Viewport } from 'next';
import './globals.css';
import 'driver.js/dist/driver.css';
import { AuthProvider } from '@/context/AuthContext';
import OrderNotifications from '@/components/OrderNotifications';
import ToastContainer from '@/components/ui/ToastContainer';
import SessionManager from '@/components/ui/SessionManager';
import ReactQueryProvider from '@/components/providers/ReactQueryProvider';

export const metadata: Metadata = {
  metadataBase: new URL('https://sojis-shawarma.vercel.app'),
  title: {
    template: "%s | Uncle Soji's Shawarma",
    default: "Uncle Soji's Shawarma Spot - Best Shawarma in Keffi",
  },
  description: "Authentic shawarma from Nasarawa State University Keffi, delivered fresh and fast. Order now from the girls hostel corner.",
  keywords: ["shawarma", "keffi", "NSUK", "sojis shawarma", "delivery", "food", "nasarawa"],
  openGraph: {
    title: "Uncle Soji's Shawarma Spot - Best Shawarma in Keffi",
    description: "Authentic premium shawarma delivered fresh and fast to your door in Keffi.",
    url: 'https://sojis-shawarma.vercel.app',
    siteName: "Uncle Soji's Shawarma",
    locale: 'en_NG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Uncle Soji's Shawarma",
    description: "Premium shawarma in Keffi.",
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: "Uncle Soji",
  },
};

export const viewport: Viewport = {
  themeColor: '#F5C518',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className="light"
      style={{
        '--font-headline-family': '"Noto Serif", serif',
        '--font-body-family': '"Plus Jakarta Sans", sans-serif',
        '--font-label-family': '"Space Grotesk", sans-serif',
      } as React.CSSProperties}
    >
      <body className="antialiased selection:bg-primary-container selection:text-on-primary-container bg-surface-variant flex flex-col items-center min-h-screen">
        <div className="w-full max-w-md bg-background min-h-[100dvh] relative shadow-2xl overflow-hidden flex flex-col">
          <ReactQueryProvider>
            <AuthProvider>
              <SessionManager />
              <OrderNotifications />
              {children}
              <ToastContainer />
            </AuthProvider>
          </ReactQueryProvider>
        </div>
      </body>
    </html>
  );
}

