'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { orderService, Order } from '@/lib/api/order.service';
import MapWrapper from '@/components/track/MapWrapper';
import Link from 'next/link';
import { useAppStore } from '@/store/appStore';

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="bg-surface min-h-screen flex items-center justify-center font-headline font-bold text-xl text-primary">Loading tracker...</div>}>
      <TrackOrderClient />
    </Suspense>
  );
}

function TrackOrderClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');
  const addToast = useAppStore(state => state.addToast);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      addToast('No order ID provided.', 'error');
      router.push('/orders');
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await orderService.getOrderById(orderId);
        setOrder(res.data);
      } catch (err: any) {
        addToast(err.message || 'Could not find order.', 'error');
        router.push('/orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
    
    // Poll for status every 15s to make it live
    const interval = setInterval(fetchOrder, 15000);
    return () => clearInterval(interval);
  }, [orderId, addToast, router]);

  if (loading || !order) {
    return <div className="bg-surface min-h-screen flex items-center justify-center font-headline font-bold text-xl text-primary animate-pulse">Fetching order...</div>;
  }

  const s = order.status;
  const isReceived = true; // Always received if it exists
  const isPreparing = s === 'preparing' || s === 'ready_for_pickup' || s === 'dispatched' || s === 'delivered';
  const isReady = s === 'ready_for_pickup' || s === 'dispatched' || s === 'delivered';
  const isOnWay = s === 'dispatched' || s === 'delivered';
  
  // Custom stepper calculation
  let progressWidth = 'w-0';
  if (isOnWay) progressWidth = 'w-[100%]';
  else if (isReady) progressWidth = 'w-[66%]';
  else if (isPreparing) progressWidth = 'w-[33%]';
  else progressWidth = 'w-0'; // Just received

  return (
    <div className="bg-surface text-on-surface font-body antialiased min-h-screen selection:bg-primary-container pb-32">
      {/* Top Navigation */}
      <nav className="flex justify-between items-center w-full sticky top-0 z-40 bg-[#FCF9F8] dark:bg-[#1C1B1B] px-4 py-4 shadow-sm h-[72px]">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors active:scale-95 duration-150">
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </button>
        <div className="flex flex-col items-center">
          <h1 className="font-headline font-bold text-base text-primary uppercase tracking-tight">Track Order</h1>
          <span className="font-label text-[10px] text-outline">#{order.order_ref}</span>
        </div>
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors active:scale-95 duration-150">
          <span className="material-symbols-outlined text-primary">help</span>
        </button>
      </nav>

      <main className="relative z-0">
        {/* Map Section (45% Height - typically 40vh approx) */}
        <section className="relative h-[48vh] w-full overflow-hidden bg-surface-container-high z-0">
           <MapWrapper orderStatus={order.status} deliveryAddress={order.delivery_address || 'Keffi, Nasarawa'} />
           <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-surface pointer-events-none z-10" style={{ backgroundImage: 'linear-gradient(to bottom, rgba(252, 249, 248, 0) 60%, rgba(252, 249, 248, 1) 100%)' }}></div>
        </section>

        {/* Status Card (Bottom Sheet Style) */}
        <section className="relative -mt-10 px-4 z-10">
          <div className="bg-surface-container-lowest rounded-3xl shadow-[0_-8px_40px_rgba(116,91,0,0.08)] p-6 space-y-8 border border-outline-variant/10">
            {/* Handle for Bottom Sheet Look */}
            <div className="w-12 h-1 bg-surface-variant rounded-full mx-auto -mt-2 mb-6"></div>
            
            {/* Status Header */}
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h2 className="font-headline font-bold text-2xl leading-tight">
                  {order.status === 'pending' || order.status === 'confirmed' ? (
                    <>Order <span className="italic font-normal">received</span> 📝</>
                  ) : order.status === 'preparing' ? (
                    <>Preparing your <span className="italic font-normal">order</span> 🔥</>
                  ) : order.status === 'ready_for_pickup' ? (
                    <>Order is <span className="italic font-normal">ready</span> 🥡</>
                  ) : order.status === 'dispatched' ? (
                    <>Out for <span className="italic font-normal">delivery</span> 🛵</>
                  ) : (
                    <>Order <span className="italic font-normal">delivered</span> 🎉</>
                  )}
                </h2>
                <p className="font-body text-outline text-sm">
                  {order.order_type === 'delivery' ? 'Estimated arrival: Approx 20-30 mins' : 'Pickup at your convenience'}
                </p>
              </div>
              <div className="bg-primary-container/10 px-4 py-2 rounded-lg border border-primary-container/20">
                <p className="font-label text-[10px] uppercase text-primary font-bold">Total</p>
                <p className="font-headline font-bold text-lg text-primary text-center">₦{order.total_amount.toLocaleString()}</p>
              </div>
            </div>

            {/* Progress Stepper */}
            <div className="relative pt-4 overflow-hidden px-2">
              <div className="absolute top-9 left-2 right-2 h-0.5 bg-surface-container-high z-0"></div>
              {/* Active Progress Line */}
              <div className={`absolute top-9 left-2 h-0.5 bg-primary-container z-0 transition-all duration-700 ${progressWidth}`}></div>
              
              <div className="relative flex justify-between z-10">
                {/* Step 1: Done */}
                <div className="flex flex-col items-center gap-3">
                  <div className={"w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-colors duration-500 " + (isReceived ? "bg-primary-container text-on-primary-container" : "bg-surface-container-high text-outline opacity-30")}>
                    <span className="material-symbols-outlined text-lg">check</span>
                  </div>
                  <span className={`font-label text-[10px] uppercase transition-colors duration-500 ${isReceived ? 'text-on-surface font-bold' : 'text-outline'}`}>Received</span>
                </div>
                
                {/* Step 2: Preparing */}
                <div className="flex flex-col items-center gap-3">
                  <div className={"w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-colors duration-500 " + (isPreparing ? (order.status === 'preparing' ? "bg-surface-container-lowest text-primary border-2 border-primary-container" : "bg-primary-container text-on-primary-container") : "bg-surface-container-high text-outline opacity-30")}>
                    <span className={"material-symbols-outlined text-lg " + (order.status === 'preparing' ? "animate-spin" : "")}>sync</span>
                  </div>
                  <span className={`font-label text-[10px] uppercase transition-colors duration-500 ${isPreparing ? 'text-primary font-bold' : 'text-outline'}`}>Preparing</span>
                </div>
                
                {/* Step 3: Ready */}
                <div className="flex flex-col items-center gap-3">
                  <div className={"w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-colors duration-500 " + (isReady ? (order.status === 'ready_for_pickup' ? "bg-surface-container-lowest text-primary border-2 border-primary-container" : "bg-primary-container text-on-primary-container") : "bg-surface-container-high text-outline opacity-30")}>
                    <span className="material-symbols-outlined text-lg">restaurant</span>
                  </div>
                  <span className={`font-label text-[10px] uppercase transition-colors duration-500 ${isReady ? 'text-primary font-bold' : 'text-outline'}`}>Ready</span>
                </div>
                
                {/* Step 4: On Way */}
                <div className="flex flex-col items-center gap-3">
                  <div className={"w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-colors duration-500 " + (isOnWay ? (order.status === 'dispatched' ? "bg-surface-container-lowest text-primary border-2 border-primary-container" : "bg-primary-container text-on-primary-container") : "bg-surface-container-high text-outline opacity-30")}>
                    <span className="material-symbols-outlined text-lg">delivery_dining</span>
                  </div>
                  <span className={`font-label text-[10px] uppercase transition-colors duration-500 ${isOnWay ? 'text-primary font-bold' : 'text-outline'}`}>On Way</span>
                </div>
              </div>
            </div>

            {/* Kitchen Info Section */}
            <div className="bg-surface-container-low rounded-2xl p-4 flex items-center gap-4 border border-outline-variant/10">
              <div className="relative">
                <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-surface shadow-sm bg-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-primary-container text-2xl">local_fire_department</span>
                </div>
                <div className="absolute -bottom-1 -right-1 bg-tertiary text-white rounded-full p-0.5 border-2 border-surface">
                  <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-headline font-bold text-sm">Soji&apos;s Kitchen</h3>
                  <div className="flex items-center gap-0.5 bg-primary-container px-1.5 py-0.5 rounded text-[10px] font-bold">
                    <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    4.9
                  </div>
                </div>
                <p className="font-body text-xs text-outline leading-tight mt-1">is preparing your wrap with extra spice</p>
              </div>
            </div>

            {/* Contact Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button onClick={() => addToast('Calling kitchen...', 'info')} className="flex items-center justify-center gap-2 py-3 px-4 rounded-full border border-outline-variant/30 hover:bg-surface-container-low transition-colors font-label text-xs font-bold text-on-surface uppercase tracking-wide">
                <span className="material-symbols-outlined text-primary text-lg">call</span>
                Call Kitchen
              </button>
              <button onClick={() => addToast('Opening WhatsApp...', 'info')} className="flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-[#25D366]/10 text-[#075E54] hover:bg-[#25D366]/20 transition-colors font-label text-xs font-bold uppercase tracking-wide">
                <span className="material-symbols-outlined text-lg">chat</span>
                WhatsApp
              </button>
            </div>

            {/* View Details Toggle */}
            <Link href={`/orders?id=${orderId}`} className="w-full flex items-center justify-center gap-2 py-4 text-outline hover:text-primary transition-colors">
              <span className="font-label text-[10px] uppercase font-bold tracking-widest">View Order Full Details</span>
              <span className="material-symbols-outlined text-sm">keyboard_arrow_right</span>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
