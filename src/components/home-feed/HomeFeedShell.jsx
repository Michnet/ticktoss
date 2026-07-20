'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import MobileTabBar from './MobileTabBar';
import { pageHasOwnMobileBar } from '@/lib/feedRoutes';

/**
 * Facebook-style 3-column shell: fixed left rail (nav/shortcuts), a centered
 * scrolling feed, and a fixed right rail (widgets). Below `lg` both rails
 * collapse into off-canvas drawers triggered by the floating bottom tab bar.
 */
export default function HomeFeedShell({ leftNav, rightRail, children }) {
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const pathname = usePathname();

  // Routes like /products/[slug] render their own fixed mobile CTA bar —
  // no floating tab bar there, so no extra bottom clearance either.
  const showMobileTabBar = !pageHasOwnMobileBar(pathname);

  // Close drawers on route-level escape, and prevent body scroll while open
  useEffect(() => {
    const anyOpen = leftOpen || rightOpen;
    document.body.style.overflow = anyOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [leftOpen, rightOpen]);

  return (
    <div className="relative">
      <div className={`tt-container-padding grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_300px] gap-5 py-4 lg:pb-4 items-start ${showMobileTabBar ? 'pb-28' : 'pb-4'}`}>
        {/* Left rail — desktop only */}
        <aside
          className="hidden lg:block sticky bg-[var(--tt-theme)] self-start overflow-y-auto no-scrollbar"
          style={{ top: 'calc(var(--tt-nav-height) + 1rem)', maxHeight: 'calc(100vh - var(--tt-nav-height) - 2rem)' }}
        >
          {leftNav}
        </aside>

        {/* Center feed */}
        <main className="min-w-0 w-full mx-auto flex flex-col gap-4">
          {children}
        </main>

        {/* Right rail — xl only */}
        <aside
          className="hidden xl:block sticky bg-[var(--tt-theme)] self-start overflow-y-auto no-scrollbar"
          style={{ top: 'calc(var(--tt-nav-height) + 1rem)', maxHeight: 'calc(100vh - var(--tt-nav-height) - 2rem)' }}
        >
          {rightRail}
        </aside>
      </div>

      {/* Off-canvas drawers (mobile/tablet) */}
      <AnimatePresence>
        {(leftOpen || rightOpen) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setLeftOpen(false); setRightOpen(false); }}
            className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[1900]"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {leftOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed top-0 left-0 bottom-0 w-full max-w-[300px] bg-[var(--tt-surface)] border-r border-[var(--tt-border)] z-[1901] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-4 border-b border-[var(--tt-border)]">
              <span className="font-['Syne',sans-serif] font-extrabold text-[0.95rem]">Menu</span>
              <button onClick={() => setLeftOpen(false)} className="tt-btn tt-btn-ghost p-2" aria-label="Close menu">
                <X size={18} />
              </button>
            </div>
            <div className="p-4">{leftNav}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {rightOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-[320px] bg-[var(--tt-surface)] border-l border-[var(--tt-border)] z-[1901] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-4 border-b border-[var(--tt-border)]">
              <span className="font-['Syne',sans-serif] font-extrabold text-[0.95rem]">Widgets</span>
              <button onClick={() => setRightOpen(false)} className="tt-btn tt-btn-ghost p-2" aria-label="Close widgets">
                <X size={18} />
              </button>
            </div>
            <div className="p-4">{rightRail}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <MobileTabBar onOpenLeft={() => setLeftOpen(true)} onOpenRight={() => setRightOpen(true)} />
    </div>
  );
}
