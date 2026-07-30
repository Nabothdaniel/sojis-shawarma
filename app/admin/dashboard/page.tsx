'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminRouteLoadingScreen } from '@/components/ui/AdminSkeletons';

export default function AdminDashboardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin');
  }, [router]);

  return (
    <AdminRouteLoadingScreen />
  );
}
