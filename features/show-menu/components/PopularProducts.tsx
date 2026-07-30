import Link from 'next/link';
import ProductImage from '@/components/ui/ProductImage';
import { buildProductHref, type MenuProduct } from '@/lib/menu';

interface PopularProductsProps {
  products: MenuProduct[];
}

export function PopularProducts({ products }: PopularProductsProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <p className="font-label text-[10px] uppercase tracking-[0.3em] text-outline font-bold">
            Popular right now
          </p>
          <h2 className="font-headline font-bold text-xl">
            Chosen from repeat orders and ratings
          </h2>
        </div>
      </div>
      <div className="grid gap-3">
        {products.map((product) => (
          <Link
            key={`popular-${product.id}`}
            href={buildProductHref(product.id)}
            className="bg-surface-container-low rounded-[28px] p-4 flex items-center gap-4 hover:shadow-lg transition-all duration-300"
          >
            <div className="w-20 h-20 rounded-[24px] overflow-hidden shrink-0">
              <ProductImage src={product.image} alt={product.name} fill blend={true} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-body font-bold text-sm">{product.name}</p>
              <p className="font-body text-xs text-outline line-clamp-1">
                {product.description}
              </p>
              <div className="mt-2 flex items-center gap-3 text-[11px] font-label font-bold uppercase tracking-widest text-outline">
                <span>{product.orderCount || 0} orders</span>
                <span>{product.rating} stars</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
