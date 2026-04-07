'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  RiEyeLine, RiEyeOffLine, RiMailLine, RiLockLine,
  RiUserLine, RiPhoneLine, RiSignalTowerFill,
  RiArrowRightLine, RiArrowLeftLine, RiMessage2Line
} from 'react-icons/ri';
import { useAppStore } from '@/store/appStore';
import PageLoader from '@/components/ui/PageLoader';
import AuthLayout from '@/components/auth/AuthLayout';
import { authService } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const { login, addToast } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    password: '', 
    confirm: '',
    otp: ''
  });

  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSendOtp = async () => {
    if (!form.email) {
      addToast('Please enter your email address.', 'error');
      return;
    }
    setLoading(true);
    try {
      await authService.sendOtp(form.email);
      addToast('Verification code sent to your email!', 'success');
      setStep(2);
      setResendTimer(60);
    } catch (error: any) {
      addToast(error.message || 'Failed to send OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!form.otp || form.otp.length !== 6) {
      addToast('Please enter a valid 6-digit OTP.', 'error');
      return;
    }
    setLoading(true);
    try {
      await authService.verifyOtp(form.email, form.otp);
      addToast('Email verified!', 'success');
      setStep(3);
    } catch (error: any) {
      addToast(error.message || 'Invalid or expired OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.password || !form.confirm) {
      addToast('Please fill in all details.', 'error'); return;
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
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password
      });
      localStorage.setItem('bamzysms-token', response.data.token);
      login(response.data.user);
      addToast('Welcome home!', 'success');
      router.push('/onboarding');
    } catch (error: any) {
      addToast(error.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const progress = (step / 3) * 100;

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

        {/* Progress Bar */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ width: '100%', height: 4, borderRadius: 10, background: 'var(--color-border)' }}>
            <div style={{ width: `${progress}%`, height: '100%', borderRadius: 10, background: 'var(--color-primary)', transition: 'width 0.4s' }} />
          </div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: 8, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Step {step} of 3: {step === 1 ? 'Verify Email' : step === 2 ? 'Enter Code' : 'Profile Details'}
          </p>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem', marginBottom: 8 }}>
          {step === 1 ? 'Let\'s get started' : step === 2 ? 'Check your inbox' : 'Almost there!'}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', marginBottom: 32 }}>
          {step === 1 ? 'Enter your email to verify your identity' : step === 2 ? `We sent a code to ${form.email}` : 'Fill in your final account details'}
        </p>

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)', display: 'flex' }}>
                  <RiMailLine size={18} />
                </span>
                <input name="email" type="email" className="input-field" placeholder="john@example.com"
                  value={form.email} onChange={handleChange} style={{ paddingLeft: 44 }} />
              </div>
            </div>
            <button type="button" onClick={handleSendOtp} className="btn-primary"
              style={{ padding: '15px', width: '100%', fontSize: '1rem', marginTop: 10 }}>
              Send Verification Code <RiArrowRightLine size={18} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>6-Digit OTP</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)', display: 'flex' }}>
                  <RiMessage2Line size={18} />
                </span>
                <input name="otp" type="text" maxLength={6} className="input-field" placeholder="000000"
                  value={form.otp} onChange={handleChange} style={{ paddingLeft: 44, letterSpacing: '0.5em', fontWeight: 700 }} />
              </div>
            </div>
            <button type="button" onClick={handleVerifyOtp} className="btn-primary"
              style={{ padding: '15px', width: '100%', fontSize: '1rem', marginTop: 10 }}>
              Verify Code <RiArrowRightLine size={18} />
            </button>
            <div style={{ textAlign: 'center' }}>
              {resendTimer > 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-faint)' }}>Resend code in {resendTimer}s</p>
              ) : (
                <button type="button" onClick={handleSendOtp} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                  Didn&apos;t receive code? Resend
                </button>
              )}
            </div>
            <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--color-text-faint)', fontSize: '0.85rem', cursor: 'pointer', marginTop: 10 }}>
              <RiArrowLeftLine size={14} /> Use different email
            </button>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)', display: 'flex' }}>
                  <RiUserLine size={18} />
                </span>
                <input name="name" type="text" className="input-field" placeholder="John Doe"
                  value={form.name} onChange={handleChange} style={{ paddingLeft: 44 }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>Phone Number</label>
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
                  placeholder="Create password" value={form.password} onChange={handleChange}
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
                  placeholder="Confirm password" value={form.confirm} onChange={handleChange}
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
              {loading ? 'Creating Account...' : 'Finish Signup'}
            </button>
          </form>
        )}

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
