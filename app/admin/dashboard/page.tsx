'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { adminService, analyticsService, orderService } from '@/lib/api';
import { useAppStore } from '@/store/appStore';

export default function AdminDashboard() {
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  const { user, addToast } = useAppStore();
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [accessSettings, setAccessSettings] = useState<any>(null);
  const [accessKeyInput, setAccessKeyInput] = useState('');
  const [isSavingAccess, setIsSavingAccess] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const fetchDashboardData = async () => {
    try {
      const [summaryResponse, ordersResponse, accessResponse] = await Promise.all([
        analyticsService.getSummary(),
        orderService.getAllOrders(),
        adminService.getAccessLinkSettings(),
      ]);
      setStats(summaryResponse.data);
      setRecentOrders((ordersResponse.data || []).slice(0, 5));
      setAccessSettings(accessResponse.data);
      setAccessKeyInput(accessResponse.data?.access_key || '');
    } catch (err) {
      console.error('Dashboard fetch failed');
    }
  };

  const saveAccessSettings = async (payload: { action?: 'save' | 'regenerate'; is_enabled: boolean; access_key?: string }) => {
    try {
      setIsSavingAccess(true);
      const response = await adminService.updateAccessLinkSettings(payload);
      setAccessSettings(response.data);
      setAccessKeyInput(response.data?.access_key || '');
      addToast(response.message || 'Admin access updated', 'success');
    } catch (error: any) {
      addToast(error.message || 'Could not update admin access link', 'error');
    } finally {
      setIsSavingAccess(false);
    }
  };

  const currentAccessUrl = `${origin}${accessSettings?.login_path || '/admin/login'}`;

  useEffect(() => {
    if (!authLoading && !token) router.push('/admin/login');
    if (token) {
      fetchDashboardData();
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [token, authLoading, router]);

  if (!stats) return <div className="p-10 font-headline font-bold">Warming Up Dashboard...</div>;

  return (
    <div className="bg-surface min-h-screen">
      <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-10">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="font-headline font-bold text-4xl">Command Center</h1>
            <p className="font-body text-sm text-outline mt-2">
              Signed in as {user?.name || user?.username || 'Admin'}
            </p>
          </div>
          <div className="flex gap-4">
             <Link href="/admin/orders" className="text-xs font-label font-bold uppercase tracking-widest bg-on-surface text-surface px-6 py-3 rounded-full">Orders</Link>
             <Link href="/admin/products" className="text-xs font-label font-bold uppercase tracking-widest bg-surface-container-low text-on-surface px-6 py-3 rounded-full">Products</Link>
             <Link href="/admin/reviews" className="text-xs font-label font-bold uppercase tracking-widest bg-surface-container-low text-on-surface px-6 py-3 rounded-full">Reviews</Link>
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

        <section className="bg-white rounded-[40px] p-8 md:p-10 border border-outline-variant/10 shadow-sm space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="font-headline font-bold text-2xl">Admin Login URL</h2>
              <p className="font-body text-sm text-outline mt-2">
                If private admin access is disabled, the default login stays on <span className="font-bold text-on-surface">/admin/login</span>. If enabled, a 10-character access key is required and rotates every 6 hours.
              </p>
            </div>
            <div className={`inline-flex items-center rounded-full px-4 py-2 text-[10px] font-label font-bold uppercase tracking-widest ${accessSettings?.is_enabled ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-low text-outline'}`}>
              {accessSettings?.is_enabled ? 'Protected link enabled' : 'Default login active'}
            </div>
          </div>

          <div className="bg-surface-container-low rounded-3xl p-5 space-y-3">
            <p className="font-label text-[10px] uppercase tracking-widest text-outline font-bold">Current admin URL</p>
            <p className="font-mono text-sm break-all">{currentAccessUrl}</p>
            {accessSettings?.expires_at && accessSettings?.is_enabled && (
              <p className="font-body text-xs text-outline">
                Rotates at {new Date(accessSettings.expires_at).toLocaleString()}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-3">
            <input
              type="text"
              value={accessKeyInput}
              onChange={(event) => setAccessKeyInput(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
              placeholder="10-character access key"
              className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-5 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container transition-all"
            />
            <button
              type="button"
              disabled={isSavingAccess}
              onClick={() => saveAccessSettings({ is_enabled: true, access_key: accessKeyInput || undefined, action: 'save' })}
              className="rounded-full bg-on-surface px-5 py-4 text-surface font-label text-xs font-bold uppercase tracking-widest disabled:opacity-60"
            >
              Save URL
            </button>
            <button
              type="button"
              disabled={isSavingAccess}
              onClick={() => saveAccessSettings({ is_enabled: true, action: 'regenerate' })}
              className="rounded-full bg-primary-container px-5 py-4 text-on-primary-container font-label text-xs font-bold uppercase tracking-widest disabled:opacity-60"
            >
              Refresh Key
            </button>
            <button
              type="button"
              disabled={isSavingAccess}
              onClick={() => navigator.clipboard.writeText(currentAccessUrl).then(() => addToast('Admin URL copied', 'success'))}
              className="rounded-full bg-surface-container-low px-5 py-4 text-on-surface font-label text-xs font-bold uppercase tracking-widest disabled:opacity-60"
            >
              Copy URL
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={isSavingAccess}
              onClick={() => saveAccessSettings({ is_enabled: false })}
              className="rounded-full bg-error/10 px-5 py-3 text-error font-label text-xs font-bold uppercase tracking-widest disabled:opacity-60"
            >
              Use current default URL
            </button>
            <Link
              href={accessSettings?.login_path || '/admin/login'}
              target="_blank"
              className="rounded-full bg-surface-container-low px-5 py-3 text-on-surface font-label text-xs font-bold uppercase tracking-widest"
            >
              Open current login page
            </Link>
          </div>
        </section>

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
                    <p className="font-label font-bold text-sm">₦{order.total_amount.toLocaleString()}</p>
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
