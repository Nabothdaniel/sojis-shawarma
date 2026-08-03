'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { adminService, type StoreSettings } from '@/lib/api/admin.service';
import { catalogService, type CatalogCategory, type CatalogProduct } from '@/lib/api/catalog.service';
import { useAppStore } from '@/store/appStore';
import useAdminGuard from '@/hooks/useAdminGuard';
import { AdminRouteLoadingScreen, SkeletonBlock } from '@/components/ui/AdminSkeletons';
import { AdminSection, AdminPageHeader } from '@/components/admin/ui/AdminContainers';
import { AdminInput, AdminTextarea, AdminSelect, AdminCheckbox } from '@/components/admin/ui/AdminForms';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { useWalkthrough } from '@/hooks/useWalkthrough';
const defaultStoreSettings: StoreSettings = {
  payment_account_name: '',
  payment_account_number: '',
  payment_bank_name: '',
  payment_note: '',
  support_whatsapp: '',
  pickup_address: '',
  pickup_instructions: '',
  delivery_fee: 0,
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
  const [editingProductId, setEditingProductId] = useState<string | number | null>(null);

  const [form, setForm] = useState({
    category_id: '',
    name: '',
    description: '',
    specifications: '',
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

  useWalkthrough('admin_products_tour_v1', [
    { element: '#tour-product-form', popover: { title: 'Add Menu Items', description: 'Fill out this form to add a new shawarma or drink to your storefront.' } },
    { element: '#tour-store-settings', popover: { title: 'Payment Details', description: 'Enter your bank details here so customers know where to transfer their payments.', side: 'left' } },
    { element: '#tour-product-list', popover: { title: 'Current Menu', description: 'All your active items are listed here. You can easily edit or delete them anytime.', side: 'top' } }
  ], { enabled: isAdmin && !loading });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingProductId && !imageFile) {
      addToast('Please select a product image for new products', 'error');
      return;
    }

    setSaving(true);
    try {
      let imageUrl = undefined;
      
      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append('file', imageFile);
        const uploadResponse = await catalogService.uploadCatalogAsset(uploadData);
        imageUrl = uploadResponse.data.path;
      }

      const payload = {
        category_id: Number(form.category_id),
        name: form.name.trim(),
        description: form.description.trim(),
        specifications: form.specifications.trim(),
        price: Number(form.price),
        available: form.available ? 1 : 0,
      };

      if (editingProductId) {
        await catalogService.updateProduct(editingProductId, { ...payload, ...(imageUrl ? { image_url: imageUrl } : {}) });
        addToast('Product updated successfully', 'success');
      } else {
        await catalogService.createProduct({
          ...payload,
          image_url: imageUrl!,
        });
        addToast('Product uploaded successfully', 'success');
      }

      setForm({
        category_id: form.category_id,
        name: '',
        description: '',
        specifications: '',
        price: '',
        available: true,
      });
      setImageFile(null);
      setEditingProductId(null);
      await loadAdminCatalog();
    } catch (error: any) {
      addToast(error.message || 'Could not save product', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEditProduct = (product: CatalogProduct) => {
    setEditingProductId(product.id);
    setForm({
      category_id: String(product.category_id || ''),
      name: product.name,
      description: product.description || '',
      specifications: product.specifications || '',
      price: String(product.price),
      available: Number(product.available) === 1,
    });
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleDeleteProduct = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await catalogService.deleteProduct(id);
      addToast('Product deleted', 'success');
      await loadAdminCatalog();
    } catch (error: any) {
      addToast(error.message || 'Could not delete product', 'error');
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
    <div className="min-h-screen bg-surface p-6 md:p-10 w-full">
      <div className="mx-auto max-w-7xl space-y-8">
        <AdminPageHeader label="Admin" title="Catalog and Payments" subtitle="Manage product categories, menu items, and the payment details customers see during checkout.">
          <Link href="/admin/orders" className="rounded-full bg-on-surface px-5 py-3 text-xs font-label font-bold uppercase tracking-widest text-surface">Orders</Link>
          <Link href="/admin/promos" className="rounded-full bg-surface-container-low px-5 py-3 text-xs font-label font-bold uppercase tracking-widest">Promos</Link>
        </AdminPageHeader>

        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <AdminSection id="tour-product-form" className="relative">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-headline text-xl font-bold">{editingProductId ? 'Edit menu item' : 'Add a menu item'}</h2>
                {editingProductId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProductId(null);
                      setForm({ category_id: categories[0]?.id as string, name: '', description: '', specifications: '', price: '', available: true });
                    }}
                    className="text-xs text-error font-bold font-label uppercase tracking-widest"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <AdminSelect
                  value={form.category_id}
                  onChange={(event) => setForm((current) => ({ ...current, category_id: event.target.value }))}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </AdminSelect>
                <AdminInput value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Product name" />
                <AdminTextarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={3} placeholder="Description" />
                <AdminTextarea value={form.specifications} onChange={(event) => setForm((current) => ({ ...current, specifications: event.target.value }))} rows={2} placeholder="Specifications (e.g. Size Variations, Ingredients)" />
                
                <AdminInput value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} type="number" min="0" placeholder="Price" />
                
                <AdminCheckbox 
                  label="Available for ordering" 
                  checked={form.available} 
                  onChange={(checked) => setForm((current) => ({ ...current, available: checked }))} 
                />
                
                <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-outline-variant/40 bg-surface-container-low px-6 py-8 text-center">
                  <input type="file" accept="image/*" className="hidden" onChange={(event) => setImageFile(event.target.files?.[0] || null)} />
                  <span className="material-symbols-outlined mb-3 text-4xl text-outline">image</span>
                  <p className="font-body font-bold text-sm">{imageFile?.name || (editingProductId ? 'Select a new image to replace (optional)' : 'Select product image')}</p>
                  <p className="font-body text-xs text-outline mt-1">JPG, PNG, or WEBP up to 5MB</p>
                </label>
                
                <AdminButton type="submit" disabled={saving} variant={editingProductId ? 'tertiary' : 'primary'} fullWidth>
                  {saving ? 'Saving...' : (editingProductId ? 'Update product' : 'Upload product')}
                </AdminButton>
              </form>
            </AdminSection>

            <AdminSection>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-headline text-xl font-bold">Categories</h2>
                <span className="text-xs font-label font-bold uppercase tracking-widest text-outline">{categories.length} active</span>
              </div>
              <form onSubmit={handleCategorySubmit} className="grid gap-4 md:grid-cols-[1fr_auto]">
                <div className="space-y-4">
                  <AdminInput value={categoryForm.name} onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))} placeholder="Category name" />
                  <label className="flex cursor-pointer items-center justify-between rounded-2xl bg-surface-container-highest px-4 py-4 text-sm gap-2">
                    <span className="truncate flex-1">{categoryImageFile?.name || 'Optional category image'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(event) => setCategoryImageFile(event.target.files?.[0] || null)} />
                    <span className="text-xs font-bold uppercase tracking-widest text-outline shrink-0">Upload</span>
                  </label>
                  <AdminCheckbox 
                    label="Visible to customers" 
                    checked={categoryForm.active} 
                    onChange={(checked) => setCategoryForm((current) => ({ ...current, active: checked }))} 
                  />
                </div>
                <AdminButton type="submit" disabled={categorySaving} variant="tertiary" className="md:self-start">
                  {categorySaving ? 'Saving...' : 'Add category'}
                </AdminButton>
              </form>
              <div className="mt-5 flex flex-wrap gap-3">
                {categories.map((category) => (
                  <span key={category.id} className="rounded-full bg-surface-container-low px-4 py-2 text-xs font-bold uppercase tracking-widest text-on-surface">
                    {category.name}
                  </span>
                ))}
              </div>
            </AdminSection>
          </div>

          <div className="space-y-8">
            <AdminSection id="tour-store-settings">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-headline text-xl font-bold">Store Settings</h2>
                <span className="text-xs font-label font-bold uppercase tracking-widest text-outline">Payments & delivery</span>
              </div>
              <form onSubmit={saveStoreSettings} className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <AdminInput value={storeSettings.payment_bank_name} onChange={(event) => setStoreSettings((current) => ({ ...current, payment_bank_name: event.target.value }))} placeholder="Bank name" />
                  <AdminInput value={storeSettings.payment_account_number} onChange={(event) => setStoreSettings((current) => ({ ...current, payment_account_number: event.target.value }))} placeholder="Account number" />
                </div>
                <AdminInput value={storeSettings.payment_account_name} onChange={(event) => setStoreSettings((current) => ({ ...current, payment_account_name: event.target.value }))} placeholder="Account name" />
                
                <h3 className="text-xs font-label font-bold uppercase tracking-widest text-outline pt-2">Delivery & Contact</h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm">₦</span>
                  <AdminInput 
                    value={storeSettings.delivery_fee || 0} 
                    onChange={(event) => setStoreSettings((current) => ({ ...current, delivery_fee: Number(event.target.value) }))} 
                    type="number" min="0" placeholder="Delivery Fee (0 = Free)" 
                  />
                </div>
                <AdminInput value={storeSettings.support_whatsapp} onChange={(event) => setStoreSettings((current) => ({ ...current, support_whatsapp: event.target.value }))} placeholder="Support WhatsApp e.g. 2348012345678" />
                <AdminTextarea value={storeSettings.pickup_address} onChange={(event) => setStoreSettings((current) => ({ ...current, pickup_address: event.target.value }))} rows={2} placeholder="Pickup address" />
                
                <AdminButton type="submit" disabled={settingsSaving} variant="tertiary" fullWidth>
                  {settingsSaving ? 'Saving...' : 'Save settings'}
                </AdminButton>
              </form>
            </AdminSection>

            <AdminSection id="tour-product-list">
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
                  <article key={product.id} className="rounded-2xl bg-surface-container-low p-4 relative group">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-body font-bold text-sm pr-16">{product.name}</p>
                        <p className="font-body text-xs text-outline line-clamp-1">{product.specifications || product.description || product.category_name}</p>
                      </div>
                      <span className="font-label font-bold text-sm shrink-0">₦{Number(product.price).toLocaleString()}</span>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] font-label font-bold uppercase tracking-widest">
                        <span className={Number(product.available) === 1 ? 'text-tertiary' : 'text-error'}>
                          {Number(product.available) === 1 ? 'available' : 'hidden'}
                        </span>
                        <span className="text-outline">{product.review_count || 0} reviews</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
                        <button onClick={() => handleDeleteProduct(product.id)} className="text-error bg-error/10 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest md:opacity-0 md:group-hover:opacity-100 transition-opacity opacity-100">
                          Delete
                        </button>
                        <button onClick={() => handleEditProduct(product)} className="text-on-surface bg-surface-container-highest rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                          Edit
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </AdminSection>
          </div>
        </div>
      </div>
    </div>
  );
}
