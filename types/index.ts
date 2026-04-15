export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface User {
  username: string;
  name: string;
  phone?: string;
  balance: number;
  smsUnits: number;
  referralCode: string;
  role: 'user' | 'admin';
  hasPin: boolean;
}

export interface AppState {
  // UI
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;

  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Auth
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User, token?: string) => void;
  logout: () => void;

  // Toasts
  toasts: ToastMessage[];
  addToast: (message: string, type: ToastMessage['type']) => void;
  removeToast: (id: string) => void;

  // Active nav (landing)
  activeSection: string;
  setActiveSection: (section: string) => void;

  // Welcome modal
  welcomeModalSeen: boolean;
  setWelcomeModalSeen: () => void;

  // Hydration
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}
