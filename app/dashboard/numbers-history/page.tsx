'use client';

import React from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Topbar from '@/components/dashboard/Topbar';
import EmptyHistory from '@/components/dashboard/EmptyHistory';

export default function NumbersHistoryPage() {
  return (
    <DashboardLayout>
      <Topbar title="Numbers History" />
      <main style={{ padding: '28px' }}>
        <div className="breadcrumb">
          <Link href="/dashboard">Dashboard</Link>
          <span>/</span>
          <span>Numbers History</span>
        </div>
        <EmptyHistory message="Empty History" />
      </main>
    </DashboardLayout>
  );
}
