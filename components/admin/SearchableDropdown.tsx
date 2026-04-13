'use client';

import React, { useState, useRef, useEffect } from 'react';
import { RiSearchLine, RiArrowDownSLine, RiCheckLine } from 'react-icons/ri';

interface Option {
  id: number | string;
  name: string;
  flag?: string;
}

interface SearchableDropdownProps {
  options: Option[];
  value: number | string;
  onChange: (value: number | string) => void;
  placeholder?: string;
  label?: string;
}

export default function SearchableDropdown({ options, value, onChange, placeholder = 'Search...', label }: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  
  const selectedOption = options.find(o => String(o.id) === String(value));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(o => 
    o.name.toLowerCase().includes(search.toLowerCase()) || 
    String(o.id).includes(search)
  );

  return (
    <div className="dropdown-container" ref={containerRef} style={{ position: 'relative', width: '280px' }}>
      {label && <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-faint)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>}
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '10px 16px',
          background: '#FFFFFF',
          border: `1.5px solid ${isOpen ? 'var(--color-primary)' : 'var(--color-border)'}`,
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: isOpen ? '0 0 0 4px var(--color-primary-glow)' : 'none'
        }}
      >
        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: selectedOption ? 'var(--color-text)' : 'var(--color-text-faint)' }}>
          {selectedOption ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {selectedOption.flag && <span>{selectedOption.flag}</span>}
              {selectedOption.name}
            </div>
          ) : placeholder}
        </span>
        <RiArrowDownSLine style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none', color: 'var(--color-text-faint)' }} />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          right: 0,
          background: '#FFFFFF',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
          zIndex: 1000,
          overflow: 'hidden',
          animation: 'dropdownFade 0.2s ease'
        }}>
          <div style={{ padding: '12px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ position: 'relative' }}>
              <RiSearchLine style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)' }} />
              <input 
                type="text" 
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search countries..."
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  borderRadius: '10px',
                  border: '1.5px solid var(--color-border)',
                  outline: 'none',
                  fontSize: '0.85rem'
                }}
              />
            </div>
          </div>
          
          <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '6px' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-faint)', fontSize: '0.85rem' }}>
                No countries found
              </div>
            ) : (
               filteredOptions.map((opt, index) => (
                <div 
                  key={`${opt.id}-${index}`}
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: String(opt.id) === String(value) ? 'var(--color-primary-dim)' : 'transparent',
                    transition: 'background 0.2s'
                  }}
                  className="dropdown-item"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)' }}>
                    {opt.flag && <span>{opt.flag}</span>}
                    {opt.name}
                  </div>
                  {String(opt.id) === String(value) && <RiCheckLine color="var(--color-primary)" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .dropdown-item:hover { background: var(--color-bg-hover) !important; }
        @keyframes dropdownFade {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
