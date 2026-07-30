'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useProfilePage } from '@/features/profile/hooks/useProfilePage';

export default function FeedbackPage() {
  const router = useRouter();
  const {
    feedbackDraft,
    setFeedbackDraft,
    isSubmittingFeedback,
    submitFeedback,
  } = useProfilePage();

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-32">
      <header className="px-6 py-6 flex items-center gap-4 bg-surface sticky top-0 z-40 border-b border-outline-variant/10">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <h1 className="font-headline font-bold text-xl">Feedback</h1>
      </header>

      <main className="px-6 py-6 space-y-6 max-w-md mx-auto w-full">
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
                onClick={async () => {
                  await submitFeedback();
                  router.push('/profile');
                }}
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
      </main>
    </div>
  );
}
