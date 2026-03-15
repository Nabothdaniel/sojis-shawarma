'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  RiShoppingCart2Line,
  RiFileList3Line,
  RiSmartphoneLine,
  RiBankCard2Line,
} from 'react-icons/ri';
import { useAppStore } from '@/store/appStore';

const STEPS = [
  {
    number: '01',
    icon: <RiFileList3Line size={28} />,
    title: 'Select a Service',
    desc: 'Browse our catalog and pick the platform you need a virtual number for — Telegram, WhatsApp, Instagram, and hundreds more.',
    color: 'var(--color-primary)',
  },
  {
    number: '02',
    icon: <RiShoppingCart2Line size={28} />,
    title: 'Place Your Order',
    desc: 'Choose your preferred number, confirm your order in our clean dashboard, and proceed to the checkout.',
    color: '#7C3AED',
  },
  {
    number: '03',
    icon: <RiSmartphoneLine size={28} />,
    title: 'Receive Your OTP',
    desc: 'The OTP is delivered to your dashboard in seconds. Use it to complete verification on the platform of your choice.',
    color: '#10B981',
  },
  {
    number: '04',
    icon: <RiBankCard2Line size={28} />,
    title: 'Easy Recharge',
    desc: 'Top up your wallet anytime using our fast, secure Nigerian payment methods — bank transfer, cards, and more.',
    color: 'var(--color-accent)',
  },
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

  // Auto cycle steps
  useEffect(() => {
    const interval = setInterval(() => setActiveStep((p) => (p + 1) % STEPS.length), 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      style={{
        padding: '96px 24px',
        background: 'var(--color-bg-2)',
        borderTop: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Grid bg */}
      <div
        className="grid-bg"
        style={{ position: 'absolute', inset: 0, opacity: 0.5, pointerEvents: 'none' }}
      />

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <span className="badge badge-primary" style={{ marginBottom: 20 }}>How It Works</span>
          <h2
            style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800,
              marginBottom: 16,
            }}
          >
            Four simple steps to{' '}
            <span className="gradient-text">get started.</span>
          </h2>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
            Our streamlined process gets you a working virtual number in under two minutes.
          </p>
        </div>

        {/* Steps */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 20,
          }}
        >
          {STEPS.map((step, i) => (
            <div
              key={step.number}
              className="step-card"
              onClick={() => setActiveStep(i)}
              style={{
                cursor: 'pointer',
                borderColor: activeStep === i ? `${step.color}40` : 'var(--color-border)',
                background: activeStep === i ? `${step.color}08` : 'rgba(255,255,255,0.025)',
                transform: activeStep === i ? 'translateY(-4px)' : 'none',
                boxShadow: activeStep === i ? `0 16px 48px rgba(0,0,0,0.25), 0 0 0 1px ${step.color}30` : 'none',
              }}
            >
              {/* Step number */}
              <span
                className="step-number"
                style={{ color: `${step.color}20` }}
              >
                {step.number}
              </span>

              {/* Icon */}
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 14,
                  background: `${step.color}15`,
                  border: `1px solid ${step.color}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: step.color,
                  marginBottom: 20,
                  transition: 'all 0.3s',
                }}
              >
                {step.icon}
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
                {step.title}
              </h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: 1.65 }}>
                {step.desc}
              </p>

              {/* Active indicator */}
              {activeStep === i && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    borderRadius: '0 0 14px 14px',
                    background: `linear-gradient(90deg, transparent, ${step.color}, transparent)`,
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
          {STEPS.map((step, i) => (
            <button
              key={i}
              onClick={() => setActiveStep(i)}
              aria-label={`Step ${i + 1}`}
              style={{
                width: activeStep === i ? 24 : 8,
                height: 8,
                borderRadius: 99,
                background: activeStep === i ? step.color : 'var(--color-text-faint)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
