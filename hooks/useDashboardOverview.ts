'use client';

import { useCallback, useEffect, useState } from 'react';
import { paymentService, smsService, userService } from '@/lib/api';
import { manualNumberService } from '@/lib/api/manual-number.service';
import { SmsPurchase, TelegramNumber, Transaction } from '@/types';
import { useAppStore } from '@/store/appStore';

export function useDashboardOverview() {
  const { setUser, virtualAccounts, setVirtualAccounts } = useAppStore();
  const [recentPurchases, setRecentPurchases] = useState<SmsPurchase[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [telegramPurchases, setTelegramPurchases] = useState<TelegramNumber[]>([]);

  const refreshProfile = useCallback(async () => {
    const response = await userService.getProfile();
    setUser(response.data);
    return response.data;
  }, [setUser]);

  useEffect(() => {
    refreshProfile().catch((error) => console.error('Failed to fetch profile', error));

    smsService
      .getPurchases()
      .then((response) => {
        setRecentPurchases(response?.data?.slice(0, 5) || []);
      })
      .catch((error) => console.error('Failed to fetch purchases', error));

    userService
      .getTransactions()
      .then((response) => {
        setRecentTransactions(response?.data?.slice(0, 5) || []);
      })
      .catch((error) => console.error('Failed to fetch transactions', error));

    manualNumberService
      .getMyTelegramNumbers()
      .then((response) => {
        setTelegramPurchases(response?.data || []);
      })
      .catch((error) => console.error('Failed to fetch Telegram purchases', error));

    if (virtualAccounts.length === 0) {
      paymentService
        .getVirtualAccount()
        .then((response) => {
          if (response.status === 'success' && response.bankAccounts?.length > 0) {
            const sortedAccounts = [...response.bankAccounts].sort((a, b) => a.bankName.localeCompare(b.bankName));
            setVirtualAccounts(sortedAccounts);
          }
        })
        .catch((error) => console.error('Failed to fetch virtual account', error));
    }
  }, [refreshProfile, setVirtualAccounts, virtualAccounts.length]);

  return {
    recentPurchases,
    recentTransactions,
    telegramPurchases,
    refreshProfile,
  };
}
