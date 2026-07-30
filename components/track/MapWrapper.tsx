'use client';

import dynamic from 'next/dynamic';

const LiveMapDynamic = dynamic(() => import('./LiveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-surface-container-high animate-pulse flex items-center justify-center">
      <span className="material-symbols-outlined text-outline animate-spin">sync</span>
    </div>
  ),
});

interface MapWrapperProps {
  orderStatus: string;
  deliveryAddress: string;
}

export default function MapWrapper({ orderStatus, deliveryAddress }: MapWrapperProps) {
  return <LiveMapDynamic orderStatus={orderStatus} deliveryAddress={deliveryAddress} />;
}
