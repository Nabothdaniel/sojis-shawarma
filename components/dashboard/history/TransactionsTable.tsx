'use client';

import React from 'react';
import { formatMoney } from '@/lib/utils';
import { Transaction } from '@/types';
import { RiExchangeFundsLine, RiTimeLine } from 'react-icons/ri';

interface TransactionsTableProps {
  transactions: Transaction[];
  variant?: 'all' | 'credits';
}

const thStyle: React.CSSProperties = {
  padding: '16px 24px',
  fontSize: '0.75rem',
  fontWeight: 800,
  color: 'var(--color-text-faint)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

export default function TransactionsTable({
  transactions,
  variant = 'all',
}: TransactionsTableProps) {
  if (variant === 'credits') {
    return (
      <>
        <div className="stat-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg-hover)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={thStyle}>Source / Description</th>
                <th style={thStyle}>Amount</th>
                <th style={thStyle}>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} style={{ borderBottom: '1px solid var(--color-border)' }} className="row-hover">
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{tx.description}</div>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        fontWeight: 900,
                        color: '#10B981',
                        background: 'rgba(16, 185, 129, 0.08)',
                        padding: '8px 16px',
                        borderRadius: '14px',
                        fontSize: '1rem',
                        border: '1.2px solid rgba(16, 185, 129, 0.2)',
                      }}
                    >
                      <RiExchangeFundsLine size={18} />
                      +{formatMoney(tx.amount)}
                    </div>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: '0.85rem',
                        color: 'var(--color-text-faint)',
                        fontWeight: 600,
                      }}
                    >
                      <RiTimeLine size={16} />
                      {new Date(tx.created_at).toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <style jsx>{`
          .row-hover:hover {
            background: var(--color-bg-hover);
          }
        `}</style>
      </>
    );
  }

  return (
    <div className="stat-card" style={{ padding: 0, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
            <th style={{ ...thStyle, padding: '16px 20px' }}>Type</th>
            <th style={{ ...thStyle, padding: '16px 20px' }}>Description</th>
            <th style={{ ...thStyle, padding: '16px 20px' }}>Amount</th>
            <th style={{ ...thStyle, padding: '16px 20px' }}>Date</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td style={{ padding: '16px 20px' }}>
                <span
                  style={{
                    padding: '6px 14px',
                    borderRadius: '12px',
                    fontSize: '0.68rem',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: tx.type === 'credit' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                    color: tx.type === 'credit' ? '#10B981' : '#EF4444',
                    border: `1.2px solid ${tx.type === 'credit' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                  }}
                >
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                  {tx.type}
                </span>
              </td>
              <td style={{ padding: '16px 20px', fontSize: '0.9rem', fontWeight: 500 }}>{tx.description}</td>
              <td style={{ padding: '16px 20px', fontSize: '0.95rem', fontWeight: 700 }}>
                {tx.type === 'credit' ? '+' : '-'}
                {formatMoney(tx.amount)}
              </td>
              <td style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--color-text-faint)' }}>
                {new Date(tx.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
