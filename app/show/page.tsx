'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useAppStore } from '@/store/appStore';
import ProductImage from '@/components/ui/ProductImage';
import BottomNav from '@/components/ui/BottomNav';
import SplashScreen from '@/components/ui/SplashScreen';
import useInstallPrompt from '@/hooks/useInstallPrompt';
import { catalogService, favoritesService } from '@/lib/api';
import { buildProductHref, getFallbackMenuProducts, normalizeCatalogProduct, type MenuProduct } from '@/lib/menu';
import { 
  LuUtensils, 
  LuDownload, 
  LuSmartphone, 
  LuBell, 
  LuSearch, 
  LuStar, 
  LuHeart, 
  LuPlus 
} from 'react-icons/lu';
import { useWalkthrough } from '@/hooks/useWalkthrough';

export default function DeliveryMenu() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isMounted, setIsMounted] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const { install, installAvailable } = useInstallPrompt();
  
  const addItem = useCartStore((state) => state.addItem);
  const totalItems = useCartStore((state) => state.totalItems());
  const { user, addToast, unreadCount } = useAppStore();
   const [menuProducts, setMenuProducts] = useState<MenuProduct[]>(getFallbackMenuProducts());
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (user && isMounted) {
      favoritesService.getFavorites()
        .then((res) => {
          const ids = new Set((res.data || []).map((f: any) => f.id));
          setFavoriteIds(ids);
        })
        .catch(() => {});
    }
  }, [user, isMounted]);

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

  useWalkthrough('customer_menu_v1', [
    { element: '#tour-welcome', popover: { title: 'Welcome to Sojis Shawarma', description: 'Your new favorite premium spot in Keffi.' } },
    { element: '#tour-search', popover: { title: 'Find your cravings', description: 'Quickly search for any custom shawarma or drink here.' } },
    { element: '#tour-categories', popover: { title: 'Filter by Category', description: 'Tap these chips to narrow down specific types of orders.' } }
  ], { enabled: !loadingProducts && isMounted });

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

  const toggleFavorite = async (e: React.MouseEvent, productId: string | number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      addToast('Sign in to save favorites', 'info');
      router.push('/login');
      return;
    }
    try {
      const res = await favoritesService.toggleFavorite(productId);
      const newIds = new Set(favoriteIds);
      if (res.action === 'added') {
        newIds.add(Number(productId));
        addToast('Added to favorites', 'success');
      } else {
        newIds.delete(Number(productId));
        addToast('Removed from favorites', 'info');
      }
      setFavoriteIds(newIds);
    } catch {
      addToast('Could not update favorites', 'error');
    }
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
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <div className={`bg-surface text-on-surface min-h-screen pb-32 transition-opacity duration-700 ${showSplash ? 'opacity-0 h-screen overflow-hidden' : 'opacity-100'}`}>
        <header className="px-6 pt-10 pb-6 bg-surface fixed top-0 w-full max-w-md z-50 transition-all duration-300 backdrop-blur-sm bg-surface/90">
        <div className="flex justify-between items-center mb-8">
          <div className="w-14 h-14 bg-primary-container rounded-[24px] flex items-center justify-center shadow-xl shadow-primary-container/20 border border-white/20 text-on-primary-container">
            <LuUtensils className="text-3xl" />
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={handleInstall} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-surface-container-low active:scale-90 transition-transform">
              {installAvailable ? <LuDownload className="text-primary text-2xl" /> : <LuSmartphone className="text-primary text-2xl" />}
            </button>
            <Link href="/notifications" className="relative w-12 h-12 flex items-center justify-center rounded-2xl bg-surface-container-low active:scale-95 transition-transform">
              <LuBell className="text-outline text-2xl" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-surface animate-pulse-subtle">
                  {unreadCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        <section id="tour-welcome" className="space-y-1">
          <p className="font-body text-outline font-medium text-base">Hey {displayName} 👋</p>
          <h1 className="font-headline font-bold text-[36px] leading-[1.1] text-on-surface">Order Delivery</h1>
        </section>
      </header>

      <main className="px-6 pt-[200px] space-y-8 max-w-md mx-auto">
        <section>
          <div id="tour-search" className="relative group">
            <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl" />
            <input 
              className="w-full bg-transparent border border-outline-variant/30 rounded-xl py-4 pl-12 pr-4 font-body placeholder:text-outline focus:ring-2 focus:ring-primary-container transition-all outline-none" 
              placeholder="Search shawarma..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </section>

        <section id="tour-categories" className="overflow-x-auto no-scrollbar -mx-6 px-6">
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
                    <LuStar className="text-primary-container text-[12px]" />
                    <span className="font-label text-[10px] font-bold">{item.rating}</span>
                  </div>
                  <button 
                    onClick={(e) => toggleFavorite(e, item.id)}
                    className="absolute bottom-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm active:scale-90 transition-transform"
                  >
                    <LuHeart className={`text-base ${favoriteIds.has(Number(item.id)) ? 'text-red-500 fill-red-500' : 'text-outline/40'}`} />
                  </button>
                </Link>
                <div className="p-4 flex flex-col flex-1">
                  <h4 className="font-body font-bold text-sm mb-1 line-clamp-1">{item.name}</h4>
                  <div className="mt-auto flex justify-between items-center">
                    <span className="font-label font-bold text-secondary">₦{item.price.toLocaleString()}</span>
                    <button onClick={() => handleQuickAdd(item)} className="w-8 h-8 bg-primary-container text-on-surface rounded-full flex items-center justify-center shadow-lg shadow-primary-container/20"><LuPlus className="text-lg" /></button>
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
    </>
  );
}
