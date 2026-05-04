'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useAppStore } from '@/store/appStore';
import { useAuth } from '@/context/AuthContext';
import { authService, orderService, reviewService, userService, type Order } from '@/lib/api';

type ProfileTab = 'profile' | 'tracking' | 'history' | 'notifications';

const activeStatuses: Order['status'][] = ['pending', 'confirmed', 'preparing', 'dispatched'];

const statusTone: Record<Order['status'], string> = {
  pending: 'bg-secondary/10 text-secondary',
  confirmed: 'bg-primary-container/20 text-on-surface',
  preparing: 'bg-primary-container/20 text-on-surface',
  dispatched: 'bg-tertiary/10 text-tertiary',
  delivered: 'bg-tertiary/10 text-tertiary',
  cancelled: 'bg-error/10 text-error',
};

const statusCopy: Record<Order['status'], { title: string; body: string; icon: string }> = {
  pending: {
    title: 'Payment review in progress',
    body: 'We have received your order and we are checking your transfer receipt.',
    icon: 'hourglass_top',
  },
  confirmed: {
    title: 'Order confirmed',
    body: 'Your payment has been confirmed and the kitchen queue is locked in.',
    icon: 'task_alt',
  },
  preparing: {
    title: 'Now preparing',
    body: 'Your shawarma is in preparation right now.',
    icon: 'restaurant',
  },
  dispatched: {
    title: 'Out for delivery',
    body: 'Your rider is on the way to your delivery address.',
    icon: 'delivery_truck_speed',
  },
  delivered: {
    title: 'Delivered successfully',
    body: 'Your order has been marked as delivered. Enjoy your meal.',
    icon: 'home_pin',
  },
  cancelled: {
    title: 'Order cancelled',
    body: 'This order was cancelled. Contact support if this looks incorrect.',
    icon: 'cancel',
  },
};

const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;
const formatDate = (value: string) =>
  new Date(value).toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });

