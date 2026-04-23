'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useAppStore } from '@/store/appStore';
import { products } from '@/lib/products';
import ProductImage from '@/components/ui/ProductImage';

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  const addItem = useCartStore((state) => state.addItem);
  const totalItems = useCartStore((state) => state.totalItems());
  const addToast = useAppStore((state) => state.addToast);

  useEffect(() => {
    const hasVisited = localStorage.getItem('soji_has_visited');
    if (!hasVisited) {
      router.push('/landing');
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, [router]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    } else {
      addToast('Use browser menu to "Add to Home Screen"', 'info');
    }
  };

  const categories = ['All', 'Shawarma', 'Drinks', 'Sides', 'Combos'];

  const popularItems = products;

  const handleQuickAdd = (item: any) => {
    addItem({
      ...item,
      quantity: 1,
      size: 'Regular'
    });
    addToast(`${item.name} added to cart`, 'success');
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-32">
      {/* Top Navigation Shell */}
      <header className="flex justify-between items-center w-full sticky top-0 z-40 bg-surface px-4 py-4 backdrop-blur-md bg-opacity-80">
        <button onClick={handleInstall} className="p-2 active:scale-95 duration-150 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-2xl">{deferredPrompt ? 'download_for_offline' : 'install_mobile'}</span>
          {deferredPrompt && <span className="font-label text-[10px] uppercase font-bold text-primary">Install App</span>}
        </button>
        <div className="flex items-center gap-1 bg-surface-container-low px-4 py-1.5 rounded-full shadow-sm">
          <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
          <span className="font-label text-xs font-bold tracking-tight uppercase">Lagos, NG</span>
        </div>
        <div className="relative p-2 active:scale-95 duration-150">
          <span className="material-symbols-outlined text-primary text-2xl">notifications</span>
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-primary-container rounded-full border-2 border-surface"></span>
        </div>
      </header>

      <main className="px-6 space-y-8 max-w-md mx-auto">
        {/* Greeting Section */}
        <section className="mt-4">
          <p className="font-body text-outline font-medium text-base mb-1">Hey Soji 👋</p>
          <h1 className="font-headline font-bold text-[28px] leading-tight text-on-background">What are you craving today?</h1>
        </section>

        {/* Search Bar */}
        <section>
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">search</span>
            <input 
              className="w-full bg-surface-container-highest border-none rounded-xl py-4 pl-12 pr-4 font-body placeholder:text-outline focus:ring-2 focus:ring-primary-container transition-all outline-none" 
              placeholder="Search shawarma, drinks..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </section>

        {/* Category Pills */}
        <section className="overflow-x-auto no-scrollbar -mx-6 px-6">
          <div className="flex gap-3 whitespace-nowrap">
            {categories.map((cat) => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2.5 rounded-full font-label font-bold text-xs uppercase tracking-widest transition-all ${
                  activeCategory === cat 
                    ? 'bg-primary-container text-on-primary-container shadow-lg shadow-primary-container/20' 
                    : 'bg-surface-container-low text-outline hover:bg-surface-container-high'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* Featured Banner */}
        <section className="relative bg-primary-container rounded-lg p-8 overflow-hidden">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/20 rounded-full blur-3xl"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-secondary text-white font-label text-[10px] font-bold uppercase tracking-widest mb-3">
                <span className="material-symbols-outlined text-[12px] mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span> Best Seller
              </span>
              <h2 className="font-headline italic font-bold text-2xl text-on-surface mb-1">Chicken Shawarma</h2>
              <p className="font-label font-bold text-xl text-primary mb-6">₦2,500</p>
              <Link href="/product/chicken-shawarma" className="flex items-center gap-2 bg-on-surface text-surface px-6 py-3 rounded-full font-body font-bold text-sm active:scale-95 transition-transform w-fit">
                Order Now <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
            <div className="flex-1 relative h-40">
              <ProductImage 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBXyaAV2L0BhLyfFTp-Cg8u3Q2LWWe4F9qx3RLK3legiMxlJFYbdAEWsJEWo29rGFjOIbWxfqEE3D61ami3zzDBZMtbFrLqc4wO6ydsMm7s96hMiz60I1yiywqPquyndbbCv4pGPd3MihJf1QM9eEih8e9mJmw1ltQS99YKdZOysHO4iAeQEKonNe6hjj7U6psaWy92v4OjveQe0A4GzsDi2UBLY80tbeRDdZQJfL6fIf-bY2FG3Kbag_I4Zk5HlrhV2Z9x_z-0adJP"
                alt="Chicken Shawarma"
                fill
                className="rotate-12 scale-125 drop-shadow-2xl translate-x-4"
              />
            </div>
          </div>
        </section>

        {/* Popular Items Grid */}
        <section>
          <div className="flex justify-between items-end mb-6">
            <h3 className="font-headline font-bold text-xl">Popular Items</h3>
            <button className="font-label text-secondary font-bold text-xs uppercase tracking-widest">See All</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {popularItems.map((item) => (
              <div key={item.id} className="bg-transparent rounded-lg overflow-hidden flex flex-col group">
                <Link href={`/product/${item.id}`} className="relative h-44 overflow-hidden rounded-3xl">
                  <ProductImage 
                    src={item.image}
                    alt={item.name}
                    fill
                    className="group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <span className="material-symbols-outlined text-primary-container text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="font-label text-[10px] font-bold">{item.rating}</span>
                  </div>
                </Link>
                <div className="p-4 flex flex-col flex-1">
                  <h4 className="font-body font-bold text-sm mb-1 line-clamp-1">{item.name}</h4>
                  <div className="mt-auto flex justify-between items-center">
                    <span className="font-label font-bold text-secondary">₦{item.price.toLocaleString()}</span>
                    <button 
                      onClick={() => handleQuickAdd(item)}
                      className="w-8 h-8 bg-primary-container text-on-surface rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-lg shadow-primary-container/20"
                    >
                      <span className="material-symbols-outlined text-lg">add</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-on-surface/90 backdrop-blur-xl rounded-full px-8 py-4 flex justify-between items-center z-50 shadow-2xl border border-white/10">
        <Link href="/" className="flex flex-col items-center gap-1 text-primary-container">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
        </Link>
        <button className="flex flex-col items-center gap-1 text-white/50">
          <span className="material-symbols-outlined">search</span>
        </button>
        <Link href="/cart" className="flex flex-col items-center gap-1 text-white/50 relative">
          <span className="material-symbols-outlined">shopping_cart</span>
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary-container text-on-primary-container text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-on-surface">
              {totalItems}
            </span>
          )}
        </Link>
        <button className="flex flex-col items-center gap-1 text-white/50">
          <span className="material-symbols-outlined">person</span>
        </button>
      </nav>

      {/* Background Decoration */}
      <div className="fixed top-[40%] -left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="fixed bottom-0 -right-20 w-80 h-80 bg-secondary/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
    </div>
  );
}
