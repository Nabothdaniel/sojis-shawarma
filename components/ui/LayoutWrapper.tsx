'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

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
