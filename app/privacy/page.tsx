import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function PrivacyPage() {
  return (
    <main>
      <Navbar />
      <div style={{ paddingTop: 120, paddingBottom: 80, maxWidth: 800, margin: '0 auto', paddingLeft: 20, paddingRight: 20 }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 24 }}>Privacy Policy</h1>
        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8, marginBottom: 20 }}>
          At BamzySMS, we take your privacy seriously. This policy outlines how we collect, use, and protect your information.
        </p>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: 32, marginBottom: 16 }}>Information We Collect</h2>
        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8 }}>
          We only collect information necessary to provide our services, such as your username, optional profile details,
          and transaction history for support purposes. We do not sell your data to third parties.
        </p>
      </div>
      <Footer />
    </main>
  );
}
