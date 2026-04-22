'use client';

import React, { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/appStore';
import { userService } from '@/lib/api';
import PageLoader from '@/components/ui/PageLoader';
import { useRealtime } from '@/hooks/useRealtime';

/**
 * AuthProvider handles session restoration after a hard reload.
 * Once Zustand has rehydrated from localStorage, we do ONE background
 * profile refresh so local state stays in sync with the database.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { login, setUser, hasHydrated } = useAppStore();
  const hasFetchedRef = useRef(false); // prevent double-fetch in StrictMode / dep loops

  // Initialize custom real-time event stream
  useRealtime();

  useEffect(() => {
    // Wait for Zustand to rehydrate from localStorage first
    if (!hasHydrated) return;
    // Only run once per mount — setUser/login are stable but user object
    // changes after setUser, which would re-trigger without this guard.
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('bamzysms-token') ||
          sessionStorage.getItem('bamzysms-token')
        : null;

    if (!token) return; // No token → nothing to restore

    userService
      .getProfile()
      .then((res: any) => {
        // Merge fresh server data into the store without touching the token
        if (res?.data) {
          setUser(res.data);
        }
      })
      .catch((err: any) => {
        // IMPORTANT: Do NOT call logout() here on network/CORS/timeout errors.
        // The global axios interceptor in client.ts already handles 401 by
        // clearing tokens and redirecting. For every other error (server down,
        // slow start, CORS during dev) we silently keep the persisted state —
        // the user's JWT is still valid and they should stay logged in.
        console.warn('[AuthProvider] Background profile refresh failed (non-critical):', err?.message);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated]); // intentionally omit login/setUser/user — they're stable or would loop

  if (!hasHydrated) {
    return <PageLoader />;
  }

  return <>{children}</>;
}
