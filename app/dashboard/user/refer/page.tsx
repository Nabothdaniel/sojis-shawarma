'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Topbar from '@/components/dashboard/Topbar';
import { RiFileCopyLine, RiCheckLine, RiUserSharedLine, RiCoinLine, RiGiftLine } from 'react-icons/ri';
import { useAppStore } from '@/store/appStore';

export default function ReferPage() {
  const { user, addToast } = useAppStore();
  const [copied, setCopied] = useState(false);
  const referralLink = `https://bamzysms.com/register?ref=${user?.referralCode ?? 'BAMZY000'}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    addToast('Referral link copied!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const instructions = [
    'Copy and share your referral link.',
    'Whenever your friend registers using your link and deposits from ₦1,000 upwards.',
    'You will receive ₦100 of the deposit amount in your Refer wallet.',
    'You can directly use that balance to buy numbers.',
  ];

  return (
    <DashboardLayout>
      <Topbar title="Refer & Earn" />
      <main style={{ padding: '28px', maxWidth: 760 }}>
        <div className="breadcrumb">
          <Link href="/dashboard">Dashboard</Link>
          <span>/</span>
          <span>Refer & Earn</span>
        </div>

        {/* Hero banner */}
        <div style={{
          borderRadius: 'var(--radius-xl)', overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(14,165,233,0.08) 60%, rgba(245,158,11,0.07) 100%)',
          border: '1px solid rgba(37,99,235,0.15)',
          padding: '32px', marginBottom: 20,
          display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(37,99,235,0.12), rgba(14,165,233,0.18))',
            border: '1px solid rgba(37,99,235,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)',
          }}>
            <RiGiftLine size={30} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.4rem' }}>
            Refer & <span className="gradient-text">Earn</span>
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', maxWidth: 400, lineHeight: 1.6 }}>
            Earn ₦100 for every friend who registers with your link and deposits ₦1,000 or more.
          </p>
        </div>

        {/* Referral link */}
        <div className="stat-card" style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-faint)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Your Referral Link
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              readOnly value={referralLink}
              className="input-field"
              style={{ flex: 1, fontSize: '0.8rem', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              onClick={handleCopy}
            />
            <button
              onClick={handleCopy}
              className={copied ? 'btn-primary' : 'btn-ghost'}
              style={{ padding: '0 18px', flexShrink: 0, gap: 6, fontSize: '0.875rem', minWidth: 100 }}
            >
              {copied ? <><RiCheckLine size={15} /> Copied!</> : <><RiFileCopyLine size={15} /> Copy</>}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="stat-card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: 16, textAlign: 'center' }}>
            Instructions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {instructions.map((text, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--color-primary-dim)', border: '1px solid rgba(37,99,235,0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.7rem', color: 'var(--color-primary)',
                }}>
                  {i + 1}
                </div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: 1.55, paddingTop: 3 }}>
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Refer Data */}
        <div className="stat-card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: 16 }}>
            Refer Data
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: <RiUserSharedLine size={18} />, label: 'Total Referred Users', value: '0', color: 'var(--color-secondary)' },
              { icon: <RiCoinLine size={18} />, label: 'Total Transfer Amount', value: '₦0', color: 'var(--color-primary)' },
            ].map((stat) => (
              <div key={stat.label} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px', borderRadius: 'var(--radius-md)',
                background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: `${stat.color}15`, border: `1px solid ${stat.color}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color,
                }}>
                  {stat.icon}
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-faint)', marginBottom: 2 }}>{stat.label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-text)' }}>{stat.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
