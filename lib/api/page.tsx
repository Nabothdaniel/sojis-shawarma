'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { orderService, Order, OrderItem } from '@/lib/api';

export default function AdminOrders() {
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await orderService.getAllOrders(filter === 'all' ? undefined : filter);
      setOrders(response.data || []);
    } catch (err) {
      console.error('Fetch orders failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !token) router.push('/login');
    if (token) fetchOrders();
  }, [token, filter, authLoading]);

  const updateStatus = async (id: number, status: string) => {
    try {
      await orderService.updateOrderStatus(id, status);
      fetchOrders(); // Refresh the list
      setSelectedOrder(null);
    } catch (err) {
      console.error('Update status failed');
    }
  };

  return (
    <div className="bg-surface min-h-screen p-6 md:p-10">
      <header className="mb-10">
        <h1 className="font-headline font-bold text-3xl">Logistics Command</h1>
        <div className="flex gap-2 mt-6 overflow-x-auto no-scrollbar">
          {['all', 'pending', 'confirmed', 'preparing', 'dispatched', 'delivered', 'cancelled'].map(s => (
            <button 
              key={s} 
              onClick={() => setFilter(s)}
              className={`px-6 py-2 rounded-full font-label text-[10px] uppercase font-bold tracking-widest transition-all ${filter === s ? 'bg-on-surface text-surface' : 'bg-surface-container-low text-outline'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-4">
          {orders.map(order => (
            <div 
              key={order.id} 
              onClick={() => setSelectedOrder(order)}
              className="bg-white p-6 rounded-3xl border border-outline-variant/10 flex justify-between items-center cursor-pointer hover:border-primary transition-all"
            >
              <div>
                <p className="font-label font-bold text-sm tracking-tight text-secondary">#{order.id}</p>
                <p className="font-headline font-bold text-base mt-1">{order.customer_name}</p>
                <p className="font-body text-xs text-outline">{order.customer_phone}</p>
              </div>
              <div className="text-right">
                <p className="font-label font-bold text-lg">₦{order.total_amount.toLocaleString()}</p>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${order.status === 'pending' ? 'bg-secondary/10 text-secondary' : 'bg-tertiary/10 text-tertiary'}`}>
                  {order.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {selectedOrder && (
          <div className="bg-white p-8 rounded-[40px] border border-outline-variant/10 shadow-xl sticky top-10 h-fit">
            <h2 className="font-headline font-bold text-2xl mb-6">Order Details</h2>
            <div className="space-y-6">
              <div>
                <p className="font-label text-[10px] uppercase font-bold text-outline">Delivery Address</p>
                <p className="font-body text-sm mt-1">{selectedOrder.delivery_address}</p>
              </div>
              
              <div>
                <p className="font-label text-[10px] uppercase font-bold text-outline">Items</p>
                <ul className="mt-2 space-y-2">
                   {selectedOrder.items.map((item: OrderItem, idx: number) => (
                     <li key={idx} className="text-sm font-body flex justify-between">
                        <span>{item.quantity}x {item.name}</span>
                        <span className="font-bold">₦{(item.price * item.quantity).toLocaleString()}</span>
                     </li>
                   ))}
                </ul>
              </div>

              <div className="pt-6 border-t border-outline-variant/20">
                <p className="font-label text-[10px] uppercase font-bold text-outline mb-4">Set Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {['confirmed', 'preparing', 'dispatched', 'delivered', 'cancelled'].map(s => (
                    <button 
                      key={s}
                      onClick={() => updateStatus(selectedOrder.id, s)}
                      className="px-4 py-3 rounded-xl border border-outline-variant text-[10px] font-bold uppercase hover:bg-on-surface hover:text-surface transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
