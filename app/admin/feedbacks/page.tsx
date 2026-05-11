'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/appStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { feedbackService, type FeedbackItem } from '@/lib/api';
import { useServerEvents } from '@/hooks/useServerEvents';
import useAdminGuard from '@/hooks/useAdminGuard';

export default function AdminFeedbacks() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { token, authLoading, isAdmin } = useAdminGuard();
  const logout = useAppStore((state) => state.logout);
  
  const { data: feedbacks, isLoading } = useQuery<FeedbackItem[]>({
    queryKey: ['feedbacks'],
    queryFn: async () => {
      const response: any = await feedbackService.getAllFeedbacks();
      return response.data || [];
    },
    enabled: isAdmin,
    initialData: [],
  });

  useServerEvents(
    {
      feedback_created: (payload: FeedbackItem) => {
        queryClient.setQueryData<FeedbackItem[]>(['feedbacks'], (current = []) => {
          if (current.some((feedback) => feedback.id === payload.id)) {
            return current;
          }

          return [payload, ...current];
        });
      },
    },
    { enabled: isAdmin, token }
  );

  if (authLoading || !isAdmin || isLoading) return <div className="p-10">Loading Feedbacks...</div>;

  return (
    <div className="bg-surface min-h-screen flex flex-col md:flex-row">
      {/* Sidebar - Consistent with Dashboard */}
      <aside className="w-full md:w-64 bg-on-surface text-surface p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-on-background">monitoring</span>
            </div>
            <h1 className="font-headline font-bold text-xl">Soji Admin</h1>
          </div>
          <nav className="space-y-2">
            <button onClick={() => router.push('/admin/dashboard')} className="w-full text-left px-4 py-3 hover:bg-white/5 rounded-xl flex items-center gap-3 transition-colors">
              <span className="material-symbols-outlined">receipt_long</span>
              Orders
            </button>
            <button className="w-full text-left px-4 py-3 bg-white/10 rounded-xl flex items-center gap-3">
              <span className="material-symbols-outlined">rate_review</span>
              Feedbacks
            </button>
          </nav>
        </div>
        <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-error-container hover:bg-error/10 rounded-xl transition-colors">
          <span className="material-symbols-outlined">logout</span>
          Logout
        </button>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <header className="mb-8">
          <h2 className="font-headline font-bold text-3xl">Service Feedbacks</h2>
          <p className="text-outline font-body">What users think about the shop</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {feedbacks.map((fb) => (
            <div key={fb.id} className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/10 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-body font-bold text-base">{fb.name}</p>
                  <p className="font-body text-[10px] text-outline">{fb.email || 'No email'}</p>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className="material-symbols-outlined text-xs" style={{ fontVariationSettings: `'FILL' ${s <= fb.rating ? 1 : 0}`, color: s <= fb.rating ? '#EAB600' : 'var(--md-sys-color-outline-variant)' }}>star</span>
                  ))}
                </div>
              </div>
              <p className="font-body text-sm text-on-surface/80 leading-relaxed italic">&quot;{fb.message}&quot;</p>
              <p className="font-label text-[10px] text-outline pt-2 border-t border-outline-variant/10">
                {new Date(fb.created_at).toLocaleDateString()} at {new Date(fb.created_at).toLocaleTimeString()}
              </p>
            </div>
          ))}
          {feedbacks.length === 0 && (
            <div className="col-span-full py-20 text-center text-outline">No feedbacks yet.</div>
          )}
        </div>
      </main>
    </div>
  );
}
