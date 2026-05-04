import apiClient from './client';

export const authService = {
  login: (credentials: any) => apiClient.post('/auth/login', credentials),
  register: (payload: any) => apiClient.post('/auth/register', payload),
  logout: () => apiClient.post('/auth/logout', {}),
};
