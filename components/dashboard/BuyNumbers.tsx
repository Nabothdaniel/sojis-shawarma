'use client';

import React, { useState } from 'react';
import { RiShoppingCartLine, RiSearchLine, RiArrowDownSLine, RiInformationLine } from 'react-icons/ri';
import { useAppStore } from '@/store/appStore';

interface Service { name: string; price: number; }
interface Country { name: string; flag: string; services: Service[]; }

const COUNTRIES: Country[] = [
  {
    name: 'USA', flag: '🇺🇸',
    services: [
      { name: 'Telegram', price: 120 }, { name: 'WhatsApp', price: 150 },
      { name: 'Rappi', price: 234 }, { name: 'Coca-Cola', price: 200 },
      { name: 'Taptap Send', price: 180 }, { name: 'Foodora', price: 190 },
      { name: 'Instagram', price: 250 }, { name: 'Facebook', price: 200 },
      { name: 'Google', price: 300 }, { name: 'Twitter/X', price: 220 },
    ],
  },
  {
    name: 'UK', flag: '🇬🇧',
    services: [
      { name: 'Telegram', price: 180 }, { name: 'WhatsApp', price: 200 },
      { name: 'Instagram', price: 320 }, { name: 'Facebook', price: 270 },
    ],
  },
  {
    name: 'Canada', flag: '🇨🇦',
    services: [
      { name: 'Telegram', price: 160 }, { name: 'WhatsApp', price: 190 },
      { name: 'Instagram', price: 280 },
    ],
  },
  {
    name: 'Nigeria', flag: '🇳🇬',
    services: [
      { name: 'Telegram', price: 90 }, { name: 'WhatsApp', price: 100 },
      { name: 'Instagram', price: 150 }, { name: 'Facebook', price: 120 },
    ],
  },
  {
    name: 'India', flag: '🇮🇳',
    services: [
      { name: 'Telegram', price: 80 }, { name: 'WhatsApp', price: 95 },
      { name: 'Instagram', price: 130 },
    ],
  },
];

interface Props { defaultCountry?: string; }

export default function BuyNumbers({ defaultCountry = 'USA' }: Props) {
  const { addToast, user } = useAppStore();
  const [selectedCountry, setSelectedCountry] = useState(defaultCountry);
  const [selectedService, setSelectedService] = useState('');
  const [search, setSearch] = useState('');
  const [dropOpen, setDropOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accordionOpen, setAccordionOpen] = useState<string | null>(null);

  const country = COUNTRIES.find((c) => c.name === selectedCountry) ?? COUNTRIES[0];
  const filtered = country.services.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
  const chosen = country.services.find((s) => s.name === selectedService);

  const handleBuy = async () => {
    if (!selectedService) { addToast('Please select a service first.', 'error'); return; }
    if (!user || user.balance < (chosen?.price ?? 0)) { addToast('Insufficient wallet balance. Please fund your wallet.', 'error'); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    addToast(`${selectedService} number purchased successfully!`, 'success');
    setSelectedService('');
  };

  const FAQ_SECTIONS = [
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Main buy card */}
      <div className="stat-card">
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: 20 }}>
          Buy {selectedCountry} Number
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Country select */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-faint)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Country
            </label>
            <div style={{ position: 'relative' }}>
              <select
                className="select-field"
                value={selectedCountry}
                onChange={(e) => { setSelectedCountry(e.target.value); setSelectedService(''); }}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.name} value={c.name} style={{ background: '#111827' }}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
              <RiArrowDownSLine size={16} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Service dropdown */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-faint)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Service
            </label>
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setDropOpen(!dropOpen)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '13px 16px', borderRadius: 'var(--radius-md)',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)',
                  color: selectedService ? 'var(--color-text)' : 'var(--color-text-faint)',
                  cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'var(--font-body)',
                  transition: 'all 0.2s',
                }}
              >
                {selectedService || 'Select Service'}
                <RiArrowDownSLine size={16} style={{ transform: dropOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              {dropOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 100,
                  background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)', overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}>
                  {/* Search */}
                  <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)', position: 'relative' }}>
                    <RiSearchLine size={15} style={{ position: 'absolute', left: 22, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)' }} />
                    <input
                      className="input-field"
                      placeholder="Search..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      style={{ paddingLeft: 34, padding: '8px 12px 8px 34px', fontSize: '0.85rem' }}
                      autoFocus
                    />
                  </div>
                  {/* Options */}
                  <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                    <button
                      onClick={() => { setSelectedService(''); setDropOpen(false); }}
                      style={{ width: '100%', padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-faint)', fontSize: '0.875rem', textAlign: 'left', borderLeft: '3px solid transparent' }}
                    >
                      Select Service
                    </button>
                    {filtered.map((s) => (
                      <button
                        key={s.name}
                        onClick={() => { setSelectedService(s.name); setDropOpen(false); setSearch(''); }}
                        style={{
                          width: '100%', padding: '11px 16px', background: selectedService === s.name ? 'var(--color-primary-dim)' : 'none',
                          border: 'none', cursor: 'pointer',
                          color: selectedService === s.name ? 'var(--color-primary)' : 'var(--color-text)',
                          fontSize: '0.875rem', textAlign: 'left',
                          borderLeft: `3px solid ${selectedService === s.name ? 'var(--color-primary)' : 'transparent'}`,
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          transition: 'all 0.15s',
                        }}
                      >
                        <span style={{ fontWeight: selectedService === s.name ? 600 : 400 }}>{s.name}</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-faint)' }}>₦{s.price}</span>
                      </button>
                    ))}
                    {filtered.length === 0 && (
                      <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-faint)', fontSize: '0.875rem' }}>
                        No services found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Price display */}
          {chosen && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', borderRadius: 10,
              background: 'var(--color-primary-dim)', border: '1px solid rgba(0,229,255,0.15)',
            }}>
              <RiInformationLine size={15} color="var(--color-primary)" />
              <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                The price of <strong style={{ color: 'var(--color-text)' }}>{chosen.name}</strong> is{' '}
                <strong style={{ color: 'var(--color-primary)' }}>₦{chosen.price.toLocaleString()}.00</strong>
              </span>
            </div>
          )}

          {/* Buy button */}
          <button
            onClick={handleBuy}
            disabled={loading || !selectedService}
            className="btn-primary"
            style={{ padding: '14px', width: '100%', fontSize: '0.95rem', opacity: !selectedService ? 0.5 : 1, gap: 8, marginTop: 4 }}
          >
            {loading ? 'Processing...' : <><RiShoppingCartLine size={18} /> Buy Number</>}
          </button>
        </div>
      </div>

      {/* FAQ accordions */}
      {FAQ_SECTIONS.map((faq) => (
        <div key={faq.id} className={`accordion-item ${accordionOpen === faq.id ? 'open' : ''}`}>
          <button
            className="accordion-trigger"
            onClick={() => setAccordionOpen(accordionOpen === faq.id ? null : faq.id)}
          >
            <span style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.875rem' }}>{faq.title}</span>
            <RiArrowDownSLine
              size={18}
              color="var(--color-text-faint)"
              style={{ transform: accordionOpen === faq.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
            />
          </button>
          {accordionOpen === faq.id && (
            <div className="accordion-content">{faq.content}</div>
          )}
        </div>
      ))}
    </div>
  );
}
