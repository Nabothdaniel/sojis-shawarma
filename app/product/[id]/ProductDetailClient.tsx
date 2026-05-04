'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useAppStore } from '@/store/appStore';
import { Product } from '@/lib/products';
import ProductImage from '@/components/ui/ProductImage';

export default function ProductDetailClient({ product }: { product: Product }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('Regular');
  
  const addItem = useCartStore((state) => state.addItem);
  const addToast = useAppStore((state) => state.addToast);

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      size: selectedSize,
      image: product.image,
    });
    addToast(`${quantity}x ${product.name} (${selectedSize}) added to cart`, 'success');
  };

  const sizes = ['Small', 'Regular', 'Large'];

  return (
    <div className="bg-background font-body text-on-surface min-h-screen flex flex-col">
      {/* Top Section (Hero Area) */}
      <section className="hero-gradient h-[486px] relative flex flex-col items-center justify-start pt-6 overflow-visible">
        {/* Header Controls */}
        <div className="w-full px-6 flex justify-between items-center z-20">
          <button 
            onClick={() => router.back()}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-lg active:scale-90 transition-transform"
          >
            <span className="material-symbols-outlined text-white">arrow_back_ios_new</span>
          </button>
          <button className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-lg active:scale-90 transition-transform">
            <span className="material-symbols-outlined text-white">bookmark</span>
          </button>
        </div>
        {/* Product Image Hero */}
        <div className="relative w-full flex justify-center mt-4 z-10 px-4">
          <div className="relative w-[85%] max-w-sm aspect-[4/5] rounded-[40px] p-6 bg-white/10 backdrop-blur-sm">
            <ProductImage
              className="custom-shadow rotate-[15deg]"
              alt={product.name}
              src={product.image}
              fill
              priority
            />
          </div>
        </div>
      </section>

      {/* Bottom White Card */}
      <main className="bg-surface-container-lowest rounded-t-[30px] -mt-16 relative z-20 flex-grow px-6 pt-8 pb-32 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        {/* Category & Badges */}
        <div className="flex justify-between items-center mb-4">
          <span className="font-label text-[12px] uppercase tracking-widest bg-surface-container-high px-4 py-1.5 rounded-full text-on-surface-variant font-bold">
            🌯 {product.category}
          </span>
          <span className="flex items-center gap-1 bg-tertiary/10 text-tertiary px-3 py-1 rounded-full text-xs font-bold font-label">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>package_2</span>
            Free Delivery
          </span>
        </div>

        {/* Product Title & Price */}
        <div className="mb-6">
          <h1 className="font-headline text-[28px] font-bold leading-tight mb-2">{product.name}</h1>
          <p className="font-label text-2xl font-bold text-primary-container" style={{ color: '#EAB600' }}>
            ₦{product.price.toLocaleString()}
          </p>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-6 mb-8 py-3 bg-surface-container-low/50 rounded-2xl px-4">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#F5C518]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="font-label font-bold text-sm">{product.rating}</span>
          </div>
          <div className="w-px h-4 bg-outline-variant/30"></div>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-on-surface-variant text-sm">schedule</span>
            <span className="font-label text-sm text-on-surface-variant">{product.prepTime}</span>
          </div>
        </div>

        {/* Description */}
        <div className="mb-8">
          <h3 className="font-headline italic text-lg mb-2 text-primary">About this item</h3>
          <p className="text-on-surface-variant leading-relaxed text-sm">
            {product.description}
          </p>
        </div>

        {/* Size Selector */}
        <div className="mb-8">
          <h3 className="font-label text-[10px] uppercase tracking-widest mb-3 font-bold text-outline">Select Size</h3>
          <div className="flex gap-3">
            {sizes.map((size) => (
              <button 
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`flex-1 py-3 rounded-full border font-label text-sm transition-all ${
                  selectedSize === size 
                    ? 'bg-primary-container text-on-primary-container font-bold shadow-md shadow-primary/10 border-transparent' 
                    : 'border-outline-variant/30 hover:bg-surface-container-high'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Action Bar (Glassmorphism) */}
      <footer className="fixed bottom-0 left-0 w-full p-6 z-50 bg-white/80 backdrop-blur-xl border-t border-outline-variant/10">
        <div className="flex items-center gap-4 max-w-md mx-auto">
          {/* Quantity Selector */}
          <div className="flex items-center bg-surface-container-low rounded-full px-2 py-1">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface transition-colors active:scale-90"
            >
              <span className="material-symbols-outlined text-lg">remove</span>
            </button>
            <span className="w-8 text-center font-label font-bold text-lg">{quantity}</span>
            <button 
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface transition-colors active:scale-90"
            >
              <span className="material-symbols-outlined text-lg">add</span>
            </button>
          </div>
          {/* Add to Cart Button */}
          <button 
            onClick={handleAddToCart}
            className="flex-grow bg-primary-container text-on-primary-container font-headline font-bold py-4 rounded-full shadow-lg shadow-primary/20 active:scale-95 transition-transform flex justify-center items-center gap-2"
          >
            <span>Add to Cart</span>
            <span className="text-on-primary-container/60">—</span>
            <span>₦{(product.price * quantity).toLocaleString()}</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
