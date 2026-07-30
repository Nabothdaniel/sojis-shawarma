'use client';

import React, { useEffect, useState } from 'react';

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Show splash for 2.5 seconds, then begin fade out
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      // Wait for fade out animation (500ms) to unmount
      setTimeout(onComplete, 500);
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-on-background px-6 transition-opacity duration-500 ease-in-out selection:bg-primary-container selection:text-on-primary-container ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Ambient Glow (Tonal Depth) */}
      <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-primary-container/10 blur-[80px] pointer-events-none duration-[4000ms]"></div>
      
      {/* Center Content */}
      <div className="z-10 flex flex-col items-center text-center animate-[fadeInUp_1s_ease-out_forwards]">
        {/* Brand Icon (Stylized Flame) */}
        <div className="mb-6 relative">
          <span
            className="material-symbols-outlined text-[80px] text-primary-container drop-shadow-[0_0_15px_rgba(245,197,24,0.3)]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            local_fire_department
          </span>
        </div>
        
        {/* Brand Name */}
        <h1 className="font-headline text-4xl font-bold italic leading-tight tracking-tight text-surface">
          Uncle Soji&apos;s<br />Shawarma Spot
        </h1>
        
        {/* Decorative Element */}
        <div className="my-5 h-[2px] w-12 bg-gradient-to-r from-transparent via-primary-container/50 to-transparent"></div>
        
        {/* Location Label */}
        <p className="font-label text-[11px] uppercase tracking-[0.2em] text-primary-fixed-dim">
          Nasarawa State University, Keffi
        </p>
      </div>

      {/* Footer */}
      <div className="absolute bottom-10 z-10 w-full text-center">
        <p className="font-label text-[10px] uppercase tracking-[0.25em] text-surface-variant/40">
          Handcrafted with passion
        </p>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
