'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useAppStore } from '@/store/appStore';
import ProductImage from '@/components/ui/ProductImage';
import BottomNav from '@/components/ui/BottomNav';
import useInstallPrompt from '@/hooks/useInstallPrompt';
import { catalogService } from '@/lib/api';
import { buildProductHref, getFallbackMenuProducts, normalizeCatalogProduct, type MenuProduct } from '@/lib/menu';

export default function DeliveryMenu() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const { install, installAvailable } = useInstallPrompt();
  
  const addItem = useCartStore((state) => state.addItem);
  const totalItems = useCartStore((state) => state.totalItems());
  const { user, addToast, unreadCount } = useAppStore();
  const [isMounted, setIsMounted] = useState(false);
  const [menuProducts, setMenuProducts] = useState<MenuProduct[]>(getFallbackMenuProducts());
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      setLoadingProducts(true);

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
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  const handleInstall = async () => {
    await install({
      onUnsupported: () => {
        addToast('Use browser menu to "Add to Home Screen"', 'info');
      },
      onAccepted: () => {
        addToast('App installed successfully!', 'success');
      },
    });
  };

  const categories = ['All', ...Array.from(new Set(menuProducts.map((product) => product.category.split('•')[0].trim())))];
  const handleQuickAdd = (item: MenuProduct) => {
    addItem({ ...item, quantity: 1, size: 'Regular' });
    addToast(`${item.name} added to cart`, 'success');
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredProducts = menuProducts.filter((product) => {
    const categoryMatches = activeCategory === 'All' || product.category.toLowerCase().includes(activeCategory.toLowerCase());
    const searchMatches = !normalizedSearch || [product.name, product.category, product.description].some((value) => value.toLowerCase().includes(normalizedSearch));
    return categoryMatches && searchMatches;
  });

  const popularProducts = [...menuProducts]
    .sort((a, b) => (b.popularScore ?? 0) - (a.popularScore ?? 0))
    .slice(0, 3);

  const displayName = user?.name?.split(' ')[0] || 'Guest';

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-32">
      <header className="px-6 pt-10 pb-6 bg-surface sticky top-0 z-30 transition-all duration-300">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-container shadow-inner bg-surface-container-low">
              <span className="material-symbols-outlined text-outline/30 w-full h-full flex items-center justify-center">person</span>
            </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shrink-0">
              <span className="material-symbols-outlined text-surface text-xl">restaurant</span>
            </div>
            <div className="min-w-0">
              <h1 className="font-headline font-bold text-sm leading-tight flex items-center gap-1">Soji&apos;s <span className="font-body text-[10px] text-outline font-normal">Spot</span></h1>
              <p className="font-body text-[10px] text-outline line-clamp-1">{user?.address || 'Keffi, NSUK'}</p>
            </div>
          </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={handleInstall} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low active:scale-90 transition-transform">
              <span className="material-symbols-outlined text-primary">{installAvailable ? 'download_for_offline' : 'install_mobile'}</span>
            </button>
            <Link href="/notifications" className="relative w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low active:scale-90 transition-transform">
              <span className="material-symbols-outlined text-outline">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center border-2 border-surface animate-pulse-subtle">
                  {unreadCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        <section className="mt-4">
          <p className="font-body text-outline font-medium text-base mb-1 italic">Hey {displayName} 👋</p>
          <h1 className="font-headline font-bold text-[32px] leading-tight text-on-surface">Order Delivery</h1>
        </section>
      </header>

      <main className="px-6 space-y-8 max-w-md mx-auto">
        <section>
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">search</span>
            <input 
              className="w-full bg-transparent border border-outline-variant/30 rounded-xl py-4 pl-12 pr-4 font-body placeholder:text-outline focus:ring-2 focus:ring-primary-container transition-all outline-none" 
              placeholder="Search shawarma..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </section>

        <section className="overflow-x-auto no-scrollbar -mx-6 px-6">
          <div className="flex gap-3 whitespace-nowrap">
            {categories.map((cat) => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2.5 rounded-full font-label font-bold text-xs uppercase tracking-widest transition-all ${
                  activeCategory === cat 
                    ? 'bg-primary-container text-on-primary-container shadow-lg shadow-primary-container/20' 
                    : 'bg-surface-container-low text-outline'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {popularProducts.length > 0 && !normalizedSearch && (
          <section className="space-y-3">
            <div className="flex items-end justify-between">
              <div>
                <p className="font-label text-[10px] uppercase tracking-[0.3em] text-outline font-bold">Popular right now</p>
                <h2 className="font-headline font-bold text-xl">Chosen from repeat orders and ratings</h2>
              </div>
            </div>
            <div className="grid gap-3">
              {popularProducts.map((product) => (
                <Link key={`popular-${product.id}`} href={buildProductHref(product.id)} className="bg-surface-container-low rounded-[28px] p-4 flex items-center gap-4 hover:shadow-lg transition-all duration-300">
                  <div className="w-20 h-20 rounded-[24px] overflow-hidden shrink-0">
                    <ProductImage src={product.image} alt={product.name} fill blend={true} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-body font-bold text-sm">{product.name}</p>
                    <p className="font-body text-xs text-outline line-clamp-1">{product.description}</p>
                    <div className="mt-2 flex items-center gap-3 text-[11px] font-label font-bold uppercase tracking-widest text-outline">
                      <span>{product.orderCount || 0} orders</span>
                      <span>{product.rating} stars</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {loadingProducts ? (
          <div className="col-span-2 space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface-container-low h-40 rounded-[32px] animate-pulse"></div>
            ))}
          </div>
        ) : (
          <section className="grid grid-cols-2 gap-4">
            {filteredProducts.map((item) => (
              <div key={item.id} className="bg-transparent rounded-lg overflow-hidden flex flex-col group">
                <Link href={buildProductHref(item.id)} className="relative h-44 overflow-hidden rounded-3xl">
                  <ProductImage src={item.image} alt={item.name} fill className="group-hover:scale-110 transition-transform duration-500" blend={true} />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <span className="material-symbols-outlined text-primary-container text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="font-label text-[10px] font-bold">{item.rating}</span>
                  </div>
                </Link>
                <div className="p-4 flex flex-col flex-1">
                  <h4 className="font-body font-bold text-sm mb-1 line-clamp-1">{item.name}</h4>
                  <div className="mt-auto flex justify-between items-center">
                    <span className="font-label font-bold text-secondary">₦{item.price.toLocaleString()}</span>
                    <button onClick={() => handleQuickAdd(item)} className="w-8 h-8 bg-primary-container text-on-surface rounded-full flex items-center justify-center shadow-lg shadow-primary-container/20"><span className="material-symbols-outlined text-lg">add</span></button>
                  </div>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-2 bg-surface-container-low rounded-[28px] p-8 text-center text-outline">
                No matching menu items yet.
              </div>
            )}
          </section>
        )}
      </main>

      <BottomNav active="home" />
    </div>
  );
}
