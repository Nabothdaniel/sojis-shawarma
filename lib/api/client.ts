import axios from 'axios';
import { auth } from '../firebase/config';

const getApiUrl = () => {
  // Use env variable if present, otherwise default to local server for development
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  // Strip quotes and semicolons
  return url.replace(/["';]/g, '');
};

const API_URL = getApiUrl();

const normalizePathname = (pathname: string) => {
  if (!pathname || pathname === '/') {
    return '/';
  }

  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
};

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Request interceptor for attaching Firebase Auth token
apiClient.interceptors.request.use(
  async (config) => {
    if (typeof window !== 'undefined') {
      const user = auth.currentUser;
      if (user) {
        try {
          const token = await user.getIdToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Error fetching Firebase token for request:', error);
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Check if we are on a route that requires authentication
    const pathname = normalizePathname(
      typeof window !== 'undefined' ? window.location.pathname : ''
    );
    const isAdminRoute = pathname.startsWith('/admin');
    const isPublicRoute = typeof window !== 'undefined' &&
      (pathname === '/login' ||
        pathname === '/signup' ||
        pathname === '/register' ||
        pathname === '/admin/login' ||
        pathname === '/');

    // Auto-logout on 401 (expired/invalid JWT)
    if (error.response?.status === 401 && typeof window !== 'undefined' && !isPublicRoute) {
      console.warn('API returned 401 - Session expired or invalid. Redirecting to login.');

      // Try signing out of Firebase on 401
      auth.signOut().catch(console.error);

      // Clean up legacy storage gracefully
      ['soji-token', 'soji-storage'].forEach((k) => {
        try { localStorage.removeItem(k); } catch { }
        try { sessionStorage.removeItem(k); } catch { }
      });

      // Hard redirect to the appropriate login so back button won't return to a protected page
      window.location.replace(isAdminRoute ? '/admin/login?expired=true' : '/login?expired=true');

      return Promise.reject(new Error('Session expired. Please log in again.'));
    }

    const message = error.response?.data?.message || error.response?.data?.error || 'Something went wrong';
    const normalizedError: Error & { status?: number; response?: unknown } = new Error(message);
    normalizedError.status = error.response?.status;
    normalizedError.response = error.response;
    return Promise.reject(normalizedError);
  }
);

export default apiClient;
