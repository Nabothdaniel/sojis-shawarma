import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function TermsPage() {
  return (
    <main>
      <Navbar />
      <div style={{ paddingTop: 120, paddingBottom: 80, maxWidth: 800, margin: '0 auto', paddingLeft: 20, paddingRight: 20 }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 24 }}>Terms of Service</h1>
        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8 }}>
          By using BamzySMS, you agree to comply with our terms. Our virtual numbers are intended for verification purposes only. 
          Misuse of our services for illegal activities is strictly prohibited and will result in account termination.
        </p>
      </div>
      <Footer />
    </main>
  );
}
