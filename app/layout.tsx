import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import OrderNotifications from '@/components/OrderNotifications';
import ToastContainer from '@/components/ui/ToastContainer';
import SessionManager from '@/components/ui/SessionManager';
import ReactQueryProvider from '@/components/providers/ReactQueryProvider';

export const metadata: Metadata = {
  title: "Soji Shawarma Spot - Best Shawarma in Keffi",
  description: "Authentic shawarma from Nasarawa State University Keffi, delivered fresh and fast. Order now from the girls hostel corner.",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: "Soji Shawarma",
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
      <body className="antialiased selection:bg-primary-container selection:text-on-primary-container">
        <ReactQueryProvider>
          <AuthProvider>
            <SessionManager />
            <OrderNotifications />
            <ToastContainer />
            {children}
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}

