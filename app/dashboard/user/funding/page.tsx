'use client';

import React from 'react';
import DashboardPageShell from '@/components/dashboard/DashboardPageShell';
import EmptyHistory from '@/components/dashboard/EmptyHistory';
import TransactionsTable from '@/components/dashboard/history/TransactionsTable';
import PageLoader from '@/components/ui/PageLoader';
import { useTransactions } from '@/hooks/useTransactions';

export default function UserFundingPage() {
  const { loading, transactions } = useTransactions((transaction) => transaction.type === 'credit');

  return (
    <DashboardPageShell
      title="Funding History"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Funding History' },
      ]}
      maxWidth={1000}
    >
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 8px' }}>Wallet Funding History</h1>
          <p style={{ color: 'var(--color-text-faint)', margin: 0 }}>View all your successful wallet deposits and credits.</p>
        </div>

      {loading ? (
        <PageLoader />
      ) : transactions.length === 0 ? (
        <EmptyHistory message="No funding history found. Top up your wallet to see records here." />
      ) : (
        <TransactionsTable transactions={transactions} variant="credits" />
        )}
    </DashboardPageShell>
  );
}
