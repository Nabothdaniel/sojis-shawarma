'use client';

import React from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Topbar from '@/components/dashboard/Topbar';
import EmptyHistory from '@/components/dashboard/EmptyHistory';

export default function TransactionsPage() {
  return (
    <DashboardLayout>
      <Topbar title="Transaction History" />
      <main style={{ padding: '28px' }}>
        <div className="breadcrumb">
          <Link href="/dashboard">Dashboard</Link>
          <span>/</span>
          <span>Transaction History</span>
        </div>
        <EmptyHistory message="Empty Transaction History" />
      </main>
    </DashboardLayout>
  );
}
