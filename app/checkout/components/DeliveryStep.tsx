import React from 'react';
import { useCheckout } from '../hooks/useCheckout';

export function DeliveryStep(props: ReturnType<typeof useCheckout>) {
  const {
    formData, setFormData, errors, setErrors,
    isGeoLoading, setIsGeoLoading, paymentSettings, addToast,
    items, subtotal, isLoading, handlePlaceOrder
  } = props;

  return (
    <form onSubmit={handlePlaceOrder} className="space-y-6">
      <section>
        <h2 className="font-headline font-bold text-lg mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-container">location_on</span>
          Fulfilment Details
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData((current) => ({ ...current, orderType: 'delivery' }))}
              className={`rounded-2xl border px-4 py-4 text-left ${formData.orderType === 'delivery' ? 'border-primary-container bg-primary-container/10' : 'border-outline-variant/30 bg-transparent'}`}
            >
              <p className="font-headline font-bold text-sm">Delivery</p>
              <p className="text-xs text-outline mt-1">Send to customer address</p>
            </button>
            <button
              type="button"
              onClick={() => setFormData((current) => ({ ...current, orderType: 'pickup' }))}
              className={`rounded-2xl border px-4 py-4 text-left ${formData.orderType === 'pickup' ? 'border-primary-container bg-primary-container/10' : 'border-outline-variant/30 bg-transparent'}`}
            >
              <p className="font-headline font-bold text-sm">Pickup</p>
              <p className="text-xs text-outline mt-1">Customer comes to collect</p>
            </button>
          </div>

          <div className="space-y-1">
            <input
              type="text"
              placeholder="Full Name"
              className={`w-full bg-transparent border border-outline-variant/30 rounded-2xl py-4 px-6 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container/30 transition-all ${errors.name ? 'ring-2 ring-red-500/50' : ''}`}
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
            />
            {errors.name && <p className="text-red-500 text-[10px] font-bold px-4 uppercase tracking-wider">{errors.name}</p>}
          </div>

          <div className="space-y-1">
            <input
              type="tel"
              placeholder="Phone Number"
              className={`w-full bg-transparent border border-outline-variant/30 rounded-2xl py-4 px-6 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container/30 transition-all ${errors.phone ? 'ring-2 ring-red-500/50' : ''}`}
              value={formData.phone}
              onChange={(e) => {
                setFormData({ ...formData, phone: e.target.value });
                if (errors.phone) setErrors({ ...errors, phone: '' });
              }}
            />
            {errors.phone && <p className="text-red-500 text-[10px] font-bold px-4 uppercase tracking-wider">{errors.phone}</p>}
          </div>

          {formData.orderType === 'delivery' ? (
          <div className="space-y-1">
            <div className="flex justify-between items-center mb-2 px-1">
              <label className="font-label text-[10px] uppercase tracking-widest text-outline font-bold">Delivery Address</label>
              <button
                type="button"
                onClick={async () => {
                  if (!navigator.geolocation) return alert('Geolocation not supported');
                  setIsGeoLoading(true);
                  navigator.geolocation.getCurrentPosition(async (pos) => {
                    try {
                      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`, {
                        headers: { 'User-Agent': 'SojiShawarmaSpot/1.0' }
                      });
                      const data = await res.json();
                      setFormData({ ...formData, address: data.display_name });
                      if (errors.address) setErrors({ ...errors, address: '' });
                      addToast('Location detected!', 'success');
                    } catch (err) {
                      addToast('Could not fetch address details', 'error');
                    } finally {
                      setIsGeoLoading(false);
                    }
                  }, () => {
                    setIsGeoLoading(false);
                    addToast('Location access denied', 'error');
                  });
                }}
                className="flex items-center gap-1 text-primary font-label text-[10px] font-bold uppercase active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-sm">my_location</span>
                Detect
              </button>
            </div>
            <textarea
              placeholder="Street, House No, Keffi"
              rows={3}
              className={`w-full bg-transparent border border-outline-variant/30 rounded-2xl py-4 px-6 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container/30 transition-all resize-none ${errors.address ? 'ring-2 ring-red-500/50' : ''}`}
              value={formData.address}
              onChange={(e) => {
                setFormData({ ...formData, address: e.target.value });
                if (errors.address) setErrors({ ...errors, address: '' });
              }}
            />
            {errors.address && <p className="text-red-500 text-[10px] font-bold px-4 uppercase tracking-wider">{errors.address}</p>}
          </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low px-5 py-4 text-sm">
                <p className="font-label text-[10px] uppercase tracking-widest text-outline font-bold">Pickup Address</p>
                <p className="mt-2 font-body">{paymentSettings?.pickup_address || 'Pickup counter'}</p>
                {paymentSettings?.pickup_instructions && (
                  <p className="mt-2 text-xs text-outline">{paymentSettings.pickup_instructions}</p>
                )}
              </div>
              <div className="space-y-1">
                <input
                  type="text"
                  placeholder="Preferred pickup time e.g. 5:30 PM"
                  className={`w-full bg-transparent border border-outline-variant/30 rounded-2xl py-4 px-6 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container/30 transition-all ${errors.pickupTime ? 'ring-2 ring-red-500/50' : ''}`}
                  value={formData.pickupTime}
                  onChange={(e) => {
                    setFormData({ ...formData, pickupTime: e.target.value });
                    if (errors.pickupTime) setErrors({ ...errors, pickupTime: '' });
                  }}
                />
                {errors.pickupTime && <p className="text-red-500 text-[10px] font-bold px-4 uppercase tracking-wider">{errors.pickupTime}</p>}
              </div>
            </div>
          )}
          <div className="space-y-3">
            <p className="font-label text-[10px] uppercase tracking-widest text-outline font-bold px-1">Payment Method</p>
            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => setFormData((current) => ({ ...current, paymentMethod: 'bank_transfer' }))}
                className={`rounded-2xl border px-4 py-4 text-left ${formData.paymentMethod === 'bank_transfer' ? 'border-primary-container bg-primary-container/10' : 'border-outline-variant/30 bg-transparent'}`}
              >
                <p className="font-headline font-bold text-sm">Bank transfer</p>
                <p className="text-xs text-outline mt-1">Customer pays now, admin confirms after receipt review.</p>
              </button>
              {formData.orderType === 'pickup' && (
                <button
                  type="button"
                  onClick={() => setFormData((current) => ({ ...current, paymentMethod: 'cash_on_pickup' }))}
                  className={`rounded-2xl border px-4 py-4 text-left ${formData.paymentMethod === 'cash_on_pickup' ? 'border-primary-container bg-primary-container/10' : 'border-outline-variant/30 bg-transparent'}`}
                >
                  <p className="font-headline font-bold text-sm">Pay on pickup</p>
                  <p className="text-xs text-outline mt-1">Customer places the order now and the admin confirms payment later.</p>
                </button>
              )}
            </div>
          </div>
          <input
            type="text"
            placeholder="Note for rider (optional)"
            className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-6 font-body text-sm outline-none focus:ring-2 focus:ring-primary-container/30 transition-all"
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          />
        </div>
      </section>

      <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6">
        <h3 className="font-headline font-bold text-base mb-4">Order Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-xs">
            <span className="text-outline">Items ({items.reduce((a, b) => a + b.quantity, 0)})</span>
            <span className="font-label font-bold">₦{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-outline">Delivery</span>
            <span className="font-label font-bold text-secondary">{formData.orderType === 'pickup' ? 'Pickup' : 'Free'}</span>
          </div>
          <div className="pt-3 border-t border-outline-variant/20 flex justify-between items-center">
            <span className="font-headline font-bold">Total</span>
            <span className="font-label font-bold text-primary-container text-lg" style={{ color: '#EAB600' }}>
              ₦{subtotal.toLocaleString()}
            </span>
          </div>
        </div>
      </section>

      <button
        type="submit"
        disabled={isLoading || isGeoLoading}
        className="w-full bg-primary-container text-on-primary-container font-headline font-bold py-4 rounded-full shadow-lg active:scale-95 transition-transform disabled:opacity-70"
      >
        {isLoading ? '...Saving Order' : formData.paymentMethod === 'cash_on_pickup' ? 'Submit Pickup Order' : 'Next: Payment'}
      </button>
    </form>
  );
}
