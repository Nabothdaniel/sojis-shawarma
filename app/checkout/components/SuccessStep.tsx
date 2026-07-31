import React from 'react';
import { useCheckout } from '../hooks/useCheckout';

export function SuccessStep(props: ReturnType<typeof useCheckout>) {
  const { formData, orderRef, orderId, paymentSettings, isSignedIn, router } = props;

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-tertiary/10 rounded-full flex items-center justify-center mb-6 text-tertiary">
        <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
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
      {!isSignedIn && (
        <div className="mt-8 pt-6 border-t border-outline-variant/30 w-full max-w-[280px]">
          <p className="text-sm font-label text-outline mb-3">Want to easily track this order and earn points on your next?</p>
          <button
            onClick={() => router.push('/login?redirect=/orders')}
            className="w-full bg-surface-container-high text-on-surface px-6 py-4 rounded-full font-headline font-bold shadow-sm active:scale-95 transition-transform"
          >
            Create an account
          </button>
        </div>
      )}
      <a
        href={`https://wa.me/${(paymentSettings?.support_whatsapp || '2348012345678').replace(/\D/g, '')}?text=${encodeURIComponent(`Hello, I just placed an order with reference ${orderRef}. I would like to chat.`)}`}
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
