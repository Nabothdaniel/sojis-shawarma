import { products as fallbackProducts, type Product } from './products';
import type { CatalogProduct } from './api/catalog.service';

export interface MenuProduct extends Product {
  rawId: string;
  reviewCount?: number;
  orderCount?: number;
  popularScore?: number;
}

export const buildProductHref = (id: string | number) => `/product?id=${encodeURIComponent(String(id))}`;

export const getGenericProductImage = () => '/images/beef-supreme.png';

export const normalizeCatalogProduct = (product: CatalogProduct): MenuProduct => {
  const categoryName = product.category_name ? `Shawarma • ${product.category_name}` : 'Shawarma';
  const averageRating = Number(product.average_rating ?? 0);

  return {
    id: String(product.id),
    rawId: String(product.id),
    name: product.name,
    price: Number(product.price),
    category: categoryName,
    rating: averageRating > 0 ? averageRating.toFixed(1) : 'New',
    prepTime: '15 min prep',
    description: product.description || 'Freshly prepared and wrapped to order.',
    image: product.image_url || getGenericProductImage(),
    reviewCount: Number(product.review_count ?? 0),
    orderCount: Number(product.order_count ?? 0),
    popularScore: Number(product.popular_score ?? 0),
  };
};

export const getFallbackMenuProducts = (): MenuProduct[] =>
  fallbackProducts.map((product) => ({
    ...product,
    rawId: product.id,
    reviewCount: 0,
    orderCount: 0,
    popularScore: 0,
  }));

export const resolveProductById = (id: string): MenuProduct | null =>
  getFallbackMenuProducts().find((product) => product.id === id) ?? null;

