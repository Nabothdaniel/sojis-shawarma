'use client';

import React, { useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { userService } from '@/lib/api';
import PageLoader from '@/components/ui/PageLoader';
import { useRealtime } from '@/hooks/useRealtime';

/**
 * AuthProvider component handles session initialization and re-authentication
 * across page reloads by checking localStorage for a valid token.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, login, logout, setUser, hasHydrated } = useAppStore();
  
  // Initialize custom real-time event stream
  useRealtime();

  useEffect(() => {
    // Only attempt profile fetch if we have hydrated the store from localStorage
    if (hasHydrated) {
      const token = typeof window !== 'undefined'
        ? localStorage.getItem('bamzysms-token') || sessionStorage.getItem('bamzysms-token')
        : null;
      
      // Always refresh profile from backend when a token exists so persisted
      // local state does not drift from the database across reloads.
      if (token) {
        userService.getProfile()
          .then((res) => {
            if (user) {
              setUser(res.data);
            } else {
              login(res.data);
            }
          })
          .catch((err) => {
            console.error('Session restoration failed:', err);
            // If token is invalid (e.g. 401), logout cleaning up state and token
            logout();
          });
      }
    }
  }, [hasHydrated, user, login, logout, setUser]);

  if (!hasHydrated) {
    return <PageLoader />;
  }

  return <>{children}</>;
}
