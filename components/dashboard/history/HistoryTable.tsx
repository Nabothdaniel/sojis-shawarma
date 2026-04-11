'use client';

import React from 'react';
import { RiFileCopyLine, RiEyeLine, RiDeleteBinLine, RiArrowLeftSLine, RiArrowRightSLine } from 'react-icons/ri';
import Tooltip from '@/components/ui/Tooltip';

interface HistoryTableProps {
  items: any[];
  onReveal: (id: number) => void;
  onHide: (id: number) => void;
  onCopy: (text: string) => void;
  revealedData: { [key: number]: { phone: string; otp: string } };
  pagination: {
    total: number;
    limit: number;
    offset: number;
    onPageChange: (newOffset: number) => void;
  };
}

export default function HistoryTable({ items, onReveal, onHide, onCopy, revealedData, pagination }: HistoryTableProps) {
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="stat-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--color-bg-2)', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '16px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-faint)' }}>SERVICE</th>
              <th style={{ padding: '16px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-faint)' }}>COUNTRY</th>
              <th style={{ padding: '16px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-faint)' }}>NUMBER</th>
              <th style={{ padding: '16px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-faint)' }}>OTP</th>
              <th style={{ padding: '16px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-faint)' }}>STATUS</th>
              <th style={{ padding: '16px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-faint)', textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)', fontSize: '0.9rem' }}>
                <td style={{ padding: '16px', fontWeight: 600 }}>{item.service_name}</td>
                <td style={{ padding: '16px', color: 'var(--color-text-muted)' }}>{item.country_name}</td>
                <td style={{ padding: '16px', fontFamily: 'monospace', fontWeight: 700 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {revealedData[item.id]?.phone || item.phone_number}
                    {revealedData[item.id] ? (
                      <button onClick={() => onCopy(revealedData[item.id].phone)} className="btn-ghost" style={{ padding: 4, minWidth: 'auto' }}>
                        <RiFileCopyLine size={14} />
                      </button>
                    ) : (
                      <button onClick={() => onReveal(item.id)} className="btn-ghost" style={{ padding: 4, minWidth: 'auto', color: 'var(--color-primary)' }}>
                        <RiEyeLine size={14} />
                      </button>
                    )}
                  </div>
                </td>
                <td style={{ padding: '16px' }}>
                  {item.otp_code || revealedData[item.id]?.otp ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10B981', fontWeight: 700, fontFamily: 'monospace' }}>
                      {revealedData[item.id]?.otp || item.otp_code}
                      <button onClick={() => onCopy(revealedData[item.id]?.otp || item.otp_code)} className="btn-ghost" style={{ padding: 4, minWidth: 'auto', color: '#10B981' }}>
                        <RiFileCopyLine size={14} />
                      </button>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--color-text-faint)', fontSize: '0.8rem' }}>Waiting...</span>
                  )}
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700,
                    background: item.status === 'received' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                    color: item.status === 'received' ? '#10B981' : '#F59E0B',
                    textTransform: 'uppercase'
                  }}>
                    {item.status}
                  </span>
                </td>
                <td style={{ padding: '16px', textAlign: 'right' }}>
                  <Tooltip content="Remove from history">
                    <button onClick={() => onHide(item.id)} className="btn-ghost" style={{ color: '#EF4444', padding: 8, minWidth: 'auto' }}>
                      <RiDeleteBinLine size={18} />
                    </button>
                  </Tooltip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div style={{ 
        padding: '16px 24px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: 'var(--color-bg-2)',
        borderTop: '1px solid var(--color-border)'
      }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-faint)' }}>
          Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({pagination.total} results)
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            disabled={currentPage === 1}
            onClick={() => pagination.onPageChange(pagination.offset - pagination.limit)}
            className="btn-ghost"
            style={{ padding: '8px 12px', minWidth: 'auto', gap: 4 }}
          >
            <RiArrowLeftSLine size={20} /> Prev
          </button>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => pagination.onPageChange(pagination.offset + pagination.limit)}
            className="btn-ghost"
            style={{ padding: '8px 12px', minWidth: 'auto', gap: 4 }}
          >
            Next <RiArrowRightSLine size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
