'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import SupportFAB from '@/components/ui/SupportFAB';
import { useAppStore } from '@/store/appStore';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, sidebarOpen, setSidebarOpen } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, router]);

  // Close sidebar on mobile by default
  useEffect(() => {
    if (window.innerWidth < 900) setSidebarOpen(false);
  }, [setSidebarOpen]);

  if (!isAuthenticated) return null;

  return (
    <div className="dashboard-layout">
      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            zIndex: 49, display: 'none',
          }}
          className="sidebar-overlay"
        />
      )}

      <Sidebar />

      <div className={`main-content`} style={{ marginLeft: sidebarOpen ? 260 : 0, transition: 'margin-left 0.3s ease' }}>
        {children}
      </div>

      <SupportFAB />

      <style>{`
        @media (max-width: 900px) {
          .main-content { margin-left: 0 !important; }
          .sidebar-overlay { display: block !important; }
        }
      `}</style>
    </div>
  );
}
