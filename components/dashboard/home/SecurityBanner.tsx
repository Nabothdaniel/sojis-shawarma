'use client';

import React from 'react';
import Link from 'next/link';
import { RiShieldKeyholeLine } from 'react-icons/ri';

interface SecurityBannerProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction?: () => void;
  href?: string;
  gradient: string;
  actionColor: string;
  shadow: string;
}

export default function SecurityBanner({
  title,
  description,
  actionLabel,
  onAction,
  href,
  gradient,
  actionColor,
  shadow,
}: SecurityBannerProps) {
  const actionButton = (
    <button
      className="btn-primary banner-btn"
      onClick={onAction}
      style={{
        background: '#fff',
        color: actionColor,
        fontWeight: 800,
        padding: '14px 28px',
        border: 'none',
        borderRadius: 12,
        cursor: 'pointer',
        transition: 'transform 0.2s',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}
    >
      {actionLabel}
    </button>
  );

  return (
    <div
      className="security-banner"
      style={{
        background: gradient,
        borderRadius: 20,
        color: '#fff',
        border: 'none',
        marginBottom: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '32px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: shadow,
      }}
    >
      <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.1 }}>
        <RiShieldKeyholeLine size={180} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, position: 'relative', zIndex: 1 }}>
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: 16,
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <RiShieldKeyholeLine size={32} />
        </div>
        <div className="banner-text">
          <h3 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 800, marginBottom: 4 }}>{title}</h3>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem', margin: 0, maxWidth: 450 }}>{description}</p>
        </div>
      </div>
      {href ? <Link href={href}>{actionButton}</Link> : actionButton}
    </div>
  );
}
