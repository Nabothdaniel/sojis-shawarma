'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in window.navigator && (window.navigator as any).standalone === true);
    
    if (isStandalone) {
      router.replace('/show/');
    } else {
      router.replace('/landing/');
    }
  }, [router]);

  return null;
}
