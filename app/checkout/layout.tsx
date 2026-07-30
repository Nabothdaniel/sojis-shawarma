import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Secure Checkout',
  description: 'Complete your online shawarma order securely. Pay seamlessly via transfer or choose to pay on pickup.',
  openGraph: {
    title: 'Secure Checkout - Soji\'s Shawarma',
    description: 'Complete your online shawarma order securely.',
  },
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
