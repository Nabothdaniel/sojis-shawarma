'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useAppStore } from '@/store/appStore';
import { products } from '@/lib/products';
import ProductImage from '@/components/ui/ProductImage';
import useInstallPrompt from '@/hooks/useInstallPrompt';

export default function DeliveryMenu() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const { install, installAvailable } = useInstallPrompt();
  
  const addItem = useCartStore((state) => state.addItem);
  const totalItems = useCartStore((state) => state.totalItems());
  const addToast = useAppStore((state:any) => state.addToast);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
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

  const categories = ['All', 'Shawarma'];
  const handleQuickAdd = (item: any) => {
    addItem({ ...item, quantity: 1, size: 'Regular' });
    addToast(`${item.name} added to cart`, 'success');
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-32">
      <header className="flex justify-between items-center w-full sticky top-0 z-40 bg-surface px-4 py-4 backdrop-blur-md bg-opacity-80">
        <button onClick={handleInstall} className="p-2 active:scale-95 duration-150 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-2xl">{installAvailable ? 'download_for_offline' : 'install_mobile'}</span>
          {installAvailable && <span className="font-label text-[10px] uppercase font-bold text-primary">Install App</span>}
        </button>
        <div className="flex items-center gap-1 bg-surface-container-low px-4 py-1.5 rounded-full shadow-sm">
          <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
          <span className="font-label text-xs font-bold tracking-tight uppercase">Keffi, Nasarawa</span>
        </div>
        <div className="relative p-2 active:scale-95 duration-150">
          <span className="material-symbols-outlined text-primary text-2xl">notifications</span>
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-primary-container rounded-full border-2 border-surface"></span>
        </div>
      </header>

      <main className="px-6 space-y-8 max-w-md mx-auto">
        <section className="mt-4">
          <p className="font-body text-outline font-medium text-base mb-1">Hey Soji 👋</p>
          <h1 className="font-headline font-bold text-[28px] leading-tight text-on-background">Order Delivery</h1>
        </section>

        <section>
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">search</span>
            <input 
              className="w-full bg-surface-container-highest border-none rounded-xl py-4 pl-12 pr-4 font-body placeholder:text-outline focus:ring-2 focus:ring-primary-container transition-all outline-none" 
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

        <section className="grid grid-cols-2 gap-4">
          {products.map((item) => (
            <div key={item.id} className="bg-transparent rounded-lg overflow-hidden flex flex-col group">
              <Link href={`/product/${item.id}`} className="relative h-44 overflow-hidden rounded-3xl">
                <ProductImage src={item.image} alt={item.name} fill className="group-hover:scale-110 transition-transform duration-500" />
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
        </section>
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-on-surface/90 backdrop-blur-xl rounded-full px-8 py-4 flex justify-between items-center z-50 shadow-2xl border border-white/10">
        <Link href="/show" className="flex flex-col items-center gap-1 text-primary-container"><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span></Link>
        <Link href="/search" className="flex flex-col items-center gap-1 text-white/50"><span className="material-symbols-outlined">search</span></Link>
        <Link href="/cart" className="flex flex-col items-center gap-1 text-white/50 relative">
          <span className="material-symbols-outlined">shopping_cart</span>
          {isMounted && totalItems > 0 && <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary-container text-on-primary-container text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-on-surface">{totalItems}</span>}
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-1 text-white/50"><span className="material-symbols-outlined">person</span></Link>
      </nav>
    </div>
  );
}
