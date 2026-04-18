'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  RiEyeLine, RiEyeOffLine, RiLockLine,
  RiUserLine, RiPhoneLine, RiSignalTowerFill,
  RiArrowRightLine
} from 'react-icons/ri';
import { useAppStore } from '@/store/appStore';
import PageLoader from '@/components/ui/PageLoader';
import AuthLayout from '@/components/auth/AuthLayout';
import { authService } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const { login, addToast } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [form, setForm] = useState({ 
    username: '',
    name: '', 
    phone: '', 
    password: '', 
    confirm: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password || !form.confirm) {
      addToast('Please fill in required details.', 'error'); return;
    }
    if (form.password !== form.confirm) {
      addToast('Passwords do not match.', 'error'); return;
    }
    if (form.password.length < 6) {
      addToast('Password must be at least 6 characters.', 'error'); return;
    }

    setLoading(true);
    try {
      const response = await authService.register({
        username: form.username.trim(),
        name: form.name.trim() || form.username.trim(),
        phone: form.phone.trim(),
        password: form.password,
        confirm_password: form.confirm
      });
      login(response.data.user, response.data.token);
      const key = response.data.recovery_key;
      addToast('Welcome home!', 'success');
      router.push(`/onboarding?key=${key}`);
    } catch (error: any) {
      addToast(error.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      {loading && <PageLoader />}
      
      <div style={{ paddingBottom: 24 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px var(--color-primary-glow)',
          }}>
            <RiSignalTowerFill size={20} color="#fff" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem' }}>
            bamzy<span style={{ color: 'var(--color-primary)' }}>SMS</span>
          </span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem', marginBottom: 8 }}>
          Create Account
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', marginBottom: 32 }}>
          Sign up with your username and password
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>Username</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)', display: 'flex' }}>
                <RiUserLine size={18} />
              </span>
              <input name="username" type="text" className="input-field" placeholder="Choose a username"
                required value={form.username} onChange={handleChange} style={{ paddingLeft: 44 }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>Full Name (Optional)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)', display: 'flex' }}>
                <RiUserLine size={18} />
              </span>
              <input name="name" type="text" className="input-field" placeholder="e.g. John Doe"
                value={form.name} onChange={handleChange} style={{ paddingLeft: 44 }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>Phone Number (Optional)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)', display: 'flex' }}>
                <RiPhoneLine size={18} />
              </span>
              <input name="phone" type="tel" className="input-field" placeholder="+234..."
                value={form.phone} onChange={handleChange} style={{ paddingLeft: 44 }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)', display: 'flex' }}>
                <RiLockLine size={18} />
              </span>
              <input name="password" type={showPass ? 'text' : 'password'} className="input-field"
                placeholder="Create password" required value={form.password} onChange={handleChange}
                style={{ paddingLeft: 44, paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-faint)', display: 'flex' }}>
                {showPass ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)', display: 'flex' }}>
                <RiLockLine size={18} />
              </span>
              <input name="confirm" type={showConfirm ? 'text' : 'password'} className="input-field"
                placeholder="Confirm password" required value={form.confirm} onChange={handleChange}
                style={{ paddingLeft: 44, paddingRight: 44 }} />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-faint)', display: 'flex' }}>
                {showConfirm ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary"
            disabled={loading}
            style={{ padding: '15px', width: '100%', fontSize: '1rem', marginTop: 10 }}>
            {loading ? 'Creating Account...' : 'Sign Up'} <RiArrowRightLine size={18} />
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 32, fontSize: '0.95rem', color: 'var(--color-text-muted)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none' }}>
            Sign In
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
