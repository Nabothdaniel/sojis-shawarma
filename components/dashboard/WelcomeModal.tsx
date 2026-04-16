'use client';

import React from 'react';
import { RiCloseLine, RiTelegramLine, RiWhatsappLine, RiQuestionLine, RiShieldCheckLine, RiCoinLine } from 'react-icons/ri';
import { useAppStore } from '@/store/appStore';

export default function WelcomeModal() {
  const { welcomeModalSeen, setWelcomeModalSeen } = useAppStore();
  if (welcomeModalSeen) return null;

  const items = [
    {
      icon: <RiTelegramLine size={18} />,
      color: '#229ED9',
      title: 'Join Our Telegram Channel',
      desc: 'Stay updated with latest numbers, prices and announcements.',
      link: 'https://t.me/bamzysms',
      linkText: 'Join Channel',
    },
    {
      icon: <RiWhatsappLine size={18} />,
      color: '#25D366',
      title: 'Message Support',
      desc: 'Reach our customer care directly on WhatsApp for any issues.',
      link: 'https://wa.me/234000000000',
      linkText: 'Chat Now',
    },
    {
      icon: <RiQuestionLine size={18} />,
      color: 'var(--color-primary)',
      title: 'How to Buy SMS Units',
      desc: 'Go to the dashboard and click "Fund Wallet". Choose your preferred payment method and follow the instructions.',
    },
    {
      icon: <RiShieldCheckLine size={18} />,
      color: '#10B981',
      title: 'Creating a Virtual Account',
      desc: 'Create a virtual account to use as your payment method. Any money sent to it reflects on your dashboard (Min: ₦100).',
    },
    {
      icon: <RiCoinLine size={18} />,
      color: 'var(--color-accent)',
      title: 'SMS Costs',
      desc: 'Our SMS verification prices are cheap and affordable for all users and resellers. Get started today.',
    },
  ];

  return (
    <div className="modal-overlay" onClick={setWelcomeModalSeen}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.7rem', color: '#000' }}>BS</span>
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem' }}>
                Welcome to BamzySMS!
              </h2>
              <p style={{ color: 'var(--color-text-faint)', fontSize: '0.75rem' }}>Here&apos;s how to get started</p>
            </div>
          </div>
          <button onClick={setWelcomeModalSeen}
            style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 8, padding: 6, cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex' }}>
            <RiCloseLine size={18} />
          </button>
        </div>

        {/* Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {items.map((item) => (
            <div key={item.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: `${item.color}18`,
                border: `1px solid ${item.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: item.color,
              }}>
                {item.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 3 }}>{item.title}</div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>{item.desc}</div>
                {item.link && (
                  <a href={item.link} target="_blank" rel="noopener noreferrer"
                    style={{ color: item.color, fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none', display: 'inline-block', marginTop: 4 }}>
                    {item.linkText} →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <button onClick={setWelcomeModalSeen} className="btn-primary"
          style={{ width: '100%', padding: '13px', marginTop: 24, fontSize: '0.9rem' }}>
          Got it, let&#39;s go!
        </button>
      </div>
    </div>
  );
}
