'use client';

import React from 'react';
import { RiArrowRightLine, RiLoginBoxLine, RiUserAddLine } from 'react-icons/ri';
import Link from 'next/link';
import { useAppStore } from '@/store/appStore';

export default function CTASection() {
  const { email, setEmail, submitEmail } = useAppStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitEmail(email);
  };

  return (
    <section style={{
      padding: 'clamp(60px, 8vw, 96px) clamp(16px, 4vw, 24px)',
      background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)', position: 'relative', overflow: 'hidden',
    }}>
      {/* Soft bg radial gradient */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 80% 60% at 50% 100%, var(--color-primary-dim) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <span className="badge badge-primary" style={{ marginBottom: 20 }}>Get Started Today</span>

        <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)', fontWeight: 800, marginBottom: 16, lineHeight: 1.15 }}>
          Start using our{' '}
          <span style={{ color: 'var(--color-primary)' }}>services now.</span>
        </h2>

        <p style={{
          color: 'var(--color-text-muted)', fontSize: 'clamp(0.875rem, 2vw, 1rem)',
          lineHeight: 1.7, marginBottom: 40, maxWidth: 460, margin: '0 auto 40px',
        }}>
          Join thousands of Nigerians who protect their identity daily with BamzySMS virtual numbers.
        </p>

        {/* Buttons */}
        <div className="cta-btns" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 36 }}>
          <Link href="/login" style={{ textDecoration: 'none' }}>
            <button className="btn-ghost" style={{ padding: '13px 26px', fontSize: '0.95rem' }}>
              <RiLoginBoxLine size={18} /> Log In
            </button>
          </Link>
          <Link href="/register" style={{ textDecoration: 'none' }}>
            <button className="btn-primary" style={{ padding: '13px 26px', fontSize: '0.95rem' }}>
              <RiUserAddLine size={18} /> Create Account <RiArrowRightLine size={16} />
            </button>
          </Link>
        </div>

        {/* OR divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28, maxWidth: 400, margin: '0 auto 28px' }}>
          <div className="divider" style={{ flex: 1 }} />
          <span style={{ color: 'var(--color-text-faint)', fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>or join the waitlist</span>
          <div className="divider" style={{ flex: 1 }} />
        </div>

        {/* Waitlist form */}
        <form onSubmit={handleSubmit} className="cta-form"
          style={{ display: 'flex', gap: 10, maxWidth: 420, margin: '0 auto', flexWrap: 'wrap' }}>
          <input type="email" className="input-field" placeholder="your@email.com"
            value={email} onChange={(e) => setEmail(e.target.value)}
            style={{ flex: 1, minWidth: 200 }} />
          <button type="submit" className="btn-primary"
            style={{ padding: '13px 20px', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
            Notify Me
          </button>
        </form>
      </div>

      <style>{`
        @media (max-width: 480px) {
          .cta-btns { flex-direction: column; align-items: stretch; }
          .cta-btns a { width: 100%; }
          .cta-btns button { width: 100%; }
          .cta-form { flex-direction: column; }
          .cta-form input, .cta-form button { width: 100%; }
        }
      `}</style>
    </section>
  );
}
