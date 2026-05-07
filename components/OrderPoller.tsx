'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/appStore';
import { orderService } from '@/lib/api';

export default function OrderPoller() {
  const { isAuthenticated, addNotification, addToast, hasHydrated } = useAppStore();
  const lastStatusesRef = useRef<Record<string, string>>({});
  const initialSyncRef = useRef(false);

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) return;

    const poll = async () => {
      try {
        const response: any = await orderService.getAllOrders();
        // Since interceptor returns response.data, and PHP returns {data: [...]}, it might be response.data
        const orders = response.data || response || [];
        
        if (!Array.isArray(orders)) return;

        // On first successful load, just populate the ref without notifying
        if (!initialSyncRef.current) {
          orders.forEach((order: any) => {
            lastStatusesRef.current[order.id] = order.status;
          });
          initialSyncRef.current = true;
          return;
        }

        orders.forEach((order: any) => {
          const prevStatus = lastStatusesRef.current[order.id];
          if (prevStatus && prevStatus !== order.status) {
            // Status changed!
            const statusMsg = getStatusMessage(order.status);
            addNotification({
              title: `Order Update: ${order.status.toUpperCase()}`,
              body: `${statusMsg} (Ref: ${order.order_ref})`,
              timestamp: new Date().toISOString(),
              type: 'order_status',
              link: `/orders`
            });
            addToast(`Order ${order.order_ref} is now ${order.status}!`, 'info');
          }
          lastStatusesRef.current[order.id] = order.status;
        });
      } catch (err) {
        console.error('Order status polling failed', err);
      }
    };

    poll();
    const interval = setInterval(poll, 20000); // Poll every 20s for better responsiveness during demo

    return () => clearInterval(interval);
  }, [isAuthenticated, hasHydrated, addNotification, addToast]);

  return null;
}

function getStatusMessage(status: string) {
  switch (status.toLowerCase()) {
    case 'confirmed': return 'Your payment has been confirmed.';
    case 'preparing': return 'The kitchen is now preparing your shawarma.';
    case 'dispatched': return 'Your order is out for delivery! ✨';
    case 'delivered': return 'Enjoy your meal! Order delivered successfully.';
    case 'cancelled': return 'Your order was cancelled.';
    default: return `Your order status was updated to ${status}.`;
  }
}
