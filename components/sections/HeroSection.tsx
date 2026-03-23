'use client';

import React, { useEffect, useRef } from 'react';
import { RiShieldCheckLine, RiArrowRightLine, RiLockPasswordLine, RiMailLine } from 'react-icons/ri';
import { useAppStore } from '@/store/appStore';

const STATS = [
  { value: '50K+', label: 'Numbers Sold' },
  { value: '99.9%', label: 'Uptime' },
  { value: '24/7', label: 'Support' },
  { value: '₦2K', label: 'Starting Price' },
];

export default function HeroSection() {
  const { email, setEmail, submitEmail } = useAppStore();
  const sectionRef = useRef<HTMLElement>(null);
  const setActiveSection = useAppStore((s) => s.setActiveSection);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setActiveSection('home'); },
      { threshold: 0.4 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [setActiveSection]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitEmail(email);
  };

  return (
    <section id="home" ref={sectionRef} className="grid-bg hero-section"
      style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', position: 'relative', overflow: 'hidden',
        paddingTop: 100, paddingBottom: 80, paddingLeft: 20, paddingRight: 20,
      }}>

      {/* Soft glow orbs */}
      <div style={{
        position: 'absolute', top: '15%', left: '5%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(26,115,232,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '5%',
        width: 350, height: 350, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(37,99,235,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 760, width: '100%', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <span className="badge badge-primary">
            <RiShieldCheckLine size={13} />
            Nigeria&apos;s #1 Virtual SMS Platform
          </span>
        </div>

        <h1 style={{
          fontSize: 'clamp(2.2rem, 6vw, 4.2rem)', fontWeight: 800,
          lineHeight: 1.1, marginBottom: 20, color: 'var(--color-text)',
        }}>
          Protect Your{' '}
          <span style={{ color: 'var(--color-primary)' }}>Identity.</span>
          <br />Verify Instantly.
        </h1>

        <p style={{
          fontSize: 'clamp(0.95rem, 2.5vw, 1.15rem)',
          color: 'var(--color-text-muted)', lineHeight: 1.7,
          maxWidth: 540, margin: '0 auto 40px',
        }}>
          Buy premium virtual phone numbers for OTP verification on Telegram, WhatsApp,
          Instagram & more. Starting from just{' '}
          <strong style={{ color: 'var(--color-primary)', fontWeight: 600 }}>₦2,000</strong>.
        </p>

        {/* Email form */}
        <form id="signup" onSubmit={handleSubmit} className="hero-form"
          style={{ display: 'flex', gap: 10, maxWidth: 460, margin: '0 auto 16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--color-text-faint)', pointerEvents: 'none', display: 'flex', zIndex: 1,
            }}>
              <RiMailLine size={17} />
            </span>
            <input type="email" className="input-field" placeholder="Enter your email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              required style={{ paddingLeft: 42 }} />
          </div>
          <button type="submit" className="btn-primary"
            style={{ padding: '13px 22px', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
            Sign Up Free <RiArrowRightLine size={16} />
          </button>
        </form>

        <p style={{
          color: 'var(--color-text-faint)', fontSize: '0.78rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 6, marginBottom: 56,
        }}>
          <RiLockPasswordLine size={13} />
          No spam. Unsubscribe anytime. 100% secure.
        </p>

        {/* Stats strip */}
        <div className="stats-strip" style={{
          display: 'flex', justifyContent: 'center',
          gap: 'clamp(16px, 4vw, 48px)', flexWrap: 'wrap',
          padding: '28px 20px', borderRadius: 'var(--radius-xl)',
          background: '#fff', border: '1px solid var(--color-border)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        }}>
          {STATS.map((stat, i) => (
            <React.Fragment key={stat.label}>
              <div style={{ textAlign: 'center', minWidth: 60 }}>
                <div style={{
                  fontFamily: 'var(--font-display)', fontWeight: 800,
                  fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', color: '#1A73E8',
                  lineHeight: 1, marginBottom: 5,
                }}>
                  {stat.value}
                </div>
                <div style={{ color: 'var(--color-text-faint)', fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                  {stat.label}
                </div>
              </div>
              {i < STATS.length - 1 && (
                <div style={{ width: 1, background: 'var(--color-border)', alignSelf: 'stretch' }}
                  className="stat-divider" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 480px) {
          .hero-form { flex-direction: column; }
          .hero-form input, .hero-form button { width: 100%; }
          .stat-divider { display: none; }
          .stats-strip { gap: 20px !important; }
        }
      `}</style>
    </section>
  );
}

