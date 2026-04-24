'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useAppStore } from '@/store/appStore';
import { useMutation } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCartStore();
  const { addToast } = useAppStore();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isGeoLoading, setIsGeoLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    note: ''
  });

  const subtotal = totalPrice();

  const { mutate: placeOrder, isPending: isLoading } = useMutation({
    mutationFn: (orderData: any) => axiosInstance.post('/orders', orderData),
    onSuccess: (response: any) => {
      const result = response.data;
      // 2. Format WhatsApp Message
      const orderList = items.map(i => `• ${i.quantity}x ${i.name} (${i.size}) - ₦${(i.price * i.quantity).toLocaleString()}`).join('\n');
      const message = `*NEW ORDER - ${result.order_ref}*\n\n` +
        `*Customer:* ${formData.name}\n` +
        `*Phone:* ${formData.phone}\n` +
        `*Address:* ${formData.address}\n\n` +
        `*Items:*\n${orderList}\n\n` +
        `*Total:* ₦${subtotal.toLocaleString()}\n\n` +
        `_Order Ref: ${result.order_ref}_`;

      const whatsappUrl = `https://wa.me/234XXXXXXXXXX?text=${encodeURIComponent(message)}`; // Replace with owner's number

      // 3. Navigate
      setIsSuccess(true);
      clearCart();
      addToast('Order logged! Redirecting...', 'success');

      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
      }, 3000);
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || 'Error placing order', 'error');
    }
  });

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return addToast('Cart is empty', 'error');

    placeOrder({
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
      items: items,
      total: subtotal,
      note: formData.note
    });
  };

  if (isSuccess) {
    return (
      <div className="bg-surface text-on-surface min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-tertiary/10 rounded-full flex items-center justify-center mb-6 text-tertiary">
          <span className="material-symbols-outlined text-5xl ripple-animation" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        </div>
        <h1 className="font-headline font-bold text-3xl mb-3">Order Placed!</h1>
        <p className="text-outline font-body text-base mb-10 max-w-[280px]">
          Your shawarma is being prepared. We'll notify you when it's out for delivery.
        </p>
        <button
          onClick={() => router.push('/')}
          className="bg-on-surface text-surface font-headline font-bold px-12 py-4 rounded-full shadow-xl active:scale-95 transition-transform"
        >
          Track My Order
        </button>
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col pb-32">
      {/* Header */}
      <header className="px-6 py-6 flex items-center gap-4 bg-surface sticky top-0 z-40">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <h1 className="font-headline font-bold text-xl">Checkout</h1>
      </header>

      <main className="flex-1 px-6 space-y-8 max-w-md mx-auto w-full">
        {/* Progress indicator */}
        <div className="flex gap-2 h-1.5 w-full">
          <div className="flex-1 bg-primary-container rounded-full"></div>
          <div className="flex-1 bg-outline-variant/30 rounded-full"></div>
          <div className="flex-1 bg-outline-variant/30 rounded-full"></div>
        </div>

        <form onSubmit={handlePlaceOrder} className="space-y-6">
          <section>
            <h2 className="font-headline font-bold text-lg mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container">location_on</span>
              Delivery Details
            </h2>

            <div className="space-y-4">
              <div className="relative group">
                <input
                  required
                  type="text"
                  placeholder="Full Name"
                  className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-6 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container/30 transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="relative group">
                <input
                  required
                  type="tel"
                  placeholder="Phone Number"
                  className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-6 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container/30 transition-all"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="relative group">
                <div className="flex justify-between items-center mb-2 px-1">
                  <label className="font-label text-[10px] uppercase tracking-widest text-outline font-bold">Delivery Address</label>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!navigator.geolocation) return alert('Geolocation not supported');
                      setIsGeoLoading(true);
                      navigator.geolocation.getCurrentPosition(async (pos) => {
                        try {
                          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`, {
                            headers: { 'User-Agent': 'SojiShawarmaSpot/1.0' }
                          });
                          const data = await res.json();
                          setFormData({ ...formData, address: data.display_name });
                          addToast('Location detected!', 'success');
                        } catch (err) {
                          addToast('Could not fetch address details', 'error');
                        } finally {
                          setIsGeoLoading(false);
                        }
                      }, () => {
                        setIsGeoLoading(true);
                        addToast('Location access denied', 'error');
                      });
                    }}
                    className="flex items-center gap-1 text-primary font-label text-[10px] font-bold uppercase active:scale-95 transition-transform"
                  >
                    <span className="material-symbols-outlined text-sm">my_location</span>
                    Detect My Location
                  </button>
                </div>
                <textarea
                  required
                  placeholder="Street, House No, Keffi"
                  rows={3}
                  className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-6 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container/30 transition-all resize-none"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="relative group">
                <input
                  type="text"
                  placeholder="Note for rider (optional)"
                  className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-6 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container/30 transition-all"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-headline font-bold text-lg mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container">credit_card</span>
              Payment Method
            </h2>
            <div className="p-4 rounded-2xl bg-primary-container/10 border-2 border-primary-container flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary-container">payments</span>
                <span className="font-body font-bold text-sm">Cash on Delivery</span>
              </div>
              <span className="material-symbols-outlined text-primary-container">radio_button_checked</span>
            </div>
            <p className="mt-3 text-[10px] text-outline px-2">More payment options coming soon</p>
          </section>

          <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6">
            <h3 className="font-headline font-bold text-base mb-4">Final Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-outline">Items ({items.reduce((a, b) => a + b.quantity, 0)})</span>
                <span className="font-label font-bold text-on-surface">₦{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-outline">Delivery</span>
                <span className="font-label font-bold text-secondary">Free</span>
              </div>
              <div className="pt-3 border-t border-outline-variant/20 flex justify-between items-center">
                <span className="font-headline font-bold">Payable amount</span>
                <span className="font-label font-bold text-primary-container text-lg" style={{ color: '#EAB600' }}>
                  ₦{subtotal.toLocaleString()}
                </span>
              </div>
            </div>
          </section>

          <button
            type="submit"
            disabled={isLoading || isGeoLoading}
            className={`w-full bg-primary-container text-on-primary-container font-headline font-bold py-4 rounded-full shadow-lg shadow-primary/20 active:scale-95 transition-transform flex justify-center items-center gap-3 ${isLoading || isGeoLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading || isGeoLoading ? (
              <>
                <span className="w-5 h-5 border-2 border-on-primary-container/30 border-t-on-primary-container rounded-full animate-spin"></span>
                {isGeoLoading ? 'Locating...' : 'Processing...'}
              </>
            ) : (
              <>
                Confirm & Place Order
                <span className="material-symbols-outlined text-xl">shopping_bag</span>
              </>
            )}
          </button>

        </form>
      </main>
    </div>
  );
}
