'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import useAppStore from '@/store/useAppStore';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function VendorDashboardLayout({ children }) {
  const { user, profile, clearAuth, isAuthLoading } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    if (isAuthLoading) return; // Wait for AuthProvider to finish

    // Only check once profile is loaded
    if (user === null) {
      router.push('/login?redirectTo=/vendor');
      return;
    }
    
    if (profile !== undefined) {
      if (profile?.roles?.includes('vendor')) {
        setIsAuthorized(true);
      } else {
        router.push('/apply-vendor');
      }
    }
  }, [user, profile, isAuthLoading, router]);

  if (isAuthLoading || !isAuthorized) {
    return (
      <div className="tt-container" style={{ padding: '4rem', textAlign: 'center' }}>
        <div className="tt-skeleton" style={{ height: '200px', maxWidth: '400px', margin: '0 auto' }} />
      </div>
    );
  }

  const links = [
    { href: '/vendor', label: 'Dashboard' },
    { href: '/vendor/products', label: 'My Products' },
    { href: '/vendor/products/new', label: 'Post a Deal' },
    { href: '/vendor/orders', label: 'Orders & Bookings' },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearAuth();
    router.push('/login');
  };

  return (
    <div className="tt-container" style={{ padding: '2rem 1.5rem', display: 'flex', gap: '2rem', flexWrap: 'wrap', minHeight: '80vh' }}>
      
      {/* Sidebar Navigation */}
      <aside style={{ flex: '0 0 240px', width: '100%' }}>
        <div className="tt-card tt-glass" style={{ padding: '1.5rem', position: 'sticky', top: 'var(--tt-nav-height)' }}>
          <h2 style={{ fontFamily: 'Syne', fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--tt-gold)' }}>
            Vendor Center
          </h2>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {links.map(link => {
              const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/vendor');
              return (
                <Link 
                  key={link.href} 
                  href={link.href}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--tt-radius-sm)',
                    background: isActive ? 'rgba(255,184,0,0.1)' : 'transparent',
                    color: isActive ? 'var(--tt-gold)' : 'var(--tt-muted-2)',
                    fontWeight: isActive ? 600 : 500,
                    transition: 'all 0.2s',
                    borderLeft: isActive ? '3px solid var(--tt-gold)' : '3px solid transparent',
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
            
            <button
              onClick={handleLogout}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--tt-radius-sm)',
                background: 'transparent',
                color: 'var(--tt-danger)',
                fontWeight: 500,
                textAlign: 'left',
                border: 'none',
                borderLeft: '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginTop: '1rem',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255,45,85,0.1)';
                e.target.style.borderLeft = '3px solid var(--tt-danger)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.borderLeft = '3px solid transparent';
              }}
            >
              Log Out
            </button>
          </nav>

          <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--tt-border)' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--tt-muted)' }}>Business Profile</p>
            <p style={{ fontWeight: 600, color: 'var(--tt-text)' }}>{profile?.display_name}</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, minWidth: '0' }}>
        {children}
      </main>
      
    </div>
  );
}
