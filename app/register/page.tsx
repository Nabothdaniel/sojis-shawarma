'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  RiEyeLine, RiEyeOffLine, RiMailLine, RiLockLine,
  RiUserLine, RiPhoneLine, RiSignalTowerFill,
  RiGoogleLine, RiFacebookCircleLine,
} from 'react-icons/ri';
import { useAppStore } from '@/store/appStore';
import PageLoader from '@/components/ui/PageLoader';

export default function RegisterPage() {
  const router = useRouter();
  const { login, addToast } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.password) {
      addToast('Please fill in all fields.', 'error'); return;
    }
    if (form.password !== form.confirm) {
      addToast('Passwords do not match.', 'error'); return;
    }
    if (form.password.length < 6) {
      addToast('Password must be at least 6 characters.', 'error'); return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1400));
    login({
      name: form.name, email: form.email, phone: form.phone,
      balance: 0, smsUnits: 0,
      referralCode: 'BAMZY' + Math.random().toString(36).slice(2, 8).toUpperCase(),
    });
    addToast('Account created! Welcome to BamzySMS.', 'success');
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
        {/* Wavy BG */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
          <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <defs>
              <radialGradient id="rg3" cx="80%" cy="50%" r="60%">
                <stop offset="0%" stopColor="rgba(0,229,255,0.07)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
              <radialGradient id="rg4" cx="15%" cy="30%" r="50%">
                <stop offset="0%" stopColor="rgba(124,58,237,0.07)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <rect width="1440" height="900" fill="url(#rg3)" />
            <rect width="1440" height="900" fill="url(#rg4)" />
            <path d="M0,300 C300,220 600,380 900,280 S1300,160 1440,240 L1440,900 L0,900 Z" fill="rgba(0,229,255,0.03)" />
            <path d="M0,450 C250,370 550,510 850,410 S1250,290 1440,370 L1440,900 L0,900 Z" fill="rgba(124,58,237,0.03)" />
          </svg>
        </div>

        <div className="auth-card" style={{ position: 'relative', zIndex: 1, maxWidth: 460 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
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
            Create Account
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: 24 }}>
            Join thousands verifying safely with BamzySMS
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 7, color: 'var(--color-text-muted)' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)', display: 'flex' }}>
                  <RiUserLine size={16} />
                </span>
                <input name="name" type="text" className="input-field" placeholder="Enter Name"
                  value={form.name} onChange={handleChange} style={{ paddingLeft: 42 }} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 7, color: 'var(--color-text-muted)' }}>Email</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)', display: 'flex' }}>
                  <RiMailLine size={16} />
                </span>
                <input name="email" type="email" className="input-field" placeholder="Enter Email"
                  value={form.email} onChange={handleChange} style={{ paddingLeft: 42 }} />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 7, color: 'var(--color-text-muted)' }}>Phone Number</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)', display: 'flex' }}>
                  <RiPhoneLine size={16} />
                </span>
                <input name="phone" type="tel" className="input-field" placeholder="Enter Phone Number"
                  value={form.phone} onChange={handleChange} style={{ paddingLeft: 42 }} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 7, color: 'var(--color-text-muted)' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)', display: 'flex' }}>
                  <RiLockLine size={16} />
                </span>
                <input name="password" type={showPass ? 'text' : 'password'} className="input-field"
                  placeholder="Enter Password" value={form.password} onChange={handleChange}
                  style={{ paddingLeft: 42, paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-faint)', display: 'flex' }}>
                  {showPass ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 7, color: 'var(--color-text-muted)' }}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)', display: 'flex' }}>
                  <RiLockLine size={16} />
                </span>
                <input name="confirm" type={showConfirm ? 'text' : 'password'} className="input-field"
                  placeholder="Enter Confirm Password" value={form.confirm} onChange={handleChange}
                  style={{ paddingLeft: 42, paddingRight: 44 }} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-faint)', display: 'flex' }}>
                  {showConfirm ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary"
              disabled={loading}
              style={{ padding: '14px', width: '100%', fontSize: '0.95rem', opacity: loading ? 0.7 : 1, marginTop: 4 }}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          {/* OR divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div className="divider" style={{ flex: 1 }} />
            <span style={{ color: 'var(--color-text-faint)', fontSize: '0.78rem', letterSpacing: '0.06em' }}>OR</span>
            <div className="divider" style={{ flex: 1 }} />
          </div>

          {/* Social */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            {[
              { icon: <RiGoogleLine size={22} />, color: '#EA4335', label: 'Google' },
              { icon: <RiFacebookCircleLine size={22} />, color: '#1877F2', label: 'Facebook' },
            ].map((s) => (
              <button key={s.label} type="button"
                className="glass-card"
                style={{
                  width: 52, height: 52, borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: s.color, cursor: 'pointer', border: '1px solid var(--color-border)',
                  background: 'rgba(255,255,255,0.03)',
                  transition: 'all 0.2s',
                }}
                aria-label={s.label}
              >
                {s.icon}
              </button>
            ))}
          </div>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
