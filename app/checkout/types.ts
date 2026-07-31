export type CheckoutStep = 'delivery' | 'payment' | 'receipt' | 'success';

export type ProfileData = {
  id?: string | number;
  name?: string | null;
  phone?: string | null;
  address?: string | null;
  email?: string | null;
};

export interface CheckoutFormData {
  name: string;
  phone: string;
  address: string;
  note: string;
  orderType: 'delivery' | 'pickup';
  pickupTime: string;
  paymentMethod: 'bank_transfer' | 'cash_on_pickup';
  paymentReference: string;
}
