import React from 'react';
import { getProductById, products } from '@/lib/products';
import ProductDetailClient from './ProductDetailClient';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  return products.map((product) => ({
    id: product.id,
  }));
}

export default function ProductDetail({ params }: { params: { id: string } }) {
  const product = getProductById(params.id);

  if (!product) {
    notFound();
  }

  return <ProductDetailClient product={product} />;
}
