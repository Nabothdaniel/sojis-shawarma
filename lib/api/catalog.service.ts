import { db } from '../firebase/config';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';

export interface CatalogCategory {
  id: string | number;
  name: string;
  slug: string;
  image_url?: string | null;
  active: number;
}

export interface CatalogProduct {
  id: string | number;
  category_id: string | number | null;
  category_name?: string | null;
  name: string;
  description: string;
  price: number;
  image_url?: string | null;
  available: number;
  average_rating?: number;
  review_count?: number;
  order_count?: number;
  popular_score?: number;
  specifications?: string;
}

export interface CatalogUploadResponse {
  status: string;
  data: {
    path: string;
    filename: string;
  };
}

export const catalogService = {
  getCategories: async (): Promise<CatalogCategory[]> => {
    const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CatalogCategory));
  },
  
  createCategory: async (payload: { name: string; image_url?: string; active?: number }) => {
    const slug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const docRef = await addDoc(collection(db, 'categories'), { ...payload, slug });
    return { id: docRef.id, ...payload, slug };
  },
  
  updateCategory: async (id: string | number, payload: { name: string; image_url?: string; active?: number }) => {
    const categoryRef = doc(db, 'categories', id.toString());
    await updateDoc(categoryRef, payload as any);
    return { id, ...payload };
  },
  
  deleteCategory: async (id: string | number) => {
    const categoryRef = doc(db, 'categories', id.toString());
    await deleteDoc(categoryRef);
    return { id };
  },
  
  getProducts: async (options?: { signal?: AbortSignal }): Promise<CatalogProduct[]> => {
    const q = query(collection(db, 'products'), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    
    // Attempting to resolve category names from firestore manually (cache categories for single fetch setup)
    const catQuery = query(collection(db, 'categories'));
    const catSnapshot = await getDocs(catQuery);
    const categoryMap = new Map();
    catSnapshot.forEach(c => categoryMap.set(c.id, c.data().name));

    return snapshot.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        category_name: data.category_id ? categoryMap.get(data.category_id.toString()) : null,
      } as CatalogProduct;
    });
  },
  
  createProduct: async (payload: {
    category_id: string | number;
    name: string;
    description: string;
    price: number;
    image_url: string;
    available?: number;
    specifications?: string;
  }) => {
    const docRef = await addDoc(collection(db, 'products'), payload);
    return { id: docRef.id, ...payload };
  },
  
  updateProduct: async (id: string | number, payload: Partial<CatalogProduct>) => {
    const docRef = doc(db, 'products', id.toString());
    await updateDoc(docRef, payload as any);
    return { id, ...payload };
  },
  
  deleteProduct: async (id: string | number) => {
    await deleteDoc(doc(db, 'products', id.toString()));
    return { id };
  },
  
  uploadCatalogAsset: async (formData: FormData): Promise<CatalogUploadResponse> => {
    const file = formData.get('file') as File;
    if (!file) throw new Error("No image file found in formData");
    
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) throw new Error("Cloudinary configuration missing in .env");
    
    const uploadForm = new FormData();
    uploadForm.append('file', file);
    uploadForm.append('upload_preset', uploadPreset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: uploadForm,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || "Failed to upload asset to Cloudinary");
    }

    const data = await res.json();

    return {
      status: 'success',
      data: {
        path: data.secure_url,
        filename: data.original_filename || file.name
      }
    };
  },
};
