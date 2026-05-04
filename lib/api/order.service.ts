import apiClient from './client';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
}

export interface Order {
  id: number;
  order_ref: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  items: OrderItem[];
  total_amount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'dispatched' | 'delivered' | 'cancelled';
  payment_status?: 'pending' | 'submitted' | 'confirmed' | 'rejected';
  receipt_path?: string | null;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderData {
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  items: OrderItem[];
  total_amount: number;
  notes?: string;
  payment_status?: string;
}

export const orderService = {
  // Customer orders
  createOrder: (orderData: CreateOrderData) =>
    apiClient.post('/orders', orderData),

  // Confirm payment with receipt
  confirmPayment: (orderId: number, receiptData: FormData) =>
    apiClient.post(`/orders/${orderId}/confirm-payment`, receiptData),

  // Admin orders management
  getAllOrders: (status?: string) =>
    apiClient.get(status ? `/orders?status=${status}` : '/orders'),

  getOrderById: (id: number) =>
    apiClient.get(`/orders/${id}`),

  updateOrderStatus: (id: number, status: string) =>
    apiClient.put(`/orders/${id}/status`, { status }),

  // Analytics
  getOrderAnalytics: () =>
    apiClient.get('/analytics/orders'),
};
