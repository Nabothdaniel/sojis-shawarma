'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Topbar from '@/components/dashboard/Topbar';
import EmptyHistory from '@/components/dashboard/EmptyHistory';
import PageLoader from '@/components/ui/PageLoader';
import { smsService } from '@/lib/api';
import { RiHashtag, RiMessage2Line, RiTimeLine } from 'react-icons/ri';

export default function NumbersHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<any[]>([]);

  useEffect(() => {
    smsService.getPurchases()
      .then(res => {
        setPurchases(res.data);
      })
      .catch(err => console.error('Failed to fetch purchases', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <Topbar title="Number History" />
      <main style={{ padding: '28px', maxWidth: 1000 }}>
        <div className="breadcrumb">
          <Link href="/dashboard">Dashboard</Link>
          <span>/</span>
          <span>Number History</span>
        </div>

        {loading ? (
          <PageLoader />
        ) : purchases.length === 0 ? (
          <EmptyHistory message="No numbers purchased yet" />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {purchases.map((item) => (
              <div key={item.id} className="stat-card" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--color-primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                      <RiHashtag size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.service_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)' }}>{item.country}</div>
                    </div>
                  </div>
                  <span style={{ 
                    padding: '4px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600,
                    background: item.status === 'received' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                    color: item.status === 'received' ? '#10B981' : '#F59E0B'
                  }}>
                    {item.status.toUpperCase()}
                  </span>
                </div>

                <div style={{ background: 'var(--color-bg)', padding: '12px 16px', borderRadius: 10, marginBottom: 16 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-faint)', marginBottom: 4 }}>Phone Number</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.2rem', letterSpacing: '0.05em' }}>{item.phone_number}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-faint)', fontSize: '0.8rem' }}>
                    <RiTimeLine size={14} /> {new Date(item.created_at).toLocaleDateString()}
                  </div>
                  {item.otp_code ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-success)', fontWeight: 700, fontSize: '0.95rem' }}>
                      <RiMessage2Line size={16} /> {item.otp_code}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--color-text-faint)', fontSize: '0.8rem', fontStyle: 'italic' }}>Waiting for code...</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}
