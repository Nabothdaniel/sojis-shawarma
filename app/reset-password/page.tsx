'use client';

import Link from 'next/link';
import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/store/appStore';
import { authService } from '@/lib/api';

const resetSchema = z.object({
  identifier: z.string().min(1, 'Username, full name, or email is required'),
  phone: z.string().optional(),
  new_password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm_password: z.string().min(6, 'Confirm your password'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

type ResetFormValues = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      await authService.resetPassword({
        account_type: accountType,
        identifier: data.identifier,
        phone: data.phone,
        new_password: data.new_password,
      });

      addToast('Password updated successfully', 'success');
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
            <span className="material-symbols-outlined text-on-primary-container text-4xl">key</span>
          </div>
          <h1 className="font-headline font-bold text-3xl">
            {accountType === 'admin' ? 'Admin Password Reset' : 'Reset Your Password'}
          </h1>
          <p className="font-body text-outline text-sm mt-2">
            {accountType === 'admin'
              ? 'Use your admin username to set a new password.'
              : 'Use your full name or email together with the WhatsApp number on your account.'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <input
              {...register('identifier')}
              type="text"
              placeholder={accountType === 'admin' ? 'Admin Username' : 'Full Name or Email'}
              className="w-full bg-surface-container-highest rounded-2xl py-4 px-6 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container transition-all"
            />
            {errors.identifier && <p className="text-error text-[10px] uppercase font-bold ml-4 mt-1 tracking-wider">{errors.identifier.message}</p>}
          </div>

          {accountType === 'user' && (
            <div>
              <input
                {...register('phone')}
                type="tel"
                placeholder="WhatsApp Number"
                className="w-full bg-surface-container-highest rounded-2xl py-4 px-6 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container transition-all"
              />
              {errors.phone && <p className="text-error text-[10px] uppercase font-bold ml-4 mt-1 tracking-wider">{errors.phone.message}</p>}
            </div>
          )}

          <div>
            <div className="relative">
              <input
                {...register('new_password')}
                type={showNewPassword ? 'text' : 'password'}
                placeholder="New Password"
                className="w-full bg-surface-container-highest rounded-2xl py-4 pl-6 pr-14 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((value) => !value)}
                className="absolute inset-y-0 right-0 flex w-14 items-center justify-center text-outline"
                aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
              >
                <span className="material-symbols-outlined text-xl">
                  {showNewPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            {errors.new_password && <p className="text-error text-[10px] uppercase font-bold ml-4 mt-1 tracking-wider">{errors.new_password.message}</p>}
          </div>

          <div>
            <div className="relative">
              <input
                {...register('confirm_password')}
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm New Password"
                className="w-full bg-surface-container-highest rounded-2xl py-4 pl-6 pr-14 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                className="absolute inset-y-0 right-0 flex w-14 items-center justify-center text-outline"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                <span className="material-symbols-outlined text-xl">
                  {showConfirmPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            {errors.confirm_password && <p className="text-error text-[10px] uppercase font-bold ml-4 mt-1 tracking-wider">{errors.confirm_password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-on-surface text-surface font-headline font-bold py-5 rounded-full shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            {isLoading ? <span className="w-5 h-5 border-2 border-surface/30 border-t-surface rounded-full animate-spin"></span> : 'Update Password'}
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
