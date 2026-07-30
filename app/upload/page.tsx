'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { catalogService, type CatalogCategory } from '@/lib/api';
import { useAppStore } from '@/store/appStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function UploadProductPage() {
  const { addToast } = useAppStore();
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    available: 1
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    let canceled = false;
    catalogService.getCategories().then((data) => {
      if (!canceled) {
        setCategories(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, categoryId: data[0].id.toString() }));
        }
      }
    }).catch((err) => {
      if (!canceled) addToast('Failed to load categories', 'error');
    });
    return () => { canceled = true; };
  }, [addToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      return addToast('Please select an image', 'error');
    }
    if (!formData.name || !formData.price || !formData.categoryId || !formData.description) {
      return addToast('Please fill all fields', 'error');
    }

    setIsLoading(true);
    try {
      // 1. Upload Image
      const uploadForm = new FormData();
      uploadForm.append('file', imageFile);
      const uploadResult = await catalogService.uploadCatalogAsset(uploadForm);
      const imageUrl = uploadResult.data.path;

      // 2. Create Product
      await catalogService.createProduct({
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        category_id: formData.categoryId,
        image_url: imageUrl,
        available: formData.available,
      });

      addToast('Product successfully uploaded!', 'success');
      // Reset
      setFormData({ ...formData, name: '', description: '', price: '' });
      setImageFile(null);
    } catch (err: any) {
      addToast(err.message || 'Upload failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-32">
      <header className="px-6 py-6 border-b border-outline-variant/20 bg-surface sticky top-0 z-40">
        <h1 className="font-headline font-bold text-xl">Upload Product</h1>
      </header>

      <main className="px-6 py-8 max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="border-2 border-dashed border-outline-variant/50 rounded-3xl p-8 flex flex-col items-center justify-center bg-surface-container-lowest cursor-pointer hover:bg-surface-container-low transition-colors relative">
            <input
              type="file"
              accept="image/*"
              required
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setImageFile(e.target.files[0]);
                }
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {imageFile ? (
              <p className="font-headline font-bold text-center text-primary">{imageFile.name}</p>
            ) : (
              <>
                <p className="font-headline font-bold text-center mb-1">Tap to select Image</p>
                <p className="font-label text-xs text-outline">Product photo (JPEG/PNG)</p>
              </>
            )}
          </div>

          <Input
            type="text"
            placeholder="Product Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div className="space-y-1">
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-6 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container transition-all"
              required
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <div className="flex justify-between items-center px-4 mt-1">
              <p className="text-[10px] text-outline uppercase font-bold tracking-widest">Category</p>
              <Link href="/admin/categories" className="text-[10px] text-primary uppercase font-bold tracking-widest hover:underline">Manage Categories</Link>
            </div>
          </div>

          <Input
            type="number"
            placeholder="Price (₦)"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            required
            min="0"
          />

          <textarea
            placeholder="Description..."
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-6 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container transition-all resize-none"
            required
          />

          <Button
            type="submit"
            isLoading={isLoading}
            disabled={isLoading}
            variant="primary"
            className="w-full"
          >
            Upload Product
          </Button>

        </form>
      </main>
    </div>
  );
}
