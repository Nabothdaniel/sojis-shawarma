'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingScreen from '@/components/ui/LoadingScreen';

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

  return <LoadingScreen message="routing you to the right place" />;
}
