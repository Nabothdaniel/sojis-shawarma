import type { MenuProduct } from '@/lib/menu';

export function getMenuCategories(products: MenuProduct[]): string[] {
  return [
    'All',
    ...Array.from(
      new Set(products.map((product) => product.category.split('•')[0].trim()))
    ),
  ];
}

export function filterMenuProducts(
  products: MenuProduct[],
  activeCategory: string,
  searchQuery: string
): MenuProduct[] {
  const normalizedSearch = searchQuery.trim().toLowerCase();

  return products.filter((product) => {
    const categoryMatches =
      activeCategory === 'All' ||
      product.category.toLowerCase().includes(activeCategory.toLowerCase());
    const searchMatches =
      !normalizedSearch ||
      [product.name, product.category, product.description].some((value) =>
        value.toLowerCase().includes(normalizedSearch)
      );

    return categoryMatches && searchMatches;
  });
}

export function getPopularProducts(products: MenuProduct[]): MenuProduct[] {
  return [...products]
    .sort((a, b) => (b.popularScore ?? 0) - (a.popularScore ?? 0))
    .slice(0, 3);
}
