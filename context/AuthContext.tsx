'use client';

import { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '@/store/appStore';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import type { User } from '@/types';

interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { token, setToken, login, logout } = useAppStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      try {
        if (firebaseUser) {
          const idToken = await firebaseUser.getIdToken();
          
          let userData: any = {};
          
          try {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
              userData = userDoc.data();
            }
          } catch (firestoreError) {
            console.error("Could not fetch user document on reload, proceeding with basic auth payload:", firestoreError);
            // We do NOT throw here because we still have the authenticated firebaseUser
          }
          
          const role = userData.role || 'user';

          const mappedUser: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || userData.name || 'User',
            email: firebaseUser.email || userData.email || undefined,
            role: role,
            phone: userData.phone || undefined,
            address: userData.address || undefined,
          };
          login(mappedUser, idToken);
        } else {
          logout();
        }
      } catch (error) {
        console.error("Critical auth state handling error", error);
        // Only force logout if the core token logic truly fails
        logout();
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [login, logout]);

  // Separate effect for admin logout on unauthorized access
  useEffect(() => {
    if (pathname.startsWith('/admin') && token === null && !isLoading) {
      router.push('/admin/login');
    }
  }, [isLoading, pathname, router, token]);

  const contextValue = useMemo(() => ({ token, setToken, isLoading }), [token, setToken, isLoading]);

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
