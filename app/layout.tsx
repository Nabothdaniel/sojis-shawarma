import type { Metadata, Viewport } from 'next';
import {
  Noto_Serif,
  Plus_Jakarta_Sans,
  Space_Grotesk,
} from 'next/font/google';
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

const headlineFont = Noto_Serif({
  subsets: ['latin'],
  variable: '--font-headline-family',
});

const bodyFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-body-family',
});

const labelFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-label-family',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`light ${headlineFont.variable} ${bodyFont.variable} ${labelFont.variable}`}
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

