'use client';

import React from 'react';
import { RiArrowRightLine, RiLoginBoxLine, RiUserAddLine } from 'react-icons/ri';
import { useAppStore } from '@/store/appStore';

export default function CTASection() {
  const { email, setEmail, submitEmail } = useAppStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitEmail(email);
  };

  return (
    <section
      style={{
        padding: '96px 24px',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--color-bg-2)',
        borderTop: '1px solid var(--color-border)',
      }}
    >
      {/* Gradient mesh background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(0,229,255,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 60% 50% at 20% 0%, rgba(124,58,237,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Decorative ring */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600,
          height: 600,
          borderRadius: '50%',
          border: '1px solid rgba(0,229,255,0.05)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          height: 400,
          borderRadius: '50%',
          border: '1px solid rgba(0,229,255,0.07)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          maxWidth: 680,
          margin: '0 auto',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <span className="badge badge-primary" style={{ marginBottom: 24 }}>
          Get Started Today
        </span>

        <h2
          style={{
            fontSize: 'clamp(2rem, 4.5vw, 3.2rem)',
            fontWeight: 800,
            marginBottom: 20,
            lineHeight: 1.1,
          }}
        >
          Start using our{' '}
          <span className="gradient-text">services now.</span>
        </h2>

        <p
          style={{
            color: 'var(--color-text-muted)',
            fontSize: '1rem',
            lineHeight: 1.7,
            marginBottom: 48,
            maxWidth: 480,
            margin: '0 auto 48px',
          }}
        >
          Join thousands of Nigerians who protect their identity daily with BamzySMS virtual numbers.
          Sign up free — no credit card required.
        </p>

        {/* Auth buttons */}
        <div
          style={{
            display: 'flex',
            gap: 14,
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: 40,
          }}
        >
          <button
            className="btn-ghost"
            style={{ padding: '14px 28px', fontSize: '0.95rem' }}
          >
            <RiLoginBoxLine size={18} />
            Log In
          </button>
          <button
            className="btn-primary"
            style={{ padding: '14px 28px', fontSize: '0.95rem' }}
          >
            <RiUserAddLine size={18} />
            Create Account
            <RiArrowRightLine size={16} />
          </button>
        </div>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 32,
            maxWidth: 440,
            margin: '0 auto 32px',
          }}
        >
          <div className="divider" style={{ flex: 1 }} />
          <span style={{ color: 'var(--color-text-faint)', fontSize: '0.78rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            or join the waitlist
          </span>
          <div className="divider" style={{ flex: 1 }} />
        </div>

        {/* Email CTA */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            gap: 12,
            maxWidth: 440,
            margin: '0 auto',
            flexWrap: 'wrap',
          }}
        >
          <input
            type="email"
            className="input-field"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />
          <button
            type="submit"
            className="btn-primary"
            style={{ padding: '14px 22px', fontSize: '0.875rem', whiteSpace: 'nowrap' }}
          >
            Notify Me
          </button>
        </form>
      </div>
    </section>
  );
}
