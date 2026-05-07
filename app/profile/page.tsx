'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useAppStore } from '@/store/appStore';
import { useAuth } from '@/context/AuthContext';
import { authService, orderService, reviewService, userService, biometricService, type Order } from '@/lib/api';
import BottomNav from '@/components/ui/BottomNav';

type ProfileTab = 'profile' | 'tracking' | 'history' | 'notifications' | 'feedback';

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
  const { user, token: persistedToken, hasHydrated, logout, addToast, setUser } = useAppStore();
  const totalItems = useCartStore((state) => state.totalItems());
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile');
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, { rating: number; review_text: string }>>({});
  const [submittingReviewKey, setSubmittingReviewKey] = useState<string | null>(null);
  const [feedbackDraft, setFeedbackDraft] = useState({ rating: 5, message: '' });
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isSettingUpBiometrics, setIsSettingUpBiometrics] = useState(false);

  const handleSetupBiometrics = async () => {
    if (!profile?.id || !profile?.email) return;
    setIsSettingUpBiometrics(true);
    try {
      await biometricService.register(profile.id.toString(), profile.email);
      addToast('Fingerprint registered! You can now log in faster.', 'success');
      // Update profile locally to reflect setup
      setProfile({ ...profile, biometric_id: 'configured' });
    } catch (err: any) {
      addToast(err.message || 'Setup failed. Make sure your device supports biometrics.', 'error');
    } finally {
      setIsSettingUpBiometrics(false);
    }
  };
  const [loadTimeout, setLoadTimeout] = useState(false);

  const effectiveToken = token || persistedToken;
  const isSignedIn = hasHydrated && Boolean(effectiveToken || user);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!effectiveToken) {
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
        const nextProfile = profileResponse.data ?? profileResponse;
        setProfile(nextProfile);
        const latestUser = useAppStore.getState().user;
        if (nextProfile?.name) {
          setUser({
            id: String(nextProfile.id ?? latestUser?.id ?? ''),
            name: nextProfile.name,
            username: nextProfile.username ?? latestUser?.username ?? null,
            phone: nextProfile.phone ?? latestUser?.phone,
            address: nextProfile.address ?? latestUser?.address,
            role: nextProfile.role ?? latestUser?.role ?? 'user',
            balance: latestUser?.balance,
          });
        }
        setOrders(Array.isArray(ordersResponse.data) ? ordersResponse.data : []);
      } catch (error: any) {
        addToast(error.message || 'Could not load your profile', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
    
    const timeout = setTimeout(() => {
      if (loading) setLoadTimeout(true);
    }, 8000);
    
    return () => clearTimeout(timeout);
  }, [effectiveToken, addToast, setUser]);

  const displayName = profile?.name || user?.name || (isSignedIn ? 'Loading profile...' : 'Guest User');
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
          {loadTimeout && !profile && (
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 text-primary font-label text-xs uppercase font-bold flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Stuck loading? Tap to refresh
            </button>
          )}
          <p className="font-body text-sm text-outline text-center">
            {isSignedIn ? 'Your delivery details and order updates live here.' : 'Sign in to track active orders and receive updates.'}
          </p>

          {isSignedIn && biometricService.isSupported() && (
            <div className="mt-8 p-6 bg-primary-container/10 border border-primary-container/20 rounded-[32px] w-full max-w-sm mx-auto">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-primary-container/20 rounded-2xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary-container">fingerprint</span>
                </div>
                <div className="text-left">
                  <h3 className="font-headline font-bold text-sm">Biometric Login</h3>
                  <p className="font-body text-[10px] text-outline">Unlock with your fingerprint</p>
                </div>
              </div>
              <button
                onClick={handleSetupBiometrics}
                disabled={isSettingUpBiometrics}
                className="w-full bg-on-surface text-surface py-3 rounded-2xl font-label text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
              >
                {isSettingUpBiometrics ? 'Setting up...' : (profile?.biometric_id ? 'Update biometrics' : 'Setup Now')}
              </button>
            </div>
          )}
        </section>

        {!authLoading && hasHydrated && !isSignedIn && (
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
          {tabButton('feedback', 'Feedback')}
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

            {isSignedIn && (
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
        
        {activeTab === 'feedback' && (
          <section className="space-y-6">
            <div className="bg-surface-container-low rounded-[32px] p-8 space-y-6 shadow-sm border border-outline-variant/10">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-primary-container/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-primary-container text-3xl">rate_review</span>
                </div>
                <h2 className="font-headline font-bold text-2xl">Service Feedback</h2>
                <p className="font-body text-sm text-outline">How was your experience today? Your suggestions help Soji grow.</p>
              </div>

              <div className="space-y-6">
                {/* Star Rating */}
                <div className="flex flex-col items-center gap-3">
                  <p className="font-label text-[10px] uppercase tracking-widest text-outline font-bold">Your Rating</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackDraft({ ...feedbackDraft, rating: star })}
                        className="active:scale-110 transition-transform duration-200"
                      >
                        <span 
                          className="material-symbols-outlined text-4xl" 
                          style={{ 
                            fontVariationSettings: `'FILL' ${star <= feedbackDraft.rating ? 1 : 0}`,
                            color: star <= feedbackDraft.rating ? '#EAB600' : 'var(--md-sys-color-outline-variant)'
                          }}
                        >
                          star
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="font-label text-xs font-bold text-primary-container uppercase tracking-tight">
                    {feedbackDraft.rating === 5 ? 'Excellent!' : feedbackDraft.rating === 4 ? 'Great' : feedbackDraft.rating === 3 ? 'Good' : feedbackDraft.rating === 2 ? 'Could be better' : 'Poor experience'}
                  </p>
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <p className="font-label text-[10px] uppercase tracking-widest text-outline font-bold px-1">Improvements or Suggestions</p>
                  <textarea
                    rows={4}
                    value={feedbackDraft.message}
                    onChange={(e) => setFeedbackDraft({ ...feedbackDraft, message: e.target.value })}
                    placeholder="Tell us what we can do better..."
                    className="w-full bg-surface border-none rounded-[24px] p-5 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container/30 transition-all resize-none shadow-inner"
                  />
                </div>

                <button
                  type="button"
                  disabled={isSubmittingFeedback || !feedbackDraft.message.trim()}
                  onClick={async () => {
                    setIsSubmittingFeedback(true);
                    try {
                      const { feedbackService } = await import('@/lib/api');
                      await feedbackService.submitFeedback({
                        name: user?.name || 'Guest',
                        email: user?.email || undefined,
                        rating: feedbackDraft.rating,
                        message: feedbackDraft.message,
                      });
                      addToast('Thanks for your feedback!', 'success');
                      setFeedbackDraft({ rating: 5, message: '' });
                      setActiveTab('profile');
                    } catch (error: any) {
                      addToast(error.message || 'Could not send feedback', 'error');
                    } finally {
                      setIsSubmittingFeedback(false);
                    }
                  }}
                  className="w-full bg-on-surface text-surface py-5 rounded-full font-label font-bold text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmittingFeedback ? (
                    <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">send</span>
                      Submit Feedback
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-tertiary/5 border border-tertiary/10 rounded-3xl p-6 text-center">
              <p className="font-body text-xs text-outline italic">
                &quot;We are always listening. Every piece of feedback goes directly to the kitchen and management team.&quot;
              </p>
            </div>
          </section>
        )}
      </main>

      <BottomNav active="profile" />
    </div>
  );
}
