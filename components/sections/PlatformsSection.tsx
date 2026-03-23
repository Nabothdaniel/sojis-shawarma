'use client';

import React from 'react';
import { RiTelegramLine, RiWhatsappLine, RiInstagramLine, RiFacebookCircleLine, RiTiktokLine, RiTwitterXLine, RiGoogleLine, RiAmazonLine } from 'react-icons/ri';

const PLATFORMS = [
  { icon: <RiTelegramLine size={24} />, name: 'Telegram', color: '#26A5E4' },
  { icon: <RiWhatsappLine size={24} />, name: 'WhatsApp', color: '#25D366' },
  { icon: <RiInstagramLine size={24} />, name: 'Instagram', color: '#E1306C' },
  { icon: <RiFacebookCircleLine size={24} />, name: 'Facebook', color: '#1877F2' },
  { icon: <RiTiktokLine size={24} />, name: 'TikTok', color: '#EE1D52' },
  { icon: <RiTwitterXLine size={24} />, name: 'X (Twitter)', color: '#14171A' },
  { icon: <RiGoogleLine size={24} />, name: 'Google', color: '#4285F4' },
  { icon: <RiAmazonLine size={24} />, name: 'Amazon', color: '#FF9900' },
];

export default function PlatformsSection() {
  return (
    <section style={{
      padding: 'clamp(48px, 6vw, 72px) clamp(16px, 4vw, 24px)',
      borderTop: '1px solid var(--color-border)',
      background: '#fff',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <p style={{
          textAlign: 'center', color: 'var(--color-text-faint)',
          fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', marginBottom: 28,
        }}>
          Works with all major platforms
        </p>

        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 10,
          justifyContent: 'center', alignItems: 'center',
        }}>
          {PLATFORMS.map((p) => (
            <div key={p.name}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 16px', borderRadius: 10,
                border: '1px solid var(--color-border)', background: '#fff',
                cursor: 'default', transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLElement>) => {
                e.currentTarget.style.borderColor = `var(--color-primary-glow)`;
                e.currentTarget.style.background = `var(--color-primary-dim)`;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLElement>) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.transform = 'none';
              }}>
              <span style={{ color: p.color, display: 'flex' }}>{p.icon}</span>
              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                {p.name}
              </span>
            </div>
          ))}
          <div style={{
            padding: '10px 16px', borderRadius: 10,
            border: '1px dashed var(--color-border)',
            color: 'var(--color-text-faint)', fontWeight: 600, fontSize: '0.85rem',
          }}>
            + 200 more
          </div>
        </div>
      </div>
    </section>
  );
}
