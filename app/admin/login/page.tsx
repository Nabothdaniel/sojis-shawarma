'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
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
      if (result.user?.role !== 'admin') {
        throw new Error('This login is reserved for admins');
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
      } else {
        const remaining = attemptsRemaining - 1;
        setAttemptsRemaining(remaining);
        addToast(`${err.message || 'Invalid credentials'}. ${remaining} attempts left.`, 'error');
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
          <h1 className="font-headline font-bold text-3xl">Admin Access</h1>
          <p className="font-body text-outline text-sm mt-2">Personal use only</p>
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

        <p className="mt-8 text-center text-outline font-label text-[10px] uppercase tracking-widest font-bold">
          Unauthorized access is logged
        </p>
      </div>
    </div>
  );
}
