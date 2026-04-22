'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import SupportFAB from '@/components/ui/SupportFAB';
import { useAppStore } from '@/store/appStore';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, sidebarOpen, setSidebarOpen, hasHydrated } = useAppStore();
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasHydrated) {
      if (!isAuthenticated) {
        router.replace('/login');
      } else if (user?.role === 'admin') {
        // Globally redirect admins away from user dashboard pages to the admin dashboard
        router.replace('/dashboard/admin/dashboard');
      }
    }
  }, [isAuthenticated, hasHydrated, router, user]);
  // Close on mobile
  useEffect(() => {
    const check = () => {
      if (window.innerWidth < 900) setSidebarOpen(false);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [setSidebarOpen]);

  // Directly set margin on the DOM node — bypasses React SSR/hydration entirely
  useEffect(() => {
    if (!contentRef.current) return;
    const isMobile = window.innerWidth < 900;
    contentRef.current.style.marginLeft = (!isMobile && sidebarOpen) ? '260px' : '0px';
  }, [sidebarOpen]);

  // While localStorage is being rehydrated, render nothing (avoids flash + race condition).
  // After hydration, useEffect handles any redirect.
  if (!hasHydrated) return null;
  if (!isAuthenticated) return null;

  return (
    <>
      <style>{`
        .dash-sidebar {
          position: fixed;
          top: 0; left: 0; bottom: 0;
          width: 260px;
          z-index: 50;
          background: var(--color-bg-2);
          border-right: 1px solid var(--color-border);
          overflow-y: auto;
          transition: transform 0.28s ease;
        }
        .dash-content {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          transition: margin-left 0.28s ease;
        }
        .mob-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 49;
        }
        @media (max-width: 900px) {
          .dash-content { margin-left: 0 !important; }
          .mob-overlay { display: block; }
        }
      `}</style>

      {/* Sidebar */}
      <div
        className="dash-sidebar"
        style={{ transform: sidebarOpen ? 'translateX(0)' : 'translateX(-260px)' }}
      >
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="mob-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Content — margin set directly via useEffect ref */}
      <div ref={contentRef} className="dash-content">
        {children}
      </div>

      <SupportFAB />
    </>
  );
}