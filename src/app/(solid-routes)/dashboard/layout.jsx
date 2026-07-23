'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAppStore from '@/store/useAppStore';
import AuthForm from '@/components/auth/AuthForm';

export default function DashboardLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthLoading } = useAppStore();

  const buyerLinks = [
    { view: 'profile', label: 'My Profile', icon: '👤' },
    { view: 'my_orders', label: 'My Orders', icon: '📦' },
    { view: 'saved', label: 'Saved Items', icon: '❤️' },
  ];

  const vendorLinks = [
    { view: 'vendor_overview', label: 'Store Overview', icon: '🏪' },
    { view: 'vendor_stores', label: 'My Stores', icon: '🏬' },
    { view: 'vendor_products', label: 'Products', icon: '🏷️' },
    { view: 'vendor_orders', label: 'Orders & Bookings', icon: '📥' },
  ];

  const SidebarContent = ({ isMobile = false }) => {
    const { isVendor } = useAppStore();
    const searchParams = useSearchParams();
    const currentView = searchParams.get('view') || 'profile';

    return (
      <>
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--tt-muted)', marginBottom: '1rem', fontWeight: 700 }}>
            My Account
          </h3>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {buyerLinks.map(link => {
              const isActive = currentView === link.view;
              return (
                <Link
                  key={link.view}
                  href={`/dashboard?view=${link.view}`}
                  onClick={() => isMobile && setMobileMenuOpen(false)}
                  className={`tt-btn ${isActive ? '' : 'tt-btn-ghost'}`}
                  style={{ 
                    justifyContent: 'flex-start', 
                    background: isActive ? 'var(--tt-surface)' : 'transparent',
                    color: isActive ? 'var(--tt-text)' : 'var(--tt-muted-2)',
                    border: isActive ? '1px solid var(--tt-border)' : '1px solid transparent'
                  }}
                >
                  <span style={{ width: '20px', textAlign: 'center', marginRight: '0.5rem' }}>{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {isVendor() && (
          <div>
            <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--tt-brand)', marginBottom: '1rem', fontWeight: 700 }}>
              My Store
            </h3>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {vendorLinks.map(link => {
                const isActive = currentView === link.view;
                return (
                  <Link
                    key={link.view}
                    href={`/dashboard?view=${link.view}`}
                    onClick={() => isMobile && setMobileMenuOpen(false)}
                    className={`tt-btn ${isActive ? '' : 'tt-btn-ghost'}`}
                    style={{ 
                      justifyContent: 'flex-start', 
                      background: isActive ? 'var(--tt-surface)' : 'transparent',
                      color: isActive ? 'var(--tt-brand)' : 'var(--tt-muted-2)',
                      border: isActive ? '1px solid var(--tt-border)' : '1px solid transparent'
                    }}
                  >
                    <span style={{ width: '20px', textAlign: 'center', marginRight: '0.5rem' }}>{link.icon}</span>
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </>
    );
  };

  if (isAuthLoading) {
    return (
      <div className="tt-container tt-container-padding" style={{ padding: '4rem', textAlign: 'center' }}>
        <div className="tt-skeleton" style={{ height: '200px', maxWidth: '400px', margin: '0 auto' }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: '3rem 1rem' }}>
        <AuthForm redirectTo="/dashboard" />
      </div>
    );
  }

  return (
    <>
      <div className='min-h-[inherit]' style={{display: 'flex', gap: '1rem'}}>

        {/* Desktop Sidebar Navigation */}
        <aside style={{ width: '250px', flexShrink: 0 }} className="hidden-mobile bg-[var(--tt-surface-2)] px-4">
          <div style={{ position: 'sticky', top: 'calc(var(--tt-nav-height) + 2rem)' }}>
            <Suspense fallback={<div className="tt-skeleton h-[300px] w-full" />}>
              <SidebarContent />
            </Suspense>
          </div>
        </aside>

        {/* Main Content Area */}
        <main style={{ flex: 1, minWidth: 0 }} className='p-3 sm:p-5'>
          {/* Mobile Trigger */}
          <div className="mobile-only" style={{ marginBottom: '0.5rem', display: 'none' }}>
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="tt-btn tt-btn-ghost"
              style={{ width: '100%', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--tt-surface)' }}
            >
              <span style={{ fontWeight: 600, color: 'var(--tt-text)' }}>Dashboard Menu</span>
              <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>☰</span>
            </button>
          </div>

          {children}
        </main>
      </div>

      {/* Mobile Offcanvas Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
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
            
            {/* Offcanvas Panel (Slides from left) */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                bottom: 0,
                width: '100%',
                maxWidth: '280px',
                background: 'var(--tt-surface)',
                borderRight: '1px solid var(--tt-border)',
                zIndex: 2001,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '4px 0 24px rgba(0,0,0,0.1)',
                overflowY: 'auto'
              }}
            >
              {/* Header */}
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--tt-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--tt-surface)', zIndex: 10 }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--tt-text)' }}>Dashboard</h2>
                <button
                  onClick={() => setMobileMenuOpen(false)}
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
              <div style={{ padding: '1.5rem', flex: 1 }}>
                <Suspense fallback={<div className="tt-skeleton h-[300px] w-full" />}>
                  <SidebarContent isMobile={true} />
                </Suspense>
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
