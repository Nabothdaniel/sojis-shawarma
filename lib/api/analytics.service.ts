import apiClient from './client';

export interface AnalyticsData {
  orders_today: number;
  revenue_today: number;
  orders_week: number;
  revenue_week: number;
  orders_month: number;
  revenue_month: number;
  top_products: Array<{
    name: string;
    count: number;
  }>;
  status_breakdown: Array<{
    status: string;
    count: number;
  }>;
  abandonment_rate: number;
}

export const analyticsService = {
  getSummary: () => apiClient.get('/analytics/summary'),
  getOrderAnalytics: () => apiClient.get('/analytics/orders'),
};