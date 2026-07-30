import apiClient from './client';

export interface FavoriteProduct {
  id: number;
  category_id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  available: number;
  category_name: string;
  created_at: string;
}

export interface FavoritesResponse {
  status: string;
  data: FavoriteProduct[];
}

export interface FavoriteToggleResponse {
  status: string;
  action: 'added' | 'removed';
}

export const favoritesService = {
  getFavorites: (): Promise<FavoritesResponse> => apiClient.get('/favorites'),

  toggleFavorite: (productId: number | string): Promise<FavoriteToggleResponse> =>
    apiClient.post('/favorites/toggle', { product_id: Number(productId) }),
};
