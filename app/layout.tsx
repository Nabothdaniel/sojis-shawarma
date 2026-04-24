import type { Metadata, Viewport } from 'next';
import './globals.css';

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

import { AuthProvider } from '@/context/AuthContext';
import ToastContainer from '@/components/ui/ToastContainer';
import SessionManager from '@/components/ui/SessionManager';
import ReactQueryProvider from '@/components/providers/ReactQueryProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;1,400;1,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased selection:bg-primary-container selection:text-on-primary-container">
        <ReactQueryProvider>
          <AuthProvider>
            <SessionManager />
            <ToastContainer />
            {children}
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}



