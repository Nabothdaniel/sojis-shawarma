import type { Order } from '@/lib/api/order.service';

export type ProfileTab =
  | 'profile'
  | 'tracking'
  | 'history'
  | 'notifications'
  | 'feedback'
  | 'saved';

export const activeStatuses: Order['status'][] = [
  'pending',
  'confirmed',
  'preparing',
  'ready_for_pickup',
  'dispatched',
];

export const statusTone: Record<Order['status'], string> = {
  pending: 'bg-secondary/10 text-secondary',
  confirmed: 'bg-primary-container/20 text-on-surface',
  preparing: 'bg-primary-container/20 text-on-surface',
  ready_for_pickup: 'bg-primary-container/40 text-on-surface',
  dispatched: 'bg-tertiary/10 text-tertiary',
  delivered: 'bg-tertiary/10 text-tertiary',
  cancelled: 'bg-error/10 text-error',
};

export const statusCopy: Record<
  Order['status'],
  { title: string; body: string; icon: string }
> = {
  pending: {
    title: 'Payment review in progress',
    body: 'We have received your order and we are checking your transfer receipt.',
    icon: 'hourglass_top',
  },
  confirmed: {
    title: 'Order confirmed',
    body: 'Your payment has been confirmed and the kitchen queue is locked in.',
    icon: 'task_alt',
  },
  preparing: {
    title: 'Now preparing',
    body: 'Your shawarma is in preparation right now.',
    icon: 'restaurant',
  },
  ready_for_pickup: {
    title: 'Ready for pickup',
    body: 'Your order is hot and ready. You can come pick it up now!',
    icon: 'storefront',
  },
  dispatched: {
    title: 'Out for delivery',
    body: 'Your rider is on the way to your delivery address.',
    icon: 'delivery_truck_speed',
  },
  delivered: {
    title: 'Delivered successfully',
    body: 'Your order has been marked as delivered. Enjoy your meal.',
    icon: 'home_pin',
  },
  cancelled: {
    title: 'Order cancelled',
    body: 'This order was cancelled. Contact support if this looks incorrect.',
    icon: 'cancel',
  },
};

export const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;

export const formatDate = (value: string) =>
  new Date(value).toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
