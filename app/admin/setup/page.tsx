'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useAppStore } from '@/store/appStore';
import { z } from 'zod';
import LoadingScreen from '@/components/ui/LoadingScreen';

const setupSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function AdminSetupPage() {
  const router = useRouter();
  const { addToast } = useAppStore();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setupSchema.parse(formData);
      setErrors({});
    } catch (err: any) {
      const formatted: Record<string, string> = {};
      err.errors.forEach((e: any) => { formatted[e.path[0]] = e.message; });
      setErrors(formatted);
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      
      // 2. Set their display name
      await updateProfile(userCredential.user, { displayName: formData.name });
      
      // 3. Write them to the database with the "admin" role
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: formData.name,
        email: formData.email,
        role: 'admin',
        createdAt: new Date().toISOString()
      });

      addToast('Admin account successfully created!', 'success');
      
      // Update global app state since user is authenticated during creation
      const token = await userCredential.user.getIdToken();
      useAppStore.getState().login({
        id: userCredential.user.uid,
        name: formData.name,
        email: formData.email,
        role: 'admin'
      }, token);
      
      // Navigate straight to the admin dashboard
      router.push('/admin');
    } catch (error: any) {
      addToast(error.message || 'Could not create admin account', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) return <LoadingScreen message="creating admin access..." />;

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-surface p-4">
      <div className="w-full max-w-sm rounded-[32px] bg-white p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-primary-container/20 mb-4">
            <span className="material-symbols-outlined text-3xl text-primary-container">admin_panel_settings</span>
          </div>
          <h1 className="font-headline text-2xl font-bold">Admin Setup</h1>
          <p className="text-center font-body text-xs text-error mt-2">
            Warning: This is a temporary route. Ensure you delete this file completely after use!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input 
              type="text" 
              placeholder="Admin Full Name"
              className="w-full rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm outline-none focus:border-primary-container"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
            {errors.name && <p className="mt-1 text-xs text-error">{errors.name}</p>}
          </div>

          <div>
            <input 
              type="email" 
              placeholder="Admin Email"
              className="w-full rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm outline-none focus:border-primary-container"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
            {errors.email && <p className="mt-1 text-xs text-error">{errors.email}</p>}
          </div>

          <div>
            <input 
              type="password" 
              placeholder="Secure Password"
              className="w-full rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm outline-none focus:border-primary-container"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
            {errors.password && <p className="mt-1 text-xs text-error">{errors.password}</p>}
          </div>

          <button 
            type="submit" 
            className="w-full rounded-full bg-primary-container py-4 font-headline font-bold text-on-primary-container transition-transform active:scale-95"
          >
            Create Admin Account
          </button>
        </form>
      </div>
    </div>
  );
}
