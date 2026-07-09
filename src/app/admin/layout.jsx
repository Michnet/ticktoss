'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import useAppStore from '@/store/useAppStore';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { isAdmin } from '@/lib/roles';
import { Menu, X } from 'lucide-react';

function AdminSidebar() {
  const { user, clearAuth } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const supabase = getSupabaseBrowserClient();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname, searchParams]);

  const links = [
    { href: '/admin', label: 'Dashboard Overview' },
    { href: '/admin?view=vendor-applications', label: 'Vendor Applications' },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearAuth();
    router.push('/login');
  };

  const currentView = searchParams.get('view');

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button 
        className="lg:hidden absolute top-0 right-4 z-20 p-2 bg-[var(--tt-surface)] rounded-md border border-[var(--tt-border)]"
        onClick={() => setIsMobileMenuOpen(true)}
      >
        <Menu size={24} color="var(--tt-text)" />
      </button>

      {/* Offcanvas Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside 
        className={`fixed lg:sticky top-0 lg:top-[var(--tt-nav-height)] left-0 h-full lg:h-auto w-[280px] lg:w-[240px] z-50 lg:z-0 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 bg-[var(--tt-bg)] lg:bg-transparent shadow-2xl lg:shadow-none border-r border-[var(--tt-border)] lg:border-none`}
      >
        <div className="tt-card tt-glass lg:p-[1.5rem] p-6 h-full lg:h-auto overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 style={{ fontFamily: 'Syne', fontSize: '1.2rem', color: 'var(--tt-gold)' }}>
              Admin Center
            </h2>
            <button className="lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
              <X size={24} color="var(--tt-text)" />
            </button>
          </div>
          
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {links.map(link => {
              const isQueryMatch = link.href.includes('?view=') ? currentView === link.href.split('?view=')[1] : !currentView;
              const isActive = pathname === '/admin' && isQueryMatch;
              
              return (
                <Link 
                  key={link.href} 
                  href={link.href}
                  style={{
                    display: 'block',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--tt-radius-sm)',
                    background: isActive ? 'rgba(255,184,0,0.1)' : 'transparent',
                    color: isActive ? 'var(--tt-gold)' : 'var(--tt-muted-2)',
                    fontWeight: isActive ? 600 : 500,
                    transition: 'all 0.2s',
                    borderLeft: isActive ? '3px solid var(--tt-gold)' : '3px solid transparent',
                    textDecoration: 'none'
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
            
            <button
              onClick={handleLogout}
              style={{
                display: 'block',
                width: '100%',
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
            <p style={{ fontSize: '0.8rem', color: 'var(--tt-muted)' }}>Administrator</p>
            <p style={{ fontWeight: 600, color: 'var(--tt-text)', wordBreak: 'break-all' }}>{user?.email}</p>
          </div>
        </div>
      </aside>
    </>
  );
}

export default function AdminDashboardLayout({ children }) {
  const { user, profile, isAuthLoading } = useAppStore();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (isAuthLoading) return; // Wait for AuthProvider to finish initializing

    if (user === null) {
      router.push('/login?redirectTo=/admin');
      return;
    }
    
    if (user !== undefined) {
      if (isAdmin(user)) {
        setIsAuthorized(true);
      } else {
        router.push('/');
      }
    }
  }, [user, isAuthLoading, router]);

  if (isAuthLoading || !isAuthorized) {
    return (
      <div className="tt-container" style={{ padding: '4rem', textAlign: 'center' }}>
        <div className="tt-skeleton" style={{ height: '200px', maxWidth: '400px', margin: '0 auto' }} />
      </div>
    );
  }

  return (
    <div className="tt-container relative" style={{ padding: '2rem 1.5rem', display: 'flex', gap: '2rem', minHeight: '80vh' }}>
      <Suspense fallback={<div className="w-[280px] lg:w-[240px] tt-skeleton h-full" />}>
        <AdminSidebar />
      </Suspense>
      <main style={{ flex: 1, minWidth: '0' }} className="pt-10 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
