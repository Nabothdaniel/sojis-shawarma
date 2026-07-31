'use client';

import React, { Suspense, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/store/appStore';
import { orderService, type Order } from '@/lib/api';
import BottomNav from '@/components/ui/BottomNav';
import OrderDetailClient from './[id]/OrderDetailClient';

const activeStatuses: Order['status'][] = ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'dispatched'];

const statusTone: Record<Order['status'], string> = {
  pending: 'bg-secondary/10 text-secondary',
  confirmed: 'bg-primary-container/20 text-on-surface',
  preparing: 'bg-primary-container/20 text-on-surface',
  ready_for_pickup: 'bg-primary-container/20 text-on-surface',
  dispatched: 'bg-tertiary/10 text-tertiary',
  delivered: 'bg-tertiary/20 text-tertiary',
  cancelled: 'bg-error/10 text-error',
};

const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;
const formatDate = (value: string) =>
  new Date(value).toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });

function OrdersPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');
  const { isAuthenticated, hasHydrated, addToast } = useAppStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.replace('/login?redirect=/orders');
      return;
    }

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const response: any = await orderService.getAllOrders();
        const data = response.data || response || [];
        setOrders(Array.isArray(data) ? data : []);
      } catch (err: any) {
        addToast(err.message || 'Could not load orders', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) fetchOrders();
  }, [isAuthenticated, hasHydrated, router, addToast]);

  const activeOrders = useMemo(
    () => orders.filter((o) => activeStatuses.includes(o.status)),
    [orders]
  );

  const historyOrders = useMemo(
    () => orders.filter((o) => ['delivered', 'cancelled'].includes(o.status)),
    [orders]
  );

  if (orderId) {
    return <OrderDetailClient id={orderId} />;
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-32">
      <header className="px-6 py-6 flex items-center justify-between bg-surface sticky top-0 z-40 border-b border-outline-variant/10">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/show')} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low">
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <h1 className="font-headline font-bold text-xl">My Orders</h1>
        </div>
      </header>

      <main className="px-6 py-6 space-y-8 max-w-md mx-auto w-full">
        <section className="flex gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`flex-1 rounded-full px-4 py-3 text-xs font-label font-bold uppercase tracking-widest transition-colors ${activeTab === 'active'
                ? 'bg-on-surface text-surface'
                : 'bg-surface-container-low text-outline'
              }`}
          >
            Active Orders ({activeOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 rounded-full px-4 py-3 text-xs font-label font-bold uppercase tracking-widest transition-colors ${activeTab === 'history'
                ? 'bg-on-surface text-surface'
                : 'bg-surface-container-low text-outline'
              }`}
          >
            Order History ({historyOrders.length})
          </button>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-headline font-bold text-lg">
              {activeTab === 'active' ? 'Active Tracking' : 'Past Delights'}
            </h2>
            <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-[10px] font-bold uppercase">
              {activeTab === 'active' ? `${activeOrders.length} Running` : `${historyOrders.length} Saved`}
            </span>
          </div>

          {loading && (
            <div className="bg-surface-container-low rounded-3xl p-8 text-center animate-pulse">
              <p className="font-body text-sm text-outline">Syncing with kitchen...</p>
            </div>
          )}

          {!loading && activeTab === 'active' && activeOrders.length === 0 && (
            <div className="bg-surface-container-low rounded-3xl p-8 text-center space-y-3">
              <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="material-symbols-outlined text-outline/30 text-3xl">delivery_truck_speed</span>
              </div>
              <p className="font-headline font-bold text-base">No active orders</p>
              <p className="font-body text-xs text-outline">When you place an order, you can track its journey here in real-time.</p>
              <Link href="/show" className="inline-block bg-on-surface text-surface px-6 py-3 rounded-full text-xs font-label font-bold uppercase tracking-widest mt-2">
                Order Now
              </Link>
            </div>
          )}

          {activeTab === 'active' && activeOrders.map((order) => (
            <Link key={order.id} href={`/orders?id=${order.id}`} className="block bg-surface-container-low rounded-[32px] p-6 space-y-4 border border-outline-variant/5 shadow-sm active:scale-[0.98] transition-transform">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-headline font-bold text-lg">{order.order_ref}</p>
                  <p className="font-body text-[10px] text-outline uppercase tracking-widest font-bold">{formatDate(order.created_at)}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${statusTone[order.status]}`}>
                  {order.status}
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-hidden">
                {order.items.slice(0, 3).map((item: any, i: number) => (
                  <span key={i} className="bg-surface-container-high px-3 py-1 rounded-full text-[10px] whitespace-nowrap text-outline">{item.quantity}x {item.name}</span>
                ))}
                {order.items.length > 3 && <span className="text-[10px] text-outline">+{order.items.length - 3} more</span>}
              </div>

              <div className="pt-4 border-t border-outline-variant/20 flex justify-between items-center">
                <span className="font-label text-[10px] uppercase tracking-widest text-outline font-bold">Total Amount</span>
                <span className="font-headline font-bold text-primary-container" style={{ color: '#EAB600' }}>{formatCurrency(order.total_amount)}</span>
              </div>
            </Link>
          ))}

          {!loading && activeTab === 'history' && historyOrders.length === 0 && (
            <div className="bg-surface-container-low rounded-3xl p-8 text-center space-y-3">
              <p className="font-headline font-bold text-base">No past orders yet</p>
              <p className="font-body text-xs text-outline">
                Delivered and cancelled orders will show up here after your first checkout.
              </p>
            </div>
          )}

          {activeTab === 'history' && historyOrders.map((order) => (
            <div key={order.id} className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-4 flex justify-between items-center">
              <div>
                <p className="font-body font-bold text-sm">{order.order_ref}</p>
                <p className="font-body text-[10px] text-outline">{formatDate(order.updated_at)}</p>
              </div>
              <div className="text-right">
                <p className="font-label font-bold text-sm mb-1">{formatCurrency(order.total_amount)}</p>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${statusTone[order.status]}`}>
                  {order.status}
                </span>
              </div>
            </div>
          ))}
        </section>
      </main>

      <BottomNav active="orders" />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface flex items-center justify-center font-body text-sm text-outline">Loading orders...</div>}>
      <OrdersPageInner />
    </Suspense>
  );
}
