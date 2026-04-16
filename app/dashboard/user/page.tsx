'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Topbar from '@/components/dashboard/Topbar';
import WelcomeModal from '@/components/dashboard/WelcomeModal';
import {
  RiWalletLine, RiShoppingCartLine, RiAddLine,
  RiArrowRightLine, RiInboxLine, RiBankLine, RiHistoryLine,
} from 'react-icons/ri';
import { useAppStore } from '@/store/appStore';
import { userService, smsService } from '@/lib/api';
import PinModal from '@/components/ui/PinModal';
import { RiShieldKeyholeLine } from 'react-icons/ri';
import { formatMoney } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const { user, login, addToast } = useAppStore();
  const [recentPurchases, setRecentPurchases] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  
  // PIN states
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);

  useEffect(() => {
    // 1. Refresh profile
    userService.getProfile().then(res => {
      login(res.data);
    }).catch(err => console.error('Failed to fetch profile', err));

    // 2. Get recent activity
    smsService.getPurchases().then(res => setRecentPurchases(res.data.slice(0, 5)));
    userService.getTransactions().then(res => setRecentTransactions(res.data.slice(0, 5)));
  }, [login]);

  const handleSetPin = async (pin: string) => {
    setPinLoading(true);
    try {
      await userService.updatePin(pin);
      addToast('Transaction PIN set successfully!', 'success');
      setPinModalOpen(false);
      // Refresh profile to update hasPin status
      const res = await userService.getProfile();
      login(res.data);
    } catch (err: any) {
      addToast(err.message || 'Failed to set PIN', 'error');
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <WelcomeModal />
      <Topbar title="Dashboard" />

      <main className="dashboard-main" style={{ padding: '24px 20px', maxWidth: 1200, margin: '0 auto' }}>
        {/* Breadcrumb */}
        <div className="breadcrumb" style={{ marginBottom: 24, fontSize: '0.85rem', color: 'var(--color-text-faint)', display: 'flex', gap: 8, fontWeight: 600 }}>
          <Link href="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>Dashboard</Link>
          <span>/</span>
          <span style={{ color: 'var(--color-primary)' }}>Home</span>
        </div>

        {/* Security Banner */}
        {!user?.hasPin && (
          <div className="security-banner" style={{ 
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)', 
            borderRadius: 20, color: '#fff', border: 'none', 
            marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '32px', position: 'relative', overflow: 'hidden',
            boxShadow: '0 10px 30px var(--color-primary-glow)'
          }}>
            <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.1 }}>
               <RiShieldKeyholeLine size={180} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, position: 'relative', zIndex: 1 }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RiShieldKeyholeLine size={32} />
              </div>
              <div className="banner-text">
                <h3 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 800, marginBottom: 4 }}>Secure Your account</h3>
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem', margin: 0, maxWidth: 450 }}>Enhance your security and reveal hidden numbers by setting a 4-digit transaction PIN.</p>
              </div>
            </div>
            <button 
              className="btn-primary banner-btn" 
              onClick={() => setPinModalOpen(true)}
              style={{ background: '#fff', color: 'var(--color-primary)', fontWeight: 800, padding: '14px 28px', border: 'none', borderRadius: 12, cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            >
              Set PIN Now
            </button>
          </div>
        )}

        {/* Stat cards */}
        <div className="stat-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 20,
          marginBottom: 32,
        }}>
          {/* Wallet Balance */}
          <div className="stat-card premium-card" style={{ 
            background: 'var(--color-bg-2)', border: '1px solid var(--color-border)',
            padding: '24px', borderRadius: 20, display: 'flex', flexDirection: 'column', gap: 20
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
               <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--color-primary-dim)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <RiWalletLine size={24} />
               </div>
               <Link href="/dashboard/fund-wallet">
                 <button className="btn-primary" style={{ padding: '8px 12px', fontSize: '0.75rem', borderRadius: 8, height: 'auto' }}>
                    <RiAddLine size={14} /> Recharge
                 </button>
               </Link>
            </div>
            <div>
              <div style={{ color: 'var(--color-text-faint)', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Wallet Balance
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', color: 'var(--color-text)' }}>
                {formatMoney(user?.balance)}
              </div>
            </div>
          </div>

          {/* Virtual Account */}
          <div className="stat-card" style={{ 
            background: 'var(--color-bg-2)', border: '1px solid var(--color-border)',
            padding: '24px', borderRadius: 20, display: 'flex', flexDirection: 'column', gap: 20
          }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(16,185,129,0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <RiBankLine size={24} />
            </div>
            <div>
              <div style={{ color: 'var(--color-text-faint)', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Virtual Account
              </div>
              <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.4rem', color: 'var(--color-text)', letterSpacing: '0.05em' }}>
                {user?.phone ? `0${user.phone.slice(-9)}` : '7049283741'}
              </div>
            </div>
          </div>

          {/* SMS Purchased */}
          <div className="stat-card" style={{ 
            background: 'var(--color-bg-2)', border: '1px solid var(--color-border)',
            padding: '24px', borderRadius: 20, display: 'flex', flexDirection: 'column', gap: 20
          }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(245,158,11,0.1)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <RiShoppingCartLine size={24} />
            </div>
            <div>
              <div style={{ color: 'var(--color-text-faint)', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Numbers Ready
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem' }}>
                {recentPurchases.filter(p => p.status === 'received').length}
              </div>
            </div>
          </div>

          {/* Total Topup */}
          <div className="stat-card" style={{ 
            background: 'var(--color-bg-2)', border: '1px solid var(--color-border)',
            padding: '24px', borderRadius: 20, display: 'flex', flexDirection: 'column', gap: 20
          }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--color-primary-dim)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <RiHistoryLine size={24} />
            </div>
            <div>
              <div style={{ color: 'var(--color-text-faint)', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Top-up
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem' }}>
                {formatMoney(recentTransactions.filter(t => t.type === 'credit').reduce((acc, t) => acc + parseFloat(t.amount), 0))}
              </div>
            </div>
          </div>
        </div>

        {/* History panels */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }} className="history-grid">
          <div className="stat-card" style={{ padding: 32, borderRadius: 24, border: '1px solid var(--color-border)', background: 'var(--color-bg-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                 <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--color-primary-dim)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <RiShoppingCartLine size={18} />
                 </div>
                 <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>
                    Recent Activations
                 </h3>
              </div>
              <Link href="/dashboard/numbers-history" style={{ color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none' }}>
                View Full History
              </Link>
            </div>
            {recentPurchases.length === 0 ? (
              <EmptyState message="No Recent Numbers Yet." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {recentPurchases.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--color-border)' }}>
                    <div>
                       <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.phone_number}</div>
                       <div style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)' }}>{new Date(p.created_at).toLocaleDateString()}</div>
                    </div>
                    <span style={{ 
                      padding: '4px 12px', borderRadius: 8, fontSize: '0.7rem', 
                      background: p.status === 'received' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                      color: p.status === 'received' ? '#10B981' : '#F59E0B', 
                      fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' 
                    }}>
                       {p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="stat-card" style={{ padding: 32, borderRadius: 24, border: '1px solid var(--color-border)', background: 'var(--color-bg-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                 <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--color-primary-dim)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <RiHistoryLine size={18} />
                 </div>
                 <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>
                    Latest Transactions
                 </h3>
              </div>
              <Link href="/dashboard/transactions" style={{ color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none' }}>
                History
              </Link>
            </div>
            {recentTransactions.length === 0 ? (
              <EmptyState message="No transactions recorded." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {recentTransactions.map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--color-border)' }}>
                    <div>
                       <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{t.description}</div>
                       <div style={{ fontSize: '0.7rem', color: 'var(--color-text-faint)' }}>{new Date(t.created_at).toLocaleDateString()}</div>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: t.type === 'credit' ? '#10B981' : 'var(--color-text)' }}>
                       {t.type === 'credit' ? '+' : '-'}{formatMoney(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <PinModal
        isOpen={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        onSuccess={handleSetPin}
        title="Set Transaction PIN"
        description="Create a secure 4-digit PIN to protect your account."
        isLoading={pinLoading}
      />

      <style>{`
        @media (max-width: 1100px) {
           .stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 900px) {
          .history-grid { grid-template-columns: 1fr !important; }
          .security-banner { flex-direction: column; align-items: flex-start !important; gap: 24px; padding: 24px !important; }
          .banner-btn { width: 100%; }
        }
        @media (max-width: 600px) {
          .stat-grid { grid-template-columns: 1fr !important; }
          .dashboard-main { padding: 16px 12px !important; }
        }
      `}</style>
    </DashboardLayout>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px', gap: 8 }}>
      <RiInboxLine size={32} color="var(--color-text-faint)" style={{ opacity: 0.4 }} />
      <p style={{ color: 'var(--color-text-faint)', fontSize: '0.8rem' }}>{message}</p>
    </div>
  );
}
