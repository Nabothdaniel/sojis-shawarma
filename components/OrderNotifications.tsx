'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useServerEvents } from '@/hooks/useServerEvents';
import { orderService } from '@/lib/api';
import { useAppStore } from '@/store/appStore';

type OrderEventPayload = {
  id: string;
  user_id?: string | null;
  order_ref: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'dispatched' | 'delivered' | 'cancelled';
  payment_status?: string;
  updated_at?: string;
  message?: string;
  event_key?: string;
};

const statusTitles: Record<OrderEventPayload['status'], string> = {
  pending: 'Order received',
  confirmed: 'Payment confirmed',
  preparing: 'Now preparing',
  dispatched: 'Out for delivery',
  delivered: 'Delivered successfully',
  cancelled: 'Order cancelled',
};

const statusIcons: Record<OrderEventPayload['status'], string> = {
  pending: 'hourglass_top',
  confirmed: 'task_alt',
  preparing: 'restaurant',
  dispatched: 'delivery_truck_speed',
  delivered: 'home_pin',
  cancelled: 'cancel',
};

export default function OrderNotifications() {
  const {
    addNotification,
    addToast,
    hasHydrated,
    isAuthenticated,
    token,
    user,
  } = useAppStore();
  const seenKeysRef = useRef<Record<string, true>>({});
  const initialSyncRef = useRef(false);
  const latestStateRef = useRef({
    addNotification,
    addToast,
    userId: user?.id ?? null,
  });

  useEffect(() => {
    latestStateRef.current = {
      addNotification,
      addToast,
      userId: user?.id ?? null,
    };
  }, [addNotification, addToast, user?.id]);

  const handleOrderEvent = (payload: OrderEventPayload) => {
    const { addNotification: notify, addToast: toast, userId } = latestStateRef.current;

    if (!userId || String(payload.user_id) !== String(userId)) {
      return;
    }

    const eventKey =
      payload.event_key || `${payload.status}:${payload.id}:${payload.updated_at ?? ''}`;

    if (seenKeysRef.current[eventKey]) {
      return;
    }

    seenKeysRef.current[eventKey] = true;

    notify({
      title: statusTitles[payload.status] || 'Order update',
      body:
        payload.message ||
        `Your order ${payload.order_ref} has been updated to ${payload.status}.`,
      timestamp: payload.updated_at || new Date().toISOString(),
      type: 'order_status',
      link: '/orders',
      icon: statusIcons[payload.status] || 'info',
      orderId: payload.id,
      orderRef: payload.order_ref,
      eventKey,
    });

    toast(`${payload.order_ref}: ${statusTitles[payload.status] || 'Updated'}`, 'info');
  };

  useServerEvents(
    {
      order_created: handleOrderEvent,
      payment_receipt_submitted: handleOrderEvent,
      order_status_changed: handleOrderEvent,
    },
    {
      enabled: hasHydrated && isAuthenticated && Boolean(token),
      token,
    }
  );

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) {
      initialSyncRef.current = false;
      seenKeysRef.current = {};
      return;
    }

    const syncOrderStatuses = async () => {
      try {
        const userId = useAppStore.getState().user?.id;
        const response: any = await orderService.getAllOrders('all', userId);
        const orders = Array.isArray(response?.data) ? response.data : [];

        if (!initialSyncRef.current) {
          orders.forEach((order: OrderEventPayload) => {
            const eventKey = `${order.status}:${order.id}:${order.updated_at ?? ''}`;
            seenKeysRef.current[eventKey] = true;
          });
          initialSyncRef.current = true;
        }
      } catch {
        // Keep notifications non-blocking if the fallback sync fails.
      }
    };

    syncOrderStatuses();
  }, [hasHydrated, isAuthenticated]);

  const pollEnabled = useMemo(
    () => hasHydrated && isAuthenticated && Boolean(user?.id),
    [hasHydrated, isAuthenticated, user?.id]
  );

  useEffect(() => {
    if (!pollEnabled) {
      return;
    }

    const poll = async () => {
      try {
        const userId = useAppStore.getState().user?.id;
        const response: any = await orderService.getAllOrders('all', userId);
        const orders = Array.isArray(response?.data) ? response.data : [];

        orders.forEach((order: OrderEventPayload) => {
          const eventKey = `${order.status}:${order.id}:${order.updated_at ?? ''}`;
          if (seenKeysRef.current[eventKey]) {
            return;
          }

          handleOrderEvent({
            ...order,
            message:
              order.status === 'pending'
                ? 'Your order is still waiting for payment confirmation.'
                : undefined,
            event_key: eventKey,
          });
        });
      } catch {
        // Silent fallback.
      }
    };

    const interval = window.setInterval(poll, 20000);
    return () => window.clearInterval(interval);
  }, [pollEnabled, user?.id]);

  return null;
}
