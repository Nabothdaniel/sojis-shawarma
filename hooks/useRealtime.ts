'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/appStore';

export function useRealtime() {
  const user = useAppStore((state) => state.user);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const token = useAppStore((state) => state.token);
  const updateUserBalance = useAppStore((state) => state.updateUserBalance);
  const addToast = useAppStore((state) => state.addToast);
  const eventSourceRef = useRef<EventSource | null>(null);
  const seenEventKeysRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    // Legacy SSE to custom backend is deprecated in Firebase serverless migration.
    // Realtime updates are migrated to individual onSnapshot listeners inside the components.
    // This hook is preserved as a no-op to prevent broken imports.
  }, [isAuthenticated, user, token, updateUserBalance, addToast]);
}
