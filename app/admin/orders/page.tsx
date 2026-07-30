'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { orderService, Order, OrderItem } from '@/lib/api';
import useAdminGuard from '@/hooks/useAdminGuard';
import { useAppStore } from '@/store/appStore';
import { AdminSplitViewSkeleton } from '@/components/ui/AdminSkeletons';

const statusOptions = ['all', 'pending', 'confirmed', 'preparing', 'ready_for_pickup', 'dispatched', 'delivered', 'cancelled'] as const;

export default function AdminOrders() {
  const { token, authLoading, isAdmin } = useAdminGuard();
  const addToast = useAppStore((state) => state.addToast);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<(typeof statusOptions)[number]>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  const queueStats = useMemo(() => ({
    paymentReview: orders.filter((order) => order.payment_status === 'submitted').length,
    pickupQueue: orders.filter((order) => order.order_type === 'pickup' && ['confirmed', 'preparing', 'ready_for_pickup'].includes(order.status)).length,
    deliveryQueue: orders.filter((order) => order.order_type !== 'pickup' && ['confirmed', 'preparing', 'dispatched'].includes(order.status)).length,
  }), [orders]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await orderService.getAllOrders(filter === 'all' ? undefined : filter);
      const nextOrders = response.data || [];
      setOrders(nextOrders);

      if (selectedOrder) {
        const freshSelected = nextOrders.find((order: Order) => order.id === selectedOrder.id) || null;
        setSelectedOrder(freshSelected);
        setAdminNote(freshSelected?.admin_note || '');
      }
    } catch (error: any) {
      addToast(error.message || 'Could not load orders', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, filter, selectedOrder]);

  useEffect(() => {
    if (!isAdmin || !token) {
      return;
    }

    fetchOrders();
  }, [fetchOrders, isAdmin, token]);

  useEffect(() => {
    if (selectedOrder) {
      setAdminNote(selectedOrder.admin_note || '');
    }
  }, [selectedOrder]);

  if (authLoading || (isAdmin && loading && orders.length === 0)) {
    return <AdminSplitViewSkeleton />;
  }

  if (!isAdmin) {
    return null;
  }

  const updateStatus = async (id: string | number, status: string) => {
    try {
      setActionLoading(true);
      await orderService.updateOrderStatus(id, status);
      addToast(`Order moved to ${status.replace(/_/g, ' ')}`, 'success');
      await fetchOrders();
    } catch (error: any) {
      addToast(error.message || 'Could not update order status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const reviewPayment = async (action: 'confirm' | 'reject') => {
    if (!selectedOrder) {
      return;
    }

    try {
      setActionLoading(true);
      await orderService.reviewPayment(selectedOrder.id, { action, admin_note: adminNote.trim() || undefined });
      addToast(action === 'confirm' ? 'Payment confirmed' : 'Payment rejected', 'success');
      await fetchOrders();
    } catch (error: any) {
      addToast(error.message || 'Could not review payment', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const selectedStatusActions = selectedOrder
    ? selectedOrder.order_type === 'pickup'
      ? ['confirmed', 'preparing', 'ready_for_pickup', 'delivered', 'cancelled']
      : ['confirmed', 'preparing', 'dispatched', 'delivered', 'cancelled']
    : [];

  return (
    <div className="bg-surface min-h-screen p-6 md:p-10">
      <header className="mb-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-label text-[10px] font-bold uppercase tracking-[0.35em] text-outline">Operations</p>
            <h1 className="font-headline font-bold text-3xl">Order Desk</h1>
            <p className="mt-2 text-sm text-outline">Review payments, move orders through delivery or pickup, and keep customers informed.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <QueueCard label="Pending payment review" value={queueStats.paymentReview} tone="secondary" />
            <QueueCard label="Pickup queue" value={queueStats.pickupQueue} tone="tertiary" />
            <QueueCard label="Delivery queue" value={queueStats.deliveryQueue} tone="primary" />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {statusOptions.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              className={`rounded-full px-5 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${filter === status ? 'bg-on-surface text-surface' : 'bg-surface-container-low text-outline'}`}
            >
              {status.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {!loading && orders.length === 0 && (
            <div className="rounded-[28px] border border-dashed border-outline-variant/40 bg-white p-8 text-sm text-outline">
              No orders match this filter yet.
            </div>
          )}

          {orders.map((order) => (
            <button
              key={order.id}
              type="button"
              onClick={() => setSelectedOrder(order)}
              className={`w-full rounded-[28px] border p-5 text-left shadow-sm transition-all ${selectedOrder?.id === order.id ? 'border-primary-container bg-primary-container/5' : 'border-outline-variant/10 bg-white hover:border-primary-container/40'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-surface-container-low px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-outline">#{order.id}</span>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${getPaymentBadgeClass(order.payment_status || 'pending')}`}>
                      {order.payment_status || 'pending'}
                    </span>
                    <span className="rounded-full bg-surface-container-low px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-on-surface">
                      {order.order_type === 'pickup' ? 'pickup' : 'delivery'}
                    </span>
                  </div>
                  <p className="font-headline font-bold text-lg">{order.customer_name}</p>
                  <p className="text-sm text-outline">{order.customer_phone}</p>
                  <p className="text-xs text-outline">
                    {order.order_type === 'pickup'
                      ? `Pickup${order.pickup_time ? ` • ${order.pickup_time}` : ''}`
                      : order.delivery_address}
                  </p>
                </div>
                <div className="space-y-2 text-right">
                  <p className="font-label text-lg font-bold">₦{order.total_amount.toLocaleString()}</p>
                  <span className="block rounded-full bg-surface-container-low px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-on-surface">
                    {order.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <aside className="sticky top-8 h-fit rounded-[32px] border border-outline-variant/10 bg-white p-6 shadow-sm">
          {!selectedOrder ? (
            <div className="space-y-3">
              <h2 className="font-headline text-xl font-bold">Select an order</h2>
              <p className="text-sm text-outline">Choose any order to review payment proof, admin notes, and next status actions.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-surface-container-low px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-outline">{selectedOrder.order_ref}</span>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${getPaymentBadgeClass(selectedOrder.payment_status || 'pending')}`}>
                    {selectedOrder.payment_status || 'pending'}
                  </span>
                </div>
                <h2 className="mt-3 font-headline text-2xl font-bold">{selectedOrder.customer_name}</h2>
                <p className="text-sm text-outline">{selectedOrder.customer_phone}</p>
              </div>

              <div className="rounded-3xl bg-surface-container-low p-4 text-sm">
                <p><span className="font-bold">Type:</span> {selectedOrder.order_type === 'pickup' ? 'Pickup' : 'Delivery'}</p>
                <p className="mt-2"><span className="font-bold">Payment method:</span> {selectedOrder.payment_method === 'cash_on_pickup' ? 'Pay on pickup' : 'Bank transfer'}</p>
                {selectedOrder.pickup_time && <p className="mt-2"><span className="font-bold">Pickup time:</span> {selectedOrder.pickup_time}</p>}
                {selectedOrder.payment_reference && <p className="mt-2"><span className="font-bold">Reference:</span> {selectedOrder.payment_reference}</p>}
                <p className="mt-2"><span className="font-bold">Address:</span> {selectedOrder.delivery_address}</p>
              </div>

              <div>
                <p className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">Items</p>
                <ul className="mt-3 space-y-2">
                  {selectedOrder.items.map((item: OrderItem, index: number) => (
                    <li key={`${item.id}-${index}`} className="flex items-start justify-between gap-3 rounded-2xl bg-surface-container-low p-3 text-sm">
                      <span>{item.quantity}x {item.name} <span className="text-outline">({item.size})</span></span>
                      <span className="font-bold">₦{(item.price * item.quantity).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <label className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">Admin note</label>
                <textarea
                  value={adminNote}
                  onChange={(event) => setAdminNote(event.target.value)}
                  rows={4}
                  className="mt-2 w-full resize-none rounded-2xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary-container/40"
                  placeholder="Write a note for this payment or order review"
                />
              </div>

              {selectedOrder.payment_status === 'submitted' && (
                <div className="space-y-3">
                  <p className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">Payment review</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => reviewPayment('confirm')}
                      className="rounded-full bg-tertiary px-4 py-3 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-60"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => reviewPayment('reject')}
                      className="rounded-full bg-error/10 px-4 py-3 text-xs font-bold uppercase tracking-widest text-error disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <p className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">Move order</p>
                <div className="grid grid-cols-2 gap-2">
                  {selectedStatusActions.map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={actionLoading || selectedOrder.status === status}
                      onClick={() => updateStatus(selectedOrder.id, status)}
                      className="rounded-2xl border border-outline-variant/20 px-3 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-on-surface hover:text-surface disabled:opacity-50"
                    >
                      {status.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {selectedOrder.receipt_path && (
                <a
                  href={selectedOrder.receipt_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center rounded-full bg-surface-container-low px-5 py-3 text-xs font-bold uppercase tracking-widest text-on-surface"
                >
                  View receipt image
                </a>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function QueueCard({ label, value, tone }: { label: string; value: number; tone: 'primary' | 'secondary' | 'tertiary' }) {
  const tones = {
    primary: 'bg-primary-container/15 text-on-surface',
    secondary: 'bg-secondary/10 text-secondary',
    tertiary: 'bg-tertiary/10 text-tertiary',
  };

  return (
    <div className={`rounded-3xl px-4 py-3 ${tones[tone]}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest">{label}</p>
      <p className="mt-1 text-2xl font-headline font-bold">{value}</p>
    </div>
  );
}

function getPaymentBadgeClass(status: string) {
  switch (status) {
    case 'submitted':
      return 'bg-secondary/10 text-secondary';
    case 'confirmed':
      return 'bg-tertiary/10 text-tertiary';
    case 'rejected':
      return 'bg-error/10 text-error';
    default:
      return 'bg-outline-variant/20 text-on-surface';
  }
}
