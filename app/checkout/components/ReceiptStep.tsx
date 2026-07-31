import React from 'react';
import { useCheckout } from '../hooks/useCheckout';

export function ReceiptStep(props: ReturnType<typeof useCheckout>) {
  const {
    formData, setFormData, receiptFile, setReceiptFile,
    addToast, handleReceiptUpload, isConfirming, paymentSettings
  } = props;

  return (
    <form onSubmit={handleReceiptUpload} className="space-y-6">
      <section>
        <h2 className="font-headline font-bold text-lg mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-container">cloud_upload</span>
          Upload Receipt
        </h2>

        <div className="border-2 border-dashed border-primary-container/30 rounded-3xl p-8 flex flex-col items-center justify-center bg-primary-container/5 cursor-pointer hover:bg-primary-container/10 transition-colors relative">
          <input
            type="file"
            accept="image/*"
            required
            onChange={(e) => {
              if (e.target.files?.[0]) {
                setReceiptFile(e.target.files[0]);
                addToast('Receipt selected!', 'success');
              }
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <span className="material-symbols-outlined text-5xl text-primary-container/50 mb-3">image</span>
          <p className="font-headline font-bold text-center mb-1">{receiptFile ? receiptFile.name : 'Tap to Upload'}</p>
          <p className="font-label text-xs text-outline">{receiptFile ? 'Selected ✓' : 'Screenshot of bank transfer'}</p>
        </div>

        <div className="bg-tertiary/10 border border-tertiary/30 rounded-2xl p-4 mt-6">
          <p className="text-tertiary text-xs font-body">
            📸 Make sure the receipt clearly shows<br/>
            • Amount transferred<br/>
            • Bank details<br/>
            • Date & time<br/>
            • Your reference number
          </p>
        </div>
        <input
          type="text"
          placeholder="Transfer reference or sender name (optional)"
          className="w-full rounded-2xl border border-outline-variant/30 bg-transparent px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-primary-container/30 mt-6"
          value={formData.paymentReference}
          onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
        />
      </section>

      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6">
        <h3 className="font-headline font-bold text-base mb-4">Delivery To</h3>
        <p className="font-body text-sm text-outline mb-2"><span className="font-bold text-on-surface">{formData.name}</span></p>
        <p className="font-body text-xs text-outline mb-4">{formData.phone}</p>
        <p className="font-body text-xs text-outline">📍 {formData.orderType === 'pickup' ? (paymentSettings?.pickup_address || 'Pickup') : formData.address}</p>
      </div>

      <button
        type="submit"
        disabled={isConfirming}
        className="w-full bg-primary-container text-on-primary-container font-headline font-bold py-4 rounded-full shadow-lg active:scale-95 transition-transform disabled:opacity-70"
      >
        {isConfirming ? '...Submitting Proof' : 'Submit Proof & Complete Order'}
      </button>
    </form>
  );
}
