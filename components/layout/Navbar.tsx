'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/ui/Logo';
import { useAppStore } from '@/store/appStore';
import { RiMenu3Line, RiCloseLine } from 'react-icons/ri';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Support', href: '/support' },
];

export default function Navbar() {
  const { mobileMenuOpen, toggleMobileMenu, setMobileMenuOpen, activeSection } = useAppStore();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => { if (window.innerWidth > 768) setMobileMenuOpen(false); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setMobileMenuOpen]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        transition: 'all 0.3s ease',
        background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--color-border)' : '1px solid transparent',
        boxShadow: scrolled ? '0 1px 8px rgba(0,0,0,0.06)' : 'none',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 24px',
          height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Logo size="md" />
          </Link>

          {/* Desktop nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 36 }} className="desk-nav">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href}
                className={`nav-link ${activeSection === link.href.replace('/', '') ? 'active' : ''}`}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }} className="desk-nav">
            <Link href="/login" style={{ textDecoration: 'none' }}>
              <button className="btn-ghost" style={{ padding: '9px 20px', fontSize: '0.875rem' }}>Log In</button>
            </Link>
            <Link href="/register" style={{ textDecoration: 'none' }}>
              <button className="btn-primary" style={{ padding: '9px 20px', fontSize: '0.875rem' }}>Sign Up Free</button>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button onClick={toggleMobileMenu} aria-label="Toggle menu"
            className="mob-menu-btn"
            style={{
              background: 'none', border: '1px solid var(--color-border)',
              borderRadius: 10, padding: '8px', cursor: 'pointer',
              color: 'var(--color-text)', display: 'none',
            }}>
            {mobileMenuOpen ? <RiCloseLine size={22} /> : <RiMenu3Line size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div style={{
            background: '#fff', borderTop: '1px solid var(--color-border)',
            padding: '16px 20px 24px', animation: 'fadeUp 0.2s ease',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href}
                  onClick={(e) => handleNavClick(e as any, link.href)}
                  style={{
                    display: 'block', padding: '12px 14px', borderRadius: 10,
                    color: 'var(--color-text-muted)', fontWeight: 500,
                    fontSize: '0.95rem', textDecoration: 'none', transition: 'all 0.2s',
                  }}>
                  {link.label}
                </Link>
              ))}
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link href="/login" style={{ textDecoration: 'none' }} onClick={() => setMobileMenuOpen(false)}>
                  <button className="btn-ghost" style={{ padding: '12px', width: '100%', fontSize: '0.9rem' }}>Log In</button>
                </Link>
                <Link href="/register" style={{ textDecoration: 'none' }} onClick={() => setMobileMenuOpen(false)}>
                  <button className="btn-primary" style={{ padding: '12px', width: '100%', fontSize: '0.9rem' }}>Sign Up Free</button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .desk-nav { display: none !important; }
          .mob-menu-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}
