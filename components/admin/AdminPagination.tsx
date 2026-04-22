'use client';

import React from 'react';
import { RiArrowLeftSLine, RiArrowRightSLine, RiArrowLeftDoubleLine, RiArrowRightDoubleLine } from 'react-icons/ri';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export default function AdminPagination({ 
  currentPage, 
  totalPages, 
  totalItems, 
  limit, 
  onPageChange 
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startIdx = (currentPage - 1) * limit + 1;
  const endIdx = Math.min(currentPage * limit, totalItems);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const showMax = 5;
    
    if (totalPages <= showMax) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, start + showMax - 1);
      
      if (end === totalPages) {
        start = Math.max(1, end - showMax + 1);
      }
      
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '24px 32px',
      borderTop: '1px solid var(--color-border)',
      background: 'var(--color-bg-2)',
    }}>
      <div style={{ color: 'var(--color-text-faint)', fontSize: '0.85rem', fontWeight: 500 }}>
        Showing <span style={{ color: 'var(--color-text)', fontWeight: 700 }}>{startIdx}</span> to <span style={{ color: 'var(--color-text)', fontWeight: 700 }}>{endIdx}</span> of <span style={{ color: 'var(--color-text)', fontWeight: 700 }}>{totalItems}</span> entries
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          style={btnStyle(currentPage === 1)}
          title="First Page"
        >
          <RiArrowLeftDoubleLine size={20} />
        </button>

        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={btnStyle(currentPage === 1)}
          title="Previous Page"
        >
          <RiArrowLeftSLine size={20} />
        </button>

        {getPageNumbers().map(p => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            style={p === currentPage ? activeBtnStyle : numBtnStyle}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={btnStyle(currentPage === totalPages)}
          title="Next Page"
        >
          <RiArrowRightSLine size={20} />
        </button>

        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          style={btnStyle(currentPage === totalPages)}
          title="Last Page"
        >
          <RiArrowRightDoubleLine size={20} />
        </button>
      </div>
    </div>
  );
}

const btnStyle = (disabled: boolean): React.CSSProperties => ({
  width: 38,
  height: 38,
  borderRadius: 10,
  border: '1px solid var(--color-border)',
  background: disabled ? 'transparent' : 'var(--color-bg-hover)',
  color: disabled ? 'var(--color-text-faint)' : 'var(--color-text)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'all 0.2s',
  opacity: disabled ? 0.5 : 1,
});

const numBtnStyle: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 10,
  border: '1px solid var(--color-border)',
  background: 'transparent',
  color: 'var(--color-text-muted)',
  fontWeight: 600,
  fontSize: '0.9rem',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

const activeBtnStyle: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 10,
  border: '1px solid var(--color-primary)',
  background: 'var(--color-primary)',
  color: '#fff',
  fontWeight: 700,
  fontSize: '0.9rem',
  cursor: 'default',
  boxShadow: '0 4px 12px rgba(var(--color-primary-rgb), 0.3)',
};
