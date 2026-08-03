'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProfilePage } from '@/features/profile/hooks/useProfilePage';
import ProductImage from '@/components/ui/ProductImage';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { buildProductHref, getGenericProductImage } from '@/lib/menu';

export default function SavedPage() {
  const router = useRouter();
  const { favorites, loading, removeFavorite } = useProfilePage();

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-32">
      <header className="px-6 py-6 flex items-center gap-4 bg-surface sticky top-0 z-40 border-b border-outline-variant/10">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <h1 className="font-headline font-bold text-xl">Saved</h1>
      </header>

      <main className="px-6 py-6 space-y-6 max-w-md mx-auto w-full">
        {loading && <LoadingScreen />}
        {!loading && favorites.length === 0 && (
          <div className="bg-surface-container-low rounded-3xl p-6 text-center space-y-2">
            <p className="font-headline font-bold text-lg">No favorites yet</p>
            <p className="font-body text-sm text-outline">
              Items you heart in the menu will appear here for quick access.
            </p>
            <Link
              href="/show"
              className="inline-block mt-4 text-primary font-label text-xs font-bold uppercase tracking-widest"
            >
              Browse Menu
            </Link>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          {favorites.map((product) => (
            <div
              key={product.id}
              className="bg-surface-container-low rounded-[28px] overflow-hidden flex flex-col group p-3 border border-outline-variant/5"
            >
              <Link
                href={buildProductHref(product.id)}
                className="relative h-32 overflow-hidden rounded-2xl mb-3"
              >
                <ProductImage
                  src={product.image_url || getGenericProductImage()}
                  alt={product.name || 'Menu Item'}
                  fill
                  blend
                />
              </Link>
              <p className="font-body font-bold text-xs line-clamp-1 px-1">
                {product.name || 'Menu Item'}
              </p>
              <div className="flex items-center justify-between mt-auto pt-3 px-1">
                <span className="font-label font-bold text-[10px] text-secondary">
                  ₦{Number(product.price).toLocaleString()}
                </span>
                <button
                  onClick={() => removeFavorite(product.id)}
                  className="text-red-500 active:scale-125 transition-transform"
                >
                  <span
                    className="material-symbols-outlined text-sm"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    favorite
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
