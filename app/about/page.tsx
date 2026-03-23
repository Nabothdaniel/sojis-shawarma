import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function AboutPage() {
  return (
    <main>
      <Navbar />
      <div style={{ paddingTop: 120, paddingBottom: 80, maxWidth: 800, margin: '0 auto', paddingLeft: 20, paddingRight: 20 }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 24 }}>About BamzySMS</h1>
        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8, fontSize: '1.1rem', marginBottom: 20 }}>
          BamzySMS is Nigeria&apos;s leading provider of virtual phone numbers for instant OTP verification. 
          Our mission is to provide secure, reliable, and affordable verification solutions for individuals and businesses.
        </p>
        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8, fontSize: '1.1rem' }}>
          We understand the need for privacy in today&apos;s digital world. Whether you&apos;re verifying a social media account 
          or setting up a professional service, BamzySMS provides the numbers you need to get the job done instantly.
        </p>
      </div>
      <Footer />
    </main>
  );
}
