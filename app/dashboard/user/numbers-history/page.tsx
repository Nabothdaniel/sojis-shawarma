'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Topbar from '@/components/dashboard/Topbar';
import EmptyHistory from '@/components/dashboard/EmptyHistory';
import PageLoader from '@/components/ui/PageLoader';
import { smsService } from '@/lib/api';
import { RiRefreshLine, RiInformationLine } from 'react-icons/ri';
import { useAppStore } from '@/store/appStore';
import PinModal from '@/components/ui/PinModal';
import HistoryViewSwitcher from '@/components/dashboard/history/HistoryViewSwitcher';
import HistorySkeleton from '@/components/dashboard/history/HistorySkeleton';
import HistoryTable from '@/components/dashboard/history/HistoryTable';
import HistoryGrid from '@/components/dashboard/history/HistoryGrid';
import TutorialBanner from '@/components/dashboard/TutorialBanner';

const NOTIFICATION_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
const PAGE_SIZE = 12;

export default function NumbersHistoryPage() {
  const { addToast } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Pagination / Infinite Scroll States
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [revealLoading, setRevealLoading] = useState(false);
  const [revealTarget, setRevealTarget] = useState<number | null>(null);
  const [revealedData, setRevealedData] = useState<{ [key: number]: { phone: string; otp: string } }>({});

  const pollingRef = useRef<{ [key: number]: NodeJS.Timeout }>({});

  const fetchHistory = useCallback(async (isLoadMore = false, newOffset = 0, silent = false) => {
    if (!silent && !isLoadMore) setLoading(true);
    if (isLoadMore) setIsLoadingMore(true);

    try {
      const res = await smsService.getPurchases(PAGE_SIZE, newOffset);
      if (isLoadMore) {
        setItems(prev => [...prev, ...res.data]);
      } else {
        setItems(res.data);
      }
      setTotal(res.meta.total);
      setHasMore(res.meta.hasMore);
      setOffset(newOffset);
    } catch (err) {
      console.error('Failed to fetch history', err);
      addToast('Failed to load history', 'error');
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [addToast]);

  const startPolling = useCallback((dbId: number, activationId: number) => {
    const poll = async () => {
      try {
        const res = await smsService.getSmsStatus(activationId);
        const { smsStatus } = res.data;

        if (smsStatus === 'OK' || smsStatus === 'CANCEL' || smsStatus === 'WAIT_RETRY') {
          // Refresh list if status changed
          fetchHistory(false, 0, true);

          if (smsStatus === 'OK') {
            addToast(`OTP Received!`, 'success');
            new Audio(NOTIFICATION_SOUND).play().catch(() => { });
            delete pollingRef.current[dbId];
            return;
          }
          if (smsStatus === 'CANCEL') {
            delete pollingRef.current[dbId];
            return;
          }
        }
        pollingRef.current[dbId] = setTimeout(poll, 10000);
      } catch (err) {
        pollingRef.current[dbId] = setTimeout(poll, 15000);
      }
    };
    pollingRef.current[dbId] = setTimeout(poll, 5000);
  }, [addToast, fetchHistory]);

  useEffect(() => {
    fetchHistory();
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      Object.values(pollingRef.current).forEach(clearTimeout);
    };
  }, [fetchHistory]);

  // Handle active status polling
  useEffect(() => {
    items.forEach(p => {
      if (p.status === 'pending' && !pollingRef.current[p.id]) {
        startPolling(p.id, p.activation_id);
      }
    });
  }, [items, startPolling]);

  const handleRevealClick = async (dbId: number) => {
    setRevealTarget(dbId);
    await revealDirectly(dbId);
  };
    
  const revealDirectly = async (dbId: number) => {
    setRevealLoading(true);
    try {
      const res = await smsService.revealPlainNumber(dbId);
      setRevealedData(prev => ({
        ...prev,
        [dbId]: { phone: res.data.phoneNumber, otp: res.data.otpCode }
      }));
    } catch (err: any) {
      addToast(err.message || 'Failed to reveal information', 'error');
    } finally {
      setRevealLoading(false);
      setRevealTarget(null);
    }
  };



  const handleUnreveal = (dbId: number) => {
    setRevealedData(prev => {
      const next = { ...prev };
      delete next[dbId];
      return next;
    });
  };

  const handleHide = async (id: number) => {
    if (!confirm('Hide this from your history?')) return;
    try {
      await smsService.hidePurchase(id);
      setItems(prev => prev.filter(item => item.id !== id));
      addToast('Removed from history', 'success');
    } catch (err) {
      addToast('Failed to hide', 'error');
    }
  };

  const handleCancel = async (activationId: number) => {
    if (!confirm('Cancel this activation?')) return;
    try {
      await smsService.setActivationStatus(activationId, 8);
      fetchHistory(false, 0, true);
      addToast('Cancelled', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed', 'error');
    }
  };

  const handleConfirm = async (activationId: number) => {
    try {
      await smsService.setActivationStatus(activationId, 6);
      fetchHistory(false, 0, true);
      addToast('Confirmed', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed', 'error');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast('Copied!', 'success');
  };

  return (
    <DashboardLayout>
      <Topbar title="Number History" />
      <main style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div className="breadcrumb" style={{ marginBottom: 0 }}>
            <Link href="/dashboard">Dashboard</Link>
            <span>/</span>
            <span>Number History</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <HistoryViewSwitcher view={viewMode} onChange={(v) => {
              setViewMode(v);
              fetchHistory(false, 0); // Reset to page 1 on view change
            }} />
            <button className="btn-ghost" onClick={() => fetchHistory(false, 0)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
              <RiRefreshLine size={16} /> Refresh
            </button>
          </div>
        </div>

        <TutorialBanner />


        {loading ? (
          <HistorySkeleton view={viewMode} />
        ) : items.length === 0 ? (
          <EmptyHistory message="No history found" />
        ) : viewMode === 'table' ? (
          <HistoryTable
            items={items}
            onReveal={handleRevealClick}
            onUnreveal={handleUnreveal}
            onHide={handleHide}
            onCopy={handleCopy}
            revealedData={revealedData}
            pagination={{
              total,
              limit: PAGE_SIZE,
              offset,
              onPageChange: (newOffset) => fetchHistory(false, newOffset)
            }}
          />
        ) : (
          <HistoryGrid
            items={items}
            onReveal={handleRevealClick}
            onUnreveal={handleUnreveal}
            onHide={handleHide}
            onCopy={handleCopy}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            revealedData={revealedData}
            hasMore={hasMore}
            onLoadMore={() => fetchHistory(true, offset + PAGE_SIZE)}
            isLoadingMore={isLoadingMore}
          />
        )}
      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .pulse-border { animation: pulseBorder 2s infinite; }
        @keyframes pulseBorder { 
          0% { border-color: var(--color-primary); } 
          50% { border-color: rgba(0, 229, 255, 0.4); } 
          100% { border-color: var(--color-primary); } 
        }
        .skeleton-line {
          background: linear-gradient(90deg, var(--color-bg-2) 25%, var(--color-border) 50%, var(--color-bg-2) 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
          border-radius: 4px;
        }
        @keyframes skeleton-loading { from { background-position: 200% 0; } to { background-position: -200% 0; } }
      `}</style>
    </DashboardLayout>
  );
}
