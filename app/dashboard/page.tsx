'use client';

import React from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Topbar from '@/components/dashboard/Topbar';
import WelcomeModal from '@/components/dashboard/WelcomeModal';
import {
  RiWalletLine, RiShoppingCartLine, RiAddLine,
  RiArrowRightLine, RiInboxLine, RiPhoneLine,
} from 'react-icons/ri';
import { useAppStore } from '@/store/appStore';

export default function DashboardPage() {
  const { user } = useAppStore();

  return (
    <DashboardLayout>
      <WelcomeModal />
      <Topbar title="Dashboard" />

      <main style={{ padding: '28px', maxWidth: 1100 }}>
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link href="/dashboard">Dashboard</Link>
          <span>/</span>
          <span>Home</span>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 28 }}>
          {/* Wallet */}
          <div className="stat-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: 'var(--color-text-faint)', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Wallet Balance
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', color: 'var(--color-text)' }}>
                ₦{user?.balance?.toLocaleString() ?? '0'}
              </div>
              <Link href="/dashboard/fund-wallet" style={{ textDecoration: 'none' }}>
                <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.78rem', marginTop: 14, gap: 6 }}>
                  <RiAddLine size={14} /> Recharge
                </button>
              </Link>
            </div>
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: 'var(--color-primary-dim)',
              border: '1px solid rgba(0,229,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-primary)',
            }}>
              <RiWalletLine size={26} />
            </div>
          </div>

          {/* SMS Units */}
          <div className="stat-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: 'var(--color-text-faint)', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                SMS Units
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', color: 'var(--color-text)' }}>
                {user?.smsUnits ?? 0}
              </div>
              <Link href="/dashboard/usa-numbers" style={{ textDecoration: 'none' }}>
                <button className="btn-ghost" style={{ padding: '8px 16px', fontSize: '0.78rem', marginTop: 14, gap: 6 }}>
                  <RiShoppingCartLine size={14} /> Buy Numbers
                </button>
              </Link>
            </div>
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: 'rgba(124,58,237,0.1)',
              border: '1px solid rgba(124,58,237,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#7C3AED',
            }}>
              <RiPhoneLine size={26} />
            </div>
          </div>

          {/* Virtual Account */}
          <div className="stat-card">
            <div style={{ color: 'var(--color-text-faint)', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Virtual Account
            </div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: 14, lineHeight: 1.5 }}>
              Generate a virtual account to fund your wallet automatically.
            </div>
            <button className="btn-primary" style={{ padding: '9px 18px', fontSize: '0.8rem', gap: 6 }}>
              Generate Account <RiArrowRightLine size={14} />
            </button>
          </div>
        </div>

        {/* Number Purchases */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem' }}>Number Purchases</h3>
            </div>
            <EmptyState icon={<RiInboxLine size={40} />} message="No Recent Number Purchases" />
          </div>

          <div className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem' }}>Recent Transactions</h3>
              <Link href="/dashboard/transactions" style={{ color: 'var(--color-primary)', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none' }}>
                View All
              </Link>
            </div>
            <EmptyState icon={<RiInboxLine size={40} />} message="No Transactions Yet" />
          </div>
        </div>
      </main>

      <style>{`
        @media (max-width: 640px) {
          main > div:last-child { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </DashboardLayout>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', gap: 12 }}>
      <div style={{ color: 'var(--color-text-faint)', opacity: 0.5 }}>{icon}</div>
      <p style={{ color: 'var(--color-text-faint)', fontSize: '0.875rem' }}>{message}</p>
    </div>
  );
}
