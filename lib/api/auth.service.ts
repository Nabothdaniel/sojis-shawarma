import apiClient from './client';

export const authService = {
  login: (credentials: any) => apiClient.post('/auth/login', credentials),
  register: (userData: any) => apiClient.post('/auth/register', userData),
  sendOtp: (email: string, type: 'signup' | 'reset' = 'signup') => 
    apiClient.post('/auth/send-otp', { email, type }),
  verifyOtp: (email: string, otp: string, type: 'signup' | 'reset' = 'signup') => 
    apiClient.post('/auth/verify-otp', { email, otp, type }),
  resetPassword: (data: any) => apiClient.post('/auth/reset-password', data),
};
