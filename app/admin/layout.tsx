'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const isAuthRoute = pathname === '/admin/login' || 
                      pathname === '/admin/setup' || 
                      pathname?.startsWith('/admin/invite');

  if (isAuthRoute) {
    return <>{children}</>;
  }

  return <AdminLayout>{children}</AdminLayout>;
}
