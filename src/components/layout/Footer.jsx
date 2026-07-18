'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer
    className='px-3'
      style={{
        background: 'var(--tt-surface)',
        borderTop: '1px solid var(--tt-border)',
        padding: '1rem 0 2rem',
      }}
    >
      <div className="tt-container tt-container-padding">
        <div className='px-3'
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2rem',
            marginBottom: '1rem',
          }}
        >
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.2rem' }}>⚡</span>
              <span
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 800,
                  fontSize: '1.2rem',
                  background: 'var(--tt-gradient-flame)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                TickToss
              </span>
            </div>
            <p className='max-w-sm' style={{ color: 'var(--tt-muted)', fontSize: '0.85rem' }}>
              Uganda&apos;s urgency marketplace. Every deal has a clock. Don&apos;t let it run out.
            </p>
          </div>

          {/* Browse */}
          <div>
            <h4 style={{ color: 'var(--tt-muted-2)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
              Browse
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { href: '/products', label: 'All Products' },
                { href: '/near-me', label: 'Near Me' },
                { href: '/categories', label: 'Categories' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} style={{ color: 'var(--tt-muted)', fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--tt-text)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--tt-muted)')}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Vendors */}
          <div>
            <h4 style={{ color: 'var(--tt-muted-2)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
              Vendors
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { href: '/apply-vendor', label: 'Become a Vendor' },
                { href: '/dashboard', label: 'Vendor Dashboard' },
                { href: '/dashboard?view=add_single', label: 'List a Product' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} style={{ color: 'var(--tt-muted)', fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--tt-text)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--tt-muted)')}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 style={{ color: 'var(--tt-muted-2)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
              Account
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { href: '/login', label: 'Sign In' },
                { href: '/register', label: 'Create Account' },
                { href: '/dashboard?view=my_orders', label: 'My Orders' },
                { href: '/dashboard?view=my_cart', label: 'My Cart' },
                { href: '/dashboard?view=saved', label: 'Saved Items' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} style={{ color: 'var(--tt-muted)', fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--tt-text)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--tt-muted)')}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <hr className="tt-divider" />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1.5rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <p style={{ color: 'var(--tt-muted)', fontSize: '0.8rem' }}>
            © {new Date().getFullYear()} TickToss. All rights reserved.
          </p>
          <p style={{ color: 'var(--tt-muted)', fontSize: '0.8rem' }}>
            🇺🇬 Made for Uganda
          </p>
        </div>
      </div>
    </footer>
  );
}
