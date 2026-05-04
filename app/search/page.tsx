'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProductImage from '@/components/ui/ProductImage';
import { useCartStore } from '@/store/cartStore';
import { useAppStore } from '@/store/appStore';
import { catalogService } from '@/lib/api';
import { buildProductHref, getFallbackMenuProducts, normalizeCatalogProduct, type MenuProduct } from '@/lib/menu';

const RECENT_SEARCHES_KEY = 'soji-search-recent';
const suggestionTerms = ['Beef', 'Chicken', 'Mutton', 'Combo', 'Garlic sauce', 'Quick lunch'];

export default function SearchPage() {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const totalItems = useCartStore((state) => state.totalItems());
  const addToast = useAppStore((state) => state.addToast);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [menuProducts, setMenuProducts] = useState<MenuProduct[]>(getFallbackMenuProducts());

  useEffect(() => {
    setIsMounted(true);

    try {
      const stored = window.localStorage.getItem(RECENT_SEARCHES_KEY);
      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setRecentSearches(parsed.filter((item): item is string => typeof item === 'string'));
      }
    } catch {
      window.localStorage.removeItem(RECENT_SEARCHES_KEY);
    }
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await catalogService.getProducts();
        const normalized = Array.isArray(response)
          ? response.filter((product) => Number(product.available ?? 1) === 1).map(normalizeCatalogProduct)
          : [];

        if (normalized.length > 0) {
          setMenuProducts(normalized);
        }
      } catch {
        setMenuProducts(getFallbackMenuProducts());
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recentSearches));
  }, [isMounted, recentSearches]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredProducts = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }

    return menuProducts.filter((product) =>
      [product.name, product.category, product.description].some((value) =>
        value.toLowerCase().includes(normalizedQuery)
      )
    );
  }, [menuProducts, normalizedQuery]);

  const featuredProducts = useMemo(
    () => [...menuProducts].sort((a, b) => (b.popularScore ?? 0) - (a.popularScore ?? 0)).slice(0, 3),
    [menuProducts]
  );

  const handleQuickAdd = (product: MenuProduct) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      size: 'Regular',
      image: product.image,
    });
    addToast(`${product.name} added to cart`, 'success');
  };

  const commitSearch = (value: string) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return;
    }

    setSearchQuery(trimmedValue);
    setRecentSearches((current) => [
      trimmedValue,
      ...current.filter((item) => item.toLowerCase() !== trimmedValue.toLowerCase()),
    ].slice(0, 5));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-32">
      <header className="px-6 py-6 flex items-center gap-4 bg-surface sticky top-0 z-40">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <div className="flex-1 relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">search</span>
          <input
            autoFocus
            className="w-full bg-surface-container-highest border-none rounded-2xl py-3 pl-12 pr-12 font-body text-sm placeholder:text-outline focus:ring-2 focus:ring-primary-container/30 transition-all outline-none"
            placeholder="Search for shawarma..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                commitSearch(searchQuery);
              }
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-surface-container-low text-outline flex items-center justify-center"
              aria-label="Clear search"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>
      </header>

      <main className="px-6 max-w-md mx-auto space-y-6">
        {!normalizedQuery ? (
          <>
            <section className="pt-2">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-label text-[10px] uppercase tracking-[0.3em] text-outline font-bold">Discover</p>
                  <h1 className="font-headline text-2xl font-bold">Find your next wrap fast</h1>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestionTerms.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => commitSearch(term)}
                    className="rounded-full bg-surface-container-low px-4 py-2 text-xs font-label font-bold uppercase tracking-widest text-on-surface"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </section>

            <section className="bg-primary-container/15 rounded-[28px] p-5">
              <p className="font-label text-[10px] uppercase tracking-[0.3em] text-outline font-bold mb-2">Popular now</p>
              <div className="space-y-4">
                {featuredProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => commitSearch(product.name)}
                    className="w-full flex items-center gap-4 text-left"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-surface overflow-hidden shrink-0">
                      <ProductImage src={product.image} alt={product.name} fill />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-bold text-sm line-clamp-1">{product.name}</p>
                      <p className="font-body text-xs text-outline line-clamp-1">{product.category}</p>
                    </div>
                    <span className="font-label text-sm font-bold text-secondary">₦{product.price.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-headline text-lg font-bold">Recent searches</p>
                  <p className="font-body text-xs text-outline">Jump back into something you looked up.</p>
                </div>
                {recentSearches.length > 0 && (
                  <button
                    type="button"
                    onClick={clearRecentSearches}
                    className="text-xs font-label font-bold uppercase tracking-widest text-outline"
                  >
                    Clear
                  </button>
                )}
              </div>

              {recentSearches.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => commitSearch(term)}
                      className="rounded-full border border-outline-variant/30 px-4 py-2 text-xs font-label font-bold uppercase tracking-widest"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-[28px] border border-dashed border-outline-variant/40 px-5 py-8 text-center text-outline">
                  <span className="material-symbols-outlined text-4xl opacity-30 mb-3">history</span>
                  <p className="font-body text-sm">Your searches will appear here after you explore the menu.</p>
                </div>
              )}
            </section>
          </>
        ) : (
          <section className="space-y-4 pt-2">
            <div className="flex items-end justify-between">
              <div>
                <p className="font-label text-[10px] uppercase tracking-[0.3em] text-outline font-bold">Results</p>
                <h1 className="font-headline text-2xl font-bold">
                  {filteredProducts.length} match{filteredProducts.length === 1 ? '' : 'es'} for &quot;{searchQuery.trim()}&quot;
                </h1>
              </div>
              <button
                type="button"
                onClick={() => commitSearch(searchQuery)}
                className="text-xs font-label font-bold uppercase tracking-widest text-outline"
              >
                Save
              </button>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="space-y-4">
                {filteredProducts.map((product) => (
                  <article key={product.id} className="rounded-[30px] bg-surface-container-low p-4">
                    <div className="flex gap-4">
                      <Link href={buildProductHref(product.id)} className="w-24 h-24 rounded-[24px] overflow-hidden bg-surface shrink-0">
                        <ProductImage src={product.image} alt={product.name} fill />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-body font-bold text-base line-clamp-1">{product.name}</p>
                            <p className="font-body text-xs text-outline">{product.category}</p>
                          </div>
                          <span className="font-label text-sm font-bold text-secondary">₦{product.price.toLocaleString()}</span>
                        </div>
                        <p className="font-body text-sm text-outline mt-2 line-clamp-2">{product.description}</p>
                        <div className="flex items-center justify-between mt-4">
                          <Link
                            href={buildProductHref(product.id)}
                            className="text-xs font-label font-bold uppercase tracking-widest text-outline"
                          >
                            View details
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleQuickAdd(product)}
                            className="rounded-full bg-primary-container px-4 py-2 text-xs font-label font-bold uppercase tracking-widest text-on-primary-container"
                          >
                            Quick add
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center text-outline">
                <span className="material-symbols-outlined text-6xl mb-4 opacity-20">search_off</span>
                <p className="font-headline text-xl font-bold text-on-surface mb-2">No exact match yet</p>
                <p className="font-body text-sm max-w-xs">
                  Try searching by protein, combo, or flavor. &quot;Beef&quot; and &quot;Chicken&quot; work well.
                </p>
              </div>
            )}
          </section>
        )}
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-on-surface/90 backdrop-blur-xl rounded-full px-8 py-4 flex justify-between items-center z-50 shadow-2xl border border-white/10">
        <Link href="/show" className="flex flex-col items-center gap-1 text-white/50"><span className="material-symbols-outlined">home</span></Link>
        <Link href="/search" className="flex flex-col items-center gap-1 text-primary-container"><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>search</span></Link>
        <Link href="/cart" className="flex flex-col items-center gap-1 text-white/50 relative">
          <span className="material-symbols-outlined">shopping_cart</span>
          {isMounted && totalItems > 0 && <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary-container text-on-primary-container text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-on-surface">{totalItems}</span>}
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-1 text-white/50"><span className="material-symbols-outlined">person</span></Link>
      </nav>
    </div>
  );
}
