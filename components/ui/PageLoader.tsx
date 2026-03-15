'use client';

import React, { useEffect, useState } from 'react';
import { RiSignalTowerFill } from 'react-icons/ri';

export default function PageLoader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 1800);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'var(--color-bg)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 20, zIndex: 9999,
        animation: visible ? 'none' : 'fadeOut 0.3s ease forwards',
      }}
    >
      {/* Logo mark */}
      <div style={{
        width: 64, height: 64, borderRadius: 16,
        background: 'linear-gradient(135deg, var(--color-primary), #0EA5E9)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 32px var(--color-primary-glow)',
      }}>
        <RiSignalTowerFill size={32} color="#000" />
      </div>

      {/* Brand name */}
      <div style={{
        fontFamily: 'var(--font-display)', fontWeight: 800,
        fontSize: '1.3rem', letterSpacing: '-0.03em', color: 'var(--color-text)',
      }}>
        bamzy<span style={{ color: 'var(--color-primary)' }}>SMS</span>
      </div>

      {/* Bouncing dots */}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <div className="loader-dot" />
        <div className="loader-dot" />
        <div className="loader-dot" />
      </div>
    </div>
  );
}
