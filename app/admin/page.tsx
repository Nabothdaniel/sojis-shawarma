'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminService, type StoreSettings } from '@/lib/api/admin.service';
import { analyticsService } from '@/lib/api/analytics.service';
import { orderService, type Order } from '@/lib/api/order.service';
import { useAppStore } from '@/store/appStore';
import useAdminGuard from '@/hooks/useAdminGuard';
import { AdminRouteLoadingScreen } from '@/components/ui/AdminSkeletons';
import { useWalkthrough } from '@/hooks/useWalkthrough';

export default function AdminHomePage() {
  const { authLoading, isAdmin, user } = useAdminGuard();
  const addToast = useAppStore((state) => state.addToast);
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [pendingPayments, setPendingPayments] = useState<Order[]>([]);
  const [pickupQueue, setPickupQueue] = useState<Order[]>([]);
  const [accessSettings, setAccessSettings] = useState<any>(null);
  const [accessKeyInput, setAccessKeyInput] = useState('');
  const [isSavingAccess, setIsSavingAccess] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    let active = true;

    const fetchDashboardData = async () => {
      try {
        const [summaryResponse, ordersResponse, accessResponse] = await Promise.all([
          analyticsService.getSummary(),
          orderService.getAllOrders(),
          adminService.getAccessLinkSettings(),
        ]);

        if (!active) {
          return;
        }

        const orders = (ordersResponse.data || []) as Order[];
        setStats(summaryResponse.data);
        setRecentOrders(orders.slice(0, 10)); // Bumped up for the list
        setPendingPayments(orders.filter((order) => order.payment_status === 'submitted').slice(0, 4));
        setPickupQueue(orders.filter((order) => order.order_type === 'pickup' && ['confirmed', 'preparing', 'ready_for_pickup'].includes(order.status)).slice(0, 4));
        setAccessSettings(accessResponse.data);
        setAccessKeyInput(accessResponse.data?.access_key || '');
      } catch (error) {
        if (active) {
          addToast('Dashboard fetch failed', 'error');
        }
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [addToast, isAdmin]);

  useWalkthrough('admin_home_tour_v3', [
    { element: '#tour-nav-home', popover: { title: 'Main Menu', description: 'Use these links to check your orders, update your menu, or view sales.', side: 'right' } },
    { element: '#admin-search', popover: { title: 'Quick Search', description: 'Type a customer name or order number here to jump straight to it, anytime.' } },
    { element: '#tour-stats', popover: { title: 'Today\'s Performance', description: 'See how many customers ordered today and your total sales.' } },
    { element: '#tour-actions', popover: { title: 'Things to Do', description: 'Check this box for bank transfers that need your approval or orders waiting for pickup.' } },
    { element: '#tour-security', popover: { title: 'Security Link', description: 'Keep your admin account safe by generating a new daily access link here.' } }
  ], { enabled: isAdmin && !!stats });

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

  if (authLoading || (isAdmin && !stats)) {
    return <AdminRouteLoadingScreen />;
  }

  if (!isAdmin) {
    return null;
  }

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const pendingCount = stats.status_breakdown?.find((s: any) => s.status === 'pending')?.count || 0;
  const activeOrdersCount = pendingPayments.length + pickupQueue.length + pendingCount; // Proxy for active orders

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      {/* Hero Section */}
      <div id="tour-hero">
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-on-surface mb-2">Good Morning, Chef {user?.name?.split(' ')[0] || ''}.</h1>
        <p className="font-body text-on-surface-variant text-lg">{currentDate} • Command Center</p>
      </div>

      {/* KPI Cards */}
      <div id="tour-stats" className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm relative overflow-hidden border border-outline-variant/10">
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-primary-container/20 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="font-body text-on-surface-variant text-sm font-medium mb-1">Today&apos;s Revenue</p>
              <h3 className="font-headline text-4xl font-bold text-on-surface">₦{(stats.revenue_today || 0).toLocaleString()}</h3>
            </div>
            <span className="material-symbols-outlined text-primary p-3 bg-primary-container/20 rounded-full">payments</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-tertiary font-bold flex items-center"><span className="material-symbols-outlined text-sm">trending_up</span> Active</span>
            <span className="text-on-surface-variant">sales processing automatically</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm relative overflow-hidden border border-outline-variant/10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="font-body text-on-surface-variant text-sm font-medium mb-1">Active Action Items</p>
              <h3 className="font-headline text-4xl font-bold text-on-surface">{activeOrdersCount}</h3>
            </div>
            <span className="material-symbols-outlined text-secondary p-3 bg-secondary/10 rounded-full">receipt_long</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {activeOrdersCount > 5 ? (
              <span className="text-error font-bold flex items-center"><span className="material-symbols-outlined text-sm">warning</span> High Volume</span>
            ) : (
              <span className="text-on-surface-variant flex items-center">Normal Queue Activity</span>
            )}
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm relative overflow-hidden border border-outline-variant/10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="font-body text-on-surface-variant text-sm font-medium mb-1">Total Orders Today</p>
              <h3 className="font-headline text-4xl font-bold text-on-surface">{stats.orders_today || 0}</h3>
            </div>
            <span className="material-symbols-outlined text-tertiary p-3 bg-tertiary/10 rounded-full">shopping_bag</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-on-surface-variant flex items-center">Across all statuses</span>
          </div>
        </div>
      </div>

      {/* Main Grid Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Live Order Queue (Takes up 2 columns) */}
        <div className="lg:col-span-2 bg-surface-container-low rounded-[40px] p-8 border border-outline-variant/10">
          <div className="flex justify-between items-center mb-8">
            <h2 className="font-headline text-2xl font-bold text-on-surface">Live Order Queue</h2>
            <Link href="/admin/orders" className="text-primary font-body font-bold hover:underline">View Desk</Link>
          </div>
          <div className="flex flex-col gap-4">
            {recentOrders.length === 0 ? (
              <p className="text-outline text-sm">No live orders today yet.</p>
            ) : null}
            {recentOrders.map((order) => (
              <div key={order.id} className="bg-surface-container-lowest rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between shadow-sm border border-outline-variant/5 gap-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-6">
                  <div className="bg-surface-container-high rounded-full w-14 h-14 flex flex-shrink-0 items-center justify-center font-headline font-bold text-xl text-on-surface shadow-inner">
                    #{String(order.id).slice(0, 3)}
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface text-lg">{order.customer_name}</h4>
                    <p className="text-on-surface-variant text-sm">
                      {order.order_type === 'pickup' ? 'Pickup' : 'Delivery'} • ₦{order.total_amount.toLocaleString()} 
                      <span className="mx-2 text-outline/40">|</span> 
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest ${
                    ['pending'].includes(order.status) ? 'bg-secondary/10 text-secondary' :
                    ['confirmed', 'preparing'].includes(order.status) ? 'bg-primary-container text-on-primary-container shadow-sm' :
                    ['delivered'].includes(order.status) ? 'bg-tertiary/10 text-tertiary' : 'bg-surface-container-highest text-on-surface'
                  }`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                  <Link href="/admin/orders" className="p-2 text-on-surface-variant hover:text-primary transition-colors bg-surface-container-low rounded-full">
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Side Panel: Replaced with Actions & Config */}
        <div id="tour-actions" className="flex flex-col gap-8">
          
          {/* Action Items */}
          <div className="bg-white rounded-[40px] p-8 border border-outline-variant/10 shadow-sm relative">
            <h3 className="font-headline text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">assignment_late</span> Things To Do
            </h3>
            
            <div className="flex justify-between items-center text-sm mb-4">
              <span className="font-bold text-on-surface">Payment Reviews</span>
              {pendingPayments.length > 0 ? (
                <span className="text-secondary font-bold bg-secondary/10 px-2 py-1 rounded-full text-[10px] uppercase">{pendingPayments.length} Pending</span>
              ) : (
                <span className="text-outline text-xs">Clear</span>
              )}
            </div>
            
            <ul className="flex flex-col gap-2 mb-6">
              {pendingPayments.map(order => (
                <li key={order.id} className="flex justify-between items-center bg-surface-container-highest rounded-2xl p-4">
                  <span className="font-bold text-on-surface text-sm truncate pr-2 flex-1">{order.customer_name}</span>
                  <Link href="/admin/orders" className="text-primary font-bold text-[10px] uppercase tracking-widest hover:underline">Review</Link>
                </li>
              ))}
              {pendingPayments.length === 0 && (
                <li className="text-on-surface-variant text-sm italic">All set for now.</li>
              )}
            </ul>

            <div className="flex justify-between items-center text-sm mb-4">
              <span className="font-bold text-on-surface">Live Pickups</span>
              {pickupQueue.length > 0 ? (
                <span className="text-tertiary font-bold bg-tertiary/10 px-2 py-1 rounded-full text-[10px] uppercase">{pickupQueue.length} Active</span>
              ) : (
                <span className="text-outline text-xs">Clear</span>
              )}
            </div>
            
            <ul className="flex flex-col gap-2">
              {pickupQueue.map(order => (
                <li key={order.id} className="flex justify-between items-center bg-surface-container-highest rounded-2xl p-4">
                  <span className="font-bold text-on-surface text-sm truncate pr-2 flex-1">{order.customer_name}</span>
                  <span className="text-outline font-bold text-[10px] uppercase tracking-widest">{order.pickup_time || 'Waiting'}</span>
                </li>
              ))}
              {pickupQueue.length === 0 && (
                <li className="text-on-surface-variant text-sm italic">No pickups currently queued.</li>
              )}
            </ul>
          </div>

          {/* Security Features */}
          <div id="tour-security" className="bg-surface-container-lowest rounded-[40px] p-8 border border-outline-variant/10 shadow-sm">
            <h3 className="font-headline text-xl font-bold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">security</span> Security
            </h3>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-label uppercase font-bold tracking-widest text-outline">Current Admin URL</span>
                <div className="bg-surface-container-highest rounded-2xl p-4 flex items-center justify-between">
                  <span className="font-mono text-[10px] truncate max-w-[150px]">{currentAccessUrl}</span>
                  <button onClick={() => navigator.clipboard.writeText(currentAccessUrl).then(() => addToast('Copied', 'success'))} className="text-primary">
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  disabled={isSavingAccess}
                  onClick={() => saveAccessSettings({ is_enabled: true, action: 'regenerate' })}
                  className="w-full bg-primary-container text-on-primary-container font-bold rounded-full py-3 text-sm hover:brightness-105 transition-all shadow-sm"
                >
                  Regenerate Daily URL
                </button>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
