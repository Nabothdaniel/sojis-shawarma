'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdminRoute = pathname?.startsWith('/admin');

  useEffect(() => {
    if (typeof window !== 'undefined' && pathname?.startsWith('/show')) {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in window.navigator && (window.navigator as any).standalone === true);
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      // If user is on /show but not in the installed app (and not in dev), bounce them to landing
      if (!isStandalone && !isDevelopment) {
        router.replace('/landing');
      }
    }
  }, [pathname, router]);

  if (isAdminRoute) {
    return (
      <div className="w-full min-h-[100dvh] bg-surface relative flex flex-col">
        {children}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-background min-h-[100dvh] relative shadow-2xl overflow-hidden flex flex-col">
      {children}
    </div>
  );
}
