import apiClient from './client';

export interface CatalogCategory {
  id: number;
  name: string;
  slug: string;
  image_url?: string | null;
  active: number;
}

export interface CatalogProduct {
  id: number;
  category_id: number | null;
  category_name?: string | null;
  name: string;
  description: string;
  price: number;
  image_url?: string | null;
  available: number;
}

export interface CatalogUploadResponse {
  status: string;
  data: {
    path: string;
    filename: string;
  };
}

export const catalogService = {
  getCategories: (): Promise<CatalogCategory[]> => apiClient.get('/categories'),
  createCategory: (payload: { name: string; image_url?: string; active?: number }) =>
    apiClient.post('/categories', payload),
  updateCategory: (id: number, payload: { name: string; image_url?: string; active?: number }) =>
    apiClient.put(`/categories/${id}`, payload),
  getProducts: (): Promise<CatalogProduct[]> => apiClient.get('/products'),
  createProduct: (payload: {
    category_id: number;
    name: string;
    description: string;
    price: number;
    image_url: string;
    available?: number;
  }) => apiClient.post('/products', payload),
  uploadCatalogAsset: (formData: FormData): Promise<CatalogUploadResponse> =>
    apiClient.post('/uploads/catalog', formData),
};
