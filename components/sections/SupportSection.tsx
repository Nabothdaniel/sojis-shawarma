'use client';

import React, { useEffect, useRef } from 'react';
import {
  RiCustomerService2Line,
  RiWhatsappLine,
  RiMailSendLine,
  RiTimeLine,
  RiArrowRightLine,
} from 'react-icons/ri';
import { useAppStore } from '@/store/appStore';

const SUPPORT_CHANNELS = [
  {
    icon: <RiWhatsappLine size={24} />,
    title: 'WhatsApp Chat',
    desc: 'Instant responses via our WhatsApp channel. Join and get help from our team in real time.',
    action: 'Join Channel',
    href: '#',
    color: '#25D366',
  },
  {
    icon: <RiMailSendLine size={24} />,
    title: 'Email Support',
    desc: 'Reach our support team at support@bamzysms.com. We respond to every query within hours.',
    action: 'Send Email',
    href: 'mailto:support@bamzysms.com',
    color: 'var(--color-primary)',
  },
  {
    icon: <RiTimeLine size={24} />,
    title: '24/7 Availability',
    desc: 'Our platform runs around the clock. Automated number delivery works even when our team is offline.',
    action: 'Learn More',
    href: '#',
    color: '#F59E0B',
  },
];

export default function SupportSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const setActiveSection = useAppStore((s) => s.setActiveSection);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setActiveSection('support'); },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [setActiveSection]);

  return (
    <section
      id="support"
      ref={sectionRef}
      style={{ padding: '96px 24px', position: 'relative', overflow: 'hidden' }}
    >
      {/* Glow */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,229,255,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 18,
                background: 'var(--color-primary-dim)',
                border: '1px solid rgba(0,229,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)',
                marginBottom: 0,
              }}
              className="animate-pulse-glow"
            >
              <RiCustomerService2Line size={32} />
            </div>
          </div>
          <span className="badge badge-primary" style={{ marginBottom: 20 }}>Support</span>
          <h2
            style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800,
              marginBottom: 16,
            }}
          >
            We provide{' '}
            <span className="gradient-text">24×7 support.</span>
          </h2>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
            Our highly trained support team is always ready to solve your problems and answer every query.
            Feel free to reach out anytime.
          </p>
        </div>

        {/* Support cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
            maxWidth: 960,
            margin: '0 auto',
          }}
        >
          {SUPPORT_CHANNELS.map((channel) => (
            <div
              key={channel.title}
              className="glass-card"
              style={{ padding: '32px 28px', borderRadius: 'var(--radius-lg)', transition: 'all 0.3s ease' }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: `${channel.color}15`,
                  border: `1px solid ${channel.color}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: channel.color,
                  marginBottom: 20,
                }}
              >
                {channel.icon}
              </div>

              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  marginBottom: 10,
                  color: 'var(--color-text)',
                }}
              >
                {channel.title}
              </h3>

              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: 1.65, marginBottom: 24 }}>
                {channel.desc}
              </p>

              <a
                href={channel.href}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  color: channel.color,
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                  transition: 'gap 0.2s',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.gap = '10px';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.gap = '6px';
                }}
              >
                {channel.action}
                <RiArrowRightLine size={15} />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
