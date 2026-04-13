'use client';

import React from 'react';
import { RiMenu2Line, RiUserLine, RiNotificationLine } from 'react-icons/ri';
import { useAppStore } from '@/store/appStore';

interface AdminTopbarProps {
  title: string;
  onMenuClick?: () => void;
}

export default function AdminTopbar({ title, onMenuClick }: AdminTopbarProps) {
  const { user } = useAppStore();

  return (
    <header className="admin-topbar" style={{
      height: '70px',
      background: 'var(--color-bg-2)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      backdropFilter: 'blur(10px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button 
          className="mobile-menu-btn"
          onClick={onMenuClick}
          style={{
            width: 38, height: 38, borderRadius: 10, border: '1px solid var(--color-border)',
            background: 'none', cursor: 'pointer', color: 'var(--color-text)',
            display: 'none', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <RiMenu2Line size={20} />
        </button>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>{title}</h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button className="nav-icon-btn" style={{
          width: 38, height: 38, borderRadius: 10, border: '1px solid var(--color-border)',
          background: 'none', cursor: 'pointer', color: 'var(--color-text-muted)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <RiNotificationLine size={18} />
        </button>

        <div className="user-profile-section" style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 16, borderLeft: '1px solid var(--color-border)' }}>
          <div className="user-info-text" style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>{user?.name || 'Admin'}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Super Admin</div>
          </div>
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'var(--color-primary-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-primary)', border: '1px solid var(--color-primary-dim)'
          }}>
            <RiUserLine size={20} />
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 1024px) {
          .admin-topbar {
            padding: 0 16px !important;
          }
          .mobile-menu-btn {
            display: flex !important;
          }
          .user-info-text {
            display: none !important;
          }
          .user-profile-section {
            padding-left: 0 !important;
            border-left: none !important;
          }
        }
      `}</style>
    </header>
  );
}
