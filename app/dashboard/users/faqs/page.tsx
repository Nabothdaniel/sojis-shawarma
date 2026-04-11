'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Topbar from '@/components/dashboard/Topbar';
import { RiArrowDownSLine } from 'react-icons/ri';

const FAQS = [
  { q: 'What is the SMS verification service?', a: 'BamzySMS provides virtual phone numbers that you can use to receive one-time passwords (OTPs) for registration and verification on popular platforms without revealing your real phone number.' },
  { q: 'What is a virtual number?', a: 'A virtual number is a temporary phone number that can receive SMS messages. It\'s not tied to a physical SIM card, making it perfect for one-time verifications while keeping your real number private.' },
  { q: 'Do I need a SIM card to use your virtual number?', a: 'No. Virtual numbers work entirely online. You simply purchase a number from our dashboard, use it to receive your OTP, and the process is complete — no SIM card required.' },
  { q: 'Will someone have access to my number after my rent is up?', a: 'No. Once your rental period expires, the number is deactivated. No one else can receive messages on that number and your OTP history is not stored on our platform.' },
  { q: 'What does it mean to receive SMS from a website online?', a: 'When you register on a platform like Telegram or Instagram using a virtual number, the platform sends an OTP to that number. Our system intercepts that SMS and displays it in your dashboard for you to use.' },
  { q: 'What do I do if I can\'t buy a virtual number?', a: 'Ensure your wallet balance is sufficient. If the issue persists, contact our support team via WhatsApp or Telegram for immediate assistance.' },
  { q: 'How long does a virtual number stay active?', a: 'Numbers are typically active for 15–30 minutes after purchase — enough time to receive one OTP. Once the OTP is received or time expires, the number is deactivated.' },
  { q: 'Can I reuse a virtual number?', a: 'No. Each number is single-use only. If you need to verify another account, you will need to purchase a new number.' },
];

export default function FAQsPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <DashboardLayout>
      <Topbar title="FAQs" />
      <main style={{ padding: '28px', maxWidth: 760 }}>
        <div className="breadcrumb">
          <Link href="/dashboard">Dashboard</Link>
          <span>/</span>
          <span>FAQs</span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.4rem', marginBottom: 24 }}>
          Frequently Asked <span className="gradient-text">Questions</span>
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FAQS.map((faq, i) => (
            <div key={i} className={`accordion-item ${open === i ? 'open' : ''}`}>
              <button
                className="accordion-trigger"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span style={{ color: open === i ? 'var(--color-primary)' : 'var(--color-text)', fontWeight: open === i ? 600 : 500, paddingRight: 16 }}>
                  {faq.q}
                </span>
                <RiArrowDownSLine
                  size={18}
                  color={open === i ? 'var(--color-primary)' : 'var(--color-text-faint)'}
                  style={{ transform: open === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s', flexShrink: 0 }}
                />
              </button>
              {open === i && (
                <div className="accordion-content">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </main>
    </DashboardLayout>
  );
}
