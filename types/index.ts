export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface User {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  role: 'user' | 'admin';
}

export interface Order {
  id: string;
  items: any[]; // Link to CartItem if needed
  total: number;
  status: 'pending' | 'preparing' | 'delivered' | 'cancelled';
  createdAt: string;
}

export interface AppState {
  // UI
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;

  // Sidebar (Admin)
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Auth
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User, token?: string) => void;
  logout: () => void;
  setUser: (user: User) => void;

  // Toasts
  toasts: ToastMessage[];
  addToast: (message: string, type: ToastMessage['type']) => void;
  removeToast: (id: string) => void;

  // Active nav section
  activeSection: string;
  setActiveSection: (section: string) => void;

  // Hydration
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

