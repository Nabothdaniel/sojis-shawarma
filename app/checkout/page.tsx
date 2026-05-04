'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useAppStore } from '@/store/appStore';
import { useMutation } from '@tanstack/react-query';
import { orderService } from '@/lib/api';

type CheckoutStep = 'delivery' | 'payment' | 'receipt' | 'success';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCartStore();
  const { addToast } = useAppStore();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('delivery');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isGeoLoading, setIsGeoLoading] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [orderRef, setOrderRef] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    note: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const checkoutSteps: CheckoutStep[] = ['delivery', 'payment', 'receipt'];
  const stepIndex = checkoutSteps.indexOf(currentStep);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const subtotal = totalPrice();

  const { mutate: placeOrder, isPending: isLoading } = useMutation({
    mutationFn: (orderData: any) => orderService.createOrder(orderData),
    onSuccess: (response: any) => {
      const result = response.data;
      setOrderId(result.id);
      setOrderRef(result.order_ref);
      setCurrentStep('payment');
      addToast('Order details saved! Proceed with payment', 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Error creating order', 'error');
    },
  });

  const { mutate: confirmPayment, isPending: isConfirming } = useMutation({
    mutationFn: async () => {
      if (!orderId || !receiptFile) {
        throw new Error('Missing order or receipt');
      }

      const uploadData = new FormData();
      uploadData.append('receipt', receiptFile);
      return orderService.confirmPayment(orderId, uploadData);
    },
    onSuccess: () => {
      setCurrentStep('success');
      clearCart();
      addToast('Payment confirmed! Order is being prepared', 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Error confirming payment', 'error');
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }
    if (!formData.address.trim()) newErrors.address = 'Delivery address is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return addToast('Cart is empty', 'error');
    if (!validateForm()) {
      addToast('Please fix the errors in the form', 'error');
      return;
    }

    placeOrder({
      customer_name: formData.name.trim(),
      customer_phone: formData.phone.trim(),
      delivery_address: formData.address.trim(),
      items: items,
      total_amount: subtotal,
      notes: formData.note.trim(),
      payment_status: 'pending'
    });
  };

  const handleReceiptUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptFile) return addToast('Please upload receipt image', 'error');
    confirmPayment();
  };

  // Success screen
  if (!isMounted) return null;
  
  if (currentStep === 'success') {
    return (
      <div className="bg-surface text-on-surface min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-tertiary/10 rounded-full flex items-center justify-center mb-6 text-tertiary">
          <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        </div>
        <h1 className="font-headline font-bold text-3xl mb-3">Payment Confirmed! ✓</h1>
        <p className="text-outline font-body text-base mb-2">Order Ref: <span className="font-bold text-primary-container">{orderRef}</span></p>
        <p className="text-outline font-body text-base mb-10 max-w-[280px]">
          Your shawarma is being prepared. We&apos;ll notify you when it&apos;s out for delivery.
        </p>
        <button
          onClick={() => router.push('/')}
          className="bg-on-surface text-surface font-headline font-bold px-12 py-4 rounded-full shadow-xl active:scale-95 transition-transform"
        >
          Back to Home
        </button>
        <a
          href={`https://wa.me/2348012345678?text=${encodeURIComponent(`Hello, I just placed an order with reference ${orderRef}. I would like to chat.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-center gap-2 bg-green-500 text-white font-headline font-bold px-12 py-4 rounded-full shadow-lg active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-xl">chat</span>
          Chat on WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col pb-32">
      {/* Header */}
      <header className="px-6 py-6 flex items-center gap-4 bg-surface sticky top-0 z-40">
        <button
          onClick={() => currentStep === 'delivery' ? router.back() : setCurrentStep('delivery')}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <h1 className="font-headline font-bold text-xl">Checkout</h1>
      </header>

      <main className="flex-1 px-6 space-y-8 max-w-md mx-auto w-full">
        {/* Progress indicator */}
        <div className="flex gap-2 h-1.5 w-full">
          <div className={`flex-1 rounded-full ${stepIndex >= 0 ? 'bg-primary-container' : 'bg-outline-variant/30'}`}></div>
          <div className={`flex-1 rounded-full ${stepIndex >= 1 ? 'bg-primary-container' : 'bg-outline-variant/30'}`}></div>
          <div className={`flex-1 rounded-full ${stepIndex >= 2 ? 'bg-primary-container' : 'bg-outline-variant/30'}`}></div>
        </div>

        {/* STEP 1: Delivery Details */}
        {currentStep === 'delivery' && (
          <form onSubmit={handlePlaceOrder} className="space-y-6">
            <section>
              <h2 className="font-headline font-bold text-lg mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container">location_on</span>
                Delivery Details
              </h2>

              <div className="space-y-4">
                <div className="space-y-1">
                  <input
                    type="text"
                    placeholder="Full Name"
                    className={`w-full bg-surface-container-highest border-none rounded-2xl py-4 px-6 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container/30 transition-all ${errors.name ? 'ring-2 ring-red-500/50' : ''}`}
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: '' });
                    }}
                  />
                  {errors.name && <p className="text-red-500 text-[10px] font-bold px-4 uppercase tracking-wider">{errors.name}</p>}
                </div>

                <div className="space-y-1">
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    className={`w-full bg-surface-container-highest border-none rounded-2xl py-4 px-6 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container/30 transition-all ${errors.phone ? 'ring-2 ring-red-500/50' : ''}`}
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      if (errors.phone) setErrors({ ...errors, phone: '' });
                    }}
                  />
                  {errors.phone && <p className="text-red-500 text-[10px] font-bold px-4 uppercase tracking-wider">{errors.phone}</p>}
                </div>

                <div className="space-y-1">
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
                            if (errors.address) setErrors({ ...errors, address: '' });
                            addToast('Location detected!', 'success');
                          } catch (err) {
                            addToast('Could not fetch address details', 'error');
                          } finally {
                            setIsGeoLoading(false);
                          }
                        }, () => {
                          setIsGeoLoading(false);
                          addToast('Location access denied', 'error');
                        });
                      }}
                      className="flex items-center gap-1 text-primary font-label text-[10px] font-bold uppercase active:scale-95 transition-transform"
                    >
                      <span className="material-symbols-outlined text-sm">my_location</span>
                      Detect
                    </button>
                  </div>
                  <textarea
                    placeholder="Street, House No, Keffi"
                    rows={3}
                    className={`w-full bg-surface-container-highest border-none rounded-2xl py-4 px-6 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container/30 transition-all resize-none ${errors.address ? 'ring-2 ring-red-500/50' : ''}`}
                    value={formData.address}
                    onChange={(e) => {
                      setFormData({ ...formData, address: e.target.value });
                      if (errors.address) setErrors({ ...errors, address: '' });
                    }}
                  />
                  {errors.address && <p className="text-red-500 text-[10px] font-bold px-4 uppercase tracking-wider">{errors.address}</p>}
                </div>
                <input
                  type="text"
                  placeholder="Note for rider (optional)"
                  className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-6 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container/30 transition-all"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                />
              </div>
            </section>

            <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6">
              <h3 className="font-headline font-bold text-base mb-4">Order Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-outline">Items ({items.reduce((a, b) => a + b.quantity, 0)})</span>
                  <span className="font-label font-bold">₦{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-outline">Delivery</span>
                  <span className="font-label font-bold text-secondary">Free</span>
                </div>
                <div className="pt-3 border-t border-outline-variant/20 flex justify-between items-center">
                  <span className="font-headline font-bold">Total</span>
                  <span className="font-label font-bold text-primary-container text-lg" style={{ color: '#EAB600' }}>
                    ₦{subtotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </section>

            <button
              type="submit"
              disabled={isLoading || isGeoLoading}
              className="w-full bg-primary-container text-on-primary-container font-headline font-bold py-4 rounded-full shadow-lg active:scale-95 transition-transform disabled:opacity-70"
            >
              {isLoading ? '...Saving Order' : 'Next: Payment Method'}
            </button>
          </form>
        )}

        {/* STEP 2: Payment Details */}
        {currentStep === 'payment' && (
          <section className="space-y-6">
            <div className="bg-primary-container/10 border-2 border-primary-container rounded-3xl p-6">
              <h2 className="font-headline font-bold text-lg mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container">bank</span>
                Bank Transfer
              </h2>
              <p className="text-outline font-body text-sm mb-6">Transfer exactly <span className="font-bold text-primary-container">₦{subtotal.toLocaleString()}</span> to the account below:</p>
              
              <div className="bg-surface rounded-2xl p-4 space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="font-label text-xs uppercase text-outline">Bank Name</span>
                  <span className="font-bold">Access Bank</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-outline-variant/20">
                  <span className="font-label text-xs uppercase text-outline">Account Name</span>
                  <span className="font-bold">Soji Shawarma Spot</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-outline-variant/20">
                  <span className="font-label text-xs uppercase text-outline">Account Number</span>
                  <span className="font-bold text-lg font-mono">0123456789</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-label text-xs uppercase text-outline">Reference</span>
                  <span className="font-bold font-mono text-sm">{orderRef}</span>
                </div>
              </div>

              <div className="bg-secondary/10 border border-secondary/30 rounded-2xl p-4 mb-6">
                <p className="text-secondary text-xs font-body">
                  ✓ Use the order reference as your transfer description<br/>
                  ✓ Screenshot the receipt after transfer<br/>
                  ✓ Upload receipt on next step for verification
                </p>
              </div>

              <button
                onClick={() => setCurrentStep('receipt')}
                className="w-full bg-primary-container text-on-primary-container font-headline font-bold py-4 rounded-full shadow-lg active:scale-95 transition-transform"
              >
                I&apos;ve Transferred, Next Step
              </button>
            </div>
          </section>
        )}

        {/* STEP 3: Receipt Upload */}
        {currentStep === 'receipt' && (
          <form onSubmit={handleReceiptUpload} className="space-y-6">
            <section>
              <h2 className="font-headline font-bold text-lg mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container">cloud_upload</span>
                Upload Receipt
              </h2>

              <div className="border-2 border-dashed border-primary-container/30 rounded-3xl p-8 flex flex-col items-center justify-center bg-primary-container/5 cursor-pointer hover:bg-primary-container/10 transition-colors relative">
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setReceiptFile(e.target.files[0]);
                      addToast('Receipt selected!', 'success');
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <span className="material-symbols-outlined text-5xl text-primary-container/50 mb-3">image</span>
                <p className="font-headline font-bold text-center mb-1">{receiptFile ? receiptFile.name : 'Tap to Upload'}</p>
                <p className="font-label text-xs text-outline">{receiptFile ? 'Selected ✓' : 'Screenshot of bank transfer'}</p>
              </div>

              <div className="bg-tertiary/10 border border-tertiary/30 rounded-2xl p-4">
                <p className="text-tertiary text-xs font-body">
                  📸 Make sure the receipt clearly shows<br/>
                  • Amount transferred<br/>
                  • Bank details<br/>
                  • Date & time<br/>
                  • Your reference number
                </p>
              </div>
            </section>

            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6">
              <h3 className="font-headline font-bold text-base mb-4">Delivery To</h3>
              <p className="font-body text-sm text-outline mb-2"><span className="font-bold text-on-surface">{formData.name}</span></p>
              <p className="font-body text-xs text-outline mb-4">{formData.phone}</p>
              <p className="font-body text-xs text-outline">📍 {formData.address}</p>
            </div>

            <button
              type="submit"
              disabled={isConfirming}
              className="w-full bg-primary-container text-on-primary-container font-headline font-bold py-4 rounded-full shadow-lg active:scale-95 transition-transform disabled:opacity-70"
            >
              {isConfirming ? '...Verifying Receipt' : 'Confirm Payment & Complete Order'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
