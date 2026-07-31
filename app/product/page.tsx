import React, { Suspense } from 'react';
import ProductDetailContent from './ProductDetailContent';

export default function ProductDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface flex items-center justify-center font-headline font-bold">Loading...</div>}>
      <ProductDetailContent />
    </Suspense>
  );
}
