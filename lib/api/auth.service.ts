import apiClient from './client';

export const authService = {
  login: (credentials: any) => apiClient.post('/auth/login', credentials),
  register: (userData: any) => apiClient.post('/auth/register', userData),
  sendOtp: (username: string, type: 'signup' | 'reset' = 'signup') => 
    apiClient.post('/auth/send-otp', { username, type }),
  verifyOtp: (username: string, otp: string, type: 'signup' | 'reset' = 'signup') => 
    apiClient.post('/auth/verify-otp', { username, otp, type }),
  resetPassword: (data: any) => apiClient.post('/auth/reset-password', data),
  resetWithKey: (data: { username: string; recovery_key: string; password: string }) => 
    apiClient.post('/auth/reset-with-key', data),
};
