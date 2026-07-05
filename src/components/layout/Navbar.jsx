'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAppStore from '@/store/useAppStore';
import ThemeToggle from '@/components/ui/ThemeToggle';

const NAV_LINKS = [
  { href: '/products',   label: 'Browse' },
  { href: '/near-me',    label: 'Near Me' },
  { href: '/categories', label: 'Categories' },
];

export default function Navbar() {
  const { user, isVendor } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          height: 'var(--tt-nav-height)',
          background: 'var(--tt-nav-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--tt-border)',
      }}
    >
      <div
        className="tt-container h-full flex items-center gap-6"
      >
        {/* Logo */}
        <Link
          href="/"
          className='flex flex-1 items-center gap-2 text-decoration-none shrink-0'
        >
          <span
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[image:var(--tt-gradient-flame)] text-[1rem] shrink-0"
          >
            🔥
          </span>
          <span className="font-['Syne',sans-serif] font-extrabold text-[1.2rem] bg-[image:var(--tt-gradient-flame)] flex-1 text-transparent bg-clip-text text-ellipsis overflow-hidden whitespace-nowrap"
          >
            TickToss
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav style={{ display: 'flex', gap: '0.25rem', flex: 1 }} className="hidden-mobile">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className='whitespace-nowrap text-ellipsis overflow-hidden'
              style={{
                color: 'var(--tt-muted-2)',
                fontSize: '0.9rem',
                fontWeight: 500,
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--tt-radius-sm)',
                transition: 'color 0.2s, background 0.2s',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--tt-text)';
                e.currentTarget.style.background = 'var(--tt-surface)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--tt-muted-2)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Right actions */}
        <div className='shrink-0' style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="hidden-mobile" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {user ? (
              <>
                {isVendor() && (
                  <Link href="/vendor" className="tt-btn tt-btn-ghost" style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}>
                    Dashboard
                  </Link>
                )}
                <Link href="/buyer/bookings" className="tt-btn tt-btn-ghost" style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}>
                  My Bookings
                </Link>
                <Link href="/settings">
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      background: 'var(--tt-gradient-flame)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    {user?.email?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="tt-btn tt-btn-ghost" style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}>
                  Sign In
                </Link>
                <Link href="/register" className="tt-btn tt-btn-primary tt-shimmer" style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}>
                  Get Started
                </Link>
              </>
            )}
          </div>

          <ThemeToggle />

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="mobile-only"
            aria-label="Toggle menu"
            style={{
              background: 'none',
              border: '1px solid var(--tt-border)',
              borderRadius: 'var(--tt-radius-sm)',
              color: 'var(--tt-text)',
              cursor: 'pointer',
              padding: '0.35rem 0.5rem',
              display: 'none',
            }}
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{
              overflow: 'hidden',
              background: 'var(--tt-surface)',
              borderBottom: '1px solid var(--tt-border)',
            }}
            className='shrink-0'
          >
            <nav style={{ display: 'flex', flexDirection: 'column', padding: '1rem', gap: '0.25rem' }}>
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  style={{ color: 'var(--tt-text)', padding: '0.6rem 0.75rem', fontSize: '1rem', borderRadius: 'var(--tt-radius-sm)' }}
                  className= 'whitespace-nowrap text-ellipsis overflow-hidden'
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .mobile-only { display: flex !important; }
        }
      `}</style>
    </header>
  );
}
