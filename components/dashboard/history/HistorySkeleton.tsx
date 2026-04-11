'use client';

import React from 'react';

export function CardSkeleton() {
  return (
    <div className="stat-card skeleton-container" style={{ minHeight: '200px' }}>
      <div className="skeleton-line" style={{ width: '40%', height: '24px', marginBottom: '16px' }} />
      <div className="skeleton-line" style={{ width: '100%', height: '48px', marginBottom: '16px', borderRadius: '12px' }} />
      <div className="skeleton-line" style={{ width: '60%', height: '18px' }} />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr>
      {Array(5).fill(0).map((_, i) => (
        <td key={i} style={{ padding: '16px' }}>
          <div className="skeleton-line" style={{ width: '80%', height: '16px' }} />
        </td>
      ))}
    </tr>
  );
}

export default function HistorySkeleton({ view, count = 6 }: { view: 'grid' | 'table', count?: number }) {
  if (view === 'table') {
    return (
      <div className="stat-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {Array(count).fill(0).map((_, i) => <TableRowSkeleton key={i} />)}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
      {Array(count).fill(0).map((_, i) => <CardSkeleton key={i} />)}
    </div>
  );
}
