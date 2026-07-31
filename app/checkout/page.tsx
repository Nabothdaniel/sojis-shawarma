'use client';

import React from 'react';
import { useCheckout } from './hooks/useCheckout';
import {
  CheckoutHeader,
  DeliveryStep,
  PaymentStep,
  ReceiptStep,
  SuccessStep
} from './components';

export default function CheckoutPage() {
  const checkoutState = useCheckout();
  
  if (!checkoutState.isMounted || checkoutState.authLoading || !checkoutState.hasHydrated || !checkoutState.isSignedIn) {
    return null; // Ensure client hydration rendering stability
  }

  if (checkoutState.currentStep === 'success') {
    return <SuccessStep {...checkoutState} />;
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col pb-32">
      <CheckoutHeader 
        currentStep={checkoutState.currentStep} 
        setCurrentStep={checkoutState.setCurrentStep} 
        router={checkoutState.router} 
      />
      
      <main className="flex-1 px-6 space-y-8 max-w-md mx-auto w-full">
        {checkoutState.currentStep === 'delivery' && <DeliveryStep {...checkoutState} />}
        {checkoutState.currentStep === 'payment' && <PaymentStep {...checkoutState} />}
        {checkoutState.currentStep === 'receipt' && <ReceiptStep {...checkoutState} />}
      </main>
    </div>
  );
}
