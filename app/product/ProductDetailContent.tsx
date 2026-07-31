'use client';

import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useProductDetail } from '@/features/products/hooks/useProductDetail';
import ProductDetailClient from './ProductDetailClient';

export default function ProductDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');
  const { data: product, isLoading, isFetching, isError } = useProductDetail(id);

  useEffect(() => {
    if (!id) {
      router.replace('/show');
    }
  }, [id, router]);

  useEffect(() => {
    if (!id || isLoading || isFetching) {
      return;
    }

    if (isError || !product) {
      router.replace('/show');
    }
  }, [id, isError, isFetching, isLoading, product, router]);

  if (isLoading || isFetching || !product) {
    return <div className="min-h-screen bg-surface flex items-center justify-center font-headline font-bold">Loading product...</div>;
  }

  return <ProductDetailClient product={product} />;
}
