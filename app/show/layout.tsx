import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Full Menu',
  description: 'Browse the full menu of premium authentic shawarmas and drinks at Soji\'s Shawarma in Keffi. Order online for swift delivery!',
  openGraph: {
    title: 'Full Delivery Menu - Soji\'s Shawarma',
    description: 'Browse our full menu for premium authentic shawarmas. Order online for swift delivery in Keffi!',
  },
};

export default function ShowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
