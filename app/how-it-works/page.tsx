import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function HowItWorks() {
  return (
    <main>
      <Navbar />
      <div style={{ paddingTop: 120, paddingBottom: 80, maxWidth: 800, margin: '0 auto', paddingLeft: 20, paddingRight: 20 }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 24 }}>How It Works</h1>
        <div style={{ display: 'grid', gap: 32, marginTop: 40 }}>
          {[
            { step: 1, title: 'Create an Account', desc: 'Sign up for a free BamzySMS account in seconds.' },
            { step: 2, title: 'Fund Your Wallet', desc: 'Add credits to your wallet using our secure payment methods.' },
            { step: 3, title: 'Choose a Service', desc: 'Select the country and service (WhatsApp, Telegram, etc.) you need.' },
            { step: 4, title: 'Get Your Number', desc: 'Receive your virtual number and get your OTP instantly.' },
          ].map((s) => (
            <div key={s.step} style={{ display: 'flex', gap: 20 }}>
              <div style={{ 
                width: 40, height: 40, borderRadius: '50%', background: 'var(--color-primary)', 
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                fontWeight: 700, flexShrink: 0 
              }}>
                {s.step}
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </main>
  );
}
