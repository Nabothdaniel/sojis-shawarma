'use client';

import React from 'react';
import { RiWallet3Line, RiShoppingCart2Line, RiMessage3Line, RiRocketLine } from 'react-icons/ri';

export default function TutorialBanner() {
  return (
    <div className="tutorial-banner" style={{
      background: 'linear-gradient(135deg, rgba(10, 11, 30, 0.4) 0%, rgba(0, 229, 255, 0.05) 100%)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(0, 229, 255, 0.15)',
      borderRadius: '24px',
      padding: '24px 32px',
      marginBottom: '32px',
      position: 'relative',
      overflow: 'hidden',
      animation: 'slideDown 0.5s ease-out'
    }}>
      {/* Decorative background pulse */}
      <div style={{
        position: 'absolute', top: '-50px', right: '-50px',
        width: 150, height: 150, borderRadius: '50%',
        background: 'var(--color-primary)', opacity: 0.05,
        filter: 'blur(50px)'
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ 
            width: 40, height: 40, borderRadius: 12, 
            background: 'var(--color-primary-dim)', color: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <RiRocketLine size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)' }}>
              Getting Started with BamzySMS
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-faint)' }}>
              Follow these simple steps to start receiving SMS online.
            </p>
          </div>
        </div>
      </div>

      <div className="tutorial-steps" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 24
      }}>
        {[
          {
            icon: <RiWallet3Line size={24} />,
            title: "1. Fund Wallet",
            desc: "Transfer funds to your virtual account to top up your balance instantly."
          },
          {
            icon: <RiShoppingCart2Line size={24} />,
            title: "2. Buy a Number",
            desc: "Select a country and service to get your dedicated disposable number."
          },
          {
            icon: <RiMessage3Line size={24} />,
            title: "3. Receive SMS",
            desc: "Use the number and wait for your OTP to appear in your Number History."
          }
        ].map((step, idx) => (
          <div key={idx} style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: 16,
            padding: '20px',
            transition: 'transform 0.3s ease, border-color 0.3s ease'
          }} className="step-card">
            <div style={{ color: 'var(--color-primary)', marginBottom: 12 }}>{step.icon}</div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: 700 }}>{step.title}</h4>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              {step.desc}
            </p>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .step-card:hover {
          transform: translateY(-5px);
          border-color: var(--color-primary-glow) !important;
          background: rgba(255, 255, 255, 0.04) !important;
        }
        @media (max-width: 600px) {
          .tutorial-steps { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
