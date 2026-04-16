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
    <div style={{
      position: 'fixed', inset: 0,
      background: 'radial-gradient(circle at top, rgba(37,99,235,0.08), transparent 42%), linear-gradient(180deg, #F8FBFF 0%, #FFFFFF 55%, #F4F7FB 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 20, zIndex: 9999,
    }}>
      <div style={{
        width: 68, height: 68, borderRadius: 20,
        background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid rgba(255,255,255,0.8)',
        boxShadow: '0 18px 44px rgba(37,99,235,0.18)',
      }}>
        <RiSignalTowerFill size={32} color="#fff" />
      </div>
      <div style={{
        fontFamily: 'var(--font-display)', fontWeight: 800,
        fontSize: '1.3rem', letterSpacing: '-0.02em', color: 'var(--color-text)',
      }}>
        bamzy<span style={{ color: 'var(--color-primary)' }}>SMS</span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="loader-dot"
            style={{ animationDelay: `${index * 0.12}s` }}
          />
        ))}
      </div>

      <style jsx>{`
        .loader-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
          box-shadow: 0 6px 16px rgba(37,99,235,0.18);
          animation: loaderPulse 0.9s ease-in-out infinite;
        }

        @keyframes loaderPulse {
          0%, 100% {
            transform: translateY(0) scale(0.92);
            opacity: 0.45;
          }
          50% {
            transform: translateY(-4px) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
