import { db } from '../firebase/config';
import { collection, getDocs, getDoc, addDoc, doc, updateDoc, query, orderBy, where } from 'firebase/firestore';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
}

export interface Order {
  id: string | number;
  order_ref: string;
  user_id?: string | number | null;
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
  payment_reviewed_by?: string | number | null;
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
  user_id?: string | number | null;
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
  createOrder: async (orderData: CreateOrderData) => {
    const orderRef = `ORD-${Date.now().toString().slice(-6)}`;
    const payload = {
      ...orderData,
      order_ref: orderRef,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Firebase doesn't accept undefined values, so we sanitize the payload
    const sanitizedPayload = Object.fromEntries(
      Object.entries(payload).filter(([, v]) => v !== undefined)
    );

    const docRef = await addDoc(collection(db, 'orders'), sanitizedPayload);
    return { status: 'success', data: { id: docRef.id, ...payload } };
  },

  confirmPayment: async (orderId: string | number, receiptData: FormData) => {
    const file = receiptData.get('receipt') as File;
    const paymentRef = receiptData.get('payment_reference') as string;
    if (!file) throw new Error("No receipt file provided");
    
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) throw new Error("Cloudinary configuration is missing in .env");

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || "Failed to upload receipt to Cloudinary");
    }

    const cloudData = await res.json();
    const downloadURL = cloudData.secure_url;
    
    const updates: any = {
      receipt_path: downloadURL,
      payment_status: 'submitted',
      payment_submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (paymentRef) updates.payment_reference = paymentRef;
    
    await updateDoc(doc(db, 'orders', orderId.toString()), updates);
    return { status: 'success', data: { receipt_path: downloadURL } };
  },

  reviewPayment: async (id: string | number, payload: { action: 'confirm' | 'reject'; admin_note?: string }) => {
    await updateDoc(doc(db, 'orders', id.toString()), {
      payment_status: payload.action === 'confirm' ? 'confirmed' : 'rejected',
      admin_note: payload.admin_note || null,
      payment_reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return { status: 'success' };
  },

  getAllOrders: async (status?: string): Promise<{ status: string; data: Order[] }> => {
    let q = query(collection(db, 'orders'), orderBy('created_at', 'desc'));
    if (status && status !== 'all') {
      q = query(collection(db, 'orders'), where('status', '==', status), orderBy('created_at', 'desc'));
    }
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order));
    return { status: 'success', data };
  },

  getOrderById: async (id: string | number): Promise<{ status: string; data: Order }> => {
    const snapshot = await getDoc(doc(db, 'orders', id.toString()));
    if (!snapshot.exists()) throw new Error("Order not found");
    return { status: 'success', data: { id: snapshot.id, ...snapshot.data() } as Order };
  },

  updateOrderStatus: async (id: string | number, status: string) => {
    await updateDoc(doc(db, 'orders', id.toString()), { status, updated_at: new Date().toISOString() });
    return { status: 'success' };
  },

  getPaymentSettings: async (): Promise<{ status: string; data: PaymentSettings }> => {
    const snapshot = await getDoc(doc(db, 'settings', 'store'));
    if (snapshot.exists()) {
      return { status: 'success', data: snapshot.data() as PaymentSettings };
    }
    return {
      status: 'success',
      data: {
        payment_account_name: '', payment_account_number: '', payment_bank_name: '',
        payment_note: '', support_whatsapp: '', pickup_address: '', pickup_instructions: ''
      }
    };
  },

  getOrderAnalytics: async () => {
    return { status: 'success', data: { total_orders: 0, pending: 0 } };
  },
};
