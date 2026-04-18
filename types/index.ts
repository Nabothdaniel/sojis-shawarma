export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface User {
  id: number;
  username: string;
  name: string;
  phone?: string;
  balance: number;
  smsUnits: number;
  referralCode: string;
  role: 'user' | 'admin';
  hasPin: boolean;
  recovery_key_saved: boolean;
  whatsapp_notifications: boolean;
  whatsapp_number?: string;
}

export interface Notification {
  id: number;
  event_type: string;
  payload: string; // JSON string
  is_read: boolean;
  created_at: string;
}

export interface VirtualAccount {
  bankCode: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  Reserved_Account_Id?: string;
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
  updateUserBalance: (balance: number) => void;

  // Payments
  virtualAccounts: VirtualAccount[];
  setVirtualAccounts: (accounts: VirtualAccount[]) => void;

  // Toasts
  toasts: ToastMessage[];
  addToast: (message: string, type: ToastMessage['type']) => void;
  removeToast: (id: string) => void;

  // Notifications
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  setNotifications: (notifications: Notification[], unreadCount: number) => void;
  markRead: (id?: number) => void;

  // Active nav (landing)
  activeSection: string;
  setActiveSection: (section: string) => void;

  // Welcome modal
  welcomeModalSeen: boolean;
  setWelcomeModalSeen: () => void;

  // Privacy
  balanceHidden: boolean;
  setBalanceHidden: (hidden: boolean) => void;

  // Hydration
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}
