'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import CartItem from '@/components/cart/CartItem';

export default function CartPage() {
  const router = useRouter();
  const { items, totalPrice, totalItems } = useCartStore();
  const subtotal = totalPrice();

  if (items.length === 0) {
    return (
      <div className="bg-surface text-on-surface min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-primary-container/20 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-5xl text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_basket</span>
        </div>
        <h1 className="font-headline font-bold text-2xl mb-2">Your cart is empty</h1>
        <p className="text-outline font-body text-sm mb-8 max-w-[250px]">
          Looks like you haven't added anything to your cart yet.
        </p>
        <Link 
          href="/" 
          className="bg-primary-container text-on-primary-container font-headline font-bold px-8 py-4 rounded-full shadow-lg shadow-primary/20 active:scale-95 transition-transform"
        >
          Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col pb-32">
      {/* Header */}
      <header className="px-6 py-6 flex items-center gap-4 sticky top-0 bg-surface/80 backdrop-blur-md z-40">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <h1 className="font-headline font-bold text-xl">My Cart</h1>
      </header>

      <main className="flex-1 px-6 space-y-4 overflow-y-auto max-w-md mx-auto w-full">
        <p className="font-label text-outline font-bold text-[10px] uppercase tracking-widest mb-2">
          {totalItems()} Items in your bag
        </p>
        
        {items.map((item) => (
          <CartItem key={`${item.id}-${item.size}`} item={item} />
        ))}

        {/* Promo Code Section */}
        <div className="mt-8 relative pt-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-lg">sell</span>
              <input 
                type="text" 
                placeholder="Promo Code" 
                className="w-full bg-surface-container-low border-none rounded-2xl py-4 pl-12 pr-4 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container/30 transition-all"
              />
            </div>
            <button className="bg-surface-container-high text-on-surface font-label font-bold px-6 py-4 rounded-2xl active:scale-95 transition-transform text-sm">
              Apply
            </button>
          </div>
        </div>

        {/* Order Summary Card */}
        <section className="mt-8 bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 editorial-shadow">
          <h2 className="font-headline font-bold text-lg mb-4">Order Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-outline">Subtotal</span>
              <span className="font-label font-bold">₦{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-outline">Delivery Fee</span>
              <span className="font-label font-bold text-secondary">Free</span>
            </div>
            <div className="w-full h-px bg-outline-variant/20 my-2"></div>
            <div className="flex justify-between text-lg">
              <span className="font-headline font-bold">Total</span>
              <span className="font-label font-bold text-primary-container" style={{ color: '#EAB600' }}>
                ₦{subtotal.toLocaleString()}
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* Checkout Action Bar */}
      <footer className="fixed bottom-0 left-0 w-full p-6 bg-white/80 backdrop-blur-xl border-t border-outline-variant/10 z-50">
        <div className="max-w-md mx-auto">
          <button 
            onClick={() => router.push('/checkout')}
            className="w-full bg-primary-container text-on-primary-container font-headline font-bold py-4 rounded-full shadow-lg shadow-primary/20 active:scale-95 transition-transform flex justify-center items-center gap-3"
          >
            Go to Checkout
            <span className="material-symbols-outlined text-xl">arrow_forward</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
