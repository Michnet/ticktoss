'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import useAppStore from '@/store/useAppStore';
import ThemeToggle from '@/components/ui/ThemeToggle';
import AuthForm from '@/components/auth/AuthForm';
import CartIcon from '@/components/cart/CartIcon';
import { useNotifications } from '@/hooks/useNotifications';

const NAV_LINKS = [
  { href: '/products',   label: 'Browse' },
  { href: '/near-me',    label: 'Near Me' },
  { href: '/categories', label: 'Categories' },
];

export default function Navbar({ variant = 'solid' }) {
  const isTransparent = variant === 'transparent';
  const { user, profile, isVendor, clearAuth, authModalOpen: storeAuthModalOpen, setAuthModalOpen: setStoreAuthModalOpen } = useAppStore();
  const [mobileOpen, setMobileOpen]       = useState(false);
  const [userMenuOpen, setUserMenuOpen]   = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [scrolled, setScrolled]           = useState(false);

  const { unreadCount } = useNotifications(user?.id ?? null);

  // Open the local auth modal when another component (e.g. WatchlistButton) sets the store flag
  useEffect(() => {
    if (storeAuthModalOpen) {
      setAuthModalMode('login');
      setAuthModalOpen(true);
      setStoreAuthModalOpen(false); // reset the store flag immediately
    }
  }, [storeAuthModalOpen, setStoreAuthModalOpen]);

  // Toggle 'heady' class after 50px of vertical scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  let userView = null;

  const handleLogout = async () => {
    try {
      await fetch('/api/auth?intent=sign_out', { method: 'POST' });
      clearAuth();
      setUserMenuOpen(false);
      window.location.href = '/';
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  if(user){
    userView = <>
                {/* {isVendor() && (
                  <Link href="/dashboard" className="tt-btn tt-btn-ghost hidden-mobile" style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}>
                    Dashboard
                  </Link>
                )} */}
                <Link href="/dashboard" className="tt-btn tt-btn-ghost hidden-mobile" style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}>
                  Dashboard
                </Link>
                <button
                  onClick={() => setUserMenuOpen(true)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                  }}
                >
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
                    }}
                  >
                    {user?.email?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                </button>
              </>
            
          }else{
            userView = <>
                <button 
                  onClick={() => { setAuthModalMode('login'); setAuthModalOpen(true); }}
                  className="tt-btn tt-btn-ghost hidden-mobile" 
                  style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
                >
                  Sign In
                </button>
                <button 
                  onClick={() => { setAuthModalMode('register'); setAuthModalOpen(true); }}
                  className="tt-btn tt-btn-primary tt-shimmer hidden-mobile" 
                  style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
                >
                  Get Started
                </button>
                <button 
                  onClick={() => { setAuthModalMode('login'); setAuthModalOpen(true); }}
                  className="mobile-only" 
                  style={{ background: 'transparent', border: 'none', padding: '0.5rem', color: 'var(--tt-text)', cursor: 'pointer' }}
                  aria-label="Sign In"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </button>
              </>
            }

  return (
  <>
      <header
        className={`w-full md:shadow h-[var(--tt-nav-height)] ${isTransparent ? `transparent ${scrolled ? '' : 'relative'}` : 'bg-[var(--tt-theme)]'} ${scrolled ? 'heady bg-[var(--tt-theme)]' : ''}`}
        style={{
          zIndex: 1000,
        }}
      >
      <div
        className="tt-container tt-container-padding h-full flex items-center gap-6"
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
          <span className="hidden sm:block font-['Syne',sans-serif] font-extrabold text-[1.2rem] bg-[image:var(--tt-gradient-flame)] flex-1 text-transparent bg-clip-text text-ellipsis overflow-hidden whitespace-nowrap"
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
          <CartIcon />

          {/* Notifications bell */}
          <Link
            href="/notifications"
            style={{ position: 'relative', display: 'flex', alignItems: 'center', color: 'var(--tt-text)', padding: '0.25rem' }}
            title="Notifications"
          >
            <Bell size={20} strokeWidth={2} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-4px',
                minWidth: '16px',
                height: '16px',
                borderRadius: '8px',
                background: 'var(--tt-flame)',
                color: '#fff',
                fontSize: '0.6rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 3px',
                lineHeight: 1,
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {userView}
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

     
    </header>

     {/* Auth Modal */}
      <AnimatePresence>
        {authModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAuthModalOpen(false)}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{ position: 'relative', width: '100%', maxWidth: '440px', zIndex: 3001 }}
            >
              <button
                onClick={() => setAuthModalOpen(false)}
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--tt-surface)', border: '1px solid var(--tt-border)', color: 'var(--tt-text)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
              >
                ✕
              </button>
              <AuthForm 
                defaultMode={authModalMode} 
                onSuccess={() => setAuthModalOpen(false)} 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

     {/* User Offcanvas Menu */}
      <AnimatePresence>
        {userMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setUserMenuOpen(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)',
                zIndex: 2000,
              }}
            />
            {/* Offcanvas Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                maxWidth: '320px',
                background: 'var(--tt-surface)',
                borderLeft: '1px solid var(--tt-border)',
                zIndex: 2001,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
              }}
            >
              {/* Header */}
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--tt-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'var(--tt-gradient-flame)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: '#fff',
                    }}
                  >
                    {user?.email?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--tt-text)' }}>
                      {profile?.display_name || profile?.first_name || 'User'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--tt-muted)' }}>
                      {user?.email}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setUserMenuOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--tt-muted)',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    fontSize: '1.25rem',
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Navigation Links */}
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                <Link
                  href="/dashboard?view=profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="tt-btn tt-btn-ghost"
                  style={{ justifyContent: 'flex-start', width: '100%' }}
                >
                  👤 My Profile
                </Link>
                <Link
                  href="/dashboard?view=my_orders"
                  onClick={() => setUserMenuOpen(false)}
                  className="tt-btn tt-btn-ghost"
                  style={{ justifyContent: 'flex-start', width: '100%' }}
                >
                  📦 My Bookings
                </Link>
                
                {isVendor() && (
                  <Link
                    href="/dashboard"
                    onClick={() => setUserMenuOpen(false)}
                    className="tt-btn tt-btn-ghost"
                    style={{ justifyContent: 'flex-start', width: '100%', color: 'var(--tt-brand)' }}
                  >
                    🏪 My Store / Dashboard
                  </Link>
                )}

                <div style={{ height: '1px', background: 'var(--tt-border)', margin: '1rem 0' }} />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--tt-text)', fontWeight: 500 }}>Theme</span>
                  <ThemeToggle />
                </div>
              </div>

              {/* Footer / Logout */}
              <div style={{ padding: '1.5rem', borderTop: '1px solid var(--tt-border)' }}>
                <button
                  onClick={handleLogout}
                  className="tt-btn"
                  style={{ width: '100%', background: 'rgba(255,45,85,0.1)', color: 'var(--tt-danger)', border: '1px solid rgba(255,45,85,0.2)' }}
                >
                  Log Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .mobile-only { display: flex !important; }
        }
      `}</style>
    </>
  );
}

