'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  RiMenu2Line, RiNotificationLine,
  RiCoinLine, RiUserSettingsLine, RiShoppingCartLine, RiLogoutBoxLine,
  RiSignalTowerFill, RiEyeLine, RiEyeOffLine,
} from 'react-icons/ri';
import { useAppStore } from '@/store/appStore';
import UserAvatar from '@/components/ui/UserAvatar';
import { formatMoney } from '@/lib/utils';
import NotificationDropdown from '@/components/dashboard/NotificationDropdown';

export default function Topbar({ title }: { title?: string }) {
  const { toggleSidebar, user, logout, balanceHidden, setBalanceHidden } = useAppStore();
  const router = useRouter();
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    setDropOpen(false);
    logout();
    router.push('/login');
  };

  return (
    <header className="topbar">
      {/* Left — hamburger */}
      <button
        onClick={toggleSidebar}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: 6, borderRadius: 8 }}
        aria-label="Toggle sidebar"
      >
        <RiMenu2Line size={22} />
      </button>

      {/* Center — logo on mobile, title on desktop */}
      <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
        {/* Logo shown on mobile */}
        <div className="topbar-logo">
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <RiSignalTowerFill size={14} color="#fff" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.95rem' }}>
            bamzy<span style={{ color: 'var(--color-primary)' }}>SMS</span>
          </span>
        </div>
        {/* Title shown on desktop */}
        {title && (
          <span className="topbar-title" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)' }}>
            {title}
          </span>
        )}
      </div>

      {/* Right — balance + notifications + avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Balance chip — hide on very small screens or if user is admin */}
        {user?.role !== 'admin' && (
          <div className="balance-chip" style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 8px 5px 12px', borderRadius: 12,
            background: 'var(--color-primary-dim)',
            border: '1px solid var(--color-primary-glow)',
            fontSize: '0.82rem', fontWeight: 700,
            color: 'var(--color-primary)',
            fontFamily: 'var(--font-display)',
          }}>
            <RiCoinLine size={14} style={{ opacity: 0.8 }} />
            <span style={{ minWidth: balanceHidden ? '60px' : 'auto', transition: 'all 0.2s' }}>
              {balanceHidden ? '••••••' : formatMoney(user?.balance)}
            </span>
            <button
              onClick={() => setBalanceHidden(!balanceHidden)}
              style={{
                background: 'none', border: 'none', padding: 4, cursor: 'pointer',
                color: 'var(--color-primary)', display: 'flex', alignItems: 'center',
                opacity: 0.6, transition: 'opacity 0.15s', marginLeft: 4
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.6')}
              title={balanceHidden ? "Show balance" : "Hide balance"}
            >
              {balanceHidden ? <RiEyeLine size={14} /> : <RiEyeOffLine size={14} />}
            </button>
          </div>
        )}

        {/* Notifications */}
        <NotificationDropdown />

        {/* Avatar + Dropdown */}
        <div ref={dropRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setDropOpen(!dropOpen)}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              border: dropOpen ? '2px solid var(--color-primary)' : '2px solid transparent',
              boxShadow: '0 0 10px var(--color-primary-glow)',
              transition: 'all 0.2s', flexShrink: 0,
              padding: 0,
              background: 'none'
            }}
            aria-label="User menu"
          >
            <UserAvatar seed={user?.username || user?.name || 'user'} size={32} style={{ border: 'none' }} />
          </button>

          {dropOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 10px)', right: 0,
              minWidth: 210, zIndex: 200,
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
              overflow: 'hidden',
              animation: 'fadeUp 0.15s ease',
            }}>
              {/* User info */}
              <div style={{
                padding: '12px 14px',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <UserAvatar seed={user?.username || user?.name || 'user'} size={36} />
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.name ?? 'User'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    @{user?.username}
                  </div>
                </div>
              </div>

              <div style={{ padding: '6px' }}>
                {[
                  { icon: <RiUserSettingsLine size={15} />, label: 'Profile', href: '/dashboard/user/profile' },
                  { icon: <RiShoppingCartLine size={15} />, label: 'Buy Numbers', href: '/dashboard/user/usa-numbers' },
                ].map((item) => (
                  <Link key={item.label} href={item.href} style={{ textDecoration: 'none' }}
                    onClick={() => setDropOpen(false)}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
                      color: 'var(--color-text-muted)', fontSize: '0.85rem',
                      transition: 'all 0.15s',
                    }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                        (e.currentTarget as HTMLElement).style.color = 'var(--color-text)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                        (e.currentTarget as HTMLElement).style.color = 'var(--color-text-muted)';
                      }}
                    >
                      {item.icon}{item.label}
                    </div>
                  </Link>
                ))}

                <div style={{ height: 1, background: 'var(--color-border)', margin: '4px 0' }} />

                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
                    color: '#EF4444', fontSize: '0.85rem', background: 'none', border: 'none',
                    transition: 'background 0.15s', textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <RiLogoutBoxLine size={15} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .topbar { position: relative; }
        .topbar-logo { display: none; align-items: center; gap: 7px; }
        .topbar-title { display: block; }
        @media (max-width: 640px) {
          .topbar-logo { display: flex !important; }
          .topbar-title { display: none !important; }
          .balance-chip { display: none !important; }
        }
      `}</style>
    </header>
  );
}
