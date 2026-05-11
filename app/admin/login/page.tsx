'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/appStore';
import { authService } from '@/lib/api';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="bg-surface min-h-screen flex items-center justify-center font-headline font-bold text-xl">Loading admin login...</div>}>
      <AdminLoginPageContent />
    </Suspense>
  );
}

function AdminLoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setToken } = useAuth();
  const { login: storeLogin, addToast } = useAppStore();
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);
  const [isLocked, setIsLocked] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [accessStatus, setAccessStatus] = useState<{ is_enabled: boolean; is_valid: boolean; expires_at: string | null } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    } else {
      setIsLocked(false);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    const run = async () => {
      try {
        if (searchParams.get('expired') === 'true') {
          addToast('Your admin session expired. Please sign in again.', 'info');
        }

        const access = searchParams.get('access') || undefined;
        const result: any = await authService.getAdminAccessStatus(access);
        setAccessStatus(result.data ?? null);
      } catch (error: any) {
        addToast(error.message || 'Could not verify admin access link', 'error');
      } finally {
        setIsCheckingAccess(false);
      }
    };

    run();
  }, [searchParams, addToast]);

  const onSubmit = async (data: LoginFormValues) => {
    if (isLocked) return;
    setIsLoading(true);

    try {
      const result: any = await authService.login(data);
      if (!result?.token || !result?.user) {
        throw Object.assign(new Error(result?.message || result?.error || 'Login service is unavailable right now'), {
          status: 500,
        });
      }

      if (result.user?.role !== 'admin') {
        throw Object.assign(new Error('This login is reserved for admins'), {
          status: 403,
        });
      }

      setToken(result.token);
      storeLogin({ ...result.user, role: 'admin' }, result.token);
      addToast('Login successful', 'success');
      router.push('/admin/dashboard');
    } catch (err: any) {
      if (err.status === 429) {
        setIsLocked(true);
        setCountdown(15 * 60);
        addToast('Too many attempts. Locked for 15 mins.', 'error');
      } else if (err.status === 401 || err.status === 403) {
        const remaining = attemptsRemaining - 1;
        setAttemptsRemaining(remaining);
        addToast(`${err.message || 'Invalid credentials'}. ${remaining} attempts left.`, 'error');
        if (remaining <= 0) {
          setIsLocked(true);
          setCountdown(15 * 60);
        }
      } else {
        addToast(err.message || 'Admin login is temporarily unavailable. Check the backend and database connection.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAccess) {
    return <div className="bg-surface min-h-screen flex items-center justify-center font-headline font-bold text-xl">Checking admin access...</div>;
  }

  if (accessStatus?.is_enabled && !accessStatus.is_valid) {
    return (
      <div className="bg-surface min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-surface-container-low rounded-[32px] p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-error/10 text-error flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">vpn_key_alert</span>
          </div>
          <h1 className="font-headline font-bold text-3xl">Private Admin Link Required</h1>
          <p className="font-body text-sm text-outline">
            This admin login is protected by a rotating 10-character access URL. Please open the latest link from the admin dashboard.
          </p>
          {accessStatus.expires_at && (
            <p className="font-label text-[10px] uppercase tracking-widest text-outline font-bold">
              Current link rotates every 6 hours
            </p>
          )}
          <Link href="/reset-password?account=admin" className="inline-flex items-center justify-center rounded-full bg-on-surface px-6 py-3 font-label text-xs font-bold uppercase tracking-widest text-surface">
            Admin password help
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary-container/20">
            <span className="material-symbols-outlined text-on-primary-container text-4xl">lock</span>
          </div>
          <h1 className="font-headline font-bold text-3xl">Admin Access</h1>
          <p className="font-body text-outline text-sm mt-2">Personal use only</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-1">
            <input
              {...register('identifier')}
              type="text"
              placeholder="Admin Username"
              disabled={isLocked || isLoading}
              className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-6 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container transition-all disabled:opacity-50"
            />
            {errors.identifier && <p className="text-error text-[10px] uppercase font-bold ml-4 tracking-wider">{errors.identifier.message}</p>}
          </div>

          <div className="space-y-1">
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                disabled={isLocked || isLoading}
                className="w-full bg-surface-container-highest border-none rounded-2xl py-4 pl-6 pr-14 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                disabled={isLocked || isLoading}
                className="absolute inset-y-0 right-0 flex w-14 items-center justify-center text-outline disabled:opacity-50"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <span className="material-symbols-outlined text-xl">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            {errors.password && <p className="text-error text-[10px] uppercase font-bold ml-4 tracking-wider">{errors.password.message}</p>}
          </div>

          {isLocked ? (
            <div className="bg-error/10 text-error p-4 rounded-2xl text-center font-label font-bold text-xs uppercase tracking-widest">
              LOCKED: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
            </div>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-on-surface text-surface font-headline font-bold py-5 rounded-full shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-surface/30 border-t-surface rounded-full animate-spin"></span>
              ) : (
                <>Sign In <span className="material-symbols-outlined">arrow_forward</span></>
              )}
            </button>
          )}
        </form>

        <div className="mt-8 space-y-3 text-center">
          <p className="text-outline font-label text-[10px] uppercase tracking-widest font-bold">
            Unauthorized access is logged
          </p>
          <Link href="/reset-password?account=admin" className="font-body text-sm text-on-surface underline underline-offset-4">
            Change admin password
          </Link>
        </div>
      </div>
    </div>
  );
}
