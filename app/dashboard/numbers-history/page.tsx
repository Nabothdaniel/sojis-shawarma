'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Topbar from '@/components/dashboard/Topbar';
import EmptyHistory from '@/components/dashboard/EmptyHistory';
import PageLoader from '@/components/ui/PageLoader';
import { smsService } from '@/lib/api';
import { 
  RiHashtag, RiMessage2Line, RiTimeLine, 
  RiFileCopyLine, RiCloseCircleLine, RiRefreshLine 
} from 'react-icons/ri';
import { useAppStore } from '@/store/appStore';

export default function NumbersHistoryPage() {
  const { addToast } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<any[]>([]);
  const pollingRef = useRef<{ [key: number]: NodeJS.Timeout }>({});

  const fetchPurchases = React.useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await smsService.getPurchases();
      setPurchases(res.data);
    } catch (err) {
      console.error('Failed to fetch purchases', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const startPolling = React.useCallback((dbId: number, activationId: number) => {
    const poll = async () => {
      try {
        const res = await smsService.getSmsStatus(activationId);
        const { smsStatus, code } = res.data;

        if (smsStatus === 'OK' || smsStatus === 'CANCEL' || smsStatus === 'WAIT_RETRY') {
          // Refresh list if status changed significantly
          fetchPurchases(true);
          
          if (smsStatus === 'OK') {
            addToast(`OTP Received!`, 'success');
            delete pollingRef.current[dbId];
            return;
          }
          if (smsStatus === 'CANCEL') {
            delete pollingRef.current[dbId];
            return;
          }
        }
        
        // Re-schedule poll
        pollingRef.current[dbId] = setTimeout(poll, 10000);
      } catch (err) {
        console.error('Polling error', err);
        pollingRef.current[dbId] = setTimeout(poll, 15000);
      }
    };
    
    pollingRef.current[dbId] = setTimeout(poll, 5000);
  }, [addToast, fetchPurchases]);

  useEffect(() => {
    fetchPurchases();
    
    // Cleanup polling on unmount
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const currentPolling = pollingRef.current;
      Object.values(currentPolling).forEach(clearTimeout);
    };
  }, [fetchPurchases]);

  // Poll for status updates for any pending purchase
  useEffect(() => {
    purchases.forEach(p => {
      if (p.status === 'pending' && !pollingRef.current[p.id]) {
        startPolling(p.id, p.activation_id);
      }
    });
  }, [purchases, startPolling]);

  const handleCancel = async (activationId: number) => {
    if (!confirm('Are you sure you want to cancel this activation?')) return;
    
    try {
      await smsService.setActivationStatus(activationId, 8);
      addToast('Activation cancelled.', 'success');
      fetchPurchases(true);
    } catch (err: any) {
      addToast(err.message || 'Failed to cancel', 'error');
    }
  };

  const handleConfirm = async (activationId: number) => {
    try {
      await smsService.setActivationStatus(activationId, 6);
      addToast('Activation completed! Number confirmed.', 'success');
      fetchPurchases(true);
    } catch (err: any) {
      addToast(err.message || 'Failed to confirm', 'error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast('Copied to clipboard!', 'success');
  };

  return (
    <DashboardLayout>
      <Topbar title="Number History" />
      <main style={{ padding: '24px', maxWidth: 1100 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div className="breadcrumb" style={{ marginBottom: 0 }}>
            <Link href="/dashboard">Dashboard</Link>
            <span>/</span>
            <span>Number History</span>
          </div>
          <button 
            className="btn-ghost" 
            onClick={() => fetchPurchases()}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
          >
            <RiRefreshLine size={16} /> Refresh
          </button>
        </div>

        {loading ? (
          <PageLoader />
        ) : purchases.length === 0 ? (
          <EmptyHistory message="No numbers purchased yet" />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {purchases.map((item) => (
              <div key={item.id} className="stat-card" style={{ 
                position: 'relative', 
                border: item.status === 'pending' ? '1px solid var(--color-primary-dim)' : '1px solid var(--color-border)',
                transition: 'all 0.3s'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--color-primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                      {item.status === 'pending' ? (
                        <div className="spinner-small" style={{ width: 18, height: 18, border: '2px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                      ) : (
                        <RiHashtag size={22} />
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem' }}>{item.service_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)', fontWeight: 600 }}>{item.country_name}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                      background: item.status === 'received' || item.status === 'completed' ? 'rgba(16,185,129,0.1)' : (item.status === 'pending' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)'),
                      color: item.status === 'received' || item.status === 'completed' ? '#10B981' : (item.status === 'pending' ? '#F59E0B' : '#EF4444')
                    }}>
                      {item.status}
                    </span>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-faint)' }}>
                      ID: {item.activation_id}
                    </div>
                  </div>
                </div>

                <div style={{ 
                  background: 'var(--color-bg)', padding: '14px 16px', borderRadius: 12, marginBottom: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-faint)', marginBottom: 4, textTransform: 'uppercase' }}>Phone Number</div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '0.05em', color: 'var(--color-text)' }}>
                      {item.phone_number}
                    </div>
                  </div>
                  <button 
                    className="btn-ghost" 
                    onClick={() => copyToClipboard(item.phone_number)}
                    style={{ padding: 8, minWidth: 'auto' }}
                    title="Copy Phone Number"
                  >
                    <RiFileCopyLine size={18} />
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '44px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-faint)', fontSize: '0.8rem', fontWeight: 500 }}>
                    <RiTimeLine size={15} /> {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>

                  {item.otp_code ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ 
                        background: 'rgba(16,185,129,0.1)', color: '#10B981', padding: '6px 12px', borderRadius: 8,
                        display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: '1.1rem', fontFamily: 'monospace'
                      }}>
                        <RiMessage2Line size={18} /> {item.otp_code}
                      </div>
                      <button 
                        className="btn-ghost" 
                        onClick={() => copyToClipboard(item.otp_code)}
                        style={{ padding: 8, minWidth: 'auto', color: '#10B981' }}
                        title="Copy OTP"
                      >
                        <RiFileCopyLine size={18} />
                      </button>
                    </div>
                  ) : item.status === 'pending' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button 
                        className="btn-primary" 
                        onClick={() => handleConfirm(item.activation_id)}
                        style={{ padding: '6px 10px', fontSize: '0.8rem', gap: 4, background: '#10B981', borderColor: '#10B981', minWidth: 'auto' }}
                      >
                        Confirm
                      </button>
                      <button 
                        className="btn-ghost" 
                        onClick={() => handleCancel(item.activation_id)}
                        style={{ color: '#EF4444', padding: '6px 10px', fontSize: '0.8rem', gap: 4, minWidth: 'auto' }}
                      >
                        <RiCloseCircleLine size={16} /> Cancel
                      </button>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--color-text-faint)', fontSize: '0.82rem' }}>No code received</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </DashboardLayout>
  );
}
