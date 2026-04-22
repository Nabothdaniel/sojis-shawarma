'use client';

import React from 'react';
import Link from 'next/link';
import {
  RiAddLine,
  RiBankLine,
  RiEyeLine,
  RiEyeOffLine,
  RiHistoryLine,
  RiShoppingCartLine,
  RiWalletLine,
} from 'react-icons/ri';
import { formatMoney } from '@/lib/utils';
import { SmsPurchase, TelegramNumber, Transaction, User, VirtualAccount } from '@/types';

interface StatsGridProps {
  user: User | null;
  balanceHidden: boolean;
  setBalanceHidden: (hidden: boolean) => void;
  virtualAccounts: VirtualAccount[];
  recentPurchases: SmsPurchase[];
  recentTransactions: Transaction[];
  telegramPurchases: TelegramNumber[];
}

export default function StatsGrid({
  user,
  balanceHidden,
  setBalanceHidden,
  virtualAccounts,
  recentPurchases,
  recentTransactions,
  telegramPurchases,
}: StatsGridProps) {
  const totalTopup = recentTransactions
    .filter((transaction) => transaction.type === 'credit')
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  return (
    <div
      className="stat-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 20,
        marginBottom: 32,
      }}
    >
      <div
        className="stat-card premium-card"
        style={{
          background: 'var(--color-bg-2)',
          border: '1px solid var(--color-border)',
          padding: '24px',
          borderRadius: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'var(--color-primary-dim)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RiWalletLine size={24} />
          </div>
          <Link href="/dashboard/user/fund-wallet">
            <button className="btn-primary" style={{ padding: '8px 12px', fontSize: '0.75rem', borderRadius: 8, height: 'auto' }}>
              <RiAddLine size={14} /> Recharge
            </button>
          </Link>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div
              style={{
                color: 'var(--color-text-faint)',
                fontSize: '0.8rem',
                fontWeight: 700,
                marginBottom: 4,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Wallet Balance
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', color: 'var(--color-text)' }}>
              {balanceHidden ? '••••••' : formatMoney(user?.balance)}
            </div>
          </div>
          <button
            onClick={() => setBalanceHidden(!balanceHidden)}
            style={{
              background: 'none',
              border: 'none',
              padding: 8,
              cursor: 'pointer',
              color: 'var(--color-text-faint)',
              display: 'flex',
              alignItems: 'center',
              opacity: 0.5,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.5')}
            title={balanceHidden ? 'Show balance' : 'Hide balance'}
          >
            {balanceHidden ? <RiEyeLine size={20} /> : <RiEyeOffLine size={20} />}
          </button>
        </div>
      </div>

      <div
        className="stat-card"
        style={{
          background: 'var(--color-bg-2)',
          border: '1px solid var(--color-border)',
          padding: '24px',
          borderRadius: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'rgba(16,185,129,0.1)',
            color: '#10B981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <RiBankLine size={24} />
        </div>
        <div>
          <div
            style={{
              color: 'var(--color-text-faint)',
              fontSize: '0.8rem',
              fontWeight: 700,
              marginBottom: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Virtual Account
          </div>
          <div className="v-account" style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.4rem', color: 'var(--color-text)', letterSpacing: '0.05em' }}>
            {virtualAccounts[0] ? virtualAccounts[0].accountNumber : user?.phone ? `0${user.phone.slice(-9)}` : 'Generating...'}
          </div>
        </div>
      </div>

      <div
        className="stat-card"
        style={{
          background: 'var(--color-bg-2)',
          border: '1px solid var(--color-border)',
          padding: '24px',
          borderRadius: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'rgba(245,158,11,0.1)',
            color: '#F59E0B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <RiShoppingCartLine size={24} />
        </div>
        <div>
          <div
            style={{
              color: 'var(--color-text-faint)',
              fontSize: '0.8rem',
              fontWeight: 700,
              marginBottom: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Numbers Ready
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem' }}>
            {recentPurchases.filter((purchase) => purchase.status === 'received').length + telegramPurchases.length}
          </div>
        </div>
      </div>

      <div
        className="stat-card"
        style={{
          background: 'var(--color-bg-2)',
          border: '1px solid var(--color-border)',
          padding: '24px',
          borderRadius: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'var(--color-primary-dim)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <RiHistoryLine size={24} />
        </div>
        <div>
          <div
            style={{
              color: 'var(--color-text-faint)',
              fontSize: '0.8rem',
              fontWeight: 700,
              marginBottom: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Total Top-up
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem' }}>{formatMoney(totalTopup)}</div>
        </div>
      </div>
    </div>
  );
}
