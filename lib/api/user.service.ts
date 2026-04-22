import apiClient, { decryptSensitive } from './client';

export const userService = {
  getProfile: () => apiClient.get('/user/profile'),
  getBalance: () => apiClient.get('/user/balance'),
  getTransactions: () => apiClient.get('/transactions'),
  updatePin: (pin: string) => apiClient.post('/user/update-pin', { pin }),
  verifyPin: (pin: string) => apiClient.post('/user/verify-pin', { pin }),
  getSecurityInfo: () => apiClient.get('/user/security'),
  updateSecuritySettings: (data: { whatsapp_notifications: boolean; whatsapp_number?: string }) => 
    apiClient.post('/user/security', data),
  confirmRecoveryKeySaved: () => apiClient.post('/user/confirm-key-saved'),
  
  regenerateRecoveryKey: async (pin: string) => {
    const res: any = await apiClient.post('/user/regenerate-recovery-key', { pin });
    if (res.status === 'success' && res.data?.recovery_key) {
      res.data.recovery_key = await decryptSensitive(res.data.recovery_key);
    }
    return res;
  },
  
  revealRecoveryKey: async (pin: string) => {
    const res: any = await apiClient.post('/user/reveal-recovery-key', { pin });
    if (res.status === 'success' && res.data?.recovery_key) {
      res.data.recovery_key = await decryptSensitive(res.data.recovery_key);
    }
    return res;
  },
};
