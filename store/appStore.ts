'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, ToastMessage, User } from '@/types';

const recentToastTimestamps = new Map<string, number>();

const normalizeUser = (user: User): User => ({
  ...user,
  role: user.role ?? 'user',
});

const persistToken = (token: string | null) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (token) {
    window.localStorage.setItem('soji-token', token);
    window.sessionStorage.setItem('soji-token', token);
    return;
  }

  window.localStorage.removeItem('soji-token');
  window.sessionStorage.removeItem('soji-token');
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      mobileMenuOpen: false,
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
      toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),

      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => {
        persistToken(token ?? null);
        set({
          user: normalizeUser(user),
          token: token ?? null,
          isAuthenticated: true,
        });
      },
      logout: () => {
        persistToken(null);
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },
      setUser: (user) => set({ user: normalizeUser(user) }),
      setToken: (token) => {
        persistToken(token);
        set((state) => ({
          token,
          isAuthenticated: Boolean(token || state.user),
        }));
      },
      updateUserBalance: (balance) => set((state) => ({
        user: state.user ? { ...state.user, balance } : null,
      })),

      toasts: [],
      addToast: (message, type) => {
        const key = `${type}:${message.trim().toLowerCase()}`;
        const now = Date.now();
        const lastShownAt = recentToastTimestamps.get(key) ?? 0;

        if (now - lastShownAt < 5000) {
          return;
        }

        recentToastTimestamps.set(key, now);
        const id = crypto.randomUUID();
        const toast: ToastMessage = { id, message, type };

        set((state) => ({ toasts: [...state.toasts, toast] }));

        setTimeout(() => {
          set((state) => ({
            toasts: state.toasts.filter((item) => item.id !== id),
          }));
        }, 4000);
      },
      removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter((toast) => toast.id !== id),
      })),

      activeSection: 'home',
      setActiveSection: (section) => set({ activeSection: section }),

      hasHydrated: false,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      
      notifications: [],
      unreadCount: 0,
      addNotification: (notification) => set((state) => {
        const id = crypto.randomUUID();
        const newNotif = { ...notification, id, read: false };
        const deduped = notification.eventKey
          ? state.notifications.filter((item) => item.eventKey !== notification.eventKey)
          : state.notifications;
        const newList = [newNotif, ...deduped].slice(0, 50);
        return {
          notifications: newList,
          unreadCount: newList.filter(n => !n.read).length
        };
      }),
      markAsRead: (id) => set((state) => {
        const newList = state.notifications.map(n => n.id === id ? { ...n, read: true } : n);
        return {
          notifications: newList,
          unreadCount: newList.filter(n => !n.read).length
        };
      }),
      clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
    }),
    {
      name: 'soji-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        notifications: state.notifications,
        unreadCount: state.unreadCount,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
