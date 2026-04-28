'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/appStore';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';

export default function AdminDashboard() {
  const router = useRouter();
  const { isAuthenticated, user, logout, addToast } = useAppStore();
  
  const { data: orders, isLoading } = useQuery<any[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const response: any = await axiosInstance.get('/orders');
      return response.data || [];
    },
    enabled: isAuthenticated && user?.role === 'admin',
    refetchInterval: 30000, // Polling every 30s
    initialData: [],
  });

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, user, router, isLoading]);

  if (isLoading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center font-headline font-bold">
      Initializing Dashboard...
    </div>
  );

  return (
    <div className="bg-surface min-h-screen flex flex-col md:flex-row">
      {/* Mini Sidebar */}
      <aside className="w-full md:w-64 bg-on-surface text-surface p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-on-background">monitoring</span>
            </div>
            <h1 className="font-headline font-bold text-xl">Soji Admin</h1>
          </div>
          
          <nav className="space-y-2">
            <button className="w-full text-left px-4 py-3 bg-white/10 rounded-xl flex items-center gap-3">
              <span className="material-symbols-outlined">receipt_long</span>
              Orders
            </button>
            <button className="w-full text-left px-4 py-3 hover:bg-white/5 rounded-xl flex items-center gap-3 transition-colors">
              <span className="material-symbols-outlined">inventory_2</span>
              Products
            </button>
            <button className="w-full text-left px-4 py-3 hover:bg-white/5 rounded-xl flex items-center gap-3 transition-colors">
              <span className="material-symbols-outlined">analytics</span>
              Analytics
            </button>
          </nav>
        </div>

        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 text-error-container hover:bg-error/10 rounded-xl transition-colors"
        >
          <span className="material-symbols-outlined">logout</span>
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="font-headline font-bold text-3xl">Active Orders</h2>
            <p className="text-outline font-body">Real-time order tracking</p>
          </div>
          <div className="bg-primary-container/20 text-primary-container px-4 py-2 rounded-full font-label font-bold text-xs uppercase tracking-widest">
            {orders.length} Active
          </div>
        </header>

        {/* Analytics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/10 shadow-sm">
            <span className="font-label text-[10px] uppercase font-bold text-outline">Total Revenue</span>
            <p className="text-3xl font-headline font-bold mt-1">₦{orders.reduce((a: number, b: any) => a + (b.total_amount || 0), 0).toLocaleString()}</p>
          </div>
          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/10 shadow-sm">
            <span className="font-label text-[10px] uppercase font-bold text-outline">Avg Order</span>
            <p className="text-3xl font-headline font-bold mt-1">₦{(orders.length ? Math.round(orders.reduce((a: number, b: any) => a + (b.total_amount || 0), 0) / orders.length) : 0).toLocaleString()}</p>
          </div>
          <div className="bg-tertiary/10 p-6 rounded-3xl border border-tertiary/10 shadow-sm">
            <span className="font-label text-[10px] uppercase font-bold text-tertiary">Conversion OK</span>
            <p className="text-3xl font-headline font-bold mt-1 text-tertiary">100%</p>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/10 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low">
              <tr>
                <th className="p-4 font-label text-[10px] uppercase font-bold text-outline">Ref</th>
                <th className="p-4 font-label text-[10px] uppercase font-bold text-outline">Customer</th>
                <th className="p-4 font-label text-[10px] uppercase font-bold text-outline">Items</th>
                <th className="p-4 font-label text-[10px] uppercase font-bold text-outline">Total</th>
                <th className="p-4 font-label text-[10px] uppercase font-bold text-outline">Status</th>
                <th className="p-4 font-label text-[10px] uppercase font-bold text-outline">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="p-4 font-label font-bold text-sm tracking-tight">{order.order_ref}</td>
                  <td className="p-4">
                    <div className="font-body font-bold text-sm">{order.customer_name}</div>
                    <div className="font-body text-[10px] text-outline">{order.customer_phone}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-[10px] font-body line-clamp-1 text-outline-variant">
                      {(Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]'))
                        .map((i: any) => `${i.quantity}x ${i.name}`)
                        .join(', ')}
                    </div>
                  </td>
                  <td className="p-4 font-label font-bold text-sm">₦{order.total_amount.toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                      order.status === 'pending' ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-tertiary-fixed text-on-tertiary-fixed'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-[10px] text-outline">{new Date(order.created_at).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && (
            <div className="p-20 text-center text-outline font-body italic">
              No orders yet. They&apos;ll appear here automatically.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
