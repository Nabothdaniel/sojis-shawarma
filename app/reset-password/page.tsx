'use client';

import Link from 'next/link';
import React, { useMemo, useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/store/appStore';
import { authService } from '@/lib/api';

const resetSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ResetFormValues = z.infer<typeof resetSchema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const accountType = useMemo(
    () => (searchParams.get('account') === 'admin' ? 'admin' : 'user'),
    [searchParams]
  );

  const { register, handleSubmit, formState: { errors } } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetFormValues) => {
    setIsLoading(true);

    try {
      await authService.resetPassword({ email: data.email });

      addToast('Password reset link sent to your email', 'success');
      router.push(accountType === 'admin' ? '/admin/login' : '/login');
    } catch (error: any) {
      addToast(error.message || 'Could not reset password', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-surface min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary-container/20">
            <span className="material-symbols-outlined text-on-primary-container text-4xl">mark_email_unread</span>
          </div>
          <h1 className="font-headline font-bold text-3xl">
            {accountType === 'admin' ? 'Admin Password Reset' : 'Reset Your Password'}
          </h1>
          <p className="font-body text-outline text-sm mt-2">
            Enter the email address associated with your account, and we&apos;ll send you a link to reset your password securely.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <input
              {...register('email')}
              type="email"
              placeholder="Email Address"
              className="w-full bg-surface-container-highest rounded-2xl py-4 px-6 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container transition-all"
            />
            {errors.email && <p className="text-error text-[10px] uppercase font-bold ml-4 mt-1 tracking-wider">{errors.email.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-on-surface text-surface font-headline font-bold py-5 rounded-full shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            {isLoading ? <span className="w-5 h-5 border-2 border-surface/30 border-t-surface rounded-full animate-spin"></span> : 'Send Reset Link'}
          </button>
        </form>

        <p className="mt-8 text-center font-body text-sm text-outline">
          <Link href={accountType === 'admin' ? '/admin/login' : '/login'} className="font-bold text-on-surface">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="bg-surface min-h-screen flex items-center justify-center p-6"><span className="w-10 h-10 border-4 border-surface-container-highest border-t-on-surface rounded-full animate-spin"></span></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
