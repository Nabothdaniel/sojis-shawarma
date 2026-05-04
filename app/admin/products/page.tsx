'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { catalogService, type CatalogCategory, type CatalogProduct } from '@/lib/api';
import { useAppStore } from '@/store/appStore';

export default function AdminProductsPage() {
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  const addToast = useAppStore((state) => state.addToast);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    category_id: '',
    name: '',
    description: '',
    price: '',
    available: true,
  });

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const [categoryResponse, productResponse] = await Promise.all([
        catalogService.getCategories(),
        catalogService.getProducts(),
      ]);
      setCategories(Array.isArray(categoryResponse) ? categoryResponse : []);
      setProducts(Array.isArray(productResponse) ? productResponse : []);
      if (!form.category_id && Array.isArray(categoryResponse) && categoryResponse[0]) {
        setForm((current) => ({ ...current, category_id: String(categoryResponse[0].id) }));
      }
    } catch (error: any) {
      addToast(error.message || 'Could not load catalog data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !token) {
      router.replace('/admin/login');
      return;
    }

    if (token) {
      loadCatalog();
    }
  }, [token, authLoading, router]);

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
      setForm({
        category_id: form.category_id,
        name: '',
        description: '',
        price: '',
        available: true,
      });
      setImageFile(null);
      await loadCatalog();
    } catch (error: any) {
      addToast(error.message || 'Could not upload product', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-label text-[10px] uppercase tracking-[0.3em] text-outline font-bold">Admin</p>
            <h1 className="font-headline text-3xl font-bold">Products</h1>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/orders" className="rounded-full bg-surface-container-low px-5 py-3 text-xs font-label font-bold uppercase tracking-widest">Orders</Link>
            <Link href="/admin/reviews" className="rounded-full bg-surface-container-low px-5 py-3 text-xs font-label font-bold uppercase tracking-widest">Reviews</Link>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[32px] bg-white p-6 shadow-sm border border-outline-variant/10">
            <h2 className="font-headline text-xl font-bold mb-4">Add a menu item</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <select
                value={form.category_id}
                onChange={(event) => setForm((current) => ({ ...current, category_id: event.target.value }))}
                className="w-full rounded-2xl bg-surface-container-highest px-4 py-4 text-sm outline-none"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Product name" className="w-full rounded-2xl bg-surface-container-highest px-4 py-4 text-sm outline-none" />
              <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={4} placeholder="Description" className="w-full rounded-2xl bg-surface-container-highest px-4 py-4 text-sm outline-none resize-none" />
              <input value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} type="number" min="0" placeholder="Price" className="w-full rounded-2xl bg-surface-container-highest px-4 py-4 text-sm outline-none" />
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
              <button disabled={saving} className="w-full rounded-full bg-on-surface py-4 text-xs font-label font-bold uppercase tracking-widest text-surface">
                {saving ? 'Saving...' : 'Upload product'}
              </button>
            </form>
          </section>

          <section className="rounded-[32px] bg-white p-6 shadow-sm border border-outline-variant/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-headline text-xl font-bold">Current menu</h2>
              <span className="text-xs font-label font-bold uppercase tracking-widest text-outline">{products.length} items</span>
            </div>
            <div className="space-y-3">
              {loading && <div className="rounded-2xl bg-surface-container-low p-4 text-sm text-outline">Loading products...</div>}
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
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

