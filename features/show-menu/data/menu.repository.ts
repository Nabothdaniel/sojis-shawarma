import { catalogService, favoritesService } from '@/lib/api';
import {
  getFallbackMenuProducts,
  normalizeCatalogProduct,
  type MenuProduct,
} from '@/lib/menu';

interface FavoriteListItem {
  id: string | number;
}

interface FavoriteListResponse {
  data?: FavoriteListItem[];
}

export async function fetchMenuProducts(): Promise<MenuProduct[]> {
  try {
    const response = await catalogService.getProducts();
    const normalized = Array.isArray(response)
      ? response
          .filter((product) => Number(product.available ?? 1) === 1)
          .map(normalizeCatalogProduct)
      : [];

    return normalized.length > 0 ? normalized : getFallbackMenuProducts();
  } catch {
    return getFallbackMenuProducts();
  }
}

export async function fetchFavoriteIds(): Promise<Set<string>> {
  const response = await favoritesService.getFavorites() as FavoriteListResponse;
  const ids = (response.data ?? []).map((favorite) => String(favorite.id));
  return new Set(ids);
}

export async function toggleFavoriteProduct(productId: string | number) {
  return favoritesService.toggleFavorite(productId);
}
