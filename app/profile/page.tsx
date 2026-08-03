'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/ui/BottomNav';
import { useProfilePage } from '@/features/profile/hooks/useProfilePage';
import useBiometricSupport from '@/hooks/useBiometricSupport';
import { 
  LuArrowLeft, 
  LuUser, 
  LuRefreshCw, 
  LuFingerprint, 
  LuReceipt, 
  LuBell, 
  LuHeart, 
  LuMessageSquare, 
  LuPhone, 
  LuMapPin 
} from 'react-icons/lu';

export default function ProfilePage() {
  const router = useRouter();
  const biometricSupported = useBiometricSupport();
  const {
    authLoading,
    displayAddress,
    displayName,
    displayPhone,
    handleLogout,
    handleRemoveBiometrics,
    handleSetupBiometrics,
    hasHydrated,
    isSettingUpBiometrics,
    isSignedIn,
    loadTimeout,
    profile,
    updateProfileDetails,
    isUpdatingProfile,
  } = useProfilePage();

  const menuLinks = [
    { label: 'My Orders', icon: <LuReceipt className="text-2xl" />, href: '/orders', color: 'text-primary-container' },
    { label: 'Notifications', icon: <LuBell className="text-2xl" />, href: '/notifications', color: 'text-primary-container' },
    { label: 'Saved Items', icon: <LuHeart className="text-2xl" />, href: '/saved', color: 'text-red-500' },
    { label: 'Give Feedback', icon: <LuMessageSquare className="text-2xl" />, href: '/feedback', color: 'text-tertiary' },
  ];

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', phone: '', address: '' });

  useEffect(() => {
    if (hasHydrated && !isEditing) {
      setEditData({
        name: displayName !== '...' && displayName !== 'Loading profile...' && displayName !== 'Guest User' ? displayName : '',
        phone: displayPhone !== 'Add a phone number when you place an order' ? displayPhone : '',
        address: displayAddress !== 'No saved delivery address yet' ? displayAddress : ''
      });
    }
  }, [hasHydrated, displayName, displayPhone, displayAddress, isEditing]);

  const handleSaveProfile = async () => {
    const success = await updateProfileDetails(editData);
    if (success) setIsEditing(false);
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-32">
      <header className="px-6 py-6 flex items-center gap-4 bg-surface sticky top-0 z-40 border-b border-outline-variant/10">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low active:scale-95 transition-transform"
        >
          <LuArrowLeft className="text-xl" />
        </button>
        <h1 className="font-headline font-bold text-xl">My Profile</h1>
      </header>

      <main className="px-6 space-y-6 max-w-md mx-auto w-full">
        {/* User Badge Section */}
        <section className="flex flex-col items-center py-6">
          <div className="w-24 h-24 bg-primary-container rounded-full flex items-center justify-center mb-4 border-4 border-surface shadow-xl text-on-primary-container">
            <LuUser className="text-4xl" />
          </div>
          <h2 className="font-headline font-bold text-2xl text-center">{displayName}</h2>
          {loadTimeout && !profile && (
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-primary font-label text-xs uppercase font-bold flex items-center gap-1"
            >
              <LuRefreshCw className="text-sm" />
              Stuck loading? Tap to refresh
            </button>
          )}
          <p className="font-body text-sm text-outline text-center">
            {isSignedIn
              ? 'Your delivery details and order updates live here.'
              : 'Sign in to track active orders and receive updates.'}
          </p>

          {isSignedIn && biometricSupported && (
            <div className="mt-8 p-6 bg-primary-container/10 border border-primary-container/20 rounded-[32px] w-full max-w-sm mx-auto">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-primary-container/20 rounded-2xl flex items-center justify-center text-primary-container">
                  <LuFingerprint className="text-2xl" />
                </div>
                <div className="text-left">
                  <h3 className="font-headline font-bold text-sm">Biometric Login</h3>
                  <p className="font-body text-[10px] text-outline">
                    Unlock with your fingerprint
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSetupBiometrics}
                  disabled={isSettingUpBiometrics}
                  className="flex-[2] bg-on-surface text-surface py-3 rounded-2xl font-label text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
                >
                  {isSettingUpBiometrics
                    ? 'Setting up...'
                    : profile?.biometric_id
                      ? 'Update biometrics'
                      : 'Setup Now'}
                </button>
                {profile?.biometric_id && (
                  <button
                    onClick={handleRemoveBiometrics}
                    className="flex-1 bg-error/10 text-error py-3 rounded-2xl font-label text-[10px] font-bold uppercase tracking-widest"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        {!authLoading && hasHydrated && !isSignedIn && (
          <section className="bg-surface-container-low rounded-3xl p-6 space-y-4">
            <p className="font-body text-sm text-outline">
              Sign in before placing an order so you can track delivery progress, see
              notifications, and leave reviews after each meal.
            </p>
            <div className="flex gap-3">
              <Link
                href="/login"
                className="flex-1 inline-flex items-center justify-center bg-on-surface text-surface py-4 rounded-full font-label font-bold text-xs uppercase tracking-widest"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="flex-1 inline-flex items-center justify-center bg-surface-container-highest text-on-surface py-4 rounded-full font-label font-bold text-xs uppercase tracking-widest"
              >
                Sign Up
              </Link>
            </div>
          </section>
        )}

        {/* Hub Links */}
        <section className="grid grid-cols-2 gap-4">
          {menuLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="bg-surface-container-low rounded-3xl p-6 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform border border-outline-variant/10 shadow-sm"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-surface-container-highest ${link.color}`}>
                {link.icon}
              </div>
              <span className="font-headline font-bold text-sm text-center">{link.label}</span>
            </Link>
          ))}
        </section>

        {/* User Details */}
        <section className="space-y-3 pt-6">
          <div className="bg-surface-container-low rounded-3xl p-6 space-y-4 shadow-sm border border-outline-variant/10">
            
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-headline font-bold text-sm">Delivery Details</h3>
              {isSignedIn && (
                <button 
                  onClick={() => setIsEditing(!isEditing)} 
                  className="font-label text-[10px] uppercase font-bold text-primary active:scale-95 transition-transform"
                >
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <label className="font-label text-[10px] uppercase font-bold text-outline tracking-widest pl-2">Full Name</label>
                  <input type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} className="w-full bg-surface-container-highest border-none rounded-2xl py-3 px-4 text-sm font-body outline-none focus:ring-2 focus:ring-primary-container" />
                </div>
                <div className="space-y-1">
                  <label className="font-label text-[10px] uppercase font-bold text-outline tracking-widest pl-2">Phone</label>
                  <input type="tel" value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} className="w-full bg-surface-container-highest border-none rounded-2xl py-3 px-4 text-sm font-body outline-none focus:ring-2 focus:ring-primary-container" />
                </div>
                <div className="space-y-1">
                  <label className="font-label text-[10px] uppercase font-bold text-outline tracking-widest pl-2">Address</label>
                  <textarea rows={2} value={editData.address} onChange={e => setEditData({...editData, address: e.target.value})} className="w-full bg-surface-container-highest border-none rounded-2xl py-3 px-4 text-sm font-body outline-none focus:ring-2 focus:ring-primary-container resize-none" />
                </div>
                <button 
                  disabled={isUpdatingProfile} 
                  onClick={handleSaveProfile} 
                  className="w-full py-4 mt-2 rounded-2xl bg-primary-container text-on-primary-container font-label font-bold text-xs uppercase tracking-widest disabled:opacity-50"
                >
                  {isUpdatingProfile ? 'Saving...' : 'Save Details'}
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-4">
                  <LuPhone className="text-primary-container text-xl" />
                  <div>
                    <p className="font-label text-[10px] uppercase tracking-widest text-outline font-bold">
                      Phone
                    </p>
                    <p className="font-body font-medium">{displayPhone}</p>
                  </div>
                </div>
                <div className="h-px bg-outline-variant/20"></div>
                <div className="flex items-start gap-4">
                  <LuMapPin className="text-primary-container text-xl" />
                  <div>
                    <p className="font-label text-[10px] uppercase tracking-widest text-outline font-bold">
                      Saved Address
                    </p>
                    <p className="font-body font-medium">{displayAddress}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {isSignedIn && (
            <button
              type="button"
              onClick={handleLogout}
              className="w-full bg-surface-container-highest flex items-center justify-center py-4 rounded-full font-label font-bold text-xs uppercase tracking-widest text-outline hover:text-error transition-colors mt-6"
            >
              Sign Out
            </button>
          )}
        </section>
      </main>

      <BottomNav active="profile" />
    </div>
  );
}
