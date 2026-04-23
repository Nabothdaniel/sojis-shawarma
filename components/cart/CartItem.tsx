'use client';

import React from 'react';
import { CartItem as CartItemType, useCartStore } from '@/store/cartStore';
import ProductImage from '@/components/ui/ProductImage';

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore();

  const handleIncrement = () => {
    updateQuantity(item.id, item.size, item.quantity + 1);
  };

  const handleDecrement = () => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.size, item.quantity - 1);
    } else {
      removeItem(item.id, item.size);
    }
  };

  return (
    <div className="bg-surface-container-lowest rounded-3xl p-4 flex gap-4 shadow-sm border border-outline-variant/10 relative overflow-hidden group transition-all hover:shadow-md">
      {/* Product Image */}
      <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0">
        <ProductImage 
          src={item.image} 
          alt={item.name} 
          fill 
          className="object-cover group-hover:scale-110 transition-transform duration-500"
        />
      </div>

      {/* Details */}
      <div className="flex-grow flex flex-col justify-between py-1">
        <div>
          <div className="flex justify-between items-start">
            <h3 className="font-headline font-bold text-sm leading-tight text-on-surface">{item.name}</h3>
            <button 
              onClick={() => removeItem(item.id, item.size)}
              className="text-outline hover:text-error transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
          <p className="font-label text-xs text-outline mt-1">{item.size}</p>
          <p className="font-label font-bold text-sm text-secondary mt-1">₦{item.price.toLocaleString()}</p>
        </div>

        <div className="flex items-center justify-between mt-2">
          {/* Quantity Controls */}
          <div className="bg-surface-container-high rounded-full px-1 py-1 flex items-center gap-4">
            <button 
              onClick={handleDecrement}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-highest transition-colors active:scale-90"
            >
              <span className="material-symbols-outlined text-sm font-bold">remove</span>
            </button>
            <span className="font-label font-bold text-sm w-4 text-center">{item.quantity}</span>
            <button 
              onClick={handleIncrement}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-highest transition-colors active:scale-90"
            >
              <span className="material-symbols-outlined text-sm font-bold">add</span>
            </button>
          </div>
          
          {/* Item Total */}
          <span className="font-label font-bold text-sm text-on-surface">
            ₦{(item.price * item.quantity).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
