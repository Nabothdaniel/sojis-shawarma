'use client';

import React, { useState, useEffect } from 'react';

const SLIDES = [
  {
    title: 'Instant OTP Delivery',
    desc: 'Receive your verification codes in seconds from hundreds of platforms worldwide.',
    image: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 80%)'
  },
  {
    title: 'Secure & Private',
    desc: 'Protect your identity. Use our virtual numbers instead of your personal phone number.',
    image: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.08) 0%, transparent 70%)'
  },
  {
    title: 'Easy Recharge',
    desc: 'Top up your wallet instantly using fast and secure Nigerian payment methods.',
    image: 'radial-gradient(circle at 80% 70%, rgba(255,255,255,0.08) 0%, transparent 70%)'
  }
];

export default function AuthCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setActive((p) => (p + 1) % SLIDES.length), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="auth-image-side" style={{ 
      background: 'var(--color-primary)',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
    }}>
      {/* Decorative Orbs */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div style={{ 
          position: 'absolute', top: '-10%', right: '-10%', width: '60%', height: '60%', 
          borderRadius: '50%', background: 'rgba(255,255,255,0.05)', filter: 'blur(80px)' 
        }} />
        <div style={{ 
          position: 'absolute', bottom: '-10%', left: '-10%', width: '50%', height: '50%', 
          borderRadius: '50%', background: 'rgba(255,255,255,0.03)', filter: 'blur(80px)' 
        }} />
      </div>

      <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {SLIDES.map((slide, i) => (
          <div key={i} className="auth-carousel-slide" style={{ 
            opacity: active === i ? 1 : 0,
            transform: `translateY(${active === i ? 0 : 20}px)`,
            pointerEvents: active === i ? 'auto' : 'none'
          }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 20 }}>{slide.title}</h2>
            <p style={{ fontSize: '1.1rem', opacity: 0.8, maxWidth: 400, margin: '0 auto', lineHeight: 1.6 }}>
              {slide.desc}
            </p>
          </div>
        ))}

        {/* Dots */}
        <div style={{ position: 'absolute', bottom: 60, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 10 }}>
          {SLIDES.map((_, i) => (
            <button key={i} className={`auth-carousel-dot ${active === i ? 'active' : ''}`} onClick={() => setActive(i)} />
          ))}
        </div>
      </div>
    </div>
  );
}
