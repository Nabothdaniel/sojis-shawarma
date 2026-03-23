'use client';

import React, { useEffect, useRef } from 'react';
import { RiShieldCheckLine, RiFlashlightLine, RiGlobalLine, RiUserSmileLine } from 'react-icons/ri';
import { useAppStore } from '@/store/appStore';

const FEATURES = [
  { icon: <RiShieldCheckLine size={22} />, title: 'Identity Protection', desc: 'Keep your real number private. Use virtual numbers to register on any platform without exposing your personal info.' },
  { icon: <RiFlashlightLine size={22} />, title: 'Instant Delivery', desc: 'Receive OTPs in seconds. Our fully automated system assigns you a number immediately after purchase.' },
  { icon: <RiGlobalLine size={22} />, title: 'All Major Platforms', desc: 'Works with Telegram, WhatsApp, Instagram, Facebook, TikTok, payment platforms, and hundreds more.' },
  { icon: <RiUserSmileLine size={22} />, title: 'No SIM, No Hassle', desc: 'Skip the queues, skip the forms. Getting a virtual number takes minutes, not days.' },
];

export default function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const setActiveSection = useAppStore((s) => s.setActiveSection);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setActiveSection('about'); },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [setActiveSection]);

  return (
    <section id="about" ref={sectionRef}
      style={{ padding: 'clamp(60px, 8vw, 96px) clamp(16px, 4vw, 24px)', position: 'relative', background: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ maxWidth: 620, marginBottom: 'clamp(36px, 5vw, 56px)' }}>
          <span className="badge badge-primary" style={{ marginBottom: 16 }}>About BamzySMS</span>
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: 16, lineHeight: 1.15 }}>
            The smarter way to verify{' '}
            <span style={{ color: 'var(--color-primary)' }}>without risk.</span>
          </h2>
          <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.75, fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
            BamzySMS gives you access to virtual phone numbers for instant SMS verification
            on any platform — no SIM card, no queues, no hassle.
          </p>
        </div>

        {/* Feature cards grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
        }}>
          {FEATURES.map((f) => (
            <div key={f.title} className="stat-card">
              <div style={{
                width: 46, height: 46, borderRadius: 12,
                background: 'var(--color-primary-dim)', border: '1px solid var(--color-primary-glow)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--color-primary)', marginBottom: 16,
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 8, color: 'var(--color-text)' }}>
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
