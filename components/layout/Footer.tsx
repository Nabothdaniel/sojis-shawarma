'use client';

import React from 'react';
import Link from 'next/link';
import Logo from '@/components/ui/Logo';
import { RiMailLine, RiWhatsappLine, RiTwitterXLine, RiInstagramLine } from 'react-icons/ri';

const FOOTER_LINKS = {
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Support', href: '/support' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Refund Policy', href: '/refund' },
  ],
  Support: [
    { label: 'FAQ', href: '/dashboard/faqs' },
    { label: 'Live Chat', href: '#' },
    { label: 'Email Us', href: 'mailto:support@bamzysms.com' },
  ],
};

const SOCIAL = [
  { icon: <RiWhatsappLine size={17} />, href: '#', label: 'WhatsApp' },
  { icon: <RiTwitterXLine size={17} />, href: '#', label: 'Twitter/X' },
  { icon: <RiInstagramLine size={17} />, href: '#', label: 'Instagram' },
  { icon: <RiMailLine size={17} />, href: 'mailto:support@bamzysms.com', label: 'Email' },
];

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--color-border)',
      background: '#fff',
      padding: 'clamp(48px, 6vw, 64px) clamp(16px, 4vw, 24px) 28px',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Top grid */}
        <div className="footer-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 'clamp(28px, 4vw, 48px)',
          marginBottom: 40,
        }}>
          {/* Brand */}
          <div style={{ gridColumn: 'span 1' }} className="footer-brand">
            <Logo size="md" />
            <p style={{
              color: 'var(--color-text-muted)', fontSize: '0.875rem',
              lineHeight: 1.7, marginTop: 14, maxWidth: 240,
            }}>
              Nigeria&apos;s most reliable virtual phone number service. Protect your identity, verify securely.
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
              {SOCIAL.map((s) => (
                <a key={s.label} href={s.href} aria-label={s.label}
                  style={{
                    width: 36, height: 36, borderRadius: 9,
                    border: '1px solid var(--color-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--color-text-muted)', transition: 'all 0.2s', textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#1A73E8';
                    (e.currentTarget as HTMLElement).style.color = '#1A73E8';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(26,115,232,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--color-text-muted)';
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group}>
              <h4 style={{
                fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'var(--color-text-faint)', marginBottom: 14,
              }}>
                {group}
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} style={{
                      color: 'var(--color-text-muted)', fontSize: '0.875rem',
                      textDecoration: 'none', transition: 'color 0.2s',
                    }}
                      onMouseEnter={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.color = 'var(--color-primary)')}
                      onMouseLeave={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.color = 'var(--color-text-muted)')}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="divider" style={{ marginBottom: 20 }} />
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 10,
        }}>
          <p style={{ color: 'var(--color-text-faint)', fontSize: '0.78rem' }}>
            © {new Date().getFullYear()} BamzySMS. All rights reserved.
          </p>
          <p style={{ color: 'var(--color-text-faint)', fontSize: '0.78rem' }}>
            Made with ♥ in Nigeria
          </p>
        </div>
      </div>
    </footer>
  );
}

