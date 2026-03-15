'use client';

import React from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Topbar from '@/components/dashboard/Topbar';
import { RiBankCardLine, RiArrowRightLine, RiAlertLine } from 'react-icons/ri';

export default function FundWalletPage() {
  return (
    <DashboardLayout>
      <Topbar title="Fund Wallet" />
      <main style={{ padding: '28px', maxWidth: 800 }}>
        <div className="breadcrumb">
          <Link href="/dashboard">Dashboard</Link>
          <span>/</span>
          <span>Fund Wallet</span>
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
            Recharge Methods
          </h2>

          {[
            {
              icon: <RiBankCardLine size={20} />,
              title: 'Virtual Account',
              desc: 'Pay by using your own BamzySMS virtual account',
              color: 'var(--color-primary)',
            },
          ].map((method) => (
            <button
              key={method.title}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 18px', borderRadius: 'var(--radius-md)',
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)',
                cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,229,255,0.3)';
                (e.currentTarget as HTMLElement).style.background = 'rgba(0,229,255,0.04)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
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
      </main>
    </DashboardLayout>
  );
}
