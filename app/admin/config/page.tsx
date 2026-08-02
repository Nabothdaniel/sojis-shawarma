'use client';

import React, { useEffect, useState } from 'react';
import { adminService, type StoreSettings, type AdminSettings } from '@/lib/api';
import { useAppStore } from '@/store/appStore';
import useAdminGuard from '@/hooks/useAdminGuard';
import { AdminRouteLoadingScreen } from '@/components/ui/AdminSkeletons';
import Link from 'next/link';

export default function AdminConfigPage() {
  const { authLoading, isAdmin } = useAdminGuard();
  const addToast = useAppStore(state => state.addToast);
  
  const [loading, setLoading] = useState(true);
  const [savingStore, setSavingStore] = useState(false);
  const [savingAdmin, setSavingAdmin] = useState(false);
  
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    payment_account_name: '',
    payment_account_number: '',
    payment_bank_name: '',
    payment_note: '',
    support_whatsapp: '',
    pickup_address: '',
    pickup_instructions: '',
    delivery_fee: 0,
  });
  
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    price_markup_multiplier: '1.0',
    usd_to_ngn_rate: '1000',
  });

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;

    async function loadSettings() {
      try {
        const [storeRes, adminRes] = await Promise.all([
          adminService.getStoreSettings(),
          adminService.getSettings()
        ]);
        if (active) {
          if (storeRes.data) setStoreSettings(prev => ({ ...prev, ...storeRes.data }));
          if (adminRes.data) setAdminSettings(prev => ({ ...prev, ...adminRes.data }));
        }
      } catch (err: any) {
        if (active) addToast(err.message || 'Error loading settings', 'error');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadSettings();
    return () => { active = false; };
  }, [isAdmin, addToast]);

  const handleStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStore(true);
    try {
      await adminService.updateStoreSettings(storeSettings);
      addToast('Store settings saved successfully', 'success');
    } catch (err: any) {
      addToast(err.message || 'Could not save store settings', 'error');
    } finally {
      setSavingStore(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAdmin(true);
    try {
      await adminService.updateSettings(adminSettings);
      addToast('Admin settings saved successfully', 'success');
    } catch (err: any) {
      addToast(err.message || 'Could not save admin settings', 'error');
    } finally {
      setSavingAdmin(false);
    }
  };

  const handleStoreChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setStoreSettings(prev => ({
      ...prev,
      [name]: name === 'delivery_fee' ? Number(value) : value
    }));
  };

  const handleAdminChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAdminSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (authLoading || (isAdmin && loading)) {
    return <AdminRouteLoadingScreen />;
  }

  if (!isAdmin) return null;

  return (
    <div className="bg-surface min-h-screen">
      <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-10">
        <header className="flex justify-between items-center bg-white p-6 rounded-[32px] border border-outline-variant/10 shadow-sm">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="h-12 w-12 rounded-2xl bg-surface-container-low flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <div>
              <h1 className="font-headline font-bold text-3xl">Configuration</h1>
              <p className="font-body text-sm text-outline mt-1">Manage global system preferences</p>
            </div>
          </div>
        </header>

        <section className="bg-white rounded-[40px] p-8 md:p-10 border border-outline-variant/10 shadow-sm space-y-6">
          <div>
            <h2 className="font-headline font-bold text-2xl">Store Settings</h2>
            <p className="font-body text-sm text-outline mt-2">These details are shown to customers during checkout and on the public site.</p>
          </div>
          
          <form onSubmit={handleStoreSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="font-label text-xs uppercase tracking-widest font-bold">Bank Name</label>
                <input required type="text" name="payment_bank_name" value={storeSettings.payment_bank_name} onChange={handleStoreChange} className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-5 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container transition-all" placeholder="e.g. GTBank" />
              </div>
              <div className="space-y-2">
                <label className="font-label text-xs uppercase tracking-widest font-bold">Account Name</label>
                <input required type="text" name="payment_account_name" value={storeSettings.payment_account_name} onChange={handleStoreChange} className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-5 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container transition-all" placeholder="e.g. Soji's Shawarma Ltd" />
              </div>
              <div className="space-y-2">
                <label className="font-label text-xs uppercase tracking-widest font-bold">Account Number</label>
                <input required type="text" name="payment_account_number" value={storeSettings.payment_account_number} onChange={handleStoreChange} className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-5 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container transition-all" placeholder="10 digit account number" />
              </div>
              <div className="space-y-2">
                <label className="font-label text-xs uppercase tracking-widest font-bold">Flat Delivery Fee (₦)</label>
                <input required type="number" min="0" name="delivery_fee" value={storeSettings.delivery_fee || 0} onChange={handleStoreChange} className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-5 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container transition-all" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="font-label text-xs uppercase tracking-widest font-bold">Support WhatsApp (with country code)</label>
                <input type="text" name="support_whatsapp" value={storeSettings.support_whatsapp} onChange={handleStoreChange} className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-5 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container transition-all" placeholder="e.g. 2348000000000" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="font-label text-xs uppercase tracking-widest font-bold">Pickup Address</label>
                <textarea required name="pickup_address" rows={2} value={storeSettings.pickup_address} onChange={handleStoreChange} className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-5 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container transition-all" placeholder="Full store address" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="font-label text-xs uppercase tracking-widest font-bold">Pickup Instructions / Payment Note</label>
                <textarea required name="pickup_instructions" rows={2} value={storeSettings.pickup_instructions} onChange={handleStoreChange} className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-5 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container transition-all" placeholder="Provide details like 'Wait for confirmation before coming'" />
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <button disabled={savingStore} type="submit" className="rounded-full bg-primary-container px-8 py-4 text-on-primary-container font-label text-xs font-bold uppercase tracking-widest disabled:opacity-60 hover:opacity-90 transition-opacity">
                {savingStore ? 'Saving...' : 'Save Store Options'}
              </button>
            </div>
          </form>
        </section>


        <section className="bg-white rounded-[40px] p-8 md:p-10 border border-outline-variant/10 shadow-sm space-y-6">
          <div>
            <h2 className="font-headline font-bold text-2xl">Global Variables</h2>
            <p className="font-body text-sm text-outline mt-2">Adjust internal conversion rates and pricing multipliers.</p>
          </div>
          
          <form onSubmit={handleAdminSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="space-y-2">
              <label className="font-label text-xs uppercase tracking-widest font-bold">USD to NGN Rate</label>
              <input required type="number" step="0.01" name="usd_to_ngn_rate" value={adminSettings.usd_to_ngn_rate} onChange={handleAdminChange} className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-5 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container transition-all" placeholder="e.g. 1500" />
            </div>
            <div className="space-y-2">
              <label className="font-label text-xs uppercase tracking-widest font-bold">Price Markup Multiplier</label>
              <input required type="number" step="0.01" name="price_markup_multiplier" value={adminSettings.price_markup_multiplier} onChange={handleAdminChange} className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-5 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container transition-all" placeholder="e.g. 1.05" />
            </div>
            <div className="md:col-span-2 flex justify-end pt-4">
              <button disabled={savingAdmin} type="submit" className="rounded-full bg-on-surface px-8 py-4 text-surface font-label text-xs font-bold uppercase tracking-widest disabled:opacity-60 hover:opacity-90 transition-opacity">
                {savingAdmin ? 'Saving...' : 'Save Variables'}
              </button>
            </div>
          </form>
        </section>

      </div>
    </div>
  );
}
