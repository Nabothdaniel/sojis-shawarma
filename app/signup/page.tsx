'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/appStore';
import { authService } from '@/lib/api';

const signupSchema = z.object({
  name: z.string().min(2, 'Your name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number is required'),
  address: z.string().min(5, 'Delivery address is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setToken } = useAuth();
  const { login: storeLogin, addToast } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);

    try {
      const result: any = await authService.register(data);
      setToken(result.token);
      storeLogin({ ...result.user, role: 'user' }, result.token);
      addToast('Account created successfully', 'success');
      router.push(searchParams.get('redirect') || '/profile');
    } catch (error: any) {
      addToast(error.message || 'Could not create account', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-surface min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary-container/20">
            <span className="material-symbols-outlined text-on-primary-container text-4xl">person_add</span>
          </div>
          <h1 className="font-headline font-bold text-3xl">Create your account</h1>
          <p className="font-body text-outline text-sm mt-2">Save your delivery details and track every order from one place.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input {...register('name')} type="text" placeholder="Full Name" className="w-full bg-surface-container-highest rounded-2xl py-4 px-6 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container transition-all" />
          {errors.name && <p className="text-error text-[10px] uppercase font-bold ml-4 tracking-wider">{errors.name.message}</p>}

          <input {...register('email')} type="email" placeholder="Email Address" className="w-full bg-surface-container-highest rounded-2xl py-4 px-6 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container transition-all" />
          {errors.email && <p className="text-error text-[10px] uppercase font-bold ml-4 tracking-wider">{errors.email.message}</p>}

          <input {...register('phone')} type="tel" placeholder="Phone Number" className="w-full bg-surface-container-highest rounded-2xl py-4 px-6 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container transition-all" />
          {errors.phone && <p className="text-error text-[10px] uppercase font-bold ml-4 tracking-wider">{errors.phone.message}</p>}

          <textarea {...register('address')} rows={3} placeholder="Delivery Address" className="w-full bg-surface-container-highest rounded-2xl py-4 px-6 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container transition-all resize-none" />
          {errors.address && <p className="text-error text-[10px] uppercase font-bold ml-4 tracking-wider">{errors.address.message}</p>}

          <input {...register('password')} type="password" placeholder="Password" className="w-full bg-surface-container-highest rounded-2xl py-4 px-6 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container transition-all" />
          {errors.password && <p className="text-error text-[10px] uppercase font-bold ml-4 tracking-wider">{errors.password.message}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-on-surface text-surface font-headline font-bold py-5 rounded-full shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            {isLoading ? <span className="w-5 h-5 border-2 border-surface/30 border-t-surface rounded-full animate-spin"></span> : 'Create account'}
          </button>
        </form>

        <p className="mt-8 text-center font-body text-sm text-outline">
          Already have an account?{' '}
          <Link href={searchParams.get('redirect') ? `/login?redirect=${encodeURIComponent(searchParams.get('redirect') || '')}` : '/login'} className="font-bold text-on-surface">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

