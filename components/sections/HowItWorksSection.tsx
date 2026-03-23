'use client';

import React, { useEffect, useRef, useState } from 'react';
import { RiShoppingCart2Line, RiFileList3Line, RiSmartphoneLine, RiBankCard2Line } from 'react-icons/ri';
import { useAppStore } from '@/store/appStore';

const STEPS = [
  { number: '01', icon: <RiFileList3Line size={26} />, title: 'Select a Service', desc: 'Browse our catalog and pick the platform you need — Telegram, WhatsApp, Instagram, and hundreds more.', color: 'var(--color-primary)' },
  { number: '02', icon: <RiShoppingCart2Line size={26} />, title: 'Place Your Order', desc: 'Choose your number, confirm in our dashboard, and proceed to checkout in seconds.', color: 'var(--color-primary)' },
  { number: '03', icon: <RiSmartphoneLine size={26} />, title: 'Receive Your OTP', desc: 'The OTP is delivered to your dashboard in seconds. Use it to complete verification instantly.', color: 'var(--color-primary)' },
  { number: '04', icon: <RiBankCard2Line size={26} />, title: 'Easy Recharge', desc: 'Top up your wallet anytime using fast, secure Nigerian payment methods.', color: 'var(--color-primary)' },
];

export default function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const setActiveSection = useAppStore((s) => s.setActiveSection);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setActiveSection('how-it-works'); },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [setActiveSection]);

  useEffect(() => {
    const interval = setInterval(() => setActiveStep((p) => (p + 1) % STEPS.length), 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="how-it-works" ref={sectionRef}
      style={{
        padding: 'clamp(60px, 8vw, 96px) clamp(16px, 4vw, 24px)',
        background: 'var(--color-bg)',
        borderTop: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)',
      }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(36px, 5vw, 56px)' }}>
          <span className="badge badge-primary" style={{ marginBottom: 16 }}>How It Works</span>
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: 14 }}>
            Four simple steps to{' '}
            <span style={{ color: 'var(--color-primary)' }}>get started.</span>
          </h2>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: 460, margin: '0 auto', lineHeight: 1.6, fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
            Our streamlined process gets you a working virtual number in under two minutes.
          </p>
        </div>

        {/* Steps grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}>
          {STEPS.map((step, i) => (
            <div key={step.number}
              onClick={() => setActiveStep(i)}
              style={{
                background: '#fff', border: `1px solid ${activeStep === i ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-lg)', padding: 'clamp(18px, 3vw, 26px)',
                cursor: 'pointer', position: 'relative', overflow: 'hidden',
                transition: 'all 0.25s ease',
                transform: activeStep === i ? 'translateY(-3px)' : 'none',
                boxShadow: activeStep === i ? `0 8px 28px rgba(37,99,235,0.1)` : '0 1px 4px rgba(0,0,0,0.05)',
              }}>

              {/* Step number watermark */}
              <div style={{
                position: 'absolute', top: -10, right: 10,
                fontFamily: 'var(--font-display)', fontWeight: 900,
                fontSize: '4.5rem', color: step.color, opacity: 0.06,
                lineHeight: 1, pointerEvents: 'none', userSelect: 'none',
              }}>
                {step.number}
              </div>

              <div style={{
                width: 50, height: 50, borderRadius: 13,
                background: `${step.color}12`, border: `1px solid ${step.color}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: step.color, marginBottom: 16, transition: 'all 0.3s',
              }}>
                {step.icon}
              </div>

              <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 8, color: 'var(--color-text)' }}>
                {step.title}
              </h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                {step.desc}
              </p>

              {/* Active bottom bar */}
              {activeStep === i && (
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
                  background: 'var(--color-primary)',
                  borderRadius: '0 0 14px 14px',
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 28 }}>
          {STEPS.map((step, i) => (
            <button key={i} onClick={() => setActiveStep(i)}
              style={{
                width: activeStep === i ? 24 : 8, height: 8, borderRadius: 99,
                background: activeStep === i ? step.color : '#D1D5DB',
                border: 'none', cursor: 'pointer', transition: 'all 0.3s', padding: 0,
              }} />
          ))}
        </div>
      </div>
    </section>
  );
}
