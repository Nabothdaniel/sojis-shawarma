'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Topbar from '@/components/dashboard/Topbar';
import EmptyHistory from '@/components/dashboard/EmptyHistory';
import PageLoader from '@/components/ui/PageLoader';
import { userService } from '@/lib/api';
import { RiExchangeLine } from 'react-icons/ri';

export default function TransactionsPage() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    userService.getTransactions()
      .then(res => {
        setTransactions(res.data);
      })
      .catch(err => console.error('Failed to fetch transactions', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <Topbar title="Transaction History" />
      <main style={{ padding: '28px', maxWidth: 1000 }}>
        <div className="breadcrumb">
          <Link href="/dashboard">Dashboard</Link>
          <span>/</span>
          <span>Transaction History</span>
        </div>

        {loading ? (
          <PageLoader />
        ) : transactions.length === 0 ? (
          <EmptyHistory message="No transactions found" />
        ) : (
          <div className="stat-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '16px 20px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-faint)', textTransform: 'uppercase' }}>Type</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-faint)', textTransform: 'uppercase' }}>Description</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-faint)', textTransform: 'uppercase' }}>Amount</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-faint)', textTransform: 'uppercase' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                        background: tx.type === 'credit' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        color: tx.type === 'credit' ? '#10B981' : '#EF4444'
                      }}>
                        {tx.type.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '0.9rem', fontWeight: 500 }}>{tx.description}</td>
                    <td style={{ padding: '16px 20px', fontSize: '0.95rem', fontWeight: 700 }}>
                      {tx.type === 'credit' ? '+' : '-'}₦{parseFloat(tx.amount).toLocaleString()}
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--color-text-faint)' }}>
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}
