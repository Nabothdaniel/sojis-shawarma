'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Topbar from '@/components/dashboard/Topbar';
import {
  RiBankCardLine, RiArrowRightLine, RiAlertLine, RiBankLine,
  RiRefreshLine, RiFileCopyLine, RiCheckLine, RiWalletLine,
  RiShieldCheckLine, RiLoader4Line,
} from 'react-icons/ri';
import { useAppStore } from '@/store/appStore';
import { formatMoney } from '@/lib/utils';
import { paymentService, VirtualAccount } from '@/lib/api/payment.service';

const BANK_LOGOS: Record<string, { color: string; short: string }> = {
  PalmPay: { color: '#00C853', short: 'PP' },
  OPay:    { color: '#FF6B00', short: 'OP' },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} title="Copy" style={{
      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-faint)',
      display: 'inline-flex', alignItems: 'center', padding: '2px 4px', borderRadius: 4,
      transition: 'color 0.2s',
    }}>
      {copied ? <RiCheckLine size={15} color="#10B981" /> : <RiFileCopyLine size={15} />}
    </button>
  );
}

export default function FundWalletPage() {
  const { user, addToast } = useAppStore();
  const [accounts, setAccounts]     = useState<VirtualAccount[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [activeBank, setActiveBank] = useState(0);

  const loadVirtualAccount = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentService.getVirtualAccount();
      if (res.status === 'success' && res.bankAccounts?.length > 0) {
        setAccounts(res.bankAccounts);
      } else {
        setError('No virtual account available. Please try again.');
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to load virtual account details.';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadVirtualAccount();
  }, [loadVirtualAccount]);

  const activeAccount = accounts[activeBank] ?? null;

  return (
    <DashboardLayout>
      <Topbar title="Fund Wallet" />
      <main style={{ padding: '28px', maxWidth: 820 }}>
        <div className="breadcrumb">
          <Link href="/dashboard/user">Dashboard</Link>
          <span>/</span>
          <span>Fund Wallet</span>
        </div>

        {/* Balance Card */}
        <div className="stat-card" style={{
          marginBottom: 24, border: 'none',
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
          color: '#fff',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ opacity: 0.75, fontSize: '0.82rem', fontWeight: 600, marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Available Balance
              </div>
              <div style={{ fontSize: '2.6rem', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                {formatMoney(user?.balance)}
              </div>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RiWalletLine size={26} />
            </div>
          </div>
        </div>

        {/* ── Virtual Account Panel ── */}
        <div className="stat-card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                <RiBankLine size={18} />
              </div>
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Your Dedicated Virtual Account</span>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)', marginTop: 1 }}>
                  Transfer to fund your wallet instantly
                </div>
              </div>
            </div>
            <button
              onClick={loadVirtualAccount}
              disabled={loading}
              title="Refresh"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-faint)', display: 'flex', padding: 4 }}
            >
              <RiRefreshLine size={18} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>

          {loading ? (
            <div style={{ height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--color-text-faint)' }}>
              <RiLoader4Line size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
              <span style={{ fontSize: '0.85rem' }}>Setting up your virtual account…</span>
            </div>
          ) : error ? (
            <div style={{ padding: '20px', textAlign: 'center', borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p style={{ color: '#EF4444', fontSize: '0.875rem', marginBottom: 12 }}>{error}</p>
              <button className="btn-primary" onClick={loadVirtualAccount} style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
                Try Again
              </button>
            </div>
          ) : activeAccount ? (
            <>
              {/* Bank tab switcher (if multiple banks) */}
              {accounts.length > 1 && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  {accounts.map((acct, i) => {
                    const meta = BANK_LOGOS[acct.bankName] ?? { color: 'var(--color-primary)', short: (acct.bankName || 'BK').slice(0, 2) };
                    return (
                      <button
                        key={i}
                        onClick={() => setActiveBank(i)}
                        style={{
                          padding: '6px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700,
                          border: `2px solid ${activeBank === i ? meta.color : 'var(--color-border)'}`,
                          background: activeBank === i ? `${meta.color}18` : 'transparent',
                          color: activeBank === i ? meta.color : 'var(--color-text-faint)',
                          cursor: 'pointer', transition: 'all 0.2s',
                        }}
                      >
                        {acct.bankName}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Account Card */}
              {(() => {
                const meta = BANK_LOGOS[activeAccount.bankName] ?? { color: 'var(--color-primary)', short: (activeAccount.bankName || 'BK').slice(0, 2).toUpperCase() };
                return (
                  <div style={{
                    background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', padding: '24px',
                    border: `1px solid ${meta.color}30`,
                  }}>
                    {/* Bank badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: 12,
                        background: `${meta.color}18`, border: `1px solid ${meta.color}40`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 900, fontSize: '0.8rem', color: meta.color, letterSpacing: '0.04em',
                      }}>
                        {meta.short}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)' }}>{activeAccount.bankName}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-faint)' }}>Virtual Account</div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
                      {/* Account Number */}
                      <div style={{ gridColumn: 'span 2' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-faint)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.08em' }}>
                          Account Number
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 900, fontSize: '1.6rem', fontFamily: 'monospace', letterSpacing: '0.1em', color: meta.color }}>
                            {activeAccount.accountNumber}
                          </span>
                          <CopyButton text={activeAccount.accountNumber} />
                        </div>
                      </div>

                      {/* Account Name */}
                      <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-faint)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.08em' }}>
                          Account Name
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}>
                          {activeAccount.accountName}
                        </div>
                      </div>

                      {/* Bank */}
                      <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-faint)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.08em' }}>
                          Bank Name
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}>
                          {activeAccount.bankName}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Trust badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, color: '#10B981', fontSize: '0.78rem', fontWeight: 600 }}>
                <RiShieldCheckLine size={15} />
                Your wallet is credited automatically when payment arrives · No minimum transfer
              </div>
            </>
          ) : null}
        </div>

        {/* ── How it Works Step-by-Step ── */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 16, color: 'var(--color-text-muted)' }}>How to Fund Your Wallet</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { step: '1', title: 'Copy Account', desc: 'Select a bank above and copy the account number.' },
              { step: '2', title: 'Make Transfer', desc: 'Transfer any amount from your bank app to this account.' },
              { step: '3', title: 'Auto-Credit', desc: 'Your wallet is credited instantly once the payment is confirmed.' },
            ].map((item, i) => (
              <div key={i} style={{ 
                padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-alt)', 
                border: '1px solid var(--color-border)', display: 'flex', gap: 12
              }}>
                <div style={{ 
                  width: 28, height: 28, borderRadius: '50%', background: 'var(--color-primary)', 
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontSize: '0.8rem', fontWeight: 800, flexShrink: 0
                }}>
                  {item.step}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)', lineHeight: 1.4 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alert banner */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
          padding: '14px 18px', borderRadius: 'var(--radius-md)',
          background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)',
          marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B', flexShrink: 0 }}>
              <RiAlertLine size={16} />
            </div>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              Experiencing any issues with your wallet funding? Contact support.
            </span>
          </div>
          <Link href="/dashboard/user/faqs">
            <button className="btn-secondary" style={{ padding: '7px 18px', fontSize: '0.8rem' }}>
              Get Help
            </button>
          </Link>
        </div>

        {/* Other methods */}
        <div className="stat-card">
          <h2 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 16 }}>Other Methods</h2>
          <button
            disabled
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', borderRadius: 'var(--radius-md)',
              background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)',
              cursor: 'not-allowed', opacity: 0.55, textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 9, background: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                <RiBankCardLine size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text)', marginBottom: 2 }}>USDT / Crypto</div>
                <div style={{ color: 'var(--color-text-faint)', fontSize: '0.78rem' }}>Pay using USDT TRC20 — Coming Soon</div>
              </div>
            </div>
            <RiArrowRightLine size={16} color="var(--color-text-faint)" />
          </button>
        </div>
      </main>

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </DashboardLayout>
  );
}
