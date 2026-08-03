'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import BottomNav from '@/components/ui/BottomNav';
import { orderService, type Order } from '@/lib/api/order.service';
import { useAppStore } from '@/store/appStore';

const statusTone: Record<Order['status'], string> = {
  pending: 'bg-secondary/10 text-secondary',
  confirmed: 'bg-primary-container/20 text-on-surface',
  preparing: 'bg-primary-container/20 text-on-surface',
  ready_for_pickup: 'bg-tertiary/10 text-tertiary',
  dispatched: 'bg-tertiary/10 text-tertiary',
  delivered: 'bg-tertiary/20 text-tertiary',
  cancelled: 'bg-error/10 text-error',
};

const paymentTone = {
  pending: 'bg-outline-variant/20 text-on-surface',
  submitted: 'bg-secondary/10 text-secondary',
  confirmed: 'bg-tertiary/10 text-tertiary',
  rejected: 'bg-error/10 text-error',
} as const;

const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;
const formatDate = (value: string) =>
  new Date(value).toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

export default function OrderDetailClient({ id: propId }: { id?: string } = {}) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { addToast, hasHydrated, isAuthenticated } = useAppStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const orderId = useMemo(() => String(propId || params?.id || ''), [propId, params?.id]);
  
  useEffect(() => {
    if (!orderId) {
      return;
    }

    let cancelled = false;

    const fetchOrder = async () => {
      setLoading(true);

      try {
        const response: any = await orderService.getOrderById(orderId);
        const data = response?.data ?? response;

        if (!cancelled) {
          setOrder(data ?? null);
        }
      } catch (error: any) {
        if (!cancelled) {
          addToast(error.message || 'Could not load this order', 'error');
          router.replace('/orders');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchOrder();

    return () => {
      cancelled = true;
    };
  }, [addToast, hasHydrated, isAuthenticated, orderId, params?.id, router]);

  return (
    <div className="min-h-screen bg-surface pb-32 text-on-surface">
      <header className="sticky top-0 z-40 border-b border-outline-variant/10 bg-surface px-6 py-6">
        <div className="mx-auto flex w-full max-w-md items-center gap-4">
          <button
            type="button"
            onClick={() => router.push('/orders')}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-low"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <div>
            <h1 className="font-headline text-xl font-bold">Order Details</h1>
            <p className="font-body text-xs text-outline">Track one order from kitchen to door.</p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-col gap-4 px-6 py-6">
        {loading && (
          <div className="rounded-3xl bg-surface-container-low p-6 text-sm text-outline">
            Loading order details...
          </div>
        )}

        {!loading && !order && (
          <div className="rounded-3xl bg-surface-container-low p-6 text-center">
            <p className="font-headline text-lg font-bold">Order not found</p>
            <Link
              href="/orders"
              className="mt-4 inline-flex rounded-full bg-on-surface px-5 py-3 text-xs font-bold uppercase tracking-widest text-surface"
            >
              Back to Orders
            </Link>
          </div>
        )}

        {order && (
          <>
            {['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'dispatched', 'delivered'].includes(order.status) && (
              <Link
                href={`/track?id=${order.id}`}
                className="w-full flex items-center justify-between bg-primary text-on-primary p-4 rounded-3xl shadow-lg active:scale-[0.98] transition-transform"
              >
                 <div className="flex items-center gap-3">
                   <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                     <span className="material-symbols-outlined text-white">location_on</span>
                   </div>
                   <div>
                     <h2 className="font-headline text-base font-bold">View Live Tracking</h2>
                     <p className="font-body text-xs text-white/80">View map, status, and chat with us</p>
                   </div>
                 </div>
                 <span className="material-symbols-outlined text-white">arrow_forward</span>
              </Link>
            )}

            <section className="rounded-[32px] bg-surface-container-low p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-headline text-2xl font-bold">{order.order_ref}</p>
                  <p className="font-body text-xs text-outline">{formatDate(order.created_at)}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${statusTone[order.status]}`}
                >
                  {order.status}
                </span>
              </div>

              <div className="mt-6 grid gap-4 text-sm">
                <div>
                  <p className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">
                    Delivery To
                  </p>
                  <p className="mt-1 font-body font-medium">{order.customer_name}</p>
                  <p className="font-body text-outline">{order.customer_phone}</p>
                </div>
                <div>
                  <p className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">
                    {order.order_type === 'pickup' ? 'Pickup' : 'Address'}
                  </p>
                  <p className="mt-1 font-body">{order.delivery_address}</p>
                  {order.order_type === 'pickup' && order.pickup_time && (
                    <p className="font-body text-xs text-outline mt-1">Preferred pickup time: {order.pickup_time}</p>
                  )}
                </div>
                {order.notes && (
                  <div>
                    <p className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">
                      Delivery Note
                    </p>
                    <p className="mt-1 font-body">{order.notes}</p>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[32px] bg-surface-container-low p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-headline text-lg font-bold">Items</h2>
                <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">
                  {order.items.length} selected
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {order.items.map((item) => (
                  <div
                    key={`${order.id}-${item.id}-${item.size}`}
                    className="rounded-2xl bg-surface-container-highest/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-body font-bold">{item.name}</p>
                        <p className="font-body text-xs text-outline">
                          {item.quantity}x • {item.size}
                        </p>
                      </div>
                      <span className="font-label text-sm font-bold">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-outline-variant/20 pt-4">
                <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">
                  Total Amount
                </span>
                <span className="font-headline text-xl font-bold text-primary">
                  {formatCurrency(order.total_amount)}
                </span>
              </div>
            </section>

            <section className="rounded-[32px] bg-surface-container-low p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-headline text-base font-bold">Payment</p>
                  <p className="font-body text-sm text-outline">
                    Method: {order.payment_method === 'cash_on_pickup' ? 'Pay on pickup' : 'Bank transfer'}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${paymentTone[(order.payment_status || 'pending') as keyof typeof paymentTone] || paymentTone.pending}`}>
                  {order.payment_status || 'pending'}
                </span>
              </div>
              {order.payment_reference && (
                <p className="mt-4 text-xs text-outline">Reference: <span className="font-bold text-on-surface">{order.payment_reference}</span></p>
              )}
              {order.admin_note && (
                <div className="mt-4 rounded-2xl bg-surface-container-highest/70 p-4 text-sm">
                  <p className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">Admin Note</p>
                  <p className="mt-2 font-body">{order.admin_note}</p>
                </div>
              )}
              <div className="mt-4 flex items-center justify-end">
                {order.receipt_path ? (
                  <a
                    href={order.receipt_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex rounded-full bg-surface-container-highest px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface"
                  >
                    View Receipt
                  </a>
                ) : order.payment_method !== 'cash_on_pickup' ? (
                  <Link
                    href="/checkout"
                    className="inline-flex rounded-full bg-on-surface px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-surface"
                  >
                    Return to Checkout
                  </Link>
                ) : null}
              </div>
            </section>
          </>
        )}
      </main>

      <BottomNav active="orders" />
    </div>
  );
}
