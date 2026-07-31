import React from 'react';
import { useCheckout } from '../hooks/useCheckout';

export function PaymentStep(props: ReturnType<typeof useCheckout>) {
  const {
    formData, setFormData, paymentSettings,
    subtotal, orderRef, setCurrentStep, clearCart
  } = props;

  return (
    <section className="space-y-6">
      <div className="bg-primary-container/10 border-2 border-primary-container rounded-3xl p-6">
        <h2 className="font-headline font-bold text-lg mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-container">bank</span>
          {formData.paymentMethod === 'cash_on_pickup' ? 'Pay on Pickup' : 'Bank Transfer'}
        </h2>
        {formData.paymentMethod === 'cash_on_pickup' ? (
          <p className="text-outline font-body text-sm mb-6">Your order is waiting for admin approval. Payment will be confirmed later when you arrive for pickup.</p>
        ) : (
          <p className="text-outline font-body text-sm mb-6">Transfer exactly <span className="font-bold text-primary-container">₦{subtotal.toLocaleString()}</span> to the account below:</p>
        )}
        
        {formData.paymentMethod === 'bank_transfer' && (
        <div className="bg-surface rounded-2xl p-4 space-y-3 mb-6">
          <div className="flex justify-between items-center">
            <span className="font-label text-xs uppercase text-outline">Bank Name</span>
            <span className="font-bold">{paymentSettings?.payment_bank_name || 'Bank'}</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-outline-variant/20">
            <span className="font-label text-xs uppercase text-outline">Account Name</span>
            <span className="font-bold">{paymentSettings?.payment_account_name || 'Store Account'}</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-outline-variant/20">
            <span className="font-label text-xs uppercase text-outline">Account Number</span>
            <span className="font-bold text-lg font-mono">{paymentSettings?.payment_account_number || '0000000000'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-label text-xs uppercase text-outline">Reference</span>
            <span className="font-bold font-mono text-sm">{orderRef}</span>
          </div>
        </div>
        )}

        <div className="bg-secondary/10 border border-secondary/30 rounded-2xl p-4 mb-6">
          <p className="text-secondary text-xs font-body">
            {formData.paymentMethod === 'bank_transfer' ? (
              <>
                ✓ Use the order reference as your transfer description<br/>
                ✓ Screenshot the receipt after transfer<br/>
                ✓ Upload receipt on the next step for admin verification
              </>
            ) : (
              <>
                ✓ The admin will confirm this order before pickup<br/>
                ✓ Bring your order reference when you arrive<br/>
                ✓ Payment remains pending until the admin marks it confirmed
              </>
            )}
          </p>
        </div>

        {formData.paymentMethod === 'bank_transfer' && (
          <input
            type="text"
            placeholder="Transfer reference or sender name (optional)"
            className="mb-6 w-full rounded-2xl border border-outline-variant/30 bg-transparent px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-primary-container/30"
            value={formData.paymentReference}
            onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
          />
        )}

        <button
          onClick={() => {
            if (formData.paymentMethod === 'cash_on_pickup') {
              clearCart();
              setCurrentStep('success');
              return;
            }
            setCurrentStep('receipt');
          }}
          className="w-full bg-primary-container text-on-primary-container font-headline font-bold py-4 rounded-full shadow-lg active:scale-95 transition-transform"
        >
          {formData.paymentMethod === 'cash_on_pickup' ? 'Finish Order Request' : 'I\'ve Transferred, Next Step'}
        </button>
      </div>
    </section>
  );
}
