'use client';

import Link from 'next/link';
import BottomNav from '@/components/ui/BottomNav';
import { MenuProductGrid } from '@/features/show-menu/components/MenuProductGrid';
import { PopularProducts } from '@/features/show-menu/components/PopularProducts';
import { useDeliveryMenu } from '@/features/show-menu/hooks/useDeliveryMenu';

export default function DeliveryMenu() {
  const {
    activeCategory,
    categories,
    displayName,
    favoriteIds,
    filteredProducts,
    handleInstall,
    handleQuickAdd,
    installAvailable,
    loadingProducts,
    normalizedSearch,
    popularProducts,
    searchQuery,
    setActiveCategory,
    setSearchQuery,
    toggleFavorite,
    unreadCount,
  } = useDeliveryMenu();

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-32">
      <header className="px-6 pt-10 pb-6 bg-surface sticky top-0 z-40 transition-all duration-300 backdrop-blur-sm bg-surface/90">
        <div className="flex justify-between items-center mb-8">
          <div className="w-14 h-14 bg-primary-container rounded-[24px] flex items-center justify-center shadow-xl shadow-primary-container/20 border border-white/20">
            <span className="material-symbols-outlined text-on-primary-container text-3xl">restaurant</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={handleInstall} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-surface-container-low active:scale-90 transition-transform">
              <span className="material-symbols-outlined text-primary text-2xl">{installAvailable ? 'download_for_offline' : 'install_mobile'}</span>
            </button>
            <Link href="/notifications" className="relative w-12 h-12 flex items-center justify-center rounded-2xl bg-surface-container-low active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-outline">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-surface animate-pulse-subtle">
                  {unreadCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        <section className="space-y-1">
          <p className="font-body text-outline font-medium text-base">Hey {displayName} 👋</p>
          <h1 className="font-headline font-bold text-[36px] leading-[1.1] text-on-surface">Order Delivery</h1>
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

        {!normalizedSearch && <PopularProducts products={popularProducts} />}

        <MenuProductGrid
          favoriteIds={favoriteIds}
          loading={loadingProducts}
          products={filteredProducts}
          onQuickAdd={handleQuickAdd}
          onToggleFavorite={toggleFavorite}
        />
      </main>

      <BottomNav active="home" />
    </div>
  );
}
