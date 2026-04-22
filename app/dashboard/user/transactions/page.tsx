'use client';

import React from 'react';
import DashboardPageShell from '@/components/dashboard/DashboardPageShell';
import EmptyHistory from '@/components/dashboard/EmptyHistory';
import TransactionsTable from '@/components/dashboard/history/TransactionsTable';
import PageLoader from '@/components/ui/PageLoader';
import { useTransactions } from '@/hooks/useTransactions';

export default function TransactionsPage() {
  const { loading, transactions } = useTransactions();

  return (
    <DashboardPageShell
      title="Transaction History"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Transaction History' },
      ]}
    >
      {loading ? (
        <PageLoader />
      ) : transactions.length === 0 ? (
        <EmptyHistory message="No transactions found" />
      ) : (
        <TransactionsTable transactions={transactions} />
      )}
    </DashboardPageShell>
  );
}
