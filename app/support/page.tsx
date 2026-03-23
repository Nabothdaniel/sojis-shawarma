import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function SupportPage() {
  return (
    <main>
      <Navbar />
      <div style={{ paddingTop: 120, paddingBottom: 80, maxWidth: 800, margin: '0 auto', paddingLeft: 20, paddingRight: 20 }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 24 }}>Support</h1>
        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8, fontSize: '1.1rem', marginBottom: 32 }}>
          Need help? Our team is available 24/7 to assist you with any issues or questions.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          <div className="stat-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 10 }}>Email Us</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: 14 }}>We respond to all emails within 24 hours.</p>
            <a href="mailto:support@bamzysms.com" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>support@bamzysms.com</a>
          </div>
          <div className="stat-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 10 }}>WhatsApp</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: 14 }}>Get instant help via our WhatsApp support.</p>
            <a href="#" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>Message on WhatsApp</a>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
