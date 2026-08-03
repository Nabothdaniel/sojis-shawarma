import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { catalogService, type CatalogProduct } from '@/lib/api/catalog.service';
import { orderService, type Order } from '@/lib/api/order.service';
export function AdminGlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Prefetch data once when the search is clicked
  const handleFocus = async () => {
    setIsOpen(true);
    if (products.length > 0 || orders.length > 0) return; // Already fetched
    
    setLoading(true);
    try {
      const [prodRes, ordRes] = await Promise.all([
        catalogService.getProducts(),
        orderService.getAllOrders()
      ]);
      setProducts(Array.isArray(prodRes) ? prodRes : ((prodRes as any).data || []));
      setOrders(Array.isArray(ordRes) ? ordRes : ((ordRes as any).data || []));
    } catch(err) {
      console.error("Search data fetch failed");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = query.length >= 2 
    ? products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || (p.description && p.description.toLowerCase().includes(query.toLowerCase())))
    : [];
    
  const filteredOrders = query.length >= 2
    ? orders.filter(o => 
        String(o.id) === query || 
        o.order_ref.toLowerCase().includes(query.toLowerCase()) || 
        o.customer_name.toLowerCase().includes(query.toLowerCase()) ||
        o.customer_phone.includes(query)
      )
    : [];

  const handleSelectOrder = (id: number | string) => {
    setIsOpen(false);
    setQuery('');
    router.push('/admin/orders');
  };

  const handleSelectProduct = () => {
    setIsOpen(false);
    setQuery('');
    router.push('/admin/products');
  };

  return (
    <div ref={wrapperRef} className="hidden md:flex relative w-80 z-[100]" id="admin-search">
      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
      <input 
        className="w-full bg-surface-container-low border-none rounded-full py-2.5 pl-12 pr-4 text-sm font-body text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary-container/50 outline-none transition-all" 
        placeholder="Search orders, customers, menu items..." 
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={handleFocus}
      />
      
      {isOpen && (query.length >= 2 || loading) && (
        <div className="absolute top-14 left-0 w-[400px] bg-white rounded-3xl shadow-xl border border-outline-variant/20 p-4 max-h-[400px] overflow-y-auto no-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-6 opacity-50">
               <span className="material-symbols-outlined animate-spin mb-2">sync</span>
               <p className="font-label text-xs uppercase tracking-widest font-bold">Scanning...</p>
            </div>
          ) : (
            <>
              {filteredOrders.length > 0 && (
                <div className="mb-4">
                  <p className="font-label text-[10px] uppercase font-bold text-outline tracking-widest pl-2 mb-2">Matching Orders</p>
                  {filteredOrders.map(o => (
                    <button 
                      key={o.id} 
                      onClick={() => handleSelectOrder(o.id)}
                      className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-surface-container-highest transition-colors text-left"
                    >
                      <div>
                        <p className="font-body text-sm font-bold truncate">{o.customer_name}</p>
                        <p className="font-body text-xs text-outline">{o.order_ref}</p>
                      </div>
                      <span className="font-label text-xs uppercase font-bold text-on-surface-variant bg-surface-container-low px-2 py-1 rounded-full">{o.status.replace(/_/g, ' ')}</span>
                    </button>
                  ))}
                </div>
              )}
              
              {filteredProducts.length > 0 && (
                <div>
                  <p className="font-label text-[10px] uppercase font-bold text-outline tracking-widest pl-2 mb-2">Menu Items</p>
                  {filteredProducts.map(p => (
                    <button 
                      key={p.id} 
                      onClick={() => handleSelectProduct()}
                      className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-surface-container-highest transition-colors text-left"
                    >
                      <span className="font-body text-sm font-bold truncate">{p.name}</span>
                      <span className="font-label text-xs font-bold text-outline">₦{Number(p.price).toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              )}
              
              {filteredOrders.length === 0 && filteredProducts.length === 0 && (
                <div className="text-center p-6 opacity-50">
                  <span className="material-symbols-outlined text-3xl mb-2">search_off</span>
                  <p className="font-body text-sm">No results found for &quot;{query}&quot;</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
