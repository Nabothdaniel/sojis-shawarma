'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in window.navigator && (window.navigator as any).standalone === true);
    
    if (isStandalone || isDevelopment) {
      router.replace('/show/');
    } else {
      router.replace('/landing/');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="w-12 h-12 border-4 border-surface-variant border-t-primary rounded-full animate-spin"></div>
    </div>
  );
}
