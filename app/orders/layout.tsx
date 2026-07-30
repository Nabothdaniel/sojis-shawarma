import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Track My Orders',
  description: 'View the status of your current and past shawarma orders.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
