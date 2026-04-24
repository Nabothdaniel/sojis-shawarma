import React from 'react';
import { getProductById, products } from '@/lib/products';
import ProductDetailClient from './ProductDetailClient';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  return products.map((product) => ({
    id: product.id,
  }));
}

export default async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = getProductById(id);

  if (!product) {
    notFound();
  }

  return <ProductDetailClient product={product} />;
}
