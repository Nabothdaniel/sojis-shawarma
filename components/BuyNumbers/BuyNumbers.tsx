'use client';

import React from 'react';
import { RiShoppingCartLine, RiInformationLine } from 'react-icons/ri';
import { useAppStore } from '@/store/appStore';
import PinModal from '@/components/ui/PinModal';
import Tooltip from '@/components/ui/Tooltip';

import { useBuyNumbers } from './useBuyNumbers';
import { BuyNumbersProps, FAQItem } from './types';
import { StatusBanner } from './components/StatusBanner';
import { CountryDropdown } from './components/CountryDropdown';
import { ServiceDropdown } from './components/ServiceDropdown';
import { FAQAccordion } from './components/FAQAccordion';

const FAQ_SECTIONS: FAQItem[] = [
  {
    id: 'issues',
    title: 'Read If You\'re Encountering Any Issues',
    content: 'If your number is not receiving OTP, please wait 2–3 minutes and try again. Ensure your wallet has sufficient balance. Contact support via WhatsApp or Telegram if the issue persists.',
  },
  {
    id: 'before',
    title: 'Read Before You Buy Numbers',
    content: 'Numbers are one-time use only. Once you receive an OTP, the number expires. Prices vary per service and country. Ensure you have sufficient balance before purchasing. No refunds after a number is assigned.',
  },
];

export default function BuyNumbers({ defaultCountry = 'USA', lockCountry = false }: BuyNumbersProps) {
  const { user } = useAppStore();
  const logic = useBuyNumbers(defaultCountry);

  if (logic.fetching) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-faint)' }}>
        Loading services...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PinModal
        isOpen={logic.pinModalOpen}
        onClose={() => logic.setPinModalOpen(false)}
        onSuccess={logic.handlePinSuccess}
        isLoading={logic.pinLoading}
        title="Confirm Purchase"
        description={`Please enter your 4-digit transaction PIN to purchase a ${logic.chosenService?.name} number for ₦${logic.priceInfo?.price?.toLocaleString()}.`}
      />

      <div className="stat-card">
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: 20 }}>
          Buy {logic.country?.eng || 'SMS'} Number
        </h2>

        {logic.purchaseError && (
          <StatusBanner message={logic.purchaseError} onClose={() => logic.setPurchaseError(null)} />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <CountryDropdown
            countries={logic.countries}
            selectedCountryId={logic.selectedCountryId}
            selectedCountry={logic.country}
            isOpen={logic.countryDropOpen}
            setIsOpen={logic.setCountryDropOpen}
            onSelect={logic.setSelectedCountryId}
            disabled={lockCountry}
          />

          <ServiceDropdown
            services={logic.services}
            filteredServices={logic.filteredServices}
            selectedServiceCode={logic.selectedServiceCode}
            chosenService={logic.chosenService}
            isOpen={logic.dropOpen}
            setIsOpen={logic.setDropOpen}
            search={logic.search}
            setSearch={logic.setSearch}
            onSelect={logic.setSelectedServiceCode}
          />

          {logic.selectedServiceCode && logic.selectedCountryId !== null && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', borderRadius: 10,
              background: 'var(--color-primary-dim)', border: '1px solid rgba(0,229,255,0.15)',
              minHeight: '42px',
            }}>
              {logic.checkingPrice ? (
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-faint)' }}>Checking availability...</span>
              ) : logic.priceInfo?.available ? (
                <Tooltip content="Live pricing includes provider cost and platform service fee.">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <RiInformationLine size={15} color="var(--color-primary)" />
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                      Price for <strong style={{ color: 'var(--color-text)' }}>{logic.chosenService?.name}</strong>: 
                      <strong style={{ color: 'var(--color-primary)', marginLeft: 4 }}>₦{logic.priceInfo.price?.toLocaleString()}</strong>
                      <span style={{ marginLeft: 8, fontSize: '0.75rem', opacity: 0.6 }}>({logic.priceInfo.count} available)</span>
                    </span>
                  </div>
                </Tooltip>
              ) : (
                <span style={{ fontSize: '0.875rem', color: '#EF4444' }}>This service is currently out of stock for this country.</span>
              )}
            </div>
          )}

          <button
            onClick={logic.handleBuy}
            disabled={logic.loading || !logic.selectedServiceCode || logic.checkingPrice || !logic.priceInfo?.available}
            className="btn-primary"
            style={{ padding: '14px', width: '100%', fontSize: '0.95rem', opacity: (!logic.selectedServiceCode || logic.checkingPrice || !logic.priceInfo?.available) ? 0.5 : 1, gap: 8, marginTop: 4 }}
          >
            {logic.loading ? 'Processing...' : <><RiShoppingCartLine size={18} /> Buy Number</>}
          </button>
        </div>
      </div>

      <FAQAccordion
        items={FAQ_SECTIONS}
        openId={logic.accordionOpen}
        setOpenId={logic.setAccordionOpen}
      />
    </div>
  );
}
