'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Menu, Compass, Flame, LayoutGrid, LayoutDashboard } from 'lucide-react';
import useAppStore from '@/store/useAppStore';
import { pageHasOwnMobileBar } from '@/lib/feedRoutes';

function TabButton({ icon: Icon, label, href, onClick, active, badge }) {
  const content = (
    <motion.div
      whileTap={{ scale: 0.88 }}
      className={`relative flex flex-col items-center justify-center gap-[3px] w-14 h-full transition-colors ${
        active ? 'text-[var(--tt-flame-2)]' : 'text-[var(--tt-muted-2)]'
      }`}
    >
      <Icon size={20} strokeWidth={active ? 2.4 : 2} />
      <span className={`text-[0.58rem] leading-none ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
      {badge > 0 && (
        <span className="absolute top-1 right-2 w-[7px] h-[7px] rounded-full bg-[var(--tt-flame)] ring-2 ring-[var(--tt-theme)]" />
      )}
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} aria-label={label}>
        {content}
      </Link>
    );
  }
  return (
    <button onClick={onClick} aria-label={label} className="contents">
      {content}
    </button>
  );
}

/**
 * App-style bottom tab bar for the feed shell on mobile/tablet — puts the
 * two rail triggers (Menu / Widgets) within thumb reach, bracketing a raised
 * "flame" FAB that jumps back to the top of the feed.
 *
 * Self-hides on routes that render their own fixed mobile bar (e.g. the
 * product detail page's sticky Book Now CTA) so the two never stack.
 */
export default function MobileTabBar({ onOpenLeft, onOpenRight }) {
  const pathname = usePathname();
  const user = useAppStore((s) => s.user);
  const isVendor = useAppStore((s) => s.isVendor);
  const setAuthModalOpen = useAppStore((s) => s.setAuthModalOpen);

  if (pageHasOwnMobileBar(pathname)) return null;

  const dashboardHref = user ? (isVendor() ? '/dashboard' : '/dashboard?view=profile') : null;

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-[1500] flex justify-center pointer-events-none px-3"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.65rem)' }}
    >
      <div className="pointer-events-auto relative flex items-stretch justify-between w-full max-w-[400px] h-[60px] px-1 rounded-[26px] border border-[var(--tt-glass-border)] shadow-[0_10px_36px_rgba(0,0,0,0.28)]"
        style={{ background: 'var(--tt-glass-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
      >
        <TabButton icon={Menu} label="Menu" onClick={onOpenLeft} />
        <TabButton icon={Compass} label="Browse" href="/products" active={pathname?.startsWith('/products')} />

        {/* Raised center FAB — spacer keeps the flex row balanced */}
        <div className="w-14 shrink-0" aria-hidden="true" />

        <TabButton icon={LayoutGrid} label="Widgets" onClick={onOpenRight} />
        <TabButton
          icon={LayoutDashboard}
          label="Dashboard"
          href={dashboardHref ?? '/'}
          active={pathname?.startsWith('/dashboard')}
          onClick={!user ? (e) => { e?.preventDefault?.(); setAuthModalOpen(true); } : undefined}
        />

        <Link
          href="/"
          aria-label="Back to top of feed"
          className="absolute left-1/2 -translate-x-1/2 -top-[22px] w-[54px] h-[54px] rounded-full flex items-center justify-center border-[3px] border-[var(--tt-theme)]"
          style={{ background: 'var(--tt-gradient-flame)', boxShadow: '0 8px 22px rgba(255,77,0,0.5)' }}
        >
          <motion.span whileTap={{ scale: 0.85 }} className="flex items-center justify-center">
            <Flame size={24} color="#fff" strokeWidth={2.2} fill="#fff" fillOpacity={0.15} />
          </motion.span>
        </Link>
      </div>
    </nav>
  );
}
