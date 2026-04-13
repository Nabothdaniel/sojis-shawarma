import React from 'react';
import { RiArrowDownSLine, RiInformationLine } from 'react-icons/ri';
import { SmsCountry } from '@/lib/api';
import Tooltip from '@/components/ui/Tooltip';
import Image from 'next/image';

interface CountryDropdownProps {
  countries: SmsCountry[];
  selectedCountryId: number | null;
  selectedCountry: SmsCountry | undefined;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSelect: (id: number) => void;
  disabled?: boolean;
}

export const CountryDropdown: React.FC<CountryDropdownProps> = ({
  countries,
  selectedCountryId,
  selectedCountry,
  isOpen,
  setIsOpen,
  onSelect,
  disabled
}) => {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Country
        </label>
        <Tooltip content="Select the origin country for your virtual number.">
          <RiInformationLine size={14} color="var(--color-text-faint)" />
        </Tooltip>
      </div>
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          className="select-field"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '13px 16px', borderRadius: 'var(--radius-md)',
            background: 'var(--color-bg)', border: '1px solid var(--color-border)',
            color: selectedCountry ? 'var(--color-text)' : 'var(--color-text-faint)',
            cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '0.9rem',
            opacity: disabled ? 0.8 : 1, transition: 'all 0.2s', textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {selectedCountry?.flagUrl ? (
              <Image src={selectedCountry.flagUrl} alt="" width={22} height={15} style={{ borderRadius: 2, objectFit: 'cover' }} />
            ) : <span>{selectedCountry?.flag || '🌐'}</span>}
            <span>{selectedCountry?.eng || 'Select Country'}</span>
          </div>
          {!disabled && (
            <RiArrowDownSLine size={16} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          )}
        </button>

        {isOpen && !disabled && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 110,
            background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)', overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {countries.map((c) => (
                 <button
                 key={`c-${c.id}-${c.eng}`}
                 onClick={() => { onSelect(c.id); setIsOpen(false); }}
                 style={{
                   width: '100%', padding: '11px 16px', background: selectedCountryId === c.id ? 'var(--color-primary-dim)' : 'none',
                   border: 'none', cursor: 'pointer',
                   color: selectedCountryId === c.id ? 'var(--color-primary)' : 'var(--color-text)',
                   fontSize: '0.875rem', textAlign: 'left',
                   borderLeft: `3px solid ${selectedCountryId === c.id ? 'var(--color-primary)' : 'transparent'}`,
                   display: 'flex', alignItems: 'center', gap: 10,
                   transition: 'all 0.15s',
                 }}
               >
                 {c.flagUrl ? (
                   <Image src={c.flagUrl} alt="" width={20} height={14} style={{ borderRadius: 2, border: '1px solid rgba(255,255,255,0.1)' }} />
                 ) : <span>{c.flag}</span>}
                 <span style={{ fontWeight: selectedCountryId === c.id ? 600 : 400 }}>{c.eng}</span>
               </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
