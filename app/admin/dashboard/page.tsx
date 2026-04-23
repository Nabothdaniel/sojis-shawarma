'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      const summaryRes = await fetch('http://localhost:8000/analytics/summary', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const ordersRes = await fetch('http://localhost:8000/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setStats(await summaryRes.json());
      setRecentOrders((await ordersRes.json()).slice(0, 5));
    } catch (err) {
      console.error('Dash fetch failed');
    }
  };

  useEffect(() => {
    if (!authLoading && !token) router.push('/login');
    if (token) {
      fetchDashboardData();
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [token, authLoading]);

  if (!stats) return <div className="p-10 font-headline font-bold">Warming Up Dashboard...</div>;

  return (
    <div className="bg-surface min-h-screen">
      <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-10">
        <header className="flex justify-between items-center">
          <h1 className="font-headline font-bold text-4xl">Command Center</h1>
          <div className="flex gap-4">
             <Link href="/admin/orders" className="text-xs font-label font-bold uppercase tracking-widest bg-on-surface text-surface px-6 py-3 rounded-full">Orders</Link>
             <Link href="/admin/analytics" className="text-xs font-label font-bold uppercase tracking-widest bg-primary-container text-on-primary-container px-6 py-3 rounded-full">Analytics</Link>
          </div>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <DashboardStat label="Today Items" value={stats.orders_today} icon="shopping_bag" />
          <DashboardStat label="Pending" value={stats.status_breakdown?.find((s:any) => s.status === 'pending')?.count || 0} icon="timer" color="text-secondary" />
          <DashboardStat label="Sales Today" value={`₦${stats.revenue_today.toLocaleString()}`} icon="payments" color="text-tertiary" />
          <DashboardStat label="Top Product" value={stats.top_products?.[0]?.name || 'N/A'} icon="star" />
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-[40px] p-10 border border-outline-variant/10 shadow-sm">
           <div className="flex justify-between items-center mb-10">
              <h2 className="font-headline font-bold text-2xl">Recent Transmissions</h2>
              <Link href="/admin/orders" className="text-secondary font-label text-[10px] uppercase font-bold tracking-widest">View All</Link>
           </div>
           
           <div className="space-y-6">
             {recentOrders.map((order) => (
               <div key={order.id} className="flex justify-between items-center p-6 bg-surface-container-low rounded-3xl group hover:bg-primary-container/10 transition-colors">
                 <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-label font-bold text-xs shadow-sm">
                      #{order.id}
                    </div>
                    <div>
                      <p className="font-body font-bold text-sm">{order.customer_name}</p>
                      <p className="font-body text-[10px] text-outline">{new Date(order.created_at).toLocaleTimeString()}</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="font-label font-bold text-sm">₦{order.total.toLocaleString()}</p>
                    <span className="font-label text-[10px] uppercase font-bold text-secondary">{order.status}</span>
                 </div>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
}

function DashboardStat({ label, value, icon, color = "text-on-surface" }: any) {
  return (
    <div className="bg-white p-8 rounded-[32px] border border-outline-variant/10 flex flex-col justify-between h-48 shadow-sm">
      <div className={`w-12 h-12 bg-surface-container-low rounded-2xl flex items-center justify-center ${color}`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div>
        <p className="font-label text-[10px] uppercase text-outline font-bold tracking-widest">{label}</p>
        <p className={`text-2xl font-headline font-bold mt-1 ${color}`}>{value}</p>
      </div>
    </div>
  );
}
