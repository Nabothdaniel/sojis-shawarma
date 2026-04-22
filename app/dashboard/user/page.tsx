'use client';

import React, { useState } from 'react';
import DashboardPageShell from '@/components/dashboard/DashboardPageShell';
import WelcomeModal from '@/components/dashboard/WelcomeModal';
import { useAppStore } from '@/store/appStore';
import { userService } from '@/lib/api';
import PinModal from '@/components/ui/PinModal';
import SecurityBanner from '@/components/dashboard/home/SecurityBanner';
import StatsGrid from '@/components/dashboard/home/StatsGrid';
import RecentActivityPanels from '@/components/dashboard/home/RecentActivityPanels';
import { useDashboardOverview } from '@/hooks/useDashboardOverview';

export default function DashboardPage() {
  const { user, addToast, balanceHidden, setBalanceHidden, virtualAccounts } = useAppStore();
  const { recentPurchases, recentTransactions, telegramPurchases, refreshProfile } = useDashboardOverview();

  // PIN states
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);

  const handleSetPin = async (pin: string) => {
    setPinLoading(true);
    try {
      await userService.updatePin(pin);
      addToast('Transaction PIN set successfully!', 'success');
      setPinModalOpen(false);
      await refreshProfile();
    } catch (err: any) {
      addToast(err.message || 'Failed to set PIN', 'error');
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <DashboardPageShell
      title="Dashboard"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Home' },
      ]}
      maxWidth={1200}
      contentStyle={{ padding: '24px 20px', maxWidth: 1200, margin: '0 auto' }}
    >
      <WelcomeModal />
      {!user?.hasPin && (
        <SecurityBanner
          title="Secure Your account"
          description="Enhance your security and reveal hidden numbers by setting a 4-digit transaction PIN."
          actionLabel="Set PIN Now"
          onAction={() => setPinModalOpen(true)}
          gradient="linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)"
          actionColor="var(--color-primary)"
          shadow="0 10px 30px var(--color-primary-glow)"
        />
      )}

      {!user?.recovery_key_saved && (
        <SecurityBanner
          title="Unsaved Recovery Key"
          description="You haven't confirmed saving your recovery key. This is the only way to regain access if you forget your password."
          actionLabel="Secure Key Now"
          href="/dashboard/user/security"
          gradient="linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
          actionColor="#D97706"
          shadow="0 10px 30px rgba(245, 158, 11, 0.2)"
        />
      )}

      <StatsGrid
        user={user}
        balanceHidden={balanceHidden}
        setBalanceHidden={setBalanceHidden}
        virtualAccounts={virtualAccounts}
        recentPurchases={recentPurchases}
        recentTransactions={recentTransactions}
        telegramPurchases={telegramPurchases}
      />

      <RecentActivityPanels
        recentPurchases={recentPurchases}
        recentTransactions={recentTransactions}
      />

      <PinModal
        isOpen={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        onSuccess={handleSetPin}
        title="Set Transaction PIN"
        description="Create a secure 4-digit PIN to protect your account."
        isLoading={pinLoading}
      />

      <style>{`
        @media (max-width: 1100px) {
           .stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 900px) {
          .history-grid { grid-template-columns: 1fr !important; }
          .security-banner { flex-direction: column; align-items: flex-start !important; gap: 24px; padding: 24px !important; }
          .banner-btn { width: 100%; }
        }
        @media (max-width: 600px) {
          .stat-grid { grid-template-columns: 1fr !important; }
          .stat-card { padding: 20px !important; }
          .history-card { padding: 20px !important; }
          .v-account { font-size: 1.25rem !important; }
        }
        @media (max-width: 380px) {
          .v-account { font-size: 1.1rem !important; }
          .history-card { padding: 16px !important; }
          .stat-card { padding: 16px !important; }
        }
      `}</style>
    </DashboardPageShell>
  );
}
