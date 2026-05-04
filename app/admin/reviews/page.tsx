'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { reviewService, type ProductReview } from '@/lib/api';
import { useAppStore } from '@/store/appStore';

export default function AdminReviewsPage() {
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  const addToast = useAppStore((state) => state.addToast);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !token) {
      router.replace('/admin/login');
      return;
    }

    const loadReviews = async () => {
      setLoading(true);
      try {
        const response = await reviewService.getAllReviews();
        setReviews(response.data || []);
      } catch (error: any) {
        addToast(error.message || 'Could not load reviews', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadReviews();
    }
  }, [token, authLoading, router, addToast]);

  if (authLoading || !token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-label text-[10px] uppercase tracking-[0.3em] text-outline font-bold">Admin</p>
            <h1 className="font-headline text-3xl font-bold">Customer reviews</h1>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/products" className="rounded-full bg-surface-container-low px-5 py-3 text-xs font-label font-bold uppercase tracking-widest">Products</Link>
            <Link href="/admin/orders" className="rounded-full bg-surface-container-low px-5 py-3 text-xs font-label font-bold uppercase tracking-widest">Orders</Link>
          </div>
        </header>

        <section className="rounded-[32px] bg-white p-6 shadow-sm border border-outline-variant/10">
          {loading && <div className="rounded-2xl bg-surface-container-low p-4 text-sm text-outline">Loading reviews...</div>}
          {!loading && reviews.length === 0 && (
            <div className="rounded-2xl bg-surface-container-low p-8 text-center text-sm text-outline">
              No reviews yet. Delivered orders will feed this screen once customers submit them.
            </div>
          )}
          <div className="space-y-4">
            {reviews.map((review) => (
              <article key={review.id} className="rounded-[28px] bg-surface-container-low p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-body font-bold text-base">{review.product_name}</p>
                    <p className="font-body text-xs text-outline">{review.user_name || 'Customer'} • {review.user_email || 'No email'}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end text-[#EAB600]">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <span key={index} className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' ${index < review.rating ? 1 : 0}` }}>
                          star
                        </span>
                      ))}
                    </div>
                    <p className="font-label text-[10px] uppercase tracking-widest text-outline font-bold mt-1">
                      Order #{review.order_id}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-on-surface">{review.review_text || 'No written comment left.'}</p>
                <p className="mt-3 text-[10px] font-label font-bold uppercase tracking-widest text-outline">
                  {new Date(review.created_at).toLocaleString('en-NG')}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

