'use client';

import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '@/store/appStore';
import axiosInstance from '@/lib/axios';

interface AuthContextType {
  token: string | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { token, setToken, logout, isAuthenticated } = useAppStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Separate effect for initial token refresh - runs only once
  useEffect(() => {
    const refreshToken = async () => {
      try {
        const data: any = await axiosInstance.post('/auth/refresh');
        if (data.token) {
          setToken(data.token);
        } else {
          throw new Error('Refresh failed');
        }
      } catch (err) {
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial check only
    refreshToken();

    // Setup auto-refresh interval (14 minutes before 15min expiry)
    intervalRef.current = setInterval(refreshToken, 14 * 60 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []); // Empty dependency array - runs only once

  // Separate effect for admin logout on unauthorized access
  useEffect(() => {
    if (pathname.startsWith('/admin') && token === null && !isLoading) {
      logout();
      router.push('/login');
    }
  }, [pathname]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({ token, isLoading }), [token, isLoading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
