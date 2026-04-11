'use client';

import React from 'react';
import { RiLayoutGridLine, RiListCheck2 } from 'react-icons/ri';

interface HistoryViewSwitcherProps {
  view: 'grid' | 'table';
  onChange: (view: 'grid' | 'table') => void;
}

export default function HistoryViewSwitcher({ view, onChange }: HistoryViewSwitcherProps) {
  return (
    <div style={{ 
      display: 'flex', 
      background: 'var(--color-bg-2)', 
      padding: '4px', 
      borderRadius: '10px',
      border: '1px solid var(--color-border)',
      gap: '4px'
    }}>
      <button
        onClick={() => onChange('grid')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer',
          fontSize: '0.85rem',
          fontWeight: 600,
          background: view === 'grid' ? 'var(--color-primary)' : 'transparent',
          color: view === 'grid' ? '#fff' : 'var(--color-text-muted)',
          transition: 'all 0.2s',
        }}
      >
        <RiLayoutGridLine size={18} />
        Cards
      </button>
      <button
        onClick={() => onChange('table')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer',
          fontSize: '0.85rem',
          fontWeight: 600,
          background: view === 'table' ? 'var(--color-primary)' : 'transparent',
          color: view === 'table' ? '#fff' : 'var(--color-text-muted)',
          transition: 'all 0.2s',
        }}
      >
        <RiListCheck2 size={18} />
        Table
      </button>
    </div>
  );
}
