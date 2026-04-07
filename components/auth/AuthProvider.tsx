'use client';

import React, { useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { userService } from '@/lib/api';
import PageLoader from '@/components/ui/PageLoader';

/**
 * AuthProvider component handles session initialization and re-authentication
 * across page reloads by checking localStorage for a valid token.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, login, logout, hasHydrated } = useAppStore();

  useEffect(() => {
    // Only attempt profile fetch if we have hydrated the store from localStorage
    if (hasHydrated) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('bamzysms-token') : null;
      
      // If we have a token but no user object (or if we want to refresh the user data), fetch profile
      if (token && !user) {
        userService.getProfile()
          .then((res) => {
            login(res.data);
          })
          .catch((err) => {
            console.error('Session restoration failed:', err);
            // If token is invalid (e.g. 401), logout cleaning up state and token
            logout();
          });
      }
    }
  }, [hasHydrated, user, login, logout]);

  // Optionally show a global loader if the store hasn't hydrated yet
  // but we usually prefer to let components handle their own loading to avoid full-page flicker
  if (!hasHydrated) {
    return <PageLoader />;
  }

  return <>{children}</>;
}
