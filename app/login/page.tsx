'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RiEyeLine, RiEyeOffLine, RiMailLine, RiLockLine, RiSignalTowerFill } from 'react-icons/ri';
import { useAppStore } from '@/store/appStore';
import PageLoader from '@/components/ui/PageLoader';

export default function LoginPage() {
  const router = useRouter();
  const { login, addToast } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) { addToast('Please fill in all fields.', 'error'); return; }
    setLoading(true);
    // Simulate auth
    await new Promise((r) => setTimeout(r, 1200));
    login({
      name: 'Demo User',
      email: form.email,
      phone: '+234 800 000 0000',
      balance: 0,
      smsUnits: 0,
      referralCode: 'BAMZY' + Math.random().toString(36).slice(2, 8).toUpperCase(),
    });
    addToast('Welcome back!', 'success');
    router.push('/dashboard');
  };

  return (
    <>
      {loading && <PageLoader />}
      <div
        className="auth-bg"
        style={{
          minHeight: '100vh', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          padding: '24px', position: 'relative', overflow: 'hidden',
        }}
      >
        {/* Decorative wavy shapes */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          overflow: 'hidden', pointerEvents: 'none', zIndex: 0,
        }}>
          <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <defs>
              <radialGradient id="rg1" cx="20%" cy="50%" r="60%">
                <stop offset="0%" stopColor="rgba(0,229,255,0.08)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
              <radialGradient id="rg2" cx="85%" cy="20%" r="50%">
                <stop offset="0%" stopColor="rgba(124,58,237,0.07)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <rect width="1440" height="900" fill="url(#rg1)" />
            <rect width="1440" height="900" fill="url(#rg2)" />
            <path d="M0,400 C200,320 400,480 600,380 S1000,260 1440,340 L1440,900 L0,900 Z"
              fill="rgba(0,229,255,0.03)" />
            <path d="M0,500 C300,420 500,560 800,460 S1200,340 1440,420 L1440,900 L0,900 Z"
              fill="rgba(124,58,237,0.03)" />
          </svg>
        </div>

        <div className="auth-card" style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--color-primary), #0EA5E9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px var(--color-primary-glow)',
            }}>
              <RiSignalTowerFill size={20} color="#000" />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem' }}>
              bamzy<span style={{ color: 'var(--color-primary)' }}>SMS</span>
            </span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.75rem', marginBottom: 8 }}>
            Sign In
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: 28 }}>
            Enter your email and password to login
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 8, color: 'var(--color-text-muted)' }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)', display: 'flex' }}>
                  <RiMailLine size={16} />
                </span>
                <input
                  name="email" type="email" className="input-field"
                  placeholder="Enter Email" value={form.email}
                  onChange={handleChange} style={{ paddingLeft: 42 }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 8, color: 'var(--color-text-muted)' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)', display: 'flex' }}>
                  <RiLockLine size={16} />
                </span>
                <input
                  name="password" type={showPass ? 'text' : 'password'}
                  className="input-field" placeholder="Enter Password"
                  value={form.password} onChange={handleChange}
                  style={{ paddingLeft: 42, paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-faint)', display: 'flex' }}>
                  {showPass ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                <button type="button" className={`toggle ${rememberMe ? 'on' : ''}`}
                  onClick={() => setRememberMe(!rememberMe)} aria-label="Remember me" />
                Remember Me
              </label>
              <Link href="#" style={{ color: 'var(--color-primary)', fontSize: '0.875rem', textDecoration: 'none', fontWeight: 500 }}>
                Forgot Password?
              </Link>
            </div>

            <button type="submit" className="btn-primary"
              disabled={loading}
              style={{ padding: '14px', width: '100%', fontSize: '0.95rem', opacity: loading ? 0.7 : 1, marginTop: 4 }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Don&apos;t have an account?{' '}
            <Link href="/register" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
