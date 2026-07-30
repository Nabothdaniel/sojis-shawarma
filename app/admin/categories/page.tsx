'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { catalogService, type CatalogCategory } from '@/lib/api';
import { useAppStore } from '@/store/appStore';
import useAdminGuard from '@/hooks/useAdminGuard';
import { AdminRouteLoadingScreen } from '@/components/ui/AdminSkeletons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LuArrowLeft, LuTag, LuTrash2, LuFolderPlus } from 'react-icons/lu';

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { authLoading, isAdmin } = useAdminGuard();
  const addToast = useAppStore((state) => state.addToast);
  
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // Quick hack/feature: allows editing inside the mapped list (if time permits)
  // For simplicity, we just delete or add.

  useEffect(() => {
    if (!isAdmin) return;
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const data = await catalogService.getCategories();
      setCategories(data);
    } catch {
      addToast('Failed to load categories', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return addToast('Category name cannot be empty', 'error');
    
    setIsSubmitting(true);
    try {
      await catalogService.createCategory({
        name: newCategoryName.trim(),
        active: 1
      });
      addToast('Category created completely', 'success');
      setNewCategoryName('');
      fetchCategories();
    } catch (err: any) {
      addToast(err.message || 'Could not create category', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string | number) => {
    if (!window.confirm('Delete this category? Products using this category might lose their grouping.')) return;
    
    try {
      await catalogService.deleteCategory(id);
      addToast('Category deleted', 'success');
      setCategories(c => c.filter(cat => cat.id !== id));
    } catch {
      addToast('Failed to delete category', 'error');
    }
  };

  if (authLoading || (isAdmin && isLoading && categories.length === 0)) {
    return <AdminRouteLoadingScreen />;
  }

  if (!isAdmin) return null;

  return (
    <div className="bg-surface min-h-screen text-on-surface">
      <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-8">
        
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin')}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low active:scale-95 transition-transform"
            >
              <LuArrowLeft className="text-xl" />
            </button>
            <div>
              <h1 className="font-headline font-bold text-3xl">Categories</h1>
              <p className="font-body text-sm text-outline mt-1">Manage global product types</p>
            </div>
          </div>
        </header>

        <section className="grid gap-8 md:grid-cols-[1fr_2fr]">
          
          {/* Create New Category */}
          <div className="bg-white p-6 rounded-[32px] border border-outline-variant/10 shadow-sm h-fit space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center">
                <LuFolderPlus />
              </div>
              <h2 className="font-headline font-bold text-lg">Add New</h2>
            </div>
            
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <Input
                type="text"
                placeholder="Category name (e.g. Combos)"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                required
              />
              <Button type="submit" isLoading={isSubmitting} variant="primary" className="w-full">
                Create Category
              </Button>
            </form>
          </div>

          {/* List of Categories */}
          <div className="bg-white p-6 rounded-[32px] border border-outline-variant/10 shadow-sm space-y-6">
            <h2 className="font-headline font-bold text-lg flex items-center gap-2">
              <LuTag className="text-primary" /> Active Categories
            </h2>
            
            <div className="space-y-3">
              {categories.length === 0 && !isLoading && (
                <div className="text-center p-8 bg-surface-container-lowest rounded-[24px] text-outline text-sm">
                  No categories found. Create one to get started.
                </div>
              )}
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-4 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl group hover:border-primary-container transition-colors">
                  <div>
                    <h3 className="font-headline font-bold text-sm text-on-surface">{cat.name}</h3>
                    <p className="font-mono text-[10px] text-outline">slug: {cat.slug}</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="w-8 h-8 rounded-full bg-error/10 text-error flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity active:scale-95"
                    title="Delete category"
                  >
                    <LuTrash2 className="text-sm" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
        </section>

      </div>
    </div>
  );
}
