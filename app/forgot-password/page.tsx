'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  RiEyeLine, RiEyeOffLine, RiUserLine, RiLockLine,
  RiArrowRightLine, RiArrowLeftLine, RiMessage2Line, RiSignalTowerFill
} from 'react-icons/ri';
import PageLoader from '@/components/ui/PageLoader';
import AuthLayout from '@/components/auth/AuthLayout';
import { authService } from '@/lib/api/auth.service';
import { useAppStore } from '@/store/appStore';


export default function ForgotPasswordPage() {
  const router = useRouter();
  const [recoveryMode, setRecoveryMode] = useState<'otp' | 'key'>('otp');
  const [form, setForm] = useState({
    username: '',
    otp: '',
    recovery_key: '',
    password: '',
    confirm: ''
  });

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const addToast = useAppStore((s) => s.addToast);


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
    if (!form.username) {
      addToast('Please enter your username.', 'error');
      return;
    }
    setLoading(true);
    try {
      await authService.sendOtp(form.username, 'reset');
      addToast('Reset code generated for your account!', 'success');
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
      addToast('Please enter a valid 6-digit code.', 'error');
      return;
    }
    setLoading(true);
    try {
      await authService.verifyOtp(form.username, form.otp, 'reset');
      setStep(3);
    } catch (error: any) {
      addToast(error.message || 'Invalid or expired code', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.password || !form.confirm) {
      addToast('Please fill in both password fields.', 'error'); return;
    }
    if (form.password !== form.confirm) {
      addToast('Passwords do not match.', 'error'); return;
    }
    if (form.password.length < 6) {
      addToast('Password must be at least 6 characters.', 'error'); return;
    }

    setLoading(true);
    try {
      if (recoveryMode === 'key') {
        await authService.resetWithKey({
          username: form.username,
          recovery_key: form.recovery_key,
          password: form.password
        });
      } else {
        await authService.resetPassword({
          username: form.username,
          otp: form.otp,
          password: form.password
        });
      }
      addToast('Password updated successfully!', 'success');
      router.push('/login');
    } catch (error: any) {
      addToast(error.message || 'Reset failed. Please verify your details.', 'error');
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

        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem', marginBottom: 8 }}>
          {step === 1 ? 'Forgot Password?' : step === 2 ? 'Enter Reset Code' : 'Set New Password'}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', marginBottom: 32 }}>
          {step === 1
            ? 'Choose a method to regain access to your account'
            : step === 2
              ? `Check logs for the 6-digit code for ${form.username}`
              : 'Choose a strong new password for your account'}
        </p>

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', background: 'var(--color-bg-hover)', padding: 4, borderRadius: 12 }}>
              <button
                onClick={() => setRecoveryMode('otp')}
                style={{
                  flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: recoveryMode === 'otp' ? 'var(--color-bg)' : 'transparent',
                  color: recoveryMode === 'otp' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s'
                }}
              >
                Verification Code
              </button>
              <button
                onClick={() => setRecoveryMode('key')}
                style={{
                  flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: recoveryMode === 'key' ? 'var(--color-bg)' : 'transparent',
                  color: recoveryMode === 'key' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s'
                }}
              >
                Recovery Key
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>Username</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)', display: 'flex' }}>
                    <RiUserLine size={18} />
                  </span>
                  <input name="username" type="text" className="input-field" placeholder="Enter your username"
                    value={form.username} onChange={handleChange} style={{ paddingLeft: 44 }} />
                </div>
              </div>

              {recoveryMode === 'key' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>Recovery Key</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)', display: 'flex' }}>
                      <RiLockLine size={18} />
                    </span>
                    <input name="recovery_key" type="text" className="input-field" placeholder="BAMZY-XXXX-XXXX"
                      value={form.recovery_key} onChange={handleChange} style={{ paddingLeft: 44, textTransform: 'uppercase' }} />
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)', marginTop: 8 }}>
                    Enter the secret key given to you during registration.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={recoveryMode === 'key' ? () => setStep(3) : handleSendOtp}
                className="btn-primary"
                style={{ padding: '15px', width: '100%', fontSize: '1rem', marginTop: 10 }}
              >
                {recoveryMode === 'key' ? 'Continue' : 'Send Reset Code'} <RiArrowRightLine size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>6-Digit Code</label>
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
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-faint)' }}>Resend in {resendTimer}s</p>
              ) : (
                <button type="button" onClick={handleSendOtp} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                  Resend code
                </button>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)', display: 'flex' }}>
                  <RiLockLine size={18} />
                </span>
                <input name="password" type={showPass ? 'text' : 'password'} className="input-field"
                  placeholder="Enter new password" value={form.password} onChange={handleChange}
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
                  placeholder="Confirm new password" value={form.confirm} onChange={handleChange}
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
              {loading ? 'Updating...' : 'Reset Password'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: 32, fontSize: '0.95rem', color: 'var(--color-text-muted)' }}>
          Remember your password?{' '}
          <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none' }}>
            Back to login
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
