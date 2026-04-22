'use client';

import React from 'react';
import Link from 'next/link';
import { RiHistoryLine, RiShoppingCartLine } from 'react-icons/ri';
import { formatMoney } from '@/lib/utils';
import { SmsPurchase, Transaction } from '@/types';
import EmptyDashboardState from './EmptyDashboardState';

interface RecentActivityPanelsProps {
  recentPurchases: SmsPurchase[];
  recentTransactions: Transaction[];
}

export default function RecentActivityPanels({
  recentPurchases,
  recentTransactions,
}: RecentActivityPanelsProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }} className="history-grid">
      <div className="stat-card history-card" style={{ padding: 32, borderRadius: 24, border: '1px solid var(--color-border)', background: 'var(--color-bg-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'var(--color-primary-dim)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RiShoppingCartLine size={18} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>
              Recent Activations
            </h3>
          </div>
          <Link href="/dashboard/user/numbers-history" style={{ color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none' }}>
            View Full History
          </Link>
        </div>
        {recentPurchases.length === 0 ? (
          <EmptyDashboardState message="No Recent Numbers Yet." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {recentPurchases.map((purchase) => (
              <div
                key={purchase.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 0',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{purchase.phone_number}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)' }}>
                    {new Date(purchase.created_at).toLocaleDateString()}
                  </div>
                </div>
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: 8,
                    fontSize: '0.7rem',
                    background: purchase.status === 'received' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                    color: purchase.status === 'received' ? '#10B981' : '#F59E0B',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {purchase.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="stat-card history-card" style={{ padding: 32, borderRadius: 24, border: '1px solid var(--color-border)', background: 'var(--color-bg-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'var(--color-primary-dim)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RiHistoryLine size={18} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>
              Latest Transactions
            </h3>
          </div>
          <Link href="/dashboard/user/transactions" style={{ color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none' }}>
            History
          </Link>
        </div>
        {recentTransactions.length === 0 ? (
          <EmptyDashboardState message="No transactions recorded." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 0',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{transaction.description}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-faint)' }}>
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </div>
                </div>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: transaction.type === 'credit' ? '#10B981' : 'var(--color-text)' }}>
                  {transaction.type === 'credit' ? '+' : '-'}
                  {formatMoney(transaction.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
