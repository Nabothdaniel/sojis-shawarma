'use client';

import React from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Topbar from '@/components/dashboard/Topbar';
import { RiBankCardLine, RiArrowRightLine, RiAlertLine, RiBankLine } from 'react-icons/ri';
import { useAppStore } from '@/store/appStore';
import { formatMoney } from '@/lib/utils';

export default function FundWalletPage() {
  const { user } = useAppStore();

  return (
    <DashboardLayout>
      <Topbar title="Fund Wallet" />
      <main style={{ padding: '28px', maxWidth: 800 }}>
        <div className="breadcrumb">
          <Link href="/dashboard">Dashboard</Link>
          <span>/</span>
          <span>Fund Wallet</span>
        </div>

        {/* Balance Card */}
        <div className="stat-card" style={{ marginBottom: 24, background: 'var(--color-primary)', color: '#fff', border: 'none' }}>
          <div style={{ opacity: 0.8, fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>Current Balance</div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
            {formatMoney(user?.balance)}
          </div>
        </div>

        {/* Mock Virtual Account */}
        <div className="stat-card" style={{ marginBottom: 24, borderStyle: 'dashed' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
              <RiBankLine size={18} />
            </div>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Your Static Virtual Account</span>
          </div>
          
          <div style={{ background: 'var(--color-bg)', padding: '20px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-faint)', textTransform: 'uppercase', marginBottom: 4 }}>Bank Name</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>WEMA BANK</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-faint)', textTransform: 'uppercase', marginBottom: 4 }}>Account Number</div>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                  {user?.phone ? `0${user.phone.slice(-9)}` : '7049283741'}
                </div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-faint)', textTransform: 'uppercase', marginBottom: 4 }}>Account Name</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>BAMZYSMS - {user?.name?.toUpperCase() ?? 'GUEST'}</div>
              </div>
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)', marginTop: 12, textAlign: 'center' }}>
            Funds sent to this account will be credited to your wallet instantly.
          </p>
        </div>

        {/* Alert banner */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
          padding: '14px 18px', borderRadius: 'var(--radius-md)',
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
          marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B',
            }}>
              <RiAlertLine size={16} />
            </div>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              If you are facing any problem please contact us
            </span>
          </div>
          <button className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.8rem' }}>
            Contact Us
          </button>
        </div>

        {/* Recharge methods */}
        <div className="stat-card">
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: 20, textAlign: 'center' }}>
            Alternative Recharge Methods
          </h2>

          <div style={{ display: 'grid', gap: 12 }}>
            {[
              {
                icon: <RiBankCardLine size={20} />,
                title: 'USDT / Crypto',
                desc: 'Pay using USDT (TRC20) - Coming Soon',
                color: 'var(--color-primary)',
              },
            ].map((method) => (
              <button
                key={method.title}
                disabled
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 18px', borderRadius: 'var(--radius-md)',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)',
                  cursor: 'not-allowed', transition: 'all 0.2s', textAlign: 'left',
                  opacity: 0.6
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: `${method.color}15`,
                    border: `1px solid ${method.color}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: method.color,
                  }}>
                    {method.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)', marginBottom: 2 }}>{method.title}</div>
                    <div style={{ color: 'var(--color-text-faint)', fontSize: '0.8rem' }}>{method.desc}</div>
                  </div>
                </div>
                <RiArrowRightLine size={18} color="var(--color-text-faint)" />
              </button>
            ))}
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
