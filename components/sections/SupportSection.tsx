'use client';

import React, { useEffect, useRef } from 'react';
import { RiCustomerService2Line, RiWhatsappLine, RiMailSendLine, RiTimeLine, RiArrowRightLine } from 'react-icons/ri';
import { useAppStore } from '@/store/appStore';

const SUPPORT_CHANNELS = [
  { icon: <RiWhatsappLine size={24} />, title: 'WhatsApp Chat', desc: 'Instant responses via our WhatsApp channel. Join and get help from our team in real time.', action: 'Join Channel', href: '#', color: '#25D366' },
  { icon: <RiMailSendLine size={24} />, title: 'Email Support', desc: 'Reach our support team at support@bamzysms.com. We respond to every query within hours.', action: 'Send Email', href: 'mailto:support@bamzysms.com', color: 'var(--color-primary)' },
  { icon: <RiTimeLine size={24} />, title: '24/7 Availability', desc: 'Our platform runs around the clock. Automated number delivery works even when our team is offline.', action: 'Learn More', href: '#', color: 'var(--color-primary)' },
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
    <section id="support" ref={sectionRef}
      style={{ padding: 'clamp(60px, 8vw, 96px) clamp(16px, 4vw, 24px)', background: '#fff' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(36px, 5vw, 56px)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <div style={{
              width: 60, height: 60, borderRadius: 16,
              background: 'var(--color-primary-dim)', border: '1px solid var(--color-primary-glow)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)',
            }}>
              <RiCustomerService2Line size={28} />
            </div>
          </div>
          <span className="badge badge-primary" style={{ marginBottom: 16 }}>Support</span>
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: 14 }}>
            We provide{' '}
            <span style={{ color: 'var(--color-primary)' }}>24×7 support.</span>
          </h2>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: 440, margin: '0 auto', lineHeight: 1.6, fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
            Our team is always ready to solve your problems and answer every query, anytime.
          </p>
        </div>

        {/* Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16, maxWidth: 960, margin: '0 auto',
        }}>
          {SUPPORT_CHANNELS.map((channel) => (
            <div key={channel.title} className="stat-card">
              <div style={{
                width: 50, height: 50, borderRadius: 13,
                background: `${channel.color}12`, border: `1px solid ${channel.color}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: channel.color, marginBottom: 18,
              }}>
                {channel.icon}
              </div>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 8 }}>{channel.title}</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: 1.65, marginBottom: 20 }}>
                {channel.desc}
              </p>
              <a href={channel.href} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                color: channel.color, fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none',
              }}>
                {channel.action} <RiArrowRightLine size={15} />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


