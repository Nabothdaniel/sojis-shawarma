
import React from 'react';
import { RiSignalTowerFill } from 'react-icons/ri';

interface LogoProps { size?: 'sm' | 'md' | 'lg'; }

const sizes = {
  sm: { icon: 14, box: 28, radius: 8, text: '0.85rem' },
  md: { icon: 18, box: 36, radius: 10, text: '1rem' },
  lg: { icon: 24, box: 48, radius: 12, text: '1.2rem' },
};

export default function Logo({ size = 'md' }: LogoProps) {
  const s = sizes[size];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: s.box, height: s.box, borderRadius: s.radius,
        background: 'linear-gradient(135deg, #1A73E8, #7C3AED)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(26,115,232,0.25)',
        flexShrink: 0,
      }}>
        <RiSignalTowerFill size={s.icon} color="#fff" />
      </div>
      <span style={{
        fontFamily: 'Poppins, sans-serif', fontWeight: 800,
        fontSize: s.text, color: '#111827', letterSpacing: '-0.02em',
      }}>
        bamzy<span style={{ color: '#1A73E8' }}>SMS</span>
      </span>
    </div>
  );
}
