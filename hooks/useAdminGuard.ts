'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/appStore';

export default function useAdminGuard() {
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  const user = useAppStore((state) => state.user);

  const isAdmin = Boolean(token) && user?.role === 'admin';

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.replace('/admin/login');
    }
  }, [authLoading, isAdmin, router]);

  return { token, authLoading, isAdmin, user };
}
