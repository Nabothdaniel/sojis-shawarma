'use client';

import React from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Topbar from '@/components/dashboard/Topbar';
import { RiTimeLine, RiNotificationLine } from 'react-icons/ri';

export default function BuyLogsPage() {
  return (
    <DashboardLayout>
      <Topbar title="Buy Logs" />
      <main style={{ padding: '28px' }}>
        <div className="breadcrumb">
          <Link href="/dashboard">Dashboard</Link>
          <span>/</span>
          <span>Buy Logs</span>
        </div>

        <div className="coming-soon-wrap">
          {/* Animated ring */}
          <div style={{ position: 'relative', width: 120, height: 120, marginBottom: 8 }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: '2px solid rgba(0,229,255,0.2)',
              animation: 'spinSlow 8s linear infinite',
            }} />
            <div style={{
              position: 'absolute', inset: 8, borderRadius: '50%',
              border: '2px dashed rgba(0,229,255,0.1)',
              animation: 'spinSlow 12s linear infinite reverse',
            }} />
            <div style={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: 'var(--color-primary-dim)',
              borderRadius: '50%',
              border: '1px solid rgba(0,229,255,0.2)',
              color: 'var(--color-primary)',
            }}>
              <RiTimeLine size={40} />
            </div>
          </div>

          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem' }}>
            Coming <span className="gradient-text">Soon</span>
          </h2>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: 360, lineHeight: 1.6, fontSize: '0.9rem' }}>
            Buy Logs is currently under development. You&apos;ll soon be able to track all your number purchases in one place.
          </p>

          <button className="btn-ghost" style={{ padding: '11px 24px', fontSize: '0.875rem', marginTop: 8, gap: 8 }}>
            <RiNotificationLine size={16} />
            Notify Me When Ready
          </button>
        </div>
      </main>
    </DashboardLayout>
  );
}
