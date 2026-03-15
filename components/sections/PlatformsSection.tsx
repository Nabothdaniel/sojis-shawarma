'use client';

import React from 'react';
import {
  RiTelegramLine,
  RiWhatsappLine,
  RiInstagramLine,
  RiFacebookCircleLine,
  RiTiktokLine,
  RiTwitterXLine,
  RiGoogleLine,
  RiAmazonLine,
} from 'react-icons/ri';

const PLATFORMS = [
  { icon: <RiTelegramLine size={26} />, name: 'Telegram', color: '#26A5E4' },
  { icon: <RiWhatsappLine size={26} />, name: 'WhatsApp', color: '#25D366' },
  { icon: <RiInstagramLine size={26} />, name: 'Instagram', color: '#E1306C' },
  { icon: <RiFacebookCircleLine size={26} />, name: 'Facebook', color: '#1877F2' },
  { icon: <RiTiktokLine size={26} />, name: 'TikTok', color: '#EE1D52' },
  { icon: <RiTwitterXLine size={26} />, name: 'X (Twitter)', color: '#E7E9EA' },
  { icon: <RiGoogleLine size={26} />, name: 'Google', color: '#4285F4' },
  { icon: <RiAmazonLine size={26} />, name: 'Amazon', color: '#FF9900' },
];

export default function PlatformsSection() {
  return (
    <section
      style={{
        padding: '64px 24px',
        borderTop: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <p
          style={{
            textAlign: 'center',
            color: 'var(--color-text-faint)',
            fontSize: '0.78rem',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 36,
          }}
        >
          Works with all major platforms
        </p>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {PLATFORMS.map((p) => (
            <div
              key={p.name}
              className="glass-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 18px',
                borderRadius: 12,
                cursor: 'default',
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = `${p.color}40`;
                (e.currentTarget as HTMLElement).style.background = `${p.color}08`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
              }}
            >
              <span style={{ color: p.color, display: 'flex' }}>{p.icon}</span>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: 'var(--color-text-muted)',
                  whiteSpace: 'nowrap',
                }}
              >
                {p.name}
              </span>
            </div>
          ))}

          {/* More badge */}
          <div
            style={{
              padding: '12px 18px',
              borderRadius: 12,
              border: '1px dashed var(--color-border)',
              color: 'var(--color-text-faint)',
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            + 200 more
          </div>
        </div>
      </div>
    </section>
  );
}
