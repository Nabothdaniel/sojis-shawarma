'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/appStore';
import { authService } from '@/lib/api';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setToken } = useAuth();
  const { login: storeLogin, addToast } = useAppStore();
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);
  const [isLocked, setIsLocked] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

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

  const onSubmit = async (data: LoginFormValues) => {
    if (isLocked) return;
    setIsLoading(true);

    try {
      const result: any = await authService.login(data);
      const role = result.user?.role === 'admin' ? 'admin' : 'user';
      setToken(result.token);
      storeLogin({ ...result.user, role }, result.token);
      addToast('Login successful', 'success');
      const redirectTo = searchParams.get('redirect');
      router.push(role === 'admin' ? '/admin/dashboard' : (redirectTo || '/profile'));
    } catch (error: any) {
      const status = error.response?.status;
      const message = error.response?.data?.message || 'Login failed';

      if (status === 429) {
        setIsLocked(true);
        setCountdown(15 * 60);
        addToast('Too many attempts. Locked for 15 mins.', 'error');
      } else {
        const remaining = attemptsRemaining - 1;
        setAttemptsRemaining(remaining);
        addToast(`${message}. ${remaining} attempts left.`, 'error');
        if (remaining <= 0) {
          setIsLocked(true);
          setCountdown(15 * 60);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-surface min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary-container/20">
            <span className="material-symbols-outlined text-on-primary-container text-4xl">lock</span>
          </div>
          <h1 className="font-headline font-bold text-3xl">Welcome Back</h1>
          <p className="font-body text-outline text-sm mt-2">Sign in to manage your orders and delivery details</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-1">
            <input
              {...register('email')}
              type="email"
              placeholder="Email Address"
              disabled={isLocked || isLoading}
              className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-6 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container transition-all disabled:opacity-50"
            />
            {errors.email && <p className="text-error text-[10px] uppercase font-bold ml-4 tracking-wider">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <input
              {...register('password')}
              type="password"
              placeholder="Password"
              disabled={isLocked || isLoading}
              className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-6 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container transition-all disabled:opacity-50"
            />
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

        <div className="mt-8 text-center space-y-3">
          <p className="font-body text-sm text-outline">New here? Create an account before your next order.</p>
          <Link
            href={searchParams.get('redirect') ? `/signup?redirect=${encodeURIComponent(searchParams.get('redirect') || '')}` : '/signup'}
            className="inline-flex items-center justify-center rounded-full bg-surface-container-low px-6 py-3 font-label text-xs font-bold uppercase tracking-widest text-on-surface"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
