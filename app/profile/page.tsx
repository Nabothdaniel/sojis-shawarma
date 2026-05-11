'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProductImage from '@/components/ui/ProductImage';
import BottomNav from '@/components/ui/BottomNav';
import { useProfilePage } from '@/features/profile/hooks/useProfilePage';
import useBiometricSupport from '@/hooks/useBiometricSupport';
import {
  formatCurrency,
  formatDate,
  statusTone,
  type ProfileTab,
} from '@/features/profile/utils/profile-view-model';
import { buildProductHref, getGenericProductImage } from '@/lib/menu';

export default function ProfilePage() {
  const router = useRouter();
  const biometricSupported = useBiometricSupport();
  const {
    activeOrders,
    activeTab,
    authLoading,
    displayAddress,
    displayName,
    displayPhone,
    favorites,
    feedbackDraft,
    handleLogout,
    handleRemoveBiometrics,
    handleReorder,
    handleSetupBiometrics,
    hasHydrated,
    isSettingUpBiometrics,
    isSignedIn,
    isSubmittingFeedback,
    loadTimeout,
    loading,
    notifications,
    orders,
    pastOrders,
    profile,
    removeFavorite,
    reviewDrafts,
    setActiveTab,
    setFeedbackDraft,
    setReviewDrafts,
    submitFeedback,
    submitReview,
    submittingReviewKey,
    user,
  } = useProfilePage();

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
      {label}
      {typeof count === 'number' ? ` (${count})` : ''}
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
            <span className="material-symbols-outlined text-4xl text-on-primary-container">
              person
            </span>
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
            {isSignedIn
              ? 'Your delivery details and order updates live here.'
              : 'Sign in to track active orders and receive updates.'}
          </p>

          {isSignedIn && biometricSupported && (
            <div className="mt-8 p-6 bg-primary-container/10 border border-primary-container/20 rounded-[32px] w-full max-w-sm mx-auto">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-primary-container/20 rounded-2xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary-container">
                    fingerprint
                  </span>
                </div>
                <div className="text-left">
                  <h3 className="font-headline font-bold text-sm">Biometric Login</h3>
                  <p className="font-body text-[10px] text-outline">
                    Unlock with your fingerprint
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSetupBiometrics}
                  disabled={isSettingUpBiometrics}
                  className="flex-[2] bg-on-surface text-surface py-3 rounded-2xl font-label text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
                >
                  {isSettingUpBiometrics
                    ? 'Setting up...'
                    : profile?.biometric_id
                      ? 'Update biometrics'
                      : 'Setup Now'}
                </button>
                {profile?.biometric_id && (
                  <button
                    onClick={handleRemoveBiometrics}
                    className="flex-1 bg-error/10 text-error py-3 rounded-2xl font-label text-[10px] font-bold uppercase tracking-widest"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        {!authLoading && hasHydrated && !isSignedIn && (
          <section className="bg-surface-container-low rounded-3xl p-6 space-y-4">
            <p className="font-body text-sm text-outline">
              Sign in before placing an order so you can track delivery progress, see
              notifications, and leave reviews after each meal.
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
          {tabButton('saved', 'Saved', favorites.length)}
          {tabButton('notifications', 'Notifications', notifications.length)}
          {tabButton('feedback', 'Feedback')}
        </section>

        {activeTab === 'profile' && (
          <section className="space-y-3">
            <div className="bg-surface-container-low rounded-3xl p-6 space-y-4">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-primary-container">call</span>
                <div>
                  <p className="font-label text-[10px] uppercase tracking-widest text-outline font-bold">
                    Phone
                  </p>
                  <p className="font-body font-medium">{displayPhone}</p>
                </div>
              </div>
              <div className="h-px bg-outline-variant/20"></div>
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-primary-container">
                  location_on
                </span>
                <div>
                  <p className="font-label text-[10px] uppercase tracking-widest text-outline font-bold">
                    Saved Address
                  </p>
                  <p className="font-body font-medium">{displayAddress}</p>
                </div>
              </div>
              <div className="h-px bg-outline-variant/20"></div>
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-primary-container">
                  receipt_long
                </span>
                <div>
                  <p className="font-label text-[10px] uppercase tracking-widest text-outline font-bold">
                    Orders
                  </p>
                  <p className="font-body font-medium">{orders.length} total orders placed</p>
                </div>
              </div>
            </div>

            {isSignedIn && (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full bg-surface-container-highest flex items-center justify-center py-4 rounded-full font-label font-bold text-xs uppercase tracking-widest text-outline hover:text-primary transition-colors"
              >
                Sign Out
              </button>
            )}
          </section>
        )}

        {activeTab === 'tracking' && (
          <section className="space-y-3">
            {loading && (
              <div className="bg-surface-container-low rounded-3xl p-6 text-sm text-outline">
                Loading your active orders...
              </div>
            )}
            {!loading && activeOrders.length === 0 && (
              <div className="bg-surface-container-low rounded-3xl p-6 text-center space-y-2">
                <p className="font-headline font-bold text-lg">No active orders</p>
                <p className="font-body text-sm text-outline">
                  Once an order is pending, confirmed, preparing, or dispatched, it
                  will appear here.
                </p>
              </div>
            )}
            {activeOrders.map((order) => (
              <article key={order.id} className="bg-surface-container-low rounded-3xl p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-headline font-bold text-lg">{order.order_ref}</p>
                    <p className="font-body text-xs text-outline">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${statusTone[order.status]}`}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={`${order.id}-${item.id}-${item.size}`} className="flex justify-between text-sm">
                      <span className="text-outline">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="font-label font-bold">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-outline-variant/20 flex justify-between items-center">
                  <span className="font-label text-[10px] uppercase tracking-widest text-outline font-bold">
                    Total
                  </span>
                  <span className="font-headline font-bold">
                    {formatCurrency(order.total_amount)}
                  </span>
                </div>
              </article>
            ))}
          </section>
        )}

        {activeTab === 'history' && (
          <section className="space-y-3">
            {loading && (
              <div className="bg-surface-container-low rounded-3xl p-6 text-sm text-outline">
                Loading your order history...
              </div>
            )}
            {!loading && pastOrders.length === 0 && (
              <div className="bg-surface-container-low rounded-3xl p-6 text-center space-y-2">
                <p className="font-headline font-bold text-lg">No completed orders yet</p>
                <p className="font-body text-sm text-outline">
                  Delivered and cancelled orders will live here with review actions.
                </p>
              </div>
            )}
            {pastOrders.map((order) => (
              <article key={order.id} className="bg-surface-container-low rounded-3xl p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-headline font-bold text-lg">{order.order_ref}</p>
                    <p className="font-body text-xs text-outline">
                      {formatDate(order.updated_at)}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${statusTone[order.status]}`}
                  >
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
                            <p className="font-body text-xs text-outline">
                              {item.quantity}x • {item.size}
                            </p>
                          </div>
                          <span className="font-label font-bold text-sm">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>

                        {order.status === 'delivered' && !hasReview && (
                          <div className="space-y-3 border-t border-outline-variant/20 pt-3">
                            <p className="font-label text-[10px] uppercase tracking-widest text-outline font-bold">
                              Leave a quick review
                            </p>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <button
                                  key={rating}
                                  type="button"
                                  onClick={() =>
                                    setReviewDrafts((current) => ({
                                      ...current,
                                      [reviewKey]: { ...draft, rating },
                                    }))
                                  }
                                  className="text-[#EAB600]"
                                >
                                  <span
                                    className="material-symbols-outlined"
                                    style={{
                                      fontVariationSettings: `'FILL' ${rating <= draft.rating ? 1 : 0}`,
                                    }}
                                  >
                                    star
                                  </span>
                                </button>
                              ))}
                            </div>
                            <textarea
                              value={draft.review_text}
                              onChange={(event) =>
                                setReviewDrafts((current) => ({
                                  ...current,
                                  [reviewKey]: {
                                    ...draft,
                                    review_text: event.target.value,
                                  },
                                }))
                              }
                              rows={2}
                              placeholder="What did you like? Optional."
                              className="w-full rounded-2xl bg-surface px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary-container/30"
                            />
                            <button
                              type="button"
                              disabled={submittingReviewKey === reviewKey}
                              onClick={() => submitReview(order, item)}
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
                <div className="pt-4 border-t border-outline-variant/20 flex gap-3">
                  <button
                    onClick={() => handleReorder(order)}
                    className="flex-1 bg-on-surface text-surface py-3 rounded-full font-label font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">reorder</span>
                    Reorder Now
                  </button>
                  {order.receipt_path && (
                    <a
                      href={order.receipt_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-surface-container-highest text-outline py-3 rounded-full font-label font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">receipt</span>
                      View Receipt
                    </a>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}

        {activeTab === 'notifications' && (
          <section className="space-y-3">
            {loading && (
              <div className="bg-surface-container-low rounded-3xl p-6 text-sm text-outline">
                Loading notifications...
              </div>
            )}
            {!loading && notifications.length === 0 && (
              <div className="bg-surface-container-low rounded-3xl p-6 text-center space-y-2">
                <p className="font-headline font-bold text-lg">No notifications yet</p>
                <p className="font-body text-sm text-outline">
                  Order status updates will show here automatically.
                </p>
              </div>
            )}
            {notifications.map((notification) => (
              <article
                key={`${notification.id}-${notification.timestamp}`}
                className="bg-surface-container-low rounded-3xl p-6 flex gap-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary-container/15 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary-container">
                    {notification.icon}
                  </span>
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

        {activeTab === 'saved' && (
          <section className="space-y-3">
            {!loading && favorites.length === 0 && (
              <div className="bg-surface-container-low rounded-3xl p-6 text-center space-y-2">
                <p className="font-headline font-bold text-lg">No favorites yet</p>
                <p className="font-body text-sm text-outline">
                  Items you heart in the menu will appear here for quick access.
                </p>
                <Link
                  href="/show"
                  className="inline-block mt-4 text-primary font-label text-xs font-bold uppercase tracking-widest"
                >
                  Browse Menu
                </Link>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {favorites.map((product) => (
                <div
                  key={product.id}
                  className="bg-surface-container-low rounded-[28px] overflow-hidden flex flex-col group p-3"
                >
                  <Link
                    href={buildProductHref(product.id)}
                    className="relative h-32 overflow-hidden rounded-2xl mb-3"
                  >
                    <ProductImage
                      src={product.image_url || getGenericProductImage()}
                      alt={product.name}
                      fill
                      blend
                    />
                  </Link>
                  <p className="font-body font-bold text-xs line-clamp-1 px-1">
                    {product.name}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-3 px-1">
                    <span className="font-label font-bold text-[10px] text-secondary">
                      ₦{Number(product.price).toLocaleString()}
                    </span>
                    <button
                      onClick={() => removeFavorite(product.id)}
                      className="text-red-500 active:scale-125 transition-transform"
                    >
                      <span
                        className="material-symbols-outlined text-sm"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        favorite
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'feedback' && (
          <section className="space-y-6">
            <div className="bg-surface-container-low rounded-[32px] p-8 space-y-6 shadow-sm border border-outline-variant/10">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-primary-container/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-primary-container text-3xl">
                    rate_review
                  </span>
                </div>
                <h2 className="font-headline font-bold text-2xl">Service Feedback</h2>
                <p className="font-body text-sm text-outline">
                  How was your experience today? Your suggestions help Soji grow.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col items-center gap-3">
                  <p className="font-label text-[10px] uppercase tracking-widest text-outline font-bold">
                    Your Rating
                  </p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          setFeedbackDraft({ ...feedbackDraft, rating: star })
                        }
                        className="active:scale-110 transition-transform duration-200"
                      >
                        <span
                          className="material-symbols-outlined text-4xl"
                          style={{
                            fontVariationSettings: `'FILL' ${star <= feedbackDraft.rating ? 1 : 0}`,
                            color:
                              star <= feedbackDraft.rating
                                ? '#EAB600'
                                : 'var(--md-sys-color-outline-variant)',
                          }}
                        >
                          star
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="font-label text-xs font-bold text-primary-container uppercase tracking-tight">
                    {feedbackDraft.rating === 5
                      ? 'Excellent!'
                      : feedbackDraft.rating === 4
                        ? 'Great'
                        : feedbackDraft.rating === 3
                          ? 'Good'
                          : feedbackDraft.rating === 2
                            ? 'Could be better'
                            : 'Poor experience'}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="font-label text-[10px] uppercase tracking-widest text-outline font-bold px-1">
                    Improvements or Suggestions
                  </p>
                  <textarea
                    rows={4}
                    value={feedbackDraft.message}
                    onChange={(e) =>
                      setFeedbackDraft({ ...feedbackDraft, message: e.target.value })
                    }
                    placeholder="Tell us what we can do better..."
                    className="w-full bg-surface border-none rounded-[24px] p-5 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container/30 transition-all resize-none shadow-inner"
                  />
                </div>

                <button
                  type="button"
                  disabled={isSubmittingFeedback || !feedbackDraft.message.trim()}
                  onClick={submitFeedback}
                  className="w-full bg-on-surface text-surface py-5 rounded-full font-label font-bold text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmittingFeedback ? (
                    <span className="animate-spin material-symbols-outlined text-sm">
                      progress_activity
                    </span>
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
                &quot;We are always listening. Every piece of feedback goes directly to
                the kitchen and management team.&quot;
              </p>
            </div>
          </section>
        )}
      </main>

      <BottomNav active="profile" />
    </div>
  );
}
