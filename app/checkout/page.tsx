'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useAppStore } from '@/store/appStore';
import { useMutation } from '@tanstack/react-query';
import { orderService, userService, type PaymentSettings } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { Order } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  LuCircleCheck,
  LuMessageCircle,
  LuArrowLeft,
  LuMapPin,
  LuLocateFixed,
  LuLandmark,
  LuCloudUpload,
  LuImage
} from 'react-icons/lu';

type CheckoutStep = 'delivery' | 'payment' | 'receipt' | 'success';
type ProfileData = {
  id?: string | number;
  name?: string | null;
  phone?: string | null;
  address?: string | null;
  email?: string | null;
};

function mergeDeliveryDetails<T extends {
  name: string;
  phone: string;
  address: string;
}>(
  current: T,
  sources: Array<{
    name?: string | null;
    phone?: string | null;
    address?: string | null;
  } | null | undefined>
) {
  const next = { ...current };

  for (const source of sources) {
    if (!source) {
      continue;
    }

    if (!next.name && source.name) {
      next.name = source.name;
    }

    if (!next.phone && source.phone) {
      next.phone = source.phone;
    }

    if (!next.address && source.address) {
      next.address = source.address;
    }
  }

  return next;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  const { user, token: persistedToken, hasHydrated } = useAppStore();
  const { items, totalPrice, clearCart } = useCartStore();
  const { addToast, setUser } = useAppStore();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('delivery');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isGeoLoading, setIsGeoLoading] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [orderRef, setOrderRef] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    note: '',
    orderType: 'delivery' as 'delivery' | 'pickup',
    pickupTime: '',
    paymentMethod: 'bank_transfer' as 'bank_transfer' | 'cash_on_pickup',
    paymentReference: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const checkoutSteps: CheckoutStep[] = ['delivery', 'payment', 'receipt'];
  const stepIndex = checkoutSteps.indexOf(currentStep);
  const progressStepIndex = currentStep === 'success' ? checkoutSteps.length - 1 : stepIndex;
  const effectiveToken = token || persistedToken;
  const isSignedIn = hasHydrated && Boolean(effectiveToken || user);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && hasHydrated && !isSignedIn) {
      addToast('Please sign in before placing an order', 'info');
      router.replace('/login?redirect=/checkout');
    }
  }, [authLoading, hasHydrated, isSignedIn, addToast, router]);

  useEffect(() => {
    if (!hasHydrated || !isSignedIn || !user) {
      return;
    }

    setFormData((current) => mergeDeliveryDetails(current, [user]));
  }, [hasHydrated, isSignedIn, user]);

  useEffect(() => {
    let cancelled = false;

    const loadPaymentSettings = async () => {
      try {
        const response = await orderService.getPaymentSettings();
        if (!cancelled) {
          setPaymentSettings(response.data);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Could not load payment settings', error);
        }
      }
    };

    loadPaymentSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  const subtotal = totalPrice();

  const { mutate: placeOrder, isPending: isLoading } = useMutation({
    mutationFn: (orderData: any) => orderService.createOrder(orderData),
    onSuccess: (response: any) => {
      const result = response?.data ?? response;

      if (!result?.id || !result?.order_ref) {
        addToast('Order was created, but the response was incomplete', 'error');
        return;
      }

      setOrderId(result.id);
      setOrderRef(result.order_ref);
      setCurrentStep(formData.paymentMethod === 'cash_on_pickup' ? 'success' : 'payment');
      addToast(
        formData.paymentMethod === 'cash_on_pickup'
          ? 'Order submitted. Wait for admin confirmation before pickup.'
          : 'Order details saved. Proceed with payment.',
        'success'
      );
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
      if (formData.paymentReference.trim()) {
        uploadData.append('payment_reference', formData.paymentReference.trim());
      }
      return orderService.confirmPayment(orderId, uploadData);
    },
    onSuccess: () => {
      setCurrentStep('success');
      clearCart();
      addToast('Payment proof submitted. Await admin confirmation.', 'success');
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
    if (formData.orderType === 'delivery' && !formData.address.trim()) {
      newErrors.address = 'Delivery address is required';
    }
    if (formData.orderType === 'pickup' && !formData.pickupTime.trim()) {
      newErrors.pickupTime = 'Pickup time is required';
    }

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
      delivery_address: formData.orderType === 'pickup'
        ? (paymentSettings?.pickup_address || 'Pickup')
        : formData.address.trim(),
      order_type: formData.orderType,
      payment_method: formData.paymentMethod,
      pickup_time: formData.orderType === 'pickup' ? formData.pickupTime.trim() : '',
      items: items,
      total_amount: subtotal,
      payment_reference: formData.paymentReference.trim() || undefined,
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
  if (!isMounted || authLoading || !hasHydrated || !isSignedIn) return null;

  if (currentStep === 'success') {
    return (
      <div className="bg-surface text-on-surface min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-tertiary/10 rounded-full flex items-center justify-center mb-6 text-tertiary">
          <LuCircleCheck className="text-5xl" />
        </div>
        <h1 className="font-headline font-bold text-3xl mb-3">
          {formData.paymentMethod === 'cash_on_pickup' ? 'Order Sent! ✓' : 'Payment Submitted! ✓'}
        </h1>
        <p className="text-outline font-body text-base mb-2">Order Ref: <span className="font-bold text-primary-container">{orderRef}</span></p>
        <p className="text-outline font-body text-base mb-10 max-w-[280px]">
          {formData.paymentMethod === 'cash_on_pickup'
            ? 'Your order is awaiting admin confirmation. We’ll notify you when it is accepted and when it is ready for pickup.'
            : 'Your payment proof is awaiting admin review. We’ll notify you in-app and by WhatsApp once it is confirmed.'}
        </p>
        <button
          onClick={() => router.push(orderId ? `/orders/${orderId}` : '/orders')}
          className="mb-4 bg-primary-container text-on-primary-container font-headline font-bold px-12 py-4 rounded-full shadow-xl active:scale-95 transition-transform"
        >
          Track this order
        </button>
        <button
          onClick={() => router.push('/')}
          className="bg-on-surface text-surface font-headline font-bold px-12 py-4 rounded-full shadow-xl active:scale-95 transition-transform"
        >
          Back to Home
        </button>
        <a
          href={`https://wa.me/${(paymentSettings?.support_whatsapp || '2348012345678').replace(/\D/g, '')}?text=${encodeURIComponent(`Hello, I just placed an order with reference ${orderRef}. I would like to chat.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-center gap-2 bg-green-500 text-white font-headline font-bold px-12 py-4 rounded-full shadow-lg active:scale-95 transition-transform"
        >
          <LuMessageCircle className="text-xl" />
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
          <LuArrowLeft className="text-xl" />
        </button>
        <h1 className="font-headline font-bold text-xl">Checkout</h1>
      </header>

      <main className="flex-1 px-6 space-y-8 max-w-md mx-auto w-full">
        {/* Progress indicator */}
        <div className="flex gap-2 h-1.5 w-full">
          <div className={`flex-1 rounded-full ${progressStepIndex >= 0 ? 'bg-primary-container' : 'bg-outline-variant/30'}`}></div>
          <div className={`flex-1 rounded-full ${progressStepIndex >= 1 ? 'bg-primary-container' : 'bg-outline-variant/30'}`}></div>
          <div className={`flex-1 rounded-full ${progressStepIndex >= 2 ? 'bg-primary-container' : 'bg-outline-variant/30'}`}></div>
        </div>

        {/* STEP 1: Delivery Details */}
        {currentStep === 'delivery' && (
          <form onSubmit={handlePlaceOrder} className="space-y-6">
            <section>
              <h2 className="font-headline font-bold text-lg mb-4 flex items-center gap-2">
                <LuMapPin className="text-primary-container" />
                Fulfilment Details
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData((current) => ({ ...current, orderType: 'delivery' }))}
                    className={`rounded-2xl border px-4 py-4 text-left ${formData.orderType === 'delivery' ? 'border-primary-container bg-primary-container/10' : 'border-outline-variant/30 bg-transparent'}`}
                  >
                    <p className="font-headline font-bold text-sm">Delivery</p>
                    <p className="text-xs text-outline mt-1">Send to customer address</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((current) => ({ ...current, orderType: 'pickup' }))}
                    className={`rounded-2xl border px-4 py-4 text-left ${formData.orderType === 'pickup' ? 'border-primary-container bg-primary-container/10' : 'border-outline-variant/30 bg-transparent'}`}
                  >
                    <p className="font-headline font-bold text-sm">Pickup</p>
                    <p className="text-xs text-outline mt-1">Customer comes to collect</p>
                  </button>
                </div>

                <Input
                  type="text"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                  error={errors.name}
                />

                <Input
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    if (errors.phone) setErrors({ ...errors, phone: '' });
                  }}
                  error={errors.phone}
                />

                {formData.orderType === 'delivery' ? (
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
                        <LuLocateFixed className="text-sm" />
                        Detect
                      </button>
                    </div>
                    <textarea
                      placeholder="Street, House No, Keffi"
                      rows={3}
                      className={`w-full bg-transparent border border-outline-variant/30 rounded-2xl py-4 px-6 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container/30 transition-all resize-none ${errors.address ? 'ring-2 ring-red-500/50' : ''}`}
                      value={formData.address}
                      onChange={(e) => {
                        setFormData({ ...formData, address: e.target.value });
                        if (errors.address) setErrors({ ...errors, address: '' });
                      }}
                    />
                    {errors.address && <p className="text-red-500 text-[10px] font-bold px-4 uppercase tracking-wider">{errors.address}</p>}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low px-5 py-4 text-sm">
                      <p className="font-label text-[10px] uppercase tracking-widest text-outline font-bold">Pickup Address</p>
                      <p className="mt-2 font-body">{paymentSettings?.pickup_address || 'Pickup counter'}</p>
                      {paymentSettings?.pickup_instructions && (
                        <p className="mt-2 text-xs text-outline">{paymentSettings.pickup_instructions}</p>
                      )}
                    </div>
                    <Input
                      type="text"
                      placeholder="Preferred pickup time e.g. 5:30 PM"
                      value={formData.pickupTime}
                      onChange={(e) => {
                        setFormData({ ...formData, pickupTime: e.target.value });
                        if (errors.pickupTime) setErrors({ ...errors, pickupTime: '' });
                      }}
                      error={errors.pickupTime}
                    />
                  </div>
                )}
                <div className="space-y-3">
                  <p className="font-label text-[10px] uppercase tracking-widest text-outline font-bold px-1">Payment Method</p>
                  <div className="grid grid-cols-1 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData((current) => ({ ...current, paymentMethod: 'bank_transfer' }))}
                      className={`rounded-2xl border px-4 py-4 text-left ${formData.paymentMethod === 'bank_transfer' ? 'border-primary-container bg-primary-container/10' : 'border-outline-variant/30 bg-transparent'}`}
                    >
                      <p className="font-headline font-bold text-sm">Bank transfer</p>
                      <p className="text-xs text-outline mt-1">Customer pays now, admin confirms after receipt review.</p>
                    </button>
                    {formData.orderType === 'pickup' && (
                      <button
                        type="button"
                        onClick={() => setFormData((current) => ({ ...current, paymentMethod: 'cash_on_pickup' }))}
                        className={`rounded-2xl border px-4 py-4 text-left ${formData.paymentMethod === 'cash_on_pickup' ? 'border-primary-container bg-primary-container/10' : 'border-outline-variant/30 bg-transparent'}`}
                      >
                        <p className="font-headline font-bold text-sm">Pay on pickup</p>
                        <p className="text-xs text-outline mt-1">Customer places the order now and the admin confirms payment later.</p>
                      </button>
                    )}
                  </div>
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
                  <span className="font-label font-bold text-secondary">{formData.orderType === 'pickup' ? 'Pickup' : 'Free'}</span>
                </div>
                <div className="pt-3 border-t border-outline-variant/20 flex justify-between items-center">
                  <span className="font-headline font-bold">Total</span>
                  <span className="font-label font-bold text-primary-container text-lg" style={{ color: '#EAB600' }}>
                    ₦{subtotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </section>

            <Button
              type="submit"
              disabled={isLoading || isGeoLoading}
              isLoading={isLoading}
              variant="primary"
              className="w-full"
            >
              {formData.paymentMethod === 'cash_on_pickup' ? 'Submit Pickup Order' : 'Next: Payment'}
            </Button>
          </form>
        )}

        {/* STEP 2: Payment Details */}
        {currentStep === 'payment' && (
          <section className="space-y-6">
            <div className="bg-primary-container/10 border-2 border-primary-container rounded-3xl p-6">
              <h2 className="font-headline font-bold text-lg mb-4 flex items-center gap-2">
                <LuLandmark className="text-primary-container" />
                {formData.paymentMethod === 'cash_on_pickup' ? 'Pay on Pickup' : 'Bank Transfer'}
              </h2>
              {formData.paymentMethod === 'cash_on_pickup' ? (
                <p className="text-outline font-body text-sm mb-6">Your order is waiting for admin approval. Payment will be confirmed later when you arrive for pickup.</p>
              ) : (
                <p className="text-outline font-body text-sm mb-6">Transfer exactly <span className="font-bold text-primary-container">₦{subtotal.toLocaleString()}</span> to the account below:</p>
              )}

              {formData.paymentMethod === 'bank_transfer' && (
                <div className="bg-surface rounded-2xl p-4 space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="font-label text-xs uppercase text-outline">Bank Name</span>
                    <span className="font-bold">{paymentSettings?.payment_bank_name || 'Bank'}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-outline-variant/20">
                    <span className="font-label text-xs uppercase text-outline">Account Name</span>
                    <span className="font-bold">{paymentSettings?.payment_account_name || 'Store Account'}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-outline-variant/20">
                    <span className="font-label text-xs uppercase text-outline">Account Number</span>
                    <span className="font-bold text-lg font-mono">{paymentSettings?.payment_account_number || '0000000000'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-label text-xs uppercase text-outline">Reference</span>
                    <span className="font-bold font-mono text-sm">{orderRef}</span>
                  </div>
                </div>
              )}

              <div className="bg-secondary/10 border border-secondary/30 rounded-2xl p-4 mb-6">
                <p className="text-secondary text-xs font-body">
                  {formData.paymentMethod === 'bank_transfer' ? (
                    <>
                      ✓ Use the order reference as your transfer description<br />
                      ✓ Screenshot the receipt after transfer<br />
                      ✓ Upload receipt on the next step for admin verification
                    </>
                  ) : (
                    <>
                      ✓ The admin will confirm this order before pickup<br />
                      ✓ Bring your order reference when you arrive<br />
                      ✓ Payment remains pending until the admin marks it confirmed
                    </>
                  )}
                </p>
              </div>

              {formData.paymentMethod === 'bank_transfer' && (
                <input
                  type="text"
                  placeholder="Transfer reference or sender name (optional)"
                  className="mb-6 w-full rounded-2xl border border-outline-variant/30 bg-transparent px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-primary-container/30"
                  value={formData.paymentReference}
                  onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
                />
              )}

              <Button
                variant="primary"
                className="w-full"
                onClick={() => {
                  if (formData.paymentMethod === 'cash_on_pickup') {
                    clearCart();
                    setCurrentStep('success');
                    return;
                  }
                  setCurrentStep('receipt');
                }}
              >
                {formData.paymentMethod === 'cash_on_pickup' ? 'Finish Order Request' : 'I\'ve Transferred, Next Step'}
              </Button>
            </div>
          </section>
        )}

        {/* STEP 3: Receipt Upload */}
        {currentStep === 'receipt' && (
          <form onSubmit={handleReceiptUpload} className="space-y-6">
            <section>
              <h2 className="font-headline font-bold text-lg mb-4 flex items-center gap-2">
                <LuCloudUpload className="text-primary-container" />
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
                <LuImage className="text-5xl text-primary-container/50 mb-3" />
                <p className="font-headline font-bold text-center mb-1">{receiptFile ? receiptFile.name : 'Tap to Upload'}</p>
                <p className="font-label text-xs text-outline">{receiptFile ? 'Selected ✓' : 'Screenshot of bank transfer'}</p>
              </div>

              <div className="bg-tertiary/10 border border-tertiary/30 rounded-2xl p-4">
                <p className="text-tertiary text-xs font-body">
                  📸 Make sure the receipt clearly shows<br />
                  • Amount transferred<br />
                  • Bank details<br />
                  • Date & time<br />
                  • Your reference number
                </p>
              </div>
              <input
                type="text"
                placeholder="Transfer reference or sender name (optional)"
                className="w-full rounded-2xl border border-outline-variant/30 bg-transparent px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-primary-container/30"
                value={formData.paymentReference}
                onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
              />
            </section>

            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6">
              <h3 className="font-headline font-bold text-base mb-4">Delivery To</h3>
              <p className="font-body text-sm text-outline mb-2"><span className="font-bold text-on-surface">{formData.name}</span></p>
              <p className="font-body text-xs text-outline mb-4">{formData.phone}</p>
              <p className="font-body text-xs text-outline">📍 {formData.orderType === 'pickup' ? (paymentSettings?.pickup_address || 'Pickup') : formData.address}</p>
            </div>

            <Button
              type="submit"
              disabled={isConfirming}
              isLoading={isConfirming}
              variant="primary"
              className="w-full"
            >
              Submit Proof & Complete Order
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}
