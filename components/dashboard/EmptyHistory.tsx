import React from 'react';
import { RiInboxLine } from 'react-icons/ri';

export default function EmptyHistory({ message }: { message: string }) {
  return (
    <div className="empty-state">
      {/* Open box SVG illustration */}
      <svg width="120" height="100" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="55" width="80" height="40" rx="4" fill="rgba(37,99,235,0.06)" stroke="rgba(37,99,235,0.18)" strokeWidth="1.5"/>
        <path d="M20 55 L35 38 L85 38 L100 55" stroke="rgba(37,99,235,0.18)" strokeWidth="1.5" fill="rgba(37,99,235,0.04)"/>
        <path d="M20 55 L60 65 L100 55" stroke="rgba(37,99,235,0.14)" strokeWidth="1" fill="none"/>
        <rect x="45" y="38" width="30" height="17" rx="2" fill="rgba(37,99,235,0.08)" stroke="rgba(37,99,235,0.14)" strokeWidth="1.5"/>
        <circle cx="75" cy="25" r="8" fill="rgba(37,99,235,0.08)" stroke="rgba(37,99,235,0.18)" strokeWidth="1.5" strokeDasharray="3 2"/>
        <line x1="60" y1="22" x2="75" y2="25" stroke="rgba(37,99,235,0.14)" strokeWidth="1"/>
      </svg>

      <div style={{ color: 'var(--color-text-faint)', marginTop: 4 }}>
        <RiInboxLine size={0} />
      </div>

      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-text-muted)' }}>
        {message}
      </h3>
      <p style={{ color: 'var(--color-text-faint)', fontSize: '0.8rem', maxWidth: 280, lineHeight: 1.6 }}>
        Nothing here yet. Your activity will appear here once you start using the platform.
      </p>
    </div>
  );
}
