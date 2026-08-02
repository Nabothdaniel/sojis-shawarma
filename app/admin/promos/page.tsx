'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { adminService, type PromoCode } from '@/lib/api';
import { useAppStore } from '@/store/appStore';
import useAdminGuard from '@/hooks/useAdminGuard';
import { AdminRouteLoadingScreen, SkeletonBlock } from '@/components/ui/AdminSkeletons';

export default function AdminPromosPage() {
  const { token, authLoading, isAdmin } = useAdminGuard();
  const addToast = useAppStore((state) => state.addToast);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    code: '',
    discount_type: 'fixed',
    discount_value: '',
    active: true,
  });

  const loadPromos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getPromoCodes();
      setPromos(Array.isArray(data) ? data : []);
    } catch (error: any) {
      addToast(error.message || 'Could not load promo codes', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (!isAdmin || !token) return;
    loadPromos();
  }, [isAdmin, loadPromos, token]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.code.trim() || !form.discount_value) return addToast('Please fill all fields', 'error');

    setSaving(true);
    try {
      await adminService.createPromoCode({
        code: form.code.trim().toUpperCase(),
        discount_type: form.discount_type as 'percentage' | 'fixed',
        discount_value: Number(form.discount_value),
        active: form.active,
      });

      addToast('Promo code created', 'success');
      setForm({ code: '', discount_type: 'fixed', discount_value: '', active: true });
      await loadPromos();
    } catch (error: any) {
      addToast(error.message || 'Could not create promo code', 'error');
    } finally {
      setSaving(false);
    }
  };

  const togglePromoStatus = async (promo: PromoCode) => {
    try {
      await adminService.togglePromoCode(promo.id, !promo.active);
      addToast(`Promo ${promo.active ? 'disabled' : 'enabled'}`, 'success');
      await loadPromos();
    } catch (error: any) {
      addToast(error.message || 'Could not update promo', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promo code?')) return;
    try {
      await adminService.deletePromoCode(id);
      addToast('Promo deleted', 'success');
      await loadPromos();
    } catch (error: any) {
      addToast(error.message || 'Could not delete promo', 'error');
    }
  };

  if (authLoading || (isAdmin && loading && promos.length === 0)) {
    return <AdminRouteLoadingScreen />;
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-surface p-6 md:p-10 w-full">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-label text-[10px] uppercase tracking-[0.3em] text-outline font-bold">Admin</p>
            <h1 className="font-headline text-3xl font-bold">Promo Codes</h1>
            <p className="mt-2 text-sm text-outline">Create discounts to share with customers.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/dashboard" className="rounded-full bg-surface-container-low px-5 py-3 text-xs font-label font-bold uppercase tracking-widest">Dashboard</Link>
          </div>
        </header>

        <div className="grid gap-8 md:grid-cols-[1fr_1.5fr]">
          <section className="rounded-[32px] bg-white p-6 shadow-sm border border-outline-variant/10 space-y-4 h-fit">
            <h2 className="font-headline text-xl font-bold">Create Promo</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input value={form.code} onChange={(e) => setForm(c => ({ ...c, code: e.target.value.toUpperCase().replace(/\s+/g, '') }))} placeholder="Code e.g. FREESH!" className="w-full rounded-2xl bg-surface-container-highest px-4 py-4 text-sm outline-none focus:ring-2 focus:ring-primary-container/30" />
              <select value={form.discount_type} onChange={(e) => setForm(c => ({ ...c, discount_type: e.target.value }))} className="w-full rounded-2xl bg-surface-container-highest px-4 py-4 text-sm outline-none focus:ring-2 focus:ring-primary-container/30">
                <option value="fixed">Fixed Amount (₦)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
              <input value={form.discount_value} onChange={(e) => setForm(c => ({ ...c, discount_value: e.target.value }))} type="number" min="1" placeholder={form.discount_type === 'percentage' ? "Percentage (e.g. 10)" : "Amount (e.g. 500)"} className="w-full rounded-2xl bg-surface-container-highest px-4 py-4 text-sm outline-none focus:ring-2 focus:ring-primary-container/30" />
              <div className="flex items-center justify-between px-2 text-sm">
                <span>Active immediately</span>
                <input type="checkbox" checked={form.active} onChange={(e) => setForm(c => ({ ...c, active: e.target.checked }))} />
              </div>
              <button disabled={saving} className="w-full rounded-full bg-on-surface py-4 text-xs font-label font-bold uppercase tracking-widest text-surface disabled:opacity-60">
                {saving ? 'Creating...' : 'Create Promo Code'}
              </button>
            </form>
          </section>

          <section className="rounded-[32px] bg-white p-6 shadow-sm border border-outline-variant/10">
            <h2 className="font-headline text-xl font-bold mb-4">Active Promos</h2>
            <div className="space-y-3">
              {loading && <SkeletonBlock className="h-16 w-full" />}
              {!loading && promos.length === 0 && (
                <div className="rounded-2xl border border-dashed border-outline-variant/40 bg-surface-container-low p-6 text-sm text-outline text-center">
                  No promo codes created yet.
                </div>
              )}
              {promos.map((promo) => (
                <div key={promo.id} className="flex items-center justify-between rounded-2xl bg-surface-container-low p-4">
                  <div>
                    <p className="font-label font-bold text-lg tracking-wider text-on-surface">{promo.code}</p>
                    <p className="text-xs text-outline font-body">
                      Discounts {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `₦${promo.discount_value.toLocaleString()}`} 
                      • Used {promo.times_used || 0} times
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => togglePromoStatus(promo)} className={`rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest ${promo.active ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-highest text-outline'}`}>
                      {promo.active ? 'Active' : 'Disabled'}
                    </button>
                    <button onClick={() => handleDelete(promo.id)} className="text-error bg-error/10 w-8 h-8 rounded-full flex justify-center items-center font-bold">
                      &times;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
