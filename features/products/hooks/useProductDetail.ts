'use client';

import { useQuery } from '@tanstack/react-query';
import { getProductDetailById, PRODUCT_DETAIL_QUERY_KEY } from '../services/product-detail.service';

export const useProductDetail = (id: string | null) =>
  useQuery({
    queryKey: [PRODUCT_DETAIL_QUERY_KEY, id],
    enabled: Boolean(id),
    queryFn: ({ signal }) => {
      if (!id) {
        return Promise.resolve(null);
      }

      return getProductDetailById(id, signal);
    },
    staleTime: 5 * 60 * 1000,
  });
