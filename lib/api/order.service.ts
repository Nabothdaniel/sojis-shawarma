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
  user_id?: number | null;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  order_type?: 'delivery' | 'pickup';
  payment_method?: 'bank_transfer' | 'cash_on_pickup';
  pickup_time?: string | null;
  items: OrderItem[];
  total_amount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready_for_pickup' | 'dispatched' | 'delivered' | 'cancelled';
  payment_status?: 'pending' | 'submitted' | 'confirmed' | 'rejected';
  receipt_path?: string | null;
  payment_reference?: string | null;
  payment_submitted_at?: string | null;
  payment_reviewed_at?: string | null;
  payment_reviewed_by?: number | null;
  admin_note?: string;
  notes?: string;
  reviewed_product_ids?: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateOrderData {
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  order_type?: 'delivery' | 'pickup';
  payment_method?: 'bank_transfer' | 'cash_on_pickup';
  pickup_time?: string;
  items: OrderItem[];
  total_amount: number;
  payment_reference?: string;
  notes?: string;
  payment_status?: string;
}

export interface PaymentSettings {
  payment_account_name: string;
  payment_account_number: string;
  payment_bank_name: string;
  payment_note: string;
  support_whatsapp: string;
  pickup_address: string;
  pickup_instructions: string;
}

export const orderService = {
  // Customer orders
  createOrder: (orderData: CreateOrderData) =>
    apiClient.post('/orders', orderData),

  // Confirm payment with receipt
  confirmPayment: (orderId: number, receiptData: FormData) =>
    apiClient.post(`/orders/${orderId}/confirm-payment`, receiptData),

  reviewPayment: (id: number, payload: { action: 'confirm' | 'reject'; admin_note?: string }) =>
    apiClient.put(`/orders/${id}/payment-review`, payload),

  // Admin orders management
  getAllOrders: (status?: string) =>
    apiClient.get(status ? `/orders?status=${status}` : '/orders'),

  getOrderById: (id: number) =>
    apiClient.get(`/orders/${id}`),

  updateOrderStatus: (id: number, status: string) =>
    apiClient.put(`/orders/${id}/status`, { status }),

  getPaymentSettings: (): Promise<{ status: string; data: PaymentSettings }> =>
    apiClient.get('/store-settings/payment'),

  // Analytics
  getOrderAnalytics: () =>
    apiClient.get('/analytics/orders'),
};
