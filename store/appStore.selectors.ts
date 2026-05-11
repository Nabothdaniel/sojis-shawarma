import { useAppStore } from './appStore';

export const useAppUser = () => useAppStore((state) => state.user);

export const useAppToken = () => useAppStore((state) => state.token);

export const useIsAuthenticated = () => useAppStore((state) => state.isAuthenticated);

export const useHasHydrated = () => useAppStore((state) => state.hasHydrated);

export const useAddToast = () => useAppStore((state) => state.addToast);

export const useSetUser = () => useAppStore((state) => state.setUser);

export const useNotifications = () => useAppStore((state) => state.notifications);

export const useUnreadCount = () => useAppStore((state) => state.unreadCount);
