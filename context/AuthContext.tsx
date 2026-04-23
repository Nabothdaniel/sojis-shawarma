'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '@/store/appStore';
import axiosInstance from '@/lib/axios';

interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, logout } = useAppStore();

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
      if (pathname.startsWith('/admin')) {
        logout();
        router.push('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial check
    refreshToken();
    
    // Auto refresh 1 minute before expiry (assuming 15min expiry)
    const interval = setInterval(refreshToken, 14 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AuthContext.Provider value={{ token, setToken, isLoading }}>
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