export default function ProfilePage() {
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  const { user, logout, addToast } = useAppStore();
  const totalItems = useCartStore((state) => state.totalItems());
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile');
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, { rating: number; review_text: string }>>({});
  const [submittingReviewKey, setSubmittingReviewKey] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!token) {
      setProfile(null);
      setOrders([]);
      return;
    }

    const fetchProfileData = async () => {
      setLoading(true);
      try {
        const [profileResponse, ordersResponse] = await Promise.all([
          userService.getProfile(),
          orderService.getAllOrders(),
        ]);
        setProfile(profileResponse.data ?? profileResponse);
        setOrders(Array.isArray(ordersResponse.data) ? ordersResponse.data : []);
      } catch (error: any) {
        addToast(error.message || 'Could not load your profile', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [token, addToast]);

  const displayName = profile?.name || user?.name || 'Guest User';
  const displayPhone = profile?.phone || user?.phone || 'Add a phone number when you place an order';
  const displayAddress = profile?.address || user?.address || 'No saved delivery address yet';

  const activeOrders = useMemo(
    () => orders.filter((order) => activeStatuses.includes(order.status)),
    [orders]
  );

  const pastOrders = useMemo(
    () => orders.filter((order) => ['delivered', 'cancelled'].includes(order.status)),
    [orders]
  );

  const notifications = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 6)
      .map((order) => ({
        ...statusCopy[order.status],
        id: order.id,
        orderRef: order.order_ref,
        timestamp: order.updated_at,
      }));
  }, [orders]);

  const tabButton = (tab: ProfileTab, label: string, count?: number) => (
    <button
      type="button"
      onClick={() => setActiveTab(tab)}
      className={`flex-1 rounded-full px-4 py-3 text-xs font-label font-bold uppercase tracking-widest transition-colors ${
        activeTab === tab
          ? 'bg-on-surface text-surface'
          : 'bg-surface-container-low text-outline'
      }`}
    >
      {label}{typeof count === 'number' ? ` (${count})` : ''}
    </button>
  );

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-32">
      <header className="px-6 py-6 flex items-center gap-4 bg-surface sticky top-0 z-40">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <h1 className="font-headline font-bold text-xl">My Profile</h1>
      </header>

      <main className="px-6 space-y-6 max-w-md mx-auto w-full">
        <section className="flex flex-col items-center py-6">
          <div className="w-24 h-24 bg-primary-container rounded-full flex items-center justify-center mb-4 border-4 border-surface shadow-xl">
            <span className="material-symbols-outlined text-4xl text-on-primary-container">person</span>
          </div>
          <h2 className="font-headline font-bold text-2xl text-center">{displayName}</h2>
          <p className="font-body text-sm text-outline text-center">
            {token ? 'Your delivery details and order updates live here.' : 'Sign in to track active orders and receive updates.'}
          </p>
        </section>

        {!authLoading && !token && (
          <section className="bg-surface-container-low rounded-3xl p-6 space-y-4">
            <p className="font-body text-sm text-outline">
              Sign in before placing an order so you can track delivery progress, see notifications, and leave reviews after each meal.
            </p>
            <div className="flex gap-3">
              <Link
                href="/login"
                className="flex-1 inline-flex items-center justify-center bg-on-surface text-surface py-4 rounded-full font-label font-bold text-xs uppercase tracking-widest"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="flex-1 inline-flex items-center justify-center bg-surface-container-highest text-on-surface py-4 rounded-full font-label font-bold text-xs uppercase tracking-widest"
              >
                Sign Up
              </Link>
            </div>
          </section>
        )}

        <section className="flex gap-2 overflow-x-auto no-scrollbar">
          {tabButton('profile', 'Profile')}
          {tabButton('tracking', 'Tracking', activeOrders.length)}
          {tabButton('history', 'History', pastOrders.length)}
          {tabButton('notifications', 'Notifications', notifications.length)}
        </section>

        {activeTab === 'profile' && (
          <section className="space-y-3">
            <div className="bg-surface-container-low rounded-3xl p-6 space-y-4">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-primary-container">call</span>
                <div>
                  <p className="font-label text-[10px] uppercase tracking-widest text-outline font-bold">Phone</p>
                  <p className="font-body font-medium">{displayPhone}</p>
                </div>
              </div>
              <div className="h-px bg-outline-variant/20"></div>
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-primary-container">location_on</span>
                <div>
                  <p className="font-label text-[10px] uppercase tracking-widest text-outline font-bold">Saved Address</p>
                  <p className="font-body font-medium">{displayAddress}</p>
                </div>
              </div>
              <div className="h-px bg-outline-variant/20"></div>
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-primary-container">receipt_long</span>
                <div>
                  <p className="font-label text-[10px] uppercase tracking-widest text-outline font-bold">Orders</p>
                  <p className="font-body font-medium">{orders.length} total orders placed</p>
                </div>
              </div>
            </div>

            {token && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await authService.logout();
                  } catch {}
                  logout();
                  router.push('/login');
                }}
                className="w-full bg-surface-container-highest flex items-center justify-center py-4 rounded-full font-label font-bold text-xs uppercase tracking-widest text-outline hover:text-primary transition-colors"
              >
                Sign Out
              </button>
            )}
          </section>
        )}

        {activeTab === 'tracking' && (
          <section className="space-y-3">
            {loading && <div className="bg-surface-container-low rounded-3xl p-6 text-sm text-outline">Loading your active orders...</div>}
            {!loading && activeOrders.length === 0 && (
              <div className="bg-surface-container-low rounded-3xl p-6 text-center space-y-2">
                <p className="font-headline font-bold text-lg">No active orders</p>
                <p className="font-body text-sm text-outline">Once an order is pending, confirmed, preparing, or dispatched, it will appear here.</p>
              </div>
            )}
            {activeOrders.map((order) => (
              <article key={order.id} className="bg-surface-container-low rounded-3xl p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-headline font-bold text-lg">{order.order_ref}</p>
                    <p className="font-body text-xs text-outline">{formatDate(order.created_at)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${statusTone[order.status]}`}>
                    {order.status}
                  </span>
                </div>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={`${order.id}-${item.id}-${item.size}`} className="flex justify-between text-sm">
                      <span className="text-outline">{item.quantity}x {item.name}</span>
                      <span className="font-label font-bold">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-outline-variant/20 flex justify-between items-center">
                  <span className="font-label text-[10px] uppercase tracking-widest text-outline font-bold">Total</span>
                  <span className="font-headline font-bold">{formatCurrency(order.total_amount)}</span>
                </div>
              </article>
            ))}
          </section>
        )}

        {activeTab === 'history' && (
          <section className="space-y-3">
            {loading && <div className="bg-surface-container-low rounded-3xl p-6 text-sm text-outline">Loading your order history...</div>}
            {!loading && pastOrders.length === 0 && (
              <div className="bg-surface-container-low rounded-3xl p-6 text-center space-y-2">
                <p className="font-headline font-bold text-lg">No completed orders yet</p>
                <p className="font-body text-sm text-outline">Delivered and cancelled orders will live here with review actions.</p>
              </div>
            )}
            {pastOrders.map((order) => (
              <article key={order.id} className="bg-surface-container-low rounded-3xl p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-headline font-bold text-lg">{order.order_ref}</p>
                    <p className="font-body text-xs text-outline">{formatDate(order.updated_at)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${statusTone[order.status]}`}>
                    {order.status}
                  </span>
                </div>
                <div className="space-y-3">
                  {order.items.map((item) => {
                    const reviewKey = `${order.id}:${item.id}`;
                    const hasReview = order.reviewed_product_ids?.includes(String(item.id));
                    const draft = reviewDrafts[reviewKey] || { rating: 5, review_text: '' };

                    return (
                      <div key={reviewKey} className="rounded-2xl bg-surface-container-highest/80 p-4 space-y-3">
                        <div className="flex justify-between gap-3">
                          <div>
                            <p className="font-body font-bold text-sm">{item.name}</p>
                            <p className="font-body text-xs text-outline">{item.quantity}x • {item.size}</p>
                          </div>
                          <span className="font-label font-bold text-sm">{formatCurrency(item.price * item.quantity)}</span>
                        </div>

                        {order.status === 'delivered' && !hasReview && (
                          <div className="space-y-3 border-t border-outline-variant/20 pt-3">
                            <p className="font-label text-[10px] uppercase tracking-widest text-outline font-bold">Leave a quick review</p>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <button
                                  key={rating}
                                  type="button"
                                  onClick={() => setReviewDrafts((current) => ({ ...current, [reviewKey]: { ...draft, rating } }))}
                                  className="text-[#EAB600]"
                                >
                                  <span className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' ${rating <= draft.rating ? 1 : 0}` }}>star</span>
                                </button>
                              ))}
                            </div>
                            <textarea
                              value={draft.review_text}
                              onChange={(event) =>
                                setReviewDrafts((current) => ({
                                  ...current,
                                  [reviewKey]: { ...draft, review_text: event.target.value },
                                }))
                              }
                              rows={2}
                              placeholder="What did you like? Optional."
                              className="w-full rounded-2xl bg-surface px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary-container/30"
                            />
                            <button
                              type="button"
                              disabled={submittingReviewKey === reviewKey}
                              onClick={async () => {
                                setSubmittingReviewKey(reviewKey);
                                try {
                                  await reviewService.createReview({
                                    order_id: order.id,
                                    product_id: String(item.id),
                                    rating: draft.rating,
                                    review_text: draft.review_text,
                                  });
                                  setOrders((current) => current.map((candidate) => candidate.id === order.id
                                    ? {
                                        ...candidate,
                                        reviewed_product_ids: [...(candidate.reviewed_product_ids || []), String(item.id)],
                                      }
                                    : candidate
                                  ));
                                  addToast('Thanks for the review', 'success');
                                } catch (error: any) {
                                  addToast(error.message || 'Could not save review', 'error');
                                } finally {
                                  setSubmittingReviewKey(null);
                                }
                              }}
                              className="rounded-full bg-primary-container px-5 py-3 text-xs font-label font-bold uppercase tracking-widest text-on-primary-container"
                            >
                              {submittingReviewKey === reviewKey ? 'Sending...' : 'Submit review'}
                            </button>
                          </div>
                        )}

                        {order.status === 'delivered' && hasReview && (
                          <div className="border-t border-outline-variant/20 pt-3 text-xs font-label font-bold uppercase tracking-widest text-tertiary">
                            Review submitted
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </section>
        )}

        {activeTab === 'notifications' && (
          <section className="space-y-3">
            {loading && <div className="bg-surface-container-low rounded-3xl p-6 text-sm text-outline">Loading notifications...</div>}
            {!loading && notifications.length === 0 && (
              <div className="bg-surface-container-low rounded-3xl p-6 text-center space-y-2">
                <p className="font-headline font-bold text-lg">No notifications yet</p>
                <p className="font-body text-sm text-outline">Order status updates will show here automatically.</p>
              </div>
            )}
            {notifications.map((notification) => (
              <article key={`${notification.id}-${notification.timestamp}`} className="bg-surface-container-low rounded-3xl p-6 flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-container/15 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary-container">{notification.icon}</span>
                </div>
                <div className="space-y-1">
                  <p className="font-headline font-bold text-base">{notification.title}</p>
                  <p className="font-body text-sm text-outline">{notification.body}</p>
                  <p className="font-label text-[10px] uppercase tracking-widest text-outline font-bold">
                    {notification.orderRef} • {formatDate(notification.timestamp)}
                  </p>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-on-surface/90 backdrop-blur-xl rounded-full px-8 py-4 flex justify-between items-center z-50 shadow-2xl border border-white/10">
        <Link href="/show" className="flex flex-col items-center gap-1 text-white/50"><span className="material-symbols-outlined">home</span></Link>
        <Link href="/search" className="flex flex-col items-center gap-1 text-white/50"><span className="material-symbols-outlined">search</span></Link>
        <Link href="/cart" className="flex flex-col items-center gap-1 text-white/50 relative">
          <span className="material-symbols-outlined">shopping_cart</span>
          {isMounted && totalItems > 0 && <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary-container text-on-primary-container text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-on-surface">{totalItems}</span>}
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-1 text-primary-container"><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person</span></Link>
      </nav>
    </div>
  );
}
