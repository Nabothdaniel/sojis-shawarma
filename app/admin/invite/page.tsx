'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminService } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/appStore';
import Link from 'next/link';
import { LuCheck } from 'react-icons/lu';

function InviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { user, hasHydrated } = useAppStore();
  const { isLoading: authLoading } = useAuth();
  const addToast = useAppStore(state => state.addToast);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    if (!token) {
      addToast('Invalid invite link', 'error');
      router.push('/');
      return;
    }

    if (hasHydrated && !authLoading && !user) {
      addToast('Please login or create an account to claim your admin invite', 'info');
      sessionStorage.setItem('redirectAfterAuth', `/admin/invite?token=${token}`);
      router.push('/login');
    }
  }, [user, hasHydrated, authLoading, addToast, router, token]);

  const claimInvite = async () => {
    if (!user || !token) return;
    setClaiming(true);
    try {
      await adminService.claimAdminInvite(token, user.id.toString());
      setClaimed(true);
      addToast('Admin rights granted! Please refresh the page or login again.', 'success');
      setTimeout(() => {
        window.location.href = '/admin'; // Force full reload
      }, 2000);
    } catch (error: any) {
      addToast(error.message || 'Could not claim invite', 'error');
    } finally {
      setClaiming(false);
    }
  };

  if (!hasHydrated || authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-container border-t-transparent" />
      </div>
    );
  }

  if (!user || !token) return null;

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-surface p-6">
      <div className="w-full max-w-sm rounded-[32px] bg-white p-8 text-center shadow-lg border border-outline-variant/10">
        {claimed ? (
          <div className="space-y-4">
            <LuCheck className="mx-auto text-6xl text-tertiary" />
            <h1 className="font-headline text-2xl font-bold">Access Granted</h1>
            <p className="text-sm text-outline">Redirecting you to the command center...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-primary-container/20">
              <span className="material-symbols-outlined text-3xl text-primary-container">shield_person</span>
            </div>
            <div>
              <h1 className="font-headline text-2xl font-bold">Admin Invitation</h1>
              <p className="mt-2 text-sm text-outline">
                You have been invited to become an administrator for Soji&apos;s Shawarma. 
                This will grant <span className="font-bold text-on-surface">{user.email || user.username}</span> full access to the dashboard.
              </p>
            </div>
            <button
              onClick={claimInvite}
              disabled={claiming}
              className="w-full rounded-full bg-primary-container py-4 text-xs font-label font-bold uppercase tracking-widest text-on-primary-container transition-transform active:scale-95 disabled:opacity-60"
            >
              {claiming ? 'Verifying...' : 'Claim Admin Rights'}
            </button>
            <div className="pt-2">
              <Link href="/" className="text-xs font-bold uppercase tracking-widest text-outline">Cancel and go home</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminInvitePage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-surface"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-container border-t-transparent" /></div>}>
      <InviteContent />
    </Suspense>
  );
}
