'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Topbar from '@/components/dashboard/Topbar';
import EmptyHistory from '@/components/dashboard/EmptyHistory';
import PageLoader from '@/components/ui/PageLoader';
import { userService } from '@/lib/api';
import { formatMoney } from '@/lib/utils';
import { RiExchangeFundsLine, RiTimeLine } from 'react-icons/ri';

export default function UserFundingPage() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    userService.getTransactions()
      .then(res => {
        // Filter for credits only (funding)
        const credits = res.data.filter((t: any) => t.type === 'credit');
        setTransactions(credits);
      })
      .catch(err => console.error('Failed to fetch funding history', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <Topbar title="Funding History" />
      <main style={{ padding: '28px', maxWidth: 1000, margin: '0 auto' }}>
        <div className="breadcrumb" style={{ marginBottom: 24, fontSize: '0.85rem', color: 'var(--color-text-faint)', display: 'flex', gap: 8, fontWeight: 600 }}>
          <Link href="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>Dashboard</Link>
          <span>/</span>
          <span style={{ color: 'var(--color-primary)' }}>Funding History</span>
        </div>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 8px' }}>Wallet Funding History</h1>
          <p style={{ color: 'var(--color-text-faint)', margin: 0 }}>View all your successful wallet deposits and credits.</p>
        </div>

        {loading ? (
          <PageLoader />
        ) : transactions.length === 0 ? (
          <EmptyHistory message="No funding history found. Top up your wallet to see records here." />
        ) : (
          <div className="stat-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg-hover)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={thStyle}>Source / Description</th>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid var(--color-border)' }} className="row-hover">
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{tx.description}</div>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        fontWeight: 900, color: '#10B981', background: 'rgba(16, 185, 129, 0.08)',
                        padding: '8px 16px', borderRadius: '14px', fontSize: '1rem',
                        border: '1.2px solid rgba(16, 185, 129, 0.2)'
                      }}>
                        <RiExchangeFundsLine size={18} />
                        +{formatMoney(tx.amount)}
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--color-text-faint)', fontWeight: 600 }}>
                        <RiTimeLine size={16} />
                        {new Date(tx.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <style jsx>{`
          .row-hover:hover { background: var(--color-bg-hover); }
        `}</style>
      </main>
    </DashboardLayout>
  );
}

const thStyle: React.CSSProperties = {
  padding: '16px 24px',
  fontSize: '0.75rem',
  fontWeight: 800,
  color: 'var(--color-text-faint)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};
