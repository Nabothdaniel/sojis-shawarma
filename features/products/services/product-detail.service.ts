import { catalogService } from '@/lib/api';
import { normalizeCatalogProduct, resolveProductById, type MenuProduct } from '@/lib/menu';

export const PRODUCT_DETAIL_QUERY_KEY = 'product-detail';

export const getProductDetailById = async (
  id: string,
  signal?: AbortSignal
): Promise<MenuProduct | null> => {
  const fallbackProduct = resolveProductById(id);

  if (fallbackProduct) {
    return fallbackProduct;
  }

  const products = await catalogService.getProducts({ signal });
  const match = Array.isArray(products)
    ? products.find((item) => String(item.id) === String(id))
    : null;

  return match ? normalizeCatalogProduct(match) : null;
};
