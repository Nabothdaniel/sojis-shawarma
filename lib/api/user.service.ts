import apiClient from './client';

export const userService = {
  getProfile: () => apiClient.get('/user/profile'),
  getBalance: () => apiClient.get('/user/balance'),
  getTransactions: () => apiClient.get('/transactions'),
  updatePin: (pin: string) => apiClient.post('/user/update-pin', { pin }),
  verifyPin: (pin: string) => apiClient.post('/user/verify-pin', { pin }),
};
