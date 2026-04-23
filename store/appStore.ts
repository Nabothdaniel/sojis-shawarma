'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState } from '@/types';

const generateId = () => Math.random().toString(36).slice(2, 9);

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // UI
      mobileMenuOpen: false,
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
      toggleMobileMenu: () => set((s) => ({ mobileMenuOpen: !s.mobileMenuOpen })),

      // Sidebar
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

      // Auth
      user: null,
      isAuthenticated: false,
      login: (user, token) => {
        if (token) {
          sessionStorage.setItem('soji-token', token);
          localStorage.setItem('soji-token', token);
        }
        set({ user, isAuthenticated: true });
      },
      logout: () => {
        const keys = ['soji-token', 'soji-storage'];
        keys.forEach((k) => {
          try { localStorage.removeItem(k); } catch {}
          try { sessionStorage.removeItem(k); } catch {}
        });

        set({
          user: null,
          isAuthenticated: false,
          toasts: [],
          mobileMenuOpen: false,
        });

        if (typeof window !== 'undefined') {
          window.location.replace('/');
        }
      },
      setUser: (user) => set({ user }),

      // Toasts
      toasts: [],
      addToast: (message, type) => {
        const existing = get().toasts.find(t => t.message === message && t.type === type);
        if (existing) return;

        const id = generateId();
        set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
        setTimeout(() => get().removeToast(id), 4000);
      },
      removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      // Nav
      activeSection: 'home',
      setActiveSection: (section) => set({ activeSection: section }),

      // Hydration
      hasHydrated: false,
      setHasHydrated: (state: boolean) => set({ hasHydrated: state }),
    }),
    {
      name: 'soji-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (rehydratedState) => {
        rehydratedState?.setHasHydrated(true);
      },
    }
  )
);

