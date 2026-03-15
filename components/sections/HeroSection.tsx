'use client';

import React, { useEffect, useRef } from 'react';
import {
  RiShieldCheckLine,
  RiArrowRightLine,
  RiLockPasswordLine,
  RiMailLine,
} from 'react-icons/ri';
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
    <section
      id="home"
      ref={sectionRef}
      className="grid-bg"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        paddingTop: 120,
        paddingBottom: 96,
        paddingLeft: 24,
        paddingRight: 24,
      }}
    >
      {/* Glow orbs */}
      <div style={{
        position: 'absolute', top: '20%', left: '10%',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,229,255,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '5%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 760, width: '100%', textAlign: 'center', position: 'relative', zIndex: 1 }}>

        {/* Badge */}
        <div className="animate-fade-up" style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <span className="badge badge-primary">
            <RiShieldCheckLine size={13} />
            Nigeria&apos;s #1 Virtual SMS Platform
          </span>
        </div>

        {/* Headline */}
        <h1
          className="animate-fade-up delay-100"
          style={{
            fontSize: 'clamp(2.6rem, 6vw, 4.5rem)',
            fontWeight: 800,
            lineHeight: 1.05,
            marginBottom: 24,
            color: 'var(--color-text)',
          }}
        >
          Protect Your{' '}
          <span className="gradient-text">Identity.</span>
          <br />
          Verify Instantly.
        </h1>

        {/* Subheading */}
        <p
          className="animate-fade-up delay-200"
          style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
            color: 'var(--color-text-muted)',
            lineHeight: 1.7,
            maxWidth: 560,
            margin: '0 auto 48px',
          }}
        >
          Buy premium virtual phone numbers for OTP verification on Telegram, WhatsApp,
          Instagram & more. Stay anonymous, stay safe — starting from just{' '}
          <strong style={{ color: 'var(--color-primary)', fontWeight: 600 }}>₦2,000</strong>.
        </p>

        {/* Email signup form */}
        <form
          id="signup"
          onSubmit={handleSubmit}
          className="animate-fade-up delay-300"
          style={{
            display: 'flex',
            gap: 12,
            maxWidth: 480,
            margin: '0 auto 20px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 14, top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-faint)',
              pointerEvents: 'none', display: 'flex', zIndex: 1,
            }}>
              <RiMailLine size={17} />
            </span>
            <input
              type="email"
              className="input-field"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ paddingLeft: 44 }}
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            style={{ padding: '14px 24px', fontSize: '0.9rem', whiteSpace: 'nowrap' }}
          >
            Sign Up Free
            <RiArrowRightLine size={16} />
          </button>
        </form>

        {/* Trust note */}
        <p
          className="animate-fade-up delay-400"
          style={{
            color: 'var(--color-text-faint)',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            marginBottom: 64,
          }}
        >
          <RiLockPasswordLine size={13} />
          No spam. Unsubscribe anytime. 100% secure.
        </p>

        {/* Stats strip */}
        <div
          className="animate-fade-up delay-500"
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'clamp(24px, 5vw, 56px)',
            flexWrap: 'wrap',
            padding: '32px 24px',
            borderRadius: 'var(--radius-xl)',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--color-border)',
          }}
        >
          {STATS.map((stat, i) => (
            <React.Fragment key={stat.label}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                  color: 'var(--color-text)',
                  lineHeight: 1,
                  marginBottom: 6,
                }}>
                  {stat.value}
                </div>
                <div style={{ color: 'var(--color-text-faint)', fontSize: '0.75rem', letterSpacing: '0.04em' }}>
                  {stat.label}
                </div>
              </div>
              {i < STATS.length - 1 && (
                <div style={{
                  width: 1,
                  background: 'var(--color-border)',
                  alignSelf: 'stretch',
                  display: 'block',
                }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
