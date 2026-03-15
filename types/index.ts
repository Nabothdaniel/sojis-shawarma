export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface User {
  name: string;
  email: string;
  phone?: string;
  balance: number;
  smsUnits: number;
  referralCode: string;
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
  login: (user: User) => void;
  logout: () => void;

  // Email (landing)
  email: string;
  setEmail: (email: string) => void;
  submittedEmails: string[];
  submitEmail: (email: string) => void;

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
}
