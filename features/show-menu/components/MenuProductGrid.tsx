import Link from 'next/link';
import ProductImage from '@/components/ui/ProductImage';
import { buildProductHref, type MenuProduct } from '@/lib/menu';

interface MenuProductGridProps {
  favoriteIds: Set<number>;
  loading: boolean;
  products: MenuProduct[];
  onQuickAdd: (product: MenuProduct) => void;
  onToggleFavorite: (event: React.MouseEvent, productId: string | number) => void;
}

export function MenuProductGrid({
  favoriteIds,
  loading,
  products,
  onQuickAdd,
  onToggleFavorite,
}: MenuProductGridProps) {
  if (loading) {
    return (
      <div className="col-span-2 space-y-6">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="bg-surface-container-low h-40 rounded-[32px] animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <section className="grid grid-cols-2 gap-4">
      {products.map((item) => {
        const isFavorite = favoriteIds.has(Number(item.id));

        return (
          <div
            key={item.id}
            className="bg-transparent rounded-lg overflow-hidden flex flex-col group"
          >
            <Link
              href={buildProductHref(item.id)}
              className="relative h-44 overflow-hidden rounded-3xl"
            >
              <ProductImage
                src={item.image}
                alt={item.name}
                fill
                className="group-hover:scale-110 transition-transform duration-500"
                blend={true}
              />
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                <span
                  className="material-symbols-outlined text-primary-container text-[12px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
                <span className="font-label text-[10px] font-bold">{item.rating}</span>
              </div>
              <button
                onClick={(event) => onToggleFavorite(event, item.id)}
                className="absolute bottom-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm active:scale-90 transition-transform"
              >
                <span
                  className={`material-symbols-outlined text-base ${isFavorite ? 'text-red-500' : 'text-outline/40'}`}
                  style={{ fontVariationSettings: `'FILL' ${isFavorite ? 1 : 0}` }}
                >
                  favorite
                </span>
              </button>
            </Link>
            <div className="p-4 flex flex-col flex-1">
              <h4 className="font-body font-bold text-sm mb-1 line-clamp-1">{item.name}</h4>
              <div className="mt-auto flex justify-between items-center">
                <span className="font-label font-bold text-secondary">
                  ₦{item.price.toLocaleString()}
                </span>
                <button
                  onClick={() => onQuickAdd(item)}
                  className="w-8 h-8 bg-primary-container text-on-surface rounded-full flex items-center justify-center shadow-lg shadow-primary-container/20"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
      {products.length === 0 && (
        <div className="col-span-2 bg-surface-container-low rounded-[28px] p-8 text-center text-outline">
          No matching menu items yet.
        </div>
      )}
    </section>
  );
}
