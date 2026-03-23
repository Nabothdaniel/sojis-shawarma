import apiClient from './client';

export const smsService = {
  getServices: (category?: string) => 
    apiClient.get(`/services${category ? `?category=${category}` : ''}`),
  buyNumber: (serviceId: number) => apiClient.post('/sms/buy', { serviceId }),
  getPurchases: () => apiClient.get('/sms/purchases'),
};
