'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAppStore from '@/store/useAppStore';

export default function DashboardLayout({ children }) {
  const { isVendor } = useAppStore();
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view') || 'profile';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const buyerLinks = [
    { view: 'profile', label: 'My Profile', icon: '👤' },
    { view: 'my_orders', label: 'My Orders', icon: '📦' },
    { view: 'saved', label: 'Saved Items', icon: '❤️' },
  ];

  const vendorLinks = [
    { view: 'vendor_overview', label: 'Store Overview', icon: '🏪' },
    { view: 'vendor_products', label: 'Products', icon: '🏷️' },
    { view: 'customer_orders', label: 'Customer Orders', icon: '🛒' },
  ];

  const SidebarContent = ({ isMobile = false }) => (
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

  return (
    <>
      <div className="tt-container" style={{ paddingTop: '2rem', paddingBottom: '4rem', display: 'flex', gap: '2rem', minHeight: '80vh' }}>
        
        {/* Desktop Sidebar Navigation */}
        <aside style={{ width: '250px', flexShrink: 0 }} className="hidden-mobile">
          <div style={{ position: 'sticky', top: 'calc(var(--tt-nav-height) + 2rem)' }}>
            <SidebarContent />
          </div>
        </aside>

        {/* Main Content Area */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {/* Mobile Trigger */}
          <div className="mobile-only" style={{ marginBottom: '1.5rem', display: 'none' }}>
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
                <SidebarContent isMobile={true} />
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
