'use client';

import React, { useEffect, useRef } from 'react';
import {
  RiShieldCheckLine,
  RiFlashlightLine,
  RiGlobalLine,
  RiUserSmileLine,
} from 'react-icons/ri';
import { useAppStore } from '@/store/appStore';

const FEATURES = [
  {
    icon: <RiShieldCheckLine size={22} />,
    title: 'Identity Protection',
    desc: 'Keep your real number private. Use virtual numbers to register on any platform without exposing your personal info.',
  },
  {
    icon: <RiFlashlightLine size={22} />,
    title: 'Instant Delivery',
    desc: 'Receive OTPs in seconds. Our fully automated system assigns you a number immediately after purchase.',
  },
  {
    icon: <RiGlobalLine size={22} />,
    title: 'All Major Platforms',
    desc: 'Works with Telegram, WhatsApp, Instagram, Facebook, TikTok, payment platforms, and hundreds more.',
  },
  {
    icon: <RiUserSmileLine size={22} />,
    title: 'No SIM, No Hassle',
    desc: 'Skip the queues, skip the forms. Getting a virtual number takes minutes, not days.',
  },
];

export default function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const setActiveSection = useAppStore((s) => s.setActiveSection);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setActiveSection('about'); },
      { threshold: 0.4 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [setActiveSection]);

  return (
    <section
      id="about"
      ref={sectionRef}
      className="section-pad"
      style={{ padding: '96px 24px', position: 'relative' }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          right: '-10%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
          transform: 'translateY(-50%)',
        }}
      />

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ maxWidth: 620, marginBottom: 64 }}>
          <span className="badge badge-primary" style={{ marginBottom: 20 }}>About BamzySMS</span>
          <h2
            style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800,
              marginBottom: 20,
              lineHeight: 1.1,
            }}
          >
            The smarter way to verify{' '}
            <span className="gradient-text">without risk.</span>
          </h2>
          <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.75, fontSize: '1rem' }}>
            BamzySMS gives you access to virtual phone numbers for instant SMS verification
            on any platform. Previously, registering an extra account meant buying a new SIM card —
            filling out forms, passport data, wasted time and money. Not anymore.
          </p>
          <p
            style={{
              color: 'var(--color-text-muted)',
              lineHeight: 1.75,
              fontSize: '1rem',
              marginTop: 16,
            }}
          >
            Our service is designed for users who need one-time or recurring SMS verification,
            from social networks to payment systems, dating apps, and beyond. The entire process
            is automated, secure, and available 24/7.
          </p>
        </div>

        {/* Feature cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 20,
          }}
        >
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="glass-card"
              style={{
                padding: '28px 24px',
                borderRadius: 'var(--radius-lg)',
                transition: 'all 0.3s ease',
                animationDelay: `${i * 0.1}s`,
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  background: 'var(--color-primary-dim)',
                  border: '1px solid rgba(0,229,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary)',
                  marginBottom: 18,
                }}
              >
                {f.icon}
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  marginBottom: 10,
                  color: 'var(--color-text)',
                }}
              >
                {f.title}
              </h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: 1.65 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
