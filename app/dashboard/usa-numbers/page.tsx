'use client';

import React from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Topbar from '@/components/dashboard/Topbar';
import BuyNumbers from '@/components/dashboard/BuyNumbers';

export default function USANumbersPage() {
  return (
    <DashboardLayout>
      <Topbar title="USA Numbers" />
      <main style={{ padding: '28px', maxWidth: 700 }}>
        <div className="breadcrumb">
          <Link href="/dashboard">Dashboard</Link>
          <span>/</span>
          <span>USA Numbers</span>
        </div>
        <BuyNumbers defaultCountry="USA" />
      </main>
    </DashboardLayout>
  );
}
