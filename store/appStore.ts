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
        // Ensure virtual accounts are reset for the new login session
        set({ user, isAuthenticated: true, virtualAccounts: [] });
      },
      logout: () => {
        sessionStorage.removeItem('bamzysms-token');
        localStorage.removeItem('bamzysms-token');
        localStorage.removeItem('bamzysms-storage');
        set({ user: null, isAuthenticated: false, virtualAccounts: [] });
      },
      updateUserBalance: (balance: number) => {
        set((s) => {
          if (!s.user) return s;
          return { user: { ...s.user, balance } };
        });
      },

      // Toasts
      toasts: [],
      addToast: (message, type) => {
        // Avoid duplicate toasts with the same message
        const existing = get().toasts.find(t => t.message === message && t.type === type);
        if (existing) return;

        const id = generateId();
        set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
        setTimeout(() => get().removeToast(id), 4000);
      },
      removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      // Notifications
      notifications: [],
      unreadCount: 0,
      addNotification: (notification) => {
        set((s) => {
          // Avoid duplicate notifications with same payload
          const isDuplicate = s.notifications.some(
            (n) => n.event_type === notification.event_type && n.payload === notification.payload
          );
          if (isDuplicate) return s;

          return {
            notifications: [notification, ...s.notifications].slice(0, 30),
            unreadCount: notification.is_read ? s.unreadCount : s.unreadCount + 1
          };
        });
      },
      setNotifications: (notifications, unreadCount) => {
        set({ notifications, unreadCount });
      },
      markRead: (id) => {
        set((s) => {
          const newNotifications = s.notifications.map((n) => {
            if (id === undefined || n.id === id) {
              return { ...n, is_read: true };
            }
            return n;
          });
          const newUnreadCount = id === undefined ? 0 : Math.max(0, s.unreadCount - 1);
          return { notifications: newNotifications, unreadCount: newUnreadCount };
        });
      },

      // Nav
      activeSection: 'home',
      setActiveSection: (section) => set({ activeSection: section }),

      // Welcome modal
      welcomeModalSeen: false,
      setWelcomeModalSeen: () => set({ welcomeModalSeen: true }),

      // Hydration
      hasHydrated: false,
      setHasHydrated: (state: boolean) => set({ hasHydrated: state }),

      // Privacy
      balanceHidden: false,
      setBalanceHidden: (hidden) => set({ balanceHidden: hidden }),

      // Payments
      virtualAccounts: [],
      setVirtualAccounts: (accounts) => set({ virtualAccounts: accounts }),
    }),
    {
      name: 'bamzysms-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        welcomeModalSeen: state.welcomeModalSeen,
        balanceHidden: state.balanceHidden,

      }),
      onRehydrateStorage: (state) => {
        return () => state.setHasHydrated(true);
      },
    }
  )
);
