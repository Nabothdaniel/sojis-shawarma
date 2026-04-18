'use client';

import React, { useEffect, useRef } from 'react';
import { 
  RiHashtag, RiMessage2Line, RiTimeLine, 
  RiFileCopyLine, RiCloseCircleLine, RiRefreshLine,
  RiEyeLine, RiEyeOffLine, RiInformationLine, RiDeleteBinLine
} from 'react-icons/ri';
import Tooltip from '@/components/ui/Tooltip';
import { CardSkeleton } from './HistorySkeleton';

interface HistoryGridProps {
  items: any[];
  onReveal: (id: number) => void;
  onUnreveal: (id: number) => void;
  onHide: (id: number) => void;
  onCopy: (text: string) => void;
  onConfirm: (activationId: number) => void;
  onCancel: (activationId: number) => void;
  revealedData: { [key: number]: { phone: string; otp: string } };
  hasMore: boolean;
  onLoadMore: () => void;
  isLoadingMore: boolean;
}

export default function HistoryGrid({ 
  items, onReveal, onUnreveal, onHide, onCopy, onConfirm, onCancel, 
  revealedData, hasMore, onLoadMore, isLoadingMore 
}: HistoryGridProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
        onLoadMore();
      }
    });

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasMore, isLoadingMore, onLoadMore]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {items.map((item) => (
          <div 
            key={item.id} 
            className={`stat-card ${item.status === 'received' ? 'pulse-border' : ''}`} 
            style={{ 
              position: 'relative', 
              border: item.status === 'pending' ? '1px solid var(--color-primary-dim)' : (item.status === 'received' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)'),
              transition: 'all 0.3s',
              boxShadow: item.status === 'received' ? '0 0 15px rgba(0, 229, 255, 0.2)' : 'none'
            }}
          >
            {/* Close Button */}
            <button 
              onClick={() => onHide(item.id)}
              style={{
                position: 'absolute', top: 12, right: 12, border: 'none', background: 'none',
                cursor: 'pointer', color: 'var(--color-text-faint)', padding: 4, zIndex: 10
              }}
              title="Close/Hide"
            >
              <RiCloseCircleLine size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingRight: 24 }}>
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
              </div>
            </div>

            <div style={{ 
              background: 'var(--color-bg)', padding: '14px 16px', borderRadius: 12, marginBottom: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-faint)', textTransform: 'uppercase' }}>Phone Number</div>
                </div>
                <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '0.05em', color: 'var(--color-text)' }}>
                  {revealedData[item.id]?.phone || item.phone_number}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {revealedData[item.id] ? (
                  <button 
                    onClick={() => onUnreveal(item.id)} 
                    className="btn-ghost" 
                    style={{ 
                      padding: 8, 
                      minWidth: 'auto', 
                      background: 'rgba(55, 65, 81, 0.1)', // Neutral dark
                      color: 'var(--color-text-muted)',
                      borderRadius: 12
                    }}
                    title="Hide details"
                  >
                    <RiEyeOffLine size={18} />
                  </button>
                ) : (
                  <button 
                    onClick={() => onReveal(item.id)} 
                    className="btn-ghost" 
                    style={{ 
                      padding: 8, 
                      minWidth: 'auto', 
                      background: 'var(--color-primary-dim)', 
                      color: 'var(--color-primary)',
                      borderRadius: 12
                    }}
                    title="Reveal details"
                  >
                    <RiEyeLine size={18} />
                  </button>
                )}
                <button 
                  className="btn-ghost" 
                  onClick={() => onCopy(revealedData[item.id]?.phone || item.phone_number)}
                  disabled={!revealedData[item.id]}
                  style={{ padding: 8, minWidth: 'auto', opacity: revealedData[item.id] ? 1 : 0.3 }}
                >
                  <RiFileCopyLine size={18} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '44px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-faint)', fontSize: '0.8rem', fontWeight: 500 }}>
                <RiTimeLine size={15} /> {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>

              {item.otp_code || revealedData[item.id]?.otp ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ 
                    background: 'rgba(16,185,129,0.1)', color: '#10B981', padding: '6px 12px', borderRadius: 8,
                    display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: '1.1rem', fontFamily: 'monospace'
                  }}>
                    <RiMessage2Line size={18} /> {revealedData[item.id]?.otp || item.otp_code}
                  </div>
                  <button 
                    className="btn-ghost" 
                    onClick={() => onCopy(revealedData[item.id]?.otp || item.otp_code)}
                    disabled={!revealedData[item.id]}
                    style={{ padding: 8, minWidth: 'auto', color: '#10B981', opacity: revealedData[item.id] ? 1 : 0.3 }}
                  >
                    <RiFileCopyLine size={18} />
                  </button>
                </div>
              ) : item.status === 'pending' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button 
                    className="btn-primary" 
                    onClick={() => onConfirm(item.activation_id)}
                    style={{ padding: '6px 12px', fontSize: '0.85rem', background: '#10B981', borderColor: '#10B981', minWidth: 'auto', fontWeight: 700 }}
                  >
                    Confirm
                  </button>
                  <button 
                    className="btn-ghost" 
                    onClick={() => onCancel(item.activation_id)}
                    style={{ color: '#EF4444', padding: '6px 10px', fontSize: '0.8rem', minWidth: 'auto' }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div style={{ color: 'var(--color-text-faint)', fontSize: '0.82rem' }}>No code received</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Infinite Scroll Trigger */}
      {hasMore && (
        <div ref={loadMoreRef} style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
          {isLoadingMore ? <div className="spinner-small" /> : <div style={{ height: '20px' }} />}
        </div>
      )}
    </div>
  );
}
