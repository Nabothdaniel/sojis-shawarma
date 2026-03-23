import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function RefundPage() {
  return (
    <main>
      <Navbar />
      <div style={{ paddingTop: 120, paddingBottom: 80, maxWidth: 800, margin: '0 auto', paddingLeft: 20, paddingRight: 20 }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 24 }}>Refund Policy</h1>
        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8 }}>
          We offer refunds only if a number fails to receive an OTP within the specified timeframe. 
          Once an OTP is received, the transaction is considered complete and non-refundable. 
          Please contact support for any refund requests.
        </p>
      </div>
      <Footer />
    </main>
  );
}
