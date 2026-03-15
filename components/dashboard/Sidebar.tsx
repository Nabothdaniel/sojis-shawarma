'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  RiDashboardLine, RiWalletLine, RiShoppingBag3Line,
  RiPhoneLine, RiGlobalLine, RiUserSharedLine,
  RiQuestionLine, RiHistoryLine, RiExchangeLine,
  RiLogoutBoxLine, RiSignalTowerFill,
} from 'react-icons/ri';
import { useAppStore } from '@/store/appStore';

const NAV_ITEMS = [
  { href: '/dashboard', icon: <RiDashboardLine size={18} />, label: 'Dashboard' },
  { href: '/dashboard/fund-wallet', icon: <RiWalletLine size={18} />, label: 'Fund Wallet' },
  { href: '/dashboard/buy-logs', icon: <RiShoppingBag3Line size={18} />, label: 'Buy Logs' },
  { href: '/dashboard/usa-numbers', icon: <RiPhoneLine size={18} />, label: 'USA Numbers' },
  { href: '/dashboard/all-countries', icon: <RiGlobalLine size={18} />, label: 'All Countries Numbers' },
  { href: '/dashboard/refer', icon: <RiUserSharedLine size={18} />, label: 'Refer & Earn' },
  { href: '/dashboard/faqs', icon: <RiQuestionLine size={18} />, label: 'FAQs' },
];

const HISTORY_ITEMS = [
  { href: '/dashboard/numbers-history', icon: <RiHistoryLine size={18} />, label: 'Numbers History' },
  { href: '/dashboard/transactions', icon: <RiExchangeLine size={18} />, label: 'Transaction History' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user, sidebarOpen } = useAppStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <aside className={`sidebar ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
      {/* Brand */}
      <div style={{
        padding: '20px 16px 16px',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg, var(--color-primary), #0EA5E9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 12px var(--color-primary-glow)',
        }}>
          <RiSignalTowerFill size={18} color="#000" />
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem' }}>
          bamzy<span style={{ color: 'var(--color-primary)' }}>SMS</span>
        </span>
      </div>

      {/* User info */}
      {user && (
        <div style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 10,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--color-border)',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--color-primary), #7C3AED)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.8rem', color: '#000',
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div className={`sidebar-item ${pathname === item.href ? 'active' : ''}`}>
                {item.icon}
                {item.label}
              </div>
            </Link>
          ))}
        </div>

        <div className="sidebar-group-label">History</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {HISTORY_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div className={`sidebar-item ${pathname === item.href ? 'active' : ''}`}>
                {item.icon}
                {item.label}
              </div>
            </Link>
          ))}
        </div>

        <div className="sidebar-group-label">Account</div>
        <button onClick={handleLogout} className="sidebar-item" style={{ color: '#EF4444' }}>
          <RiLogoutBoxLine size={18} />
          Logout
        </button>
      </nav>
    </aside>
  );
}
