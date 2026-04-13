import apiClient from './client';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  balance: number;
  role: 'user' | 'admin';
  created_at: string;
}

export interface AdminSettings {
  price_markup_multiplier: string;
  usd_to_ngn_rate: string;
  [key: string]: string;
}

export interface PricingOverride {
  id: number;
  service_code: string;
  multiplier: number | null;
  fixed_price: number | null;
  updated_at: string;
}

export const adminService = {
  // Get all users
  getUsers: (): Promise<{ status: string; data: AdminUser[] }> =>
    apiClient.get('/admin/users'),

  // Update a user's balance
  updateUserBalance: (userId: number, balance: number): Promise<{ status: string; message: string }> =>
    apiClient.post('/admin/user/balance', { userId, balance }),

  // Get system settings (markup, etc.)
  getSettings: (): Promise<{ status: string; data: AdminSettings }> =>
    apiClient.get('/admin/settings'),

  // Update system settings
  updateSettings: (settings: Partial<AdminSettings>): Promise<{ status: string; message: string }> =>
    apiClient.post('/admin/settings', settings),

  // Get provider (SMSBower) balance
  getProviderBalance: (): Promise<{ status: string; balance: number }> =>
    apiClient.get('/admin/provider-balance'),

  // Pricing Overrides
  getPricingOverrides: (): Promise<{ status: string; data: PricingOverride[] }> =>
    apiClient.get('/admin/pricing/overrides'),

  updatePricingOverride: (data: { serviceCode: string; countryId?: number; multiplier?: number; fixedPrice?: number }): Promise<{ status: string; message: string }> =>
    apiClient.post('/admin/pricing/update', data),

  bulkUpdatePricingOverrides: (data: { countryId: number; overrides: { serviceCode: string; fixedPrice: number }[] }): Promise<{ status: string; message: string }> =>
    apiClient.post('/admin/pricing/bulk-update', data),

  deletePricingOverride: (serviceCode: string, countryId: number = 0): Promise<{ status: string; message: string }> =>
    apiClient.delete(`/admin/pricing/delete?serviceCode=${serviceCode}&countryId=${countryId}`),

  // Audit Logs
  getSystemLogs: (): Promise<{ status: string; data: any[] }> =>
    apiClient.get('/admin/logs'),

  // Analytics
  getAnalytics: (): Promise<{ status: string; data: any }> =>
    apiClient.get('/admin/analytics'),

  // Paginated Services for Price Management
  getPaginatedServices: (params: { page: number; limit: number; search?: string; countryId?: number }): Promise<{ 
    status: string; 
    data: any[]; 
    pagination: { total: number; page: number; limit: number; pages: number } 
  }> =>
    apiClient.get(`/admin/pricing/services?page=${params.page}&limit=${params.limit}&search=${params.search || ''}&countryId=${params.countryId || 0}`),

  // Get countries list
  getCountries: (): Promise<{ status: string; data: any[] }> =>
    apiClient.get('/admin/countries'),

  // Get provider status
  getProviderStatus: (): Promise<{ status: string; data: any }> =>
    apiClient.get('/admin/provider/status'),
};
