'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { adminService, catalogService, type CatalogCategory, type CatalogProduct, type StoreSettings } from '@/lib/api';
import { useAppStore } from '@/store/appStore';
import useAdminGuard from '@/hooks/useAdminGuard';
import { AdminRouteLoadingScreen, SkeletonBlock } from '@/components/ui/AdminSkeletons';

const defaultStoreSettings: StoreSettings = {
  payment_account_name: '',
  payment_account_number: '',
  payment_bank_name: '',
  payment_note: '',
  support_whatsapp: '',
  pickup_address: '',
  pickup_instructions: '',
};

export default function AdminProductsPage() {
  const { token, authLoading, isAdmin } = useAdminGuard();
  const addToast = useAppStore((state) => state.addToast);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categorySaving, setCategorySaving] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(defaultStoreSettings);
  const [form, setForm] = useState({
    category_id: '',
    name: '',
    description: '',
    price: '',
    available: true,
  });
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    active: true,
  });

  const loadAdminCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const [categoryResponse, productResponse, storeResponse] = await Promise.all([
        catalogService.getCategories(),
        catalogService.getProducts(),
        adminService.getStoreSettings(),
      ]);

      const nextCategories = Array.isArray(categoryResponse) ? categoryResponse : [];
      const nextProducts = Array.isArray(productResponse) ? productResponse : [];
      setCategories(nextCategories);
      setProducts(nextProducts);
      setStoreSettings(storeResponse.data || defaultStoreSettings);
      if (!form.category_id && nextCategories[0]) {
        setForm((current) => ({ ...current, category_id: String(nextCategories[0].id) }));
      }
    } catch (error: any) {
      addToast(error.message || 'Could not load admin catalog', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, form.category_id]);

  useEffect(() => {
    if (!isAdmin || !token) {
      return;
    }

    loadAdminCatalog();
  }, [isAdmin, loadAdminCatalog, token]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!imageFile) {
      addToast('Please select a product image', 'error');
      return;
    }

    setSaving(true);
    try {
      const uploadData = new FormData();
      uploadData.append('file', imageFile);
      const uploadResponse = await catalogService.uploadCatalogAsset(uploadData);

      await catalogService.createProduct({
        category_id: Number(form.category_id),
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        image_url: uploadResponse.data.path,
        available: form.available ? 1 : 0,
      });

      addToast('Product uploaded successfully', 'success');
      setForm((current) => ({
        ...current,
        name: '',
        description: '',
        price: '',
        available: true,
      }));
      setImageFile(null);
      await loadAdminCatalog();
    } catch (error: any) {
      addToast(error.message || 'Could not upload product', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCategorySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setCategorySaving(true);
    try {
      let imageUrl = '';
      if (categoryImageFile) {
        const uploadData = new FormData();
        uploadData.append('file', categoryImageFile);
        const uploadResponse = await catalogService.uploadCatalogAsset(uploadData);
        imageUrl = uploadResponse.data.path;
      }

      await catalogService.createCategory({
        name: categoryForm.name.trim(),
        image_url: imageUrl || undefined,
        active: categoryForm.active ? 1 : 0,
      });

      addToast('Category created', 'success');
      setCategoryForm({ name: '', active: true });
      setCategoryImageFile(null);
      await loadAdminCatalog();
    } catch (error: any) {
      addToast(error.message || 'Could not create category', 'error');
    } finally {
      setCategorySaving(false);
    }
  };

  const saveStoreSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    setSettingsSaving(true);
    try {
      const response = await adminService.updateStoreSettings(storeSettings);
      setStoreSettings(response.data || defaultStoreSettings);
      addToast('Payment and pickup settings updated', 'success');
    } catch (error: any) {
      addToast(error.message || 'Could not save store settings', 'error');
    } finally {
      setSettingsSaving(false);
    }
  };

  if (authLoading || (isAdmin && loading && categories.length === 0 && products.length === 0)) {
    return <AdminRouteLoadingScreen />;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-label text-[10px] uppercase tracking-[0.3em] text-outline font-bold">Admin</p>
            <h1 className="font-headline text-3xl font-bold">Catalog and Payments</h1>
            <p className="mt-2 text-sm text-outline">Manage product categories, menu items, and the payment details customers see during checkout.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/orders" className="rounded-full bg-on-surface px-5 py-3 text-xs font-label font-bold uppercase tracking-widest text-surface">Orders</Link>
            <Link href="/admin/reviews" className="rounded-full bg-surface-container-low px-5 py-3 text-xs font-label font-bold uppercase tracking-widest">Reviews</Link>
          </div>
        </header>

        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <section className="rounded-[32px] bg-white p-6 shadow-sm border border-outline-variant/10">
              <h2 className="mb-4 font-headline text-xl font-bold">Add a menu item</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <select
                  value={form.category_id}
                  onChange={(event) => setForm((current) => ({ ...current, category_id: event.target.value }))}
                  className="w-full rounded-2xl bg-surface-container-highest px-4 py-4 text-sm outline-none focus:ring-2 focus:ring-primary-container/30"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Product name" className="w-full rounded-2xl bg-surface-container-highest px-4 py-4 text-sm outline-none focus:ring-2 focus:ring-primary-container/30" />
                <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={4} placeholder="Description" className="w-full resize-none rounded-2xl bg-surface-container-highest px-4 py-4 text-sm outline-none focus:ring-2 focus:ring-primary-container/30" />
                <input value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} type="number" min="0" placeholder="Price" className="w-full rounded-2xl bg-surface-container-highest px-4 py-4 text-sm outline-none focus:ring-2 focus:ring-primary-container/30" />
                <label className="flex items-center justify-between rounded-2xl bg-surface-container-highest px-4 py-4 text-sm">
                  <span>Available for ordering</span>
                  <input type="checkbox" checked={form.available} onChange={(event) => setForm((current) => ({ ...current, available: event.target.checked }))} />
                </label>
                <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-outline-variant/40 bg-surface-container-low px-6 py-8 text-center">
                  <input type="file" accept="image/*" className="hidden" onChange={(event) => setImageFile(event.target.files?.[0] || null)} />
                  <span className="material-symbols-outlined mb-3 text-4xl text-outline">image</span>
                  <p className="font-body font-bold text-sm">{imageFile?.name || 'Select product image'}</p>
                  <p className="font-body text-xs text-outline mt-1">JPG, PNG, or WEBP up to 5MB</p>
                </label>
                <button disabled={saving} className="w-full rounded-full bg-on-surface py-4 text-xs font-label font-bold uppercase tracking-widest text-surface disabled:opacity-60">
                  {saving ? 'Saving...' : 'Upload product'}
                </button>
              </form>
            </section>

            <section className="rounded-[32px] bg-white p-6 shadow-sm border border-outline-variant/10">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-headline text-xl font-bold">Categories</h2>
                <span className="text-xs font-label font-bold uppercase tracking-widest text-outline">{categories.length} active</span>
              </div>
              <form onSubmit={handleCategorySubmit} className="grid gap-4 md:grid-cols-[1fr_auto]">
                <div className="space-y-4">
                  <input value={categoryForm.name} onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))} placeholder="Category name" className="w-full rounded-2xl bg-surface-container-highest px-4 py-4 text-sm outline-none focus:ring-2 focus:ring-primary-container/30" />
                  <label className="flex cursor-pointer items-center justify-between rounded-2xl bg-surface-container-highest px-4 py-4 text-sm">
                    <span>{categoryImageFile?.name || 'Optional category image'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(event) => setCategoryImageFile(event.target.files?.[0] || null)} />
                    <span className="text-xs font-bold uppercase tracking-widest text-outline">Upload</span>
                  </label>
                  <label className="flex items-center justify-between rounded-2xl bg-surface-container-highest px-4 py-4 text-sm">
                    <span>Visible to customers</span>
                    <input type="checkbox" checked={categoryForm.active} onChange={(event) => setCategoryForm((current) => ({ ...current, active: event.target.checked }))} />
                  </label>
                </div>
                <button disabled={categorySaving} className="rounded-full bg-primary-container px-6 py-4 text-xs font-label font-bold uppercase tracking-widest text-on-primary-container disabled:opacity-60">
                  {categorySaving ? 'Saving...' : 'Add category'}
                </button>
              </form>
              <div className="mt-5 flex flex-wrap gap-3">
                {categories.map((category) => (
                  <span key={category.id} className="rounded-full bg-surface-container-low px-4 py-2 text-xs font-bold uppercase tracking-widest text-on-surface">
                    {category.name}
                  </span>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <section className="rounded-[32px] bg-white p-6 shadow-sm border border-outline-variant/10">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-headline text-xl font-bold">Payment and pickup info</h2>
                <span className="text-xs font-label font-bold uppercase tracking-widest text-outline">Checkout settings</span>
              </div>
              <form onSubmit={saveStoreSettings} className="space-y-4">
                <input value={storeSettings.payment_bank_name} onChange={(event) => setStoreSettings((current) => ({ ...current, payment_bank_name: event.target.value }))} placeholder="Bank name" className="w-full rounded-2xl bg-surface-container-highest px-4 py-4 text-sm outline-none focus:ring-2 focus:ring-primary-container/30" />
                <input value={storeSettings.payment_account_name} onChange={(event) => setStoreSettings((current) => ({ ...current, payment_account_name: event.target.value }))} placeholder="Account name" className="w-full rounded-2xl bg-surface-container-highest px-4 py-4 text-sm outline-none focus:ring-2 focus:ring-primary-container/30" />
                <input value={storeSettings.payment_account_number} onChange={(event) => setStoreSettings((current) => ({ ...current, payment_account_number: event.target.value }))} placeholder="Account number" className="w-full rounded-2xl bg-surface-container-highest px-4 py-4 text-sm outline-none focus:ring-2 focus:ring-primary-container/30" />
                <textarea value={storeSettings.payment_note} onChange={(event) => setStoreSettings((current) => ({ ...current, payment_note: event.target.value }))} rows={3} placeholder="Payment note shown to customers" className="w-full resize-none rounded-2xl bg-surface-container-highest px-4 py-4 text-sm outline-none focus:ring-2 focus:ring-primary-container/30" />
                <input value={storeSettings.support_whatsapp} onChange={(event) => setStoreSettings((current) => ({ ...current, support_whatsapp: event.target.value }))} placeholder="Support WhatsApp e.g. 2348012345678" className="w-full rounded-2xl bg-surface-container-highest px-4 py-4 text-sm outline-none focus:ring-2 focus:ring-primary-container/30" />
                <textarea value={storeSettings.pickup_address} onChange={(event) => setStoreSettings((current) => ({ ...current, pickup_address: event.target.value }))} rows={2} placeholder="Pickup address" className="w-full resize-none rounded-2xl bg-surface-container-highest px-4 py-4 text-sm outline-none focus:ring-2 focus:ring-primary-container/30" />
                <textarea value={storeSettings.pickup_instructions} onChange={(event) => setStoreSettings((current) => ({ ...current, pickup_instructions: event.target.value }))} rows={3} placeholder="Pickup instructions" className="w-full resize-none rounded-2xl bg-surface-container-highest px-4 py-4 text-sm outline-none focus:ring-2 focus:ring-primary-container/30" />
                <button disabled={settingsSaving} className="w-full rounded-full bg-tertiary py-4 text-xs font-label font-bold uppercase tracking-widest text-white disabled:opacity-60">
                  {settingsSaving ? 'Saving...' : 'Save settings'}
                </button>
              </form>
            </section>

            <section className="rounded-[32px] bg-white p-6 shadow-sm border border-outline-variant/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-headline text-xl font-bold">Current menu</h2>
                <span className="text-xs font-label font-bold uppercase tracking-widest text-outline">{products.length} items</span>
              </div>
              <div className="space-y-3">
                {loading && (
                  <>
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="rounded-2xl bg-surface-container-low p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2">
                            <SkeletonBlock className="h-4 w-28" />
                            <SkeletonBlock className="h-3 w-24" />
                          </div>
                          <SkeletonBlock className="h-4 w-16" />
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {!loading && products.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-outline-variant/40 bg-surface-container-low p-6 text-sm text-outline">
                    No products yet. Add your first menu item from the form on the left.
                  </div>
                )}
                {!loading && products.map((product) => (
                  <article key={product.id} className="rounded-2xl bg-surface-container-low p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-body font-bold text-sm">{product.name}</p>
                        <p className="font-body text-xs text-outline">{product.category_name || 'Uncategorized'}</p>
                      </div>
                      <span className="font-label font-bold text-sm">₦{Number(product.price).toLocaleString()}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-[10px] font-label font-bold uppercase tracking-widest">
                      <span className={Number(product.available) === 1 ? 'text-tertiary' : 'text-error'}>
                        {Number(product.available) === 1 ? 'available' : 'hidden'}
                      </span>
                      <span className="text-outline">{product.review_count || 0} reviews</span>
                      <span className="text-outline">{product.order_count || 0} orders</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
