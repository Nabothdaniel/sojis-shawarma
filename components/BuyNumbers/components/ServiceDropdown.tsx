import React from 'react';
import { RiArrowDownSLine, RiInformationLine, RiSearchLine } from 'react-icons/ri';
import { SmsService } from '@/lib/api';
import Tooltip from '@/components/ui/Tooltip';

interface ServiceDropdownProps {
  services: SmsService[];
  filteredServices: SmsService[];
  selectedServiceCode: string;
  chosenService: SmsService | undefined;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  search: string;
  setSearch: (search: string) => void;
  onSelect: (code: string) => void;
}

export const ServiceDropdown: React.FC<ServiceDropdownProps> = ({
  services,
  filteredServices,
  selectedServiceCode,
  chosenService,
  isOpen,
  setIsOpen,
  search,
  setSearch,
  onSelect
}) => {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Service
        </label>
        <Tooltip content="Select the app or website you want to receive an SMS from.">
          <RiInformationLine size={14} color="var(--color-text-faint)" />
        </Tooltip>
      </div>
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
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
          <RiArrowDownSLine size={16} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        {isOpen && (
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
                onClick={() => { onSelect(''); setIsOpen(false); }}
                style={{ width: '100%', padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-faint)', fontSize: '0.875rem', textAlign: 'left', borderLeft: '3px solid transparent' }}
              >
                Select Service
              </button>
              {filteredServices.map((s, idx) => (
                 <button
                 key={s.code ? `s-${s.code}` : `idx-${idx}`}
                 onClick={() => { onSelect(s.code); setIsOpen(false); setSearch(''); }}
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
  );
};
