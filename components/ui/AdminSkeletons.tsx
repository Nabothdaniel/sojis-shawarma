'use client';

import React from 'react';

type SkeletonBlockProps = {
  className?: string;
};

export function SkeletonBlock({ className = '' }: SkeletonBlockProps) {
  return <div aria-hidden="true" className={`admin-skeleton rounded-2xl ${className}`.trim()} />;
}

export function AdminRouteLoadingScreen() {
  return (
    <div className="min-h-screen bg-surface p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-3">
            <SkeletonBlock className="h-3 w-20 rounded-full" />
            <SkeletonBlock className="h-11 w-64" />
            <SkeletonBlock className="h-4 w-48" />
          </div>
          <div className="flex gap-3">
            <SkeletonBlock className="h-12 w-28 rounded-full" />
            <SkeletonBlock className="h-12 w-28 rounded-full" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-[32px] border border-outline-variant/10 bg-white p-6 shadow-sm">
              <SkeletonBlock className="mb-8 h-12 w-12 rounded-2xl" />
              <SkeletonBlock className="mb-3 h-3 w-24 rounded-full" />
              <SkeletonBlock className="h-8 w-28" />
            </div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[32px] border border-outline-variant/10 bg-white p-6 shadow-sm">
            <div className="mb-6 space-y-3">
              <SkeletonBlock className="h-7 w-48" />
              <SkeletonBlock className="h-4 w-80 max-w-full" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-[28px] bg-surface-container-low p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <SkeletonBlock className="h-4 w-24" />
                      <SkeletonBlock className="h-5 w-40" />
                    </div>
                    <div className="space-y-3">
                      <SkeletonBlock className="ml-auto h-4 w-16" />
                      <SkeletonBlock className="ml-auto h-6 w-20 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-outline-variant/10 bg-white p-6 shadow-sm">
            <div className="mb-6 space-y-3">
              <SkeletonBlock className="h-7 w-36" />
              <SkeletonBlock className="h-4 w-56 max-w-full" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <SkeletonBlock key={index} className="h-14 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminListPageSkeleton() {
  return (
    <div className="min-h-screen bg-surface p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-3">
            <SkeletonBlock className="h-3 w-20 rounded-full" />
            <SkeletonBlock className="h-10 w-48" />
          </div>
          <div className="flex gap-3">
            <SkeletonBlock className="h-11 w-24 rounded-full" />
            <SkeletonBlock className="h-11 w-24 rounded-full" />
          </div>
        </div>

        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="rounded-[28px] border border-outline-variant/10 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <SkeletonBlock className="h-4 w-16" />
                  <SkeletonBlock className="h-6 w-40" />
                  <SkeletonBlock className="h-4 w-32" />
                </div>
                <div className="space-y-3">
                  <SkeletonBlock className="ml-auto h-5 w-20" />
                  <SkeletonBlock className="ml-auto h-6 w-24 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminSplitViewSkeleton() {
  return (
    <div className="min-h-screen bg-surface p-6 md:p-10">
      <div className="space-y-8">
        <div className="space-y-4">
          <SkeletonBlock className="h-10 w-56" />
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-10 w-24 rounded-full" />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="rounded-[28px] border border-outline-variant/10 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <SkeletonBlock className="h-4 w-14" />
                    <SkeletonBlock className="h-5 w-40" />
                    <SkeletonBlock className="h-4 w-28" />
                  </div>
                  <div className="space-y-3">
                    <SkeletonBlock className="ml-auto h-5 w-20" />
                    <SkeletonBlock className="ml-auto h-6 w-24 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-[32px] border border-outline-variant/10 bg-white p-8 shadow-sm">
            <div className="mb-6 space-y-3">
              <SkeletonBlock className="h-7 w-36" />
              <SkeletonBlock className="h-4 w-40" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonBlock key={index} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminAnalyticsSkeleton() {
  return (
    <div className="min-h-screen bg-surface p-6 md:p-10">
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-3">
            <SkeletonBlock className="h-10 w-64" />
            <SkeletonBlock className="h-4 w-44" />
          </div>
          <SkeletonBlock className="h-12 w-32 rounded-full" />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-3xl border border-outline-variant/10 bg-white p-6 shadow-sm">
              <SkeletonBlock className="h-3 w-24 rounded-full" />
              <SkeletonBlock className="mt-4 h-9 w-24" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="rounded-3xl border border-outline-variant/10 bg-white p-8 shadow-sm">
              <SkeletonBlock className="mb-8 h-6 w-40" />
              <SkeletonBlock className="h-64 w-full rounded-[28px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminSidebarPageSkeleton() {
  return (
    <div className="min-h-screen bg-surface md:flex">
      <aside className="w-full bg-on-surface p-6 md:min-h-screen md:w-64">
        <div className="space-y-4">
          <SkeletonBlock className="h-10 w-40 bg-white/10" />
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-12 w-full bg-white/10" />
          ))}
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-10">
        <div className="space-y-8">
          <div className="space-y-3">
            <SkeletonBlock className="h-10 w-56" />
            <SkeletonBlock className="h-4 w-40" />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="rounded-3xl border border-outline-variant/10 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <SkeletonBlock className="h-5 w-24" />
                    <SkeletonBlock className="h-3 w-28" />
                  </div>
                  <SkeletonBlock className="h-4 w-16" />
                </div>
                <SkeletonBlock className="h-20 w-full" />
                <SkeletonBlock className="mt-4 h-3 w-32" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
