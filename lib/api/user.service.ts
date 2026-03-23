import apiClient from './client';

export const userService = {
  getProfile: () => apiClient.get('/user/profile'),
  getBalance: () => apiClient.get('/user/balance'),
  getTransactions: () => apiClient.get('/transactions'),
};
