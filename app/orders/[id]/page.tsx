import { notFound } from 'next/navigation';

// Provide a placeholder so Next.js can statically export this route.
// All real /orders/:id traffic is redirected to /orders?id=:id by the
// app itself before reaching this page (see app/orders/page.tsx).
export function generateStaticParams() {
  return [{ id: '_' }];
}

export default function OrderDetailPage() {
  notFound();
}
