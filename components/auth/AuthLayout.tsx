'use client';

import React from 'react';
import Link from 'next/link';
import { RiArrowLeftLine } from 'react-icons/ri';
import AuthCarousel from './AuthCarousel';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="auth-split-wrapper">
      <div className="auth-form-side">
        <Link href="/" className="go-back-btn">
          <RiArrowLeftLine size={18} /> Back to home
        </Link>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {children}
        </div>
      </div>
      <AuthCarousel />
    </div>
  );
}
