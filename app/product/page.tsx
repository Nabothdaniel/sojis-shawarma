'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { catalogService } from '@/lib/api';
import { getProductById } from '@/lib/products';
import ProductDetailClient from './[id]/ProductDetailClient';
import { normalizeCatalogProduct, type MenuProduct } from '@/lib/menu';

export default function ProductDetailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [product, setProduct] = useState<MenuProduct | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = searchParams.get('id');
    if (!id) {
      router.replace('/show');
      return;
    }

    const fallback = getProductById(id);
    if (fallback) {
      setProduct({ ...fallback, rawId: fallback.id });
      setLoading(false);
      return;
    }

    const loadProduct = async () => {
      try {
        const response = await catalogService.getProducts();
        const match = Array.isArray(response)
          ? response.find((item) => String(item.id) === String(id))
          : null;

        if (match) {
          setProduct(normalizeCatalogProduct(match));
          return;
        }

        router.replace('/show');
      } catch {
        router.replace('/show');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [router, searchParams]);

  if (loading || !product) {
    return <div className="min-h-screen bg-surface flex items-center justify-center font-headline font-bold">Loading product...</div>;
  }

  return <ProductDetailClient product={product} />;
}

