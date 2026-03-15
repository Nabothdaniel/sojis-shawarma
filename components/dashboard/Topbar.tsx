'use client';

import React from 'react';
import Link from 'next/link';
import { RiMenu2Line, RiNotificationLine, RiUserLine, RiCoinLine } from 'react-icons/ri';
import { useAppStore } from '@/store/appStore';

export default function Topbar({ title }: { title?: string }) {
  const { toggleSidebar, user } = useAppStore();

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={toggleSidebar}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: 4 }}
          aria-label="Toggle sidebar"
        >
          <RiMenu2Line size={22} />
        </button>
        {title && (
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)' }}>
            {title}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Balance chip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 999,
          background: 'rgba(0,229,255,0.08)',
          border: '1px solid rgba(0,229,255,0.15)',
          fontSize: '0.8rem', fontWeight: 600,
          color: 'var(--color-primary)',
          fontFamily: 'var(--font-display)',
        }}>
          <RiCoinLine size={14} />
          ₦{user?.balance?.toLocaleString() ?? '0'}
        </div>

        {/* Notifications */}
        <button style={{
          width: 36, height: 36, borderRadius: 10, border: '1px solid var(--color-border)',
          background: 'none', cursor: 'pointer', color: 'var(--color-text-muted)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
        }}>
          <RiNotificationLine size={18} />
        </button>

        {/* Avatar */}
        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-primary), #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8rem', fontWeight: 700, color: '#000',
            fontFamily: 'var(--font-display)', cursor: 'pointer',
            boxShadow: '0 0 10px var(--color-primary-glow)',
          }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : <RiUserLine size={16} />}
          </div>
        </Link>
      </div>
    </header>
  );
}
