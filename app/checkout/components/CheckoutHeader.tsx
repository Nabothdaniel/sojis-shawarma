import React from 'react';
import { CheckoutStep } from '../types';

interface CheckoutHeaderProps {
  currentStep: CheckoutStep;
  setCurrentStep: (step: CheckoutStep) => void;
  router: any;
}

export function CheckoutHeader({ currentStep, setCurrentStep, router }: CheckoutHeaderProps) {
  const checkoutSteps: CheckoutStep[] = ['delivery', 'payment', 'receipt'];
  const stepIndex = checkoutSteps.indexOf(currentStep);
  const progressStepIndex = currentStep === 'success' ? checkoutSteps.length - 1 : stepIndex;

  return (
    <>
      <header className="px-6 py-6 flex items-center gap-4 bg-surface sticky top-0 z-40">
        <button
          onClick={() => currentStep === 'delivery' ? router.back() : setCurrentStep('delivery')}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <h1 className="font-headline font-bold text-xl">Checkout</h1>
      </header>

      <div className="flex gap-2 h-1.5 w-full mb-8">
        <div className={`flex-1 rounded-full ${progressStepIndex >= 0 ? 'bg-primary-container' : 'bg-outline-variant/30'}`}></div>
        <div className={`flex-1 rounded-full ${progressStepIndex >= 1 ? 'bg-primary-container' : 'bg-outline-variant/30'}`}></div>
        <div className={`flex-1 rounded-full ${progressStepIndex >= 2 ? 'bg-primary-container' : 'bg-outline-variant/30'}`}></div>
      </div>
    </>
  );
}
