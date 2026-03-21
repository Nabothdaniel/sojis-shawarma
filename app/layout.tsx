/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata } from 'next';
import './globals.css';
import ToastContainer from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'BamzySMS — Virtual Phone Numbers for OTP Verification',
  description:
    "Buy premium virtual phone numbers for instant SMS/OTP verification on Telegram, WhatsApp, Instagram, Facebook and more. Starting from ₦2,000.",
  keywords: ['virtual phone number', 'OTP verification', 'Nigeria', 'SMS verification', 'BamzySMS'],
  authors: [{ name: 'BamzySMS' }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
