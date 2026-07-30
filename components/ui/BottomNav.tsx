'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { useAppStore } from '@/store/appStore';
import { LuHouse, LuReceipt, LuShoppingCart, LuUser } from 'react-icons/lu';

interface BottomNavProps {
  active: 'home' | 'orders' | 'cart' | 'profile' | 'search';
}

export default function BottomNav({ active }: BottomNavProps) {
  const totalItems = useCartStore((state) => state.totalItems());
  const { unreadCount } = useAppStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const navClass = (id: string) => 
    `flex flex-col items-center gap-1 transition-all duration-300 relative ${
      active === id ? 'text-primary-container scale-110' : 'text-white/50 hover:text-white/80'
    }`;

  const iconStyle = (id: string) => 
    active === id ? { fontVariationSettings: "'FILL' 1" } : {};

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-on-surface/95 backdrop-blur-2xl rounded-full px-8 py-4 flex justify-between items-center z-50 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10">
      <Link href="/show" className={navClass('home')}>
        <LuHouse className="text-2xl" />
        {active === 'home' && <span className="w-1 h-1 bg-primary-container rounded-full absolute -bottom-2"></span>}
      </Link>
      
      <Link href="/orders" className={navClass('orders')}>
        <LuReceipt className="text-2xl" />
        {active === 'orders' && <span className="w-1 h-1 bg-primary-container rounded-full absolute -bottom-2"></span>}
      </Link>

      <Link href="/cart" className={navClass('cart')}>
        <LuShoppingCart className="text-2xl" />
        {isMounted && totalItems > 0 && (
          <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary-container text-on-primary-container text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-on-surface animate-bounce-subtle">
            {totalItems}
          </span>
        )}
        {active === 'cart' && <span className="w-1 h-1 bg-primary-container rounded-full absolute -bottom-2"></span>}
      </Link>

      <Link href="/profile" className={navClass('profile')}>
        <LuUser className="text-2xl" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-on-surface"></span>
        )}
        {active === 'profile' && <span className="w-1 h-1 bg-primary-container rounded-full absolute -bottom-2"></span>}
      </Link>
    </nav>
  );
}
