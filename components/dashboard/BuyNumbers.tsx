'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RiShoppingCartLine, RiSearchLine, RiArrowDownSLine, RiInformationLine } from 'react-icons/ri';
import { useAppStore } from '@/store/appStore';
import { smsService, userService, SmsService, SmsCountry, AvailabilityInfo } from '@/lib/api';

interface Props { defaultCountry?: string; }

export default function BuyNumbers({ defaultCountry = 'Russia' }: Props) {
  const router = useRouter();
  const { addToast, user, login } = useAppStore();
  
  // Data lists
  const [countries, setCountries] = useState<SmsCountry[]>([]);
  const [services, setServices] = useState<SmsService[]>([]);
  
  // Selections
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [selectedServiceCode, setSelectedServiceCode] = useState<string>('');
  const [priceInfo, setPriceInfo] = useState<AvailabilityInfo | null>(null);
  
  // UI states
  const [search, setSearch] = useState('');
  const [dropOpen, setDropOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [checkingPrice, setCheckingPrice] = useState(false);
  const [accordionOpen, setAccordionOpen] = useState<string | null>(null);

  // 1. Initial fetch: Countries and Services
  useEffect(() => {
    const init = async () => {
      try {
        const [countriesRes, servicesRes] = await Promise.all([
          smsService.getCountries(),
          smsService.getSmsBowerServices()
        ]);
        
        setCountries(countriesRes.data);
        setServices(servicesRes.data);
        
        // Find default country ID (robust match)
        const def = countriesRes.data.find(c => 
          c.eng.toLowerCase() === defaultCountry.toLowerCase() ||
          c.eng.toLowerCase().includes(defaultCountry.toLowerCase())
        );
        if (def) setSelectedCountryId(def.id);
        else if (countriesRes.data.length > 0) setSelectedCountryId(countriesRes.data[0].id);

      } catch (err: any) {
        const msg = err.message || '';
        let finalMsg = 'Failed to load services: ' + msg;
        if (msg.toLowerCase().includes('no access') || msg.toLowerCase().includes('401') || msg.toLowerCase().includes('not whitelisted')) {
          finalMsg += '. Please ensure your server IP is whitelisted in your SMSBower API settings. You can find your IP at /api/utils/server-ip';
        }
        addToast(finalMsg, 'error');
      } finally {
        setFetching(false);
      }
    };
    init();
  }, [addToast, defaultCountry]);

  // 2. Fetch price/availability when both selections are made
  useEffect(() => {
    if (selectedCountryId !== null && selectedServiceCode) {
      setCheckingPrice(true);
      smsService.getAvailability(selectedServiceCode, selectedCountryId)
        .then(res => setPriceInfo(res.data))
        .catch(() => {
          setPriceInfo({ available: false, price: null, count: 0 });
          addToast('Could not fetch price for this selection.', 'error');
        })
        .finally(() => setCheckingPrice(false));
    } else {
      setPriceInfo(null);
    }
  }, [selectedCountryId, selectedServiceCode, addToast]);

  const country = countries.find(c => c.id === selectedCountryId);
  const filteredServices = services.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  const chosenService = services.find(s => s.code === selectedServiceCode);

  const handleBuy = async () => {
    if (!selectedServiceCode || !selectedCountryId || !country || !chosenService) { 
      addToast('Please select a country and service first.', 'error'); 
      return; 
    }
    
    if (!priceInfo?.available || priceInfo.price === null) {
      addToast('This service is currently unavailable for ' + country.eng, 'error');
      return;
    }

    // In a real app, priceInfo.price might be in a different currency or scale.
    // Let's assume the backend handles the conversion and returns the final price in Naira (₦)
    // based on the logic in SMSController and Database.
    if (!user || user.balance < priceInfo.price) { 
      addToast(`Insufficient balance. This costs ₦${priceInfo.price}, you have ₦${user?.balance?.toLocaleString() ?? '0'}.`, 'error'); 
      return; 
    }
    
    setLoading(true);
    try {
      await smsService.buyNumber({
        serviceCode: selectedServiceCode,
        serviceName: chosenService.name,
        countryId: selectedCountryId,
        countryName: country.eng,
        maxPrice: priceInfo.price
      });
      
      addToast(`${chosenService.name} number purchased successfully!`, 'success');
      setSelectedServiceCode('');
      
      // Refresh user data
      const profileRes = await userService.getProfile();
      login(profileRes.data);
    } catch (error: any) {
      addToast(error.message || 'Purchase failed', 'error');
    } finally {
      setLoading(false);
    }
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

  if (fetching) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-faint)' }}>Loading services...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Main buy card */}
      <div className="stat-card">
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: 20 }}>
          Buy {country?.eng || 'SMS'} Number
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
                value={selectedCountryId ?? ''}
                onChange={(e) => { setSelectedCountryId(Number(e.target.value)); setSelectedServiceCode(''); }}
              >
                {countries.map((c) => (
                  <option key={c.id} value={c.id} style={{ background: '#111827' }}>
                    {c.flag} {c.eng}
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
                  background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                  color: selectedServiceCode ? 'var(--color-text)' : 'var(--color-text-faint)',
                  cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'var(--font-body)',
                  transition: 'all 0.2s',
                }}
              >
                {chosenService?.name || 'Select Service'}
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
                      onClick={() => { setSelectedServiceCode(''); setDropOpen(false); }}
                      style={{ width: '100%', padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-faint)', fontSize: '0.875rem', textAlign: 'left', borderLeft: '3px solid transparent' }}
                    >
                      Select Service
                    </button>
                    {filteredServices.map((s) => (
                       <button
                       key={s.code}
                       onClick={() => { setSelectedServiceCode(s.code); setDropOpen(false); setSearch(''); }}
                       style={{
                         width: '100%', padding: '11px 16px', background: selectedServiceCode === s.code ? 'var(--color-primary-dim)' : 'none',
                         border: 'none', cursor: 'pointer',
                         color: selectedServiceCode === s.code ? 'var(--color-primary)' : 'var(--color-text)',
                         fontSize: '0.875rem', textAlign: 'left',
                         borderLeft: `3px solid ${selectedServiceCode === s.code ? 'var(--color-primary)' : 'transparent'}`,
                         display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                         transition: 'all 0.15s',
                       }}
                     >
                       <span style={{ fontWeight: selectedServiceCode === s.code ? 600 : 400 }}>{s.name}</span>
                       <span style={{ fontSize: '0.78rem', color: 'var(--color-text-faint)' }}>{s.code}</span>
                     </button>
                    ))}
                    {filteredServices.length === 0 && (
                      <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-faint)', fontSize: '0.875rem' }}>
                        No services found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Availability & Price Display */}
          {selectedServiceCode && selectedCountryId !== null && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', borderRadius: 10,
              background: 'var(--color-primary-dim)', border: '1px solid rgba(0,229,255,0.15)',
              minHeight: '42px',
            }}>
              {checkingPrice ? (
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-faint)' }}>Checking availability...</span>
              ) : priceInfo?.available ? (
                <>
                  <RiInformationLine size={15} color="var(--color-primary)" />
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                    Price for <strong style={{ color: 'var(--color-text)' }}>{chosenService?.name}</strong>: 
                    <strong style={{ color: 'var(--color-primary)', marginLeft: 4 }}>₦{priceInfo.price?.toLocaleString()}</strong>
                    <span style={{ marginLeft: 8, fontSize: '0.75rem', opacity: 0.6 }}>({priceInfo.count} available)</span>
                  </span>
                </>
              ) : (
                <span style={{ fontSize: '0.875rem', color: '#EF4444' }}>This service is currently out of stock for this country.</span>
              )}
            </div>
          )}

          {/* Buy button */}
          <button
            onClick={handleBuy}
            disabled={loading || !selectedServiceCode || checkingPrice || !priceInfo?.available}
            className="btn-primary"
            style={{ padding: '14px', width: '100%', fontSize: '0.95rem', opacity: (!selectedServiceCode || checkingPrice || !priceInfo?.available) ? 0.5 : 1, gap: 8, marginTop: 4 }}
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
