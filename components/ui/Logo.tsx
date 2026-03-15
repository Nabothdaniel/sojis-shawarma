import React from 'react';
import { RiSignalTowerFill } from 'react-icons/ri';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: { icon: 18, text: '1rem', gap: 8 },
  md: { icon: 22, text: '1.2rem', gap: 10 },
  lg: { icon: 32, text: '1.75rem', gap: 12 },
};

export default function Logo({ size = 'md' }: LogoProps) {
  const s = sizes[size];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: s.gap, textDecoration: 'none' }}>
      <div
        style={{
          width: s.icon * 1.8,
          height: s.icon * 1.8,
          borderRadius: '10px',
          background: 'linear-gradient(135deg, var(--color-primary), #0EA5E9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 0 16px var(--color-primary-glow)',
        }}
      >
        <RiSignalTowerFill size={s.icon} color="#000" />
      </div>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: s.text,
          letterSpacing: '-0.03em',
          color: 'var(--color-text)',
          lineHeight: 1,
        }}
      >
        bamzy<span style={{ color: 'var(--color-primary)' }}>SMS</span>
      </span>
    </div>
  );
}
