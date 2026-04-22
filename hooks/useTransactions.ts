'use client';

import { useEffect, useState } from 'react';
import { userService } from '@/lib/api';
import { Transaction } from '@/types';

export function useTransactions(filter?: (transaction: Transaction) => boolean) {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    let isMounted = true;

    userService
      .getTransactions()
      .then((response) => {
        if (!isMounted) return;

        const nextTransactions = filter ? response.data.filter(filter) : response.data;
        setTransactions(nextTransactions);
      })
      .catch((error) => console.error('Failed to fetch transactions', error))
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [filter]);

  return {
    loading,
    transactions,
  };
}
