'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/ui/Logo';
import { useAppStore } from '@/store/appStore';
import { RiMenu3Line, RiCloseLine } from 'react-icons/ri';

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Support', href: '#support' },
];

export default function Navbar() {
  const { mobileMenuOpen, toggleMobileMenu, setMobileMenuOpen, activeSection } = useAppStore();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => { if (window.innerWidth > 768) setMobileMenuOpen(false); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setMobileMenuOpen]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) target.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          transition: 'all 0.3s ease',
          background: scrolled ? 'rgba(8,12,20,0.92)' : 'transparent',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          borderBottom: scrolled ? '1px solid var(--color-border)' : '1px solid transparent',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '0 24px',
            height: 72,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Logo size="md" />
          </Link>

          {/* Desktop nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 40 }} className="desktop-nav">
            {NAV_LINKS.map((link) => {
              const sectionId = link.href.replace('#', '');
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`nav-link ${activeSection === sectionId ? 'active' : ''}`}
                >
                  {link.label}
                </a>
              );
            })}
          </div>

          {/* Desktop CTA */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }} className="desktop-nav">
            <a href="#signup" onClick={(e) => handleNavClick(e, '#signup')} style={{ textDecoration: 'none' }}>
              <button className="btn-ghost" style={{ padding: '10px 20px', fontSize: '0.875rem' }}>
                Log In
              </button>
            </a>
            <a href="#signup" onClick={(e) => handleNavClick(e, '#signup')} style={{ textDecoration: 'none' }}>
              <button className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.875rem' }}>
                Sign Up Free
              </button>
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className="mobile-menu-btn"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
            style={{
              background: 'none',
              border: '1px solid var(--color-border)',
              borderRadius: 10,
              padding: '8px',
              cursor: 'pointer',
              color: 'var(--color-text)',
              display: 'none',
            }}
          >
            {mobileMenuOpen ? <RiCloseLine size={22} /> : <RiMenu3Line size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div
            style={{
              background: 'rgba(8,12,20,0.97)',
              backdropFilter: 'blur(20px)',
              borderTop: '1px solid var(--color-border)',
              padding: '20px 24px 28px',
              animation: 'fadeUp 0.25s ease',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  style={{
                    display: 'block',
                    padding: '13px 16px',
                    borderRadius: 10,
                    color: 'var(--color-text-muted)',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = 'var(--color-text)';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = 'var(--color-text-muted)';
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                >
                  {link.label}
                </a>
              ))}
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button className="btn-ghost" style={{ padding: '13px', width: '100%', fontSize: '0.9rem' }}>
                  Log In
                </button>
                <button className="btn-primary" style={{ padding: '13px', width: '100%', fontSize: '0.9rem' }}>
                  Sign Up Free
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}
