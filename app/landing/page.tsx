'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    // Detect device
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) setDeviceType('ios');
    else if (/android/.test(ua)) setDeviceType('android');

    // Capture install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsBannerVisible(true);
    });

    // Check if dismissal is stored
    const isDismissed = localStorage.getItem('pwa_banner_dismissed');
    if (isDismissed !== 'true' && !window.matchMedia('(display-mode: standalone)').matches) {
       setIsBannerVisible(true);
    }
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    } else {
      // Show manual instructions
      if (deviceType === 'ios') {
        alert('Tap the "Share" button then "Add to Home Screen"');
      } else if (deviceType === 'android') {
        alert('Tap the browser menu then "Add to Home Screen"');
      } else {
        alert('Click the install icon in your browser address bar');
      }
    }
  };

  const dismissBanner = () => {
    setIsBannerVisible(false);
    localStorage.setItem('pwa_banner_dismissed', 'true');
  };

  return (
    <div className="bg-surface min-h-screen text-on-surface">
      {/* PWA Banner */}
      {isBannerVisible && (
        <div className="bg-primary-container text-on-primary-container px-6 py-3 flex justify-between items-center fixed top-0 w-full z-[100] shadow-md animate-in slide-in-from-top duration-300">
          <p className="font-label font-bold text-[10px] uppercase tracking-wider">Fast experience: Install Soji's App</p>
          <div className="flex items-center gap-4">
            <button onClick={handleInstall} className="underline font-bold text-[10px] uppercase">Install</button>
            <button onClick={dismissBanner} className="material-symbols-outlined text-sm">close</button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-8 flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-primary-container rounded-3xl flex items-center justify-center mb-8 shadow-2xl rotate-3">
          <span className="material-symbols-outlined text-on-primary-container text-5xl">restaurant</span>
        </div>
        <h1 className="font-headline font-bold text-5xl leading-tight mb-4">Soji's <br/> <span className="text-primary italic">Shawarma</span></h1>
        <p className="font-body text-outline text-lg max-w-[280px] mb-10">Lagos's favorite juiciest shawarma delivery app.</p>
        
        <button 
          onClick={handleInstall}
          className="bg-on-surface text-surface px-10 py-5 rounded-full font-headline font-bold text-lg shadow-2xl active:scale-95 transition-transform"
        >
          Install App
        </button>
      </section>

      {/* How it Works */}
      <section className="py-16 px-8 bg-surface-container-low">
        <div className="max-w-md mx-auto">
          <h2 className="font-headline font-bold text-2xl mb-12 text-center">How It Works</h2>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="space-y-3">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <span className="material-symbols-outlined text-primary">menu_book</span>
              </div>
              <p className="font-label font-bold text-[10px] uppercase tracking-widest">Browse Menu</p>
            </div>
            <div className="space-y-3">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <span className="material-symbols-outlined text-primary">shopping_bag</span>
              </div>
              <p className="font-label font-bold text-[10px] uppercase tracking-widest">Place Order</p>
            </div>
            <div className="space-y-3">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <span className="material-symbols-outlined text-primary">delivery_dining</span>
              </div>
              <p className="font-label font-bold text-[10px] uppercase tracking-widest">Get Delivered</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-8 flex flex-col gap-8 max-w-md mx-auto">
        <div className="flex gap-6 items-start">
          <div className="p-3 bg-secondary/10 text-secondary rounded-xl">
             <span className="material-symbols-outlined">bolt</span>
          </div>
          <div>
            <h3 className="font-headline font-bold text-lg mb-1">Fast Delivery</h3>
            <p className="font-body text-sm text-outline">Under 30 minutes anywhere in our delivery zones.</p>
          </div>
        </div>
        <div className="flex gap-6 items-start">
          <div className="p-3 bg-tertiary/10 text-tertiary rounded-xl">
             <span className="material-symbols-outlined">send</span>
          </div>
          <div>
            <h3 className="font-headline font-bold text-lg mb-1">Live Updates</h3>
            <p className="font-body text-sm text-outline">Real-time tracking notifications via Telegram.</p>
          </div>
        </div>
        <div className="flex gap-6 items-start">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
             <span className="material-symbols-outlined">no_accounts</span>
          </div>
          <div>
            <h3 className="font-headline font-bold text-lg mb-1">No Signup Needed</h3>
            <p className="font-body text-sm text-outline">Order instantly as a guest. We respect your privacy.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-8 text-center border-t border-outline-variant/20">
        <div className="space-y-6">
          <p className="font-label font-bold text-[10px] uppercase tracking-widest opacity-40">© 2024 Soji's Shawarma Spot</p>
          <div className="flex justify-center gap-6 text-outline">
            <span className="material-symbols-outlined">language</span>
            <span className="material-symbols-outlined">alternate_email</span>
            <span className="material-symbols-outlined">chat</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
