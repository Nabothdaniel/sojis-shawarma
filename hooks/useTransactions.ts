'use client';

import { useQuery } from '@tanstack/react-query';
import { userService } from '@/lib/api';
import { Transaction } from '@/types';

export function useTransactions(filter?: (transaction: Transaction) => boolean) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => userService.getTransactions(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const transactions = data?.data || [];
  const filteredTransactions = filter ? transactions.filter(filter) : transactions;

  return {
    loading: isLoading,
    transactions: filteredTransactions,
    error,
  };
}
