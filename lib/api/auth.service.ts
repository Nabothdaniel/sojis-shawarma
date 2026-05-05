import apiClient from './client';

export const authService = {
  login: (credentials: any) => apiClient.post('/auth/login', credentials),
  register: (payload: any) => apiClient.post('/auth/register', payload),
  resetPassword: (payload: any) => apiClient.post('/auth/reset-password', payload),
  getAdminAccessStatus: (access?: string) =>
    apiClient.get(`/admin/access-link/public${access ? `?access=${encodeURIComponent(access)}` : ''}`),
  logout: () => apiClient.post('/auth/logout', {}),
};
