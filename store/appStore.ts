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
          sessionStorage.setItem('bamzysms-token', token);
          localStorage.setItem('bamzysms-token', token); // Optional: redundant but keeps session on reload
        }
        set({ user, isAuthenticated: true });
      },
      logout: () => {
        sessionStorage.removeItem('bamzysms-token');
        localStorage.removeItem('bamzysms-token');
        set({ user: null, isAuthenticated: false });
      },

      // Email
      email: '',
      setEmail: (email) => set({ email }),
      submittedEmails: [],
      submitEmail: (email: string) => {
        const { submittedEmails, addToast } = get();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          addToast('Please enter a valid email address.', 'error'); return;
        }
        if (submittedEmails.includes(email)) {
          addToast('This email is already registered!', 'info'); return;
        }
        set({ submittedEmails: [...submittedEmails, email], email: '' });
        addToast("You're on the list! We'll be in touch soon.", 'success');
      },

      // Toasts
      toasts: [],
      addToast: (message, type) => {
        const id = generateId();
        set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
        setTimeout(() => get().removeToast(id), 4000);
      },
      removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      // Nav
      activeSection: 'home',
      setActiveSection: (section) => set({ activeSection: section }),

      // Welcome modal
      welcomeModalSeen: false,
      setWelcomeModalSeen: () => set({ welcomeModalSeen: true }),

      // Hydration
      hasHydrated: false,
      setHasHydrated: (state: boolean) => set({ hasHydrated: state }),
    }),
    {
      name: 'bamzysms-storage',
      partialize: (state) => ({
        submittedEmails: state.submittedEmails,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        welcomeModalSeen: state.welcomeModalSeen,
      }),
      onRehydrateStorage: (state) => {
        return () => state.setHasHydrated(true);
      },
    }
  )
);
